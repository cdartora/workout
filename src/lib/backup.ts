import { db } from '../db.ts'

// Backup completo num único arquivo JSON (fotos em base64), para salvar no iCloud Drive.
const APP = 'workout'
const FORMAT = 1
const TABLES = ['settings', 'ladders', 'levelTests', 'sessions', 'weighIns', 'foodShortcuts', 'foodLogs', 'photos'] as const
type TableName = (typeof TABLES)[number]

export interface BackupFile {
  app: typeof APP
  format: number
  exportedAt: number
  tables: Partial<Record<TableName, unknown[]>>
}

interface EncodedBlob {
  $blob: string
  type: string
}

const LAST_BACKUP_KEY = 'lastBackupAt'

export async function lastBackupAt(): Promise<number | undefined> {
  return (await db.settings.get(LAST_BACKUP_KEY))?.value as number | undefined
}

export async function markBackupDone(at = Date.now()): Promise<void> {
  await db.settings.put({ key: LAST_BACKUP_KEY, value: at })
}

export async function createBackup(now = Date.now()): Promise<BackupFile> {
  const tables: BackupFile['tables'] = {}
  await db.transaction('r', TABLES as unknown as string[], async () => {
    for (const name of TABLES) tables[name] = await db.table(name).toArray()
  })
  // Blobs não viram JSON: converte fora da transação (operação assíncrona não-IndexedDB).
  for (const name of TABLES)
    tables[name] = await Promise.all(tables[name]!.map((row) => encodeBlobs(row as Record<string, unknown>)))
  return { app: APP, format: FORMAT, exportedAt: now, tables }
}

export async function backupToFile(now = Date.now()): Promise<File> {
  const backup = await createBackup(now)
  const date = new Date(now).toISOString().slice(0, 10)
  return new File([JSON.stringify(backup)], `workout-backup-${date}.json`, { type: 'application/json' })
}

export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('O arquivo não é um backup válido (JSON inválido).')
  }
  const backup = data as Partial<BackupFile>
  if (backup?.app !== APP || typeof backup.tables !== 'object' || backup.tables === null)
    throw new Error('Este arquivo não é um backup do Workout.')
  if ((backup.format ?? 0) > FORMAT) throw new Error('Backup de uma versão mais nova do app. Atualize o app e tente de novo.')
  for (const name of TABLES) {
    const rows = backup.tables[name]
    if (rows !== undefined && !Array.isArray(rows)) throw new Error(`Backup corrompido (tabela ${name}).`)
  }
  return backup as BackupFile
}

/** Substitui todos os dados do app pelos do backup. */
export async function restoreBackup(backup: BackupFile): Promise<{ sessions: number; photos: number }> {
  const decoded: Partial<Record<TableName, unknown[]>> = {}
  for (const name of TABLES) decoded[name] = (backup.tables[name] ?? []).map((row) => decodeBlobs(row as Record<string, unknown>))

  await db.transaction('rw', TABLES as unknown as string[], async () => {
    for (const name of TABLES) {
      await db.table(name).clear()
      await db.table(name).bulkAdd(decoded[name]!)
    }
    // Os dados agora são exatamente os do backup: ele conta como o último feito.
    await db.settings.put({ key: LAST_BACKUP_KEY, value: backup.exportedAt })
  })
  return { sessions: decoded.sessions!.length, photos: decoded.photos!.length }
}

async function encodeBlobs(row: Record<string, unknown>): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ...row }
  for (const [key, value] of Object.entries(row))
    if (value instanceof Blob) out[key] = { $blob: await blobToBase64(value), type: value.type } satisfies EncodedBlob
  return out
}

function decodeBlobs(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row }
  for (const [key, value] of Object.entries(row)) {
    const encoded = value as EncodedBlob | null
    if (encoded && typeof encoded === 'object' && typeof encoded.$blob === 'string')
      out[key] = new Blob([base64ToBytes(encoded.$blob)], { type: encoded.type })
  }
  return out
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
