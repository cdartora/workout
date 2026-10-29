import type { Session, WeighIn } from '../db.ts'
import { LADDERS, type LadderId } from './ladders.ts'
import { proteinGoal } from './nutrition.ts'
import { startOfWeek } from './session.ts'
import { WEEKLY_GOAL, previousWeek } from './streaks.ts'

export interface Achievement {
  id: string
  emoji: string
  title: string
  description: string
  /** Quando foi conquistada (ausente = bloqueada). */
  unlockedAt?: number
}

export interface AchievementData {
  /** Treinos concluídos, em qualquer ordem. */
  sessions: readonly Session[]
  weighIns: readonly WeighIn[]
  /** Proteína total por dia (início do dia → gramas). */
  proteinByDay: ReadonlyMap<number, number>
}

const stepIndex = (ladderId: LadderId, stepId: string) => LADDERS[ladderId].steps.findIndex((s) => s.id === stepId)

/** Data da primeira série que satisfaz a condição. */
function firstSet(
  sessions: readonly Session[],
  match: (ladderId: LadderId, stepId: string, value: number) => boolean,
): number | undefined {
  for (const s of sessions)
    for (const e of s.entries) if (e.sets.some((v) => match(e.ladderId, e.stepId, v))) return s.finishedAt
  return undefined
}

export function computeAchievements({ sessions: unsorted, weighIns, proteinByDay }: AchievementData): Achievement[] {
  const sessions = [...unsorted].filter((s) => s.finishedAt).sort((a, b) => a.finishedAt! - b.finishedAt!)
  const nth = (n: number) => sessions[n - 1]?.finishedAt

  // Semanas completas e sequências, em ordem cronológica.
  const weekDone = new Map<number, number>() // semana → data do treino que completou a meta
  const weekCount = new Map<number, number>()
  for (const s of sessions) {
    const w = startOfWeek(new Date(s.finishedAt!))
    const n = (weekCount.get(w) ?? 0) + 1
    weekCount.set(w, n)
    if (n === WEEKLY_GOAL) weekDone.set(w, s.finishedAt!)
  }
  const streakReached = new Map<number, number>() // tamanho da sequência → data
  let run = 0
  let prev: number | undefined
  for (const [week, at] of [...weekDone].sort((a, b) => a[0] - b[0])) {
    run = prev !== undefined && previousWeek(week) === prev ? run + 1 : 1
    if (!streakReached.has(run)) streakReached.set(run, at)
    prev = week
  }

  // Subidas de degrau: degrau maior que o último feito naquela escada.
  const stepUps: number[] = []
  const lastStep = new Map<LadderId, number>()
  for (const s of sessions)
    for (const e of s.entries) {
      if (e.sets.length === 0) continue
      const i = stepIndex(e.ladderId, e.stepId)
      const before = lastStep.get(e.ladderId)
      if (before !== undefined && i > before) stepUps.push(s.finishedAt!)
      lastStep.set(e.ladderId, i)
    }

  // Peso ganho desde a primeira pesagem.
  const weights = [...weighIns].sort((a, b) => a.date - b.date)
  const gained = (kg: number) => weights.find((w) => weights.length > 0 && w.weightKg - weights[0].weightKg >= kg)?.date

  // Dias com a meta de proteína batida (meta pelo peso mais recente até aquele dia).
  const proteinDays: number[] = []
  for (const [day, total] of [...proteinByDay].sort((a, b) => a[0] - b[0])) {
    const weight = [...weights].reverse().find((w) => w.date <= day) ?? weights[0]
    if (weight && total >= proteinGoal(weight.weightKg)) proteinDays.push(day)
  }

  const atLeast = (ladderId: LadderId, stepId: string) => (l: LadderId, s: string) =>
    l === ladderId && stepIndex(l, s) >= stepIndex(ladderId, stepId)

  const list: (Omit<Achievement, 'unlockedAt'> & { at: number | undefined })[] = [
    { id: 'first_workout', emoji: '🚀', title: 'Primeiro treino', description: 'Concluir o primeiro treino', at: nth(1) },
    { id: 'workouts_10', emoji: '💪', title: '10 treinos', description: 'Concluir 10 treinos', at: nth(10) },
    { id: 'workouts_25', emoji: '🏋️', title: '25 treinos', description: 'Concluir 25 treinos', at: nth(25) },
    { id: 'workouts_50', emoji: '⚡', title: '50 treinos', description: 'Concluir 50 treinos', at: nth(50) },
    { id: 'workouts_100', emoji: '💯', title: '100 treinos', description: 'Concluir 100 treinos', at: nth(100) },
    { id: 'full_week', emoji: '✅', title: 'Semana completa', description: `${WEEKLY_GOAL} treinos na mesma semana`, at: streakReached.get(1) },
    { id: 'streak_4', emoji: '🔥', title: '1 mês de constância', description: '4 semanas seguidas completas', at: streakReached.get(4) },
    { id: 'streak_8', emoji: '🔥', title: '2 meses de constância', description: '8 semanas seguidas completas', at: streakReached.get(8) },
    { id: 'streak_12', emoji: '🏆', title: '3 meses de constância', description: '12 semanas seguidas completas', at: streakReached.get(12) },
    { id: 'step_up_1', emoji: '🪜', title: 'Novo degrau', description: 'Subir de degrau pela primeira vez', at: stepUps[0] },
    { id: 'step_up_5', emoji: '🧗', title: 'Escalador', description: 'Subir 5 degraus', at: stepUps[4] },
    { id: 'step_up_10', emoji: '⛰️', title: 'Alpinista', description: 'Subir 10 degraus', at: stepUps[9] },
    {
      id: 'first_pullup',
      emoji: '🙌',
      title: 'Primeira barra',
      description: 'Uma barra fixa completa, sem ajuda',
      at: firstSet(sessions, (l, s, v) => atLeast('pull_v', 'barra_fixa')(l, s) && v >= 1),
    },
    {
      id: 'pullups_10',
      emoji: '🦍',
      title: '10 barras',
      description: '10 barras fixas numa série',
      at: firstSet(sessions, (l, s, v) => atLeast('pull_v', 'barra_fixa')(l, s) && v >= 10),
    },
    {
      id: 'pushups_10',
      emoji: '🫸',
      title: '10 flexões',
      description: '10 flexões no chão numa série',
      at: firstSet(sessions, (l, s, v) => atLeast('push_h', 'flexao')(l, s) && v >= 10),
    },
    {
      id: 'first_pistol',
      emoji: '🦵',
      title: 'Pistol',
      description: 'Um agachamento numa perna só, sem apoio',
      at: firstSet(sessions, (l, s, v) => atLeast('legs_squat', 'pistol')(l, s) && v >= 1),
    },
    {
      id: 'handstand',
      emoji: '🤸',
      title: 'De ponta-cabeça',
      description: 'Uma negativa de parada de mão',
      at: firstSet(sessions, (l, s, v) => atLeast('push_v', 'parada_negativa')(l, s) && v >= 1),
    },
    { id: 'weight_2_5', emoji: '📈', title: '+2,5 kg', description: 'Ganhar 2,5 kg desde a primeira pesagem', at: gained(2.5) },
    { id: 'weight_5', emoji: '🦬', title: '+5 kg', description: 'Ganhar 5 kg desde a primeira pesagem', at: gained(5) },
    { id: 'protein_7', emoji: '🥚', title: 'Proteína em dia', description: 'Bater a meta de proteína em 7 dias', at: proteinDays[6] },
    { id: 'protein_30', emoji: '🍗', title: 'Máquina de proteína', description: 'Bater a meta de proteína em 30 dias', at: proteinDays[29] },
  ]
  return list.map(({ at, ...a }) => ({ ...a, unlockedAt: at }))
}
