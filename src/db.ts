import Dexie, { type EntityTable } from 'dexie'
import type { LadderId } from './program/ladders.ts'
import { DEFAULT_SHORTCUTS } from './program/nutrition.ts'
import type { WorkoutId } from './program/workouts.ts'

// Banco local (IndexedDB). Novas tabelas entram com db.version(n + 1).
export interface Setting {
  key: string
  value: unknown
}

/** Degrau atual de cada escada. */
export interface LadderState {
  ladderId: LadderId
  stepIndex: number
  updatedAt: number
}

export interface LevelTest {
  id?: number
  date: number
  results: Partial<Record<LadderId, { stepId: string; value: number; startingStep: number }>>
}

export interface SessionEntry {
  ladderId: LadderId
  stepId: string
  targets: number[]
  sets: number[]
}

export interface Session {
  id?: number
  workout: WorkoutId
  startedAt: number
  /** Ausente enquanto o treino está em andamento. */
  finishedAt?: number
  /** Índice da próxima série a fazer (para retomar o treino). */
  cursor: number
  entries: SessionEntry[]
}

export interface WeighIn {
  id?: number
  /** Início do dia (uma pesagem por dia; registrar de novo substitui). */
  date: number
  weightKg: number
}

export interface FoodShortcut {
  id?: number
  name: string
  protein: number
  order: number
}

export interface FoodLog {
  id?: number
  /** Início do dia. */
  day: number
  name: string
  protein: number
  createdAt: number
}

export type Pose = 'frente' | 'lado' | 'costas'

export interface Photo {
  id?: number
  /** Início do dia. */
  date: number
  pose: Pose
  /** JPEG comprimido (~1080 px no maior lado). */
  blob: Blob
}

export const db = new Dexie('workout') as Dexie & {
  settings: EntityTable<Setting, 'key'>
  ladders: EntityTable<LadderState, 'ladderId'>
  levelTests: EntityTable<LevelTest, 'id'>
  sessions: EntityTable<Session, 'id'>
  weighIns: EntityTable<WeighIn, 'id'>
  foodShortcuts: EntityTable<FoodShortcut, 'id'>
  foodLogs: EntityTable<FoodLog, 'id'>
  photos: EntityTable<Photo, 'id'>
}

db.version(1).stores({
  settings: 'key',
})

db.version(2).stores({
  ladders: 'ladderId',
  levelTests: '++id, date',
  sessions: '++id, startedAt, finishedAt',
})

db.version(3)
  .stores({
    weighIns: '++id, &date',
    foodShortcuts: '++id, order',
    foodLogs: '++id, day',
  })
  // Atalhos de exemplo na primeira vez (banco novo ou vindo da v2); o usuário edita ou apaga.
  .upgrade((tx) => tx.table('foodShortcuts').bulkAdd(seedShortcuts()))

db.version(4).stores({
  photos: '++id, date, [date+pose]',
})

db.on('populate', (tx) => tx.table('foodShortcuts').bulkAdd(seedShortcuts()))

function seedShortcuts(): FoodShortcut[] {
  return DEFAULT_SHORTCUTS.map((s, order) => ({ ...s, order }))
}

// Pede ao navegador para não apagar os dados sob pressão de espaço.
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

export async function latestWeight(): Promise<number | undefined> {
  return (await db.weighIns.orderBy('date').last())?.weightKg
}

export async function addFoodLog(name: string, protein: number, day: number): Promise<number> {
  return (await db.foodLogs.add({ day, name, protein, createdAt: Date.now() })) as number
}

/** Uma pesagem por dia: registrar de novo no mesmo dia substitui. */
export async function saveWeighIn(date: number, weightKg: number): Promise<void> {
  await db.transaction('rw', db.weighIns, async () => {
    await db.weighIns.where('date').equals(date).delete()
    await db.weighIns.add({ date, weightKg })
  })
}

export async function proteinByDay(): Promise<Map<number, number>> {
  const totals = new Map<number, number>()
  await db.foodLogs.each((log) => totals.set(log.day, (totals.get(log.day) ?? 0) + log.protein))
  return totals
}

export async function finishedSessions(): Promise<Session[]> {
  // finishedAt ausente não entra no índice, então isto só traz treinos concluídos.
  return db.sessions.orderBy('finishedAt').reverse().toArray()
}

export async function unfinishedSession(): Promise<Session | undefined> {
  return db.sessions.filter((s) => s.finishedAt === undefined).last()
}

/** Séries da última sessão concluída em que este degrau foi feito. */
export function lastSetsFor(history: readonly Session[], stepId: string): number[] | undefined {
  for (const session of history) {
    const entry = session.entries.find((e) => e.stepId === stepId && e.sets.length > 0)
    if (entry) return entry.sets
  }
  return undefined
}

/** Melhor série já registrada neste degrau. */
export function bestSetFor(history: readonly Session[], stepId: string): number {
  let best = 0
  for (const session of history)
    for (const entry of session.entries) if (entry.stepId === stepId) best = Math.max(best, ...entry.sets)
  return best
}
