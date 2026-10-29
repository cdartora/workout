import Dexie, { type EntityTable } from 'dexie'

// Banco local (IndexedDB). Novas tabelas entram com db.version(n + 1) nas próximas etapas.
export interface Setting {
  key: string
  value: unknown
}

export const db = new Dexie('workout') as Dexie & {
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  settings: 'key',
})

// Pede ao navegador para não apagar os dados sob pressão de espaço.
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
