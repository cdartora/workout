import { db, finishedSessions, lastSetsFor, type Session, type SessionEntry } from '../db.ts'
import { LADDER_IDS, resolveStep, type LadderId } from './ladders.ts'
import { nextTargets } from './progression.ts'
import { WORKOUTS, otherWorkout, type WorkoutId } from './workouts.ts'

export async function currentSteps(): Promise<Record<LadderId, number>> {
  const states = await db.ladders.toArray()
  const steps = Object.fromEntries(LADDER_IDS.map((id) => [id, 0])) as Record<LadderId, number>
  for (const s of states) steps[s.ladderId] = s.stepIndex
  return steps
}

export function nextWorkoutAfter(history: readonly Session[]): WorkoutId {
  return history.length > 0 ? otherWorkout(history[0].workout) : 'A'
}

/** Cria o treino com os degraus atuais e as metas calculadas a partir do histórico. */
export async function startSession(workout: WorkoutId): Promise<number> {
  const [steps, history] = await Promise.all([currentSteps(), finishedSessions()])
  const entries = WORKOUTS[workout].flatMap((block) =>
    block.ladders.map((ladderId) => {
      const step = resolveStep(ladderId, steps[ladderId])
      const targets = nextTargets(lastSetsFor(history, step.id), step.range, step.unit, block.sets)
      return { ladderId, stepId: step.id, targets, sets: [] }
    }),
  )
  return (await db.sessions.add({ workout, startedAt: Date.now(), cursor: 0, entries })) as number
}

/** Troca o degrau de um exercício ainda não iniciado no treino em andamento. */
export async function changeSessionStep(
  session: Session,
  ladderId: LadderId,
  stepIndex: number,
): Promise<SessionEntry[]> {
  const history = await finishedSessions()
  const step = resolveStep(ladderId, stepIndex)
  const block = WORKOUTS[session.workout].find((b) => b.ladders.includes(ladderId))!
  const entries = session.entries.map((e) =>
    e.ladderId === ladderId
      ? { ...e, stepId: step.id, targets: nextTargets(lastSetsFor(history, step.id), step.range, step.unit, block.sets) }
      : e,
  )
  await db.transaction('rw', db.sessions, db.ladders, async () => {
    await db.sessions.update(session.id!, { entries })
    await db.ladders.put({ ladderId, stepIndex: step.index, updatedAt: Date.now() })
  })
  return entries
}

export async function setLadderStep(ladderId: LadderId, stepIndex: number): Promise<void> {
  await db.ladders.put({ ladderId, stepIndex, updatedAt: Date.now() })
}

export function startOfWeek(date = new Date()): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // segunda-feira
  return d.getTime()
}

export function startOfDay(date = new Date()): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
