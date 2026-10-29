import Dexie, { type EntityTable } from 'dexie'
import type { LadderId } from './program/ladders.ts'
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

export const db = new Dexie('workout') as Dexie & {
  settings: EntityTable<Setting, 'key'>
  ladders: EntityTable<LadderState, 'ladderId'>
  levelTests: EntityTable<LevelTest, 'id'>
  sessions: EntityTable<Session, 'id'>
}

db.version(1).stores({
  settings: 'key',
})

db.version(2).stores({
  ladders: 'ladderId',
  levelTests: '++id, date',
  sessions: '++id, startedAt, finishedAt',
})

// Pede ao navegador para não apagar os dados sob pressão de espaço.
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
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
