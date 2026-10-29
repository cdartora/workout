import { startOfWeek } from './session.ts'

export const WEEKLY_GOAL = 3
const DAY = 24 * 60 * 60 * 1000

/** Início da semana anterior (robusto a horário de verão). */
export function previousWeek(weekStart: number): number {
  return startOfWeek(new Date(weekStart - 3 * DAY))
}

/** Treinos concluídos por semana (chave: início da semana, segunda 00:00). */
export function weeklyCounts(finishedAt: readonly number[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const t of finishedAt) {
    const week = startOfWeek(new Date(t))
    counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return counts
}

/**
 * Semanas seguidas batendo a meta. A semana atual só conta quando completa;
 * enquanto está em andamento, a sequência das semanas anteriores continua viva.
 */
export function currentStreak(finishedAt: readonly number[], now = Date.now()): number {
  const counts = weeklyCounts(finishedAt)
  let week = startOfWeek(new Date(now))
  if ((counts.get(week) ?? 0) < WEEKLY_GOAL) week = previousWeek(week)
  let streak = 0
  while ((counts.get(week) ?? 0) >= WEEKLY_GOAL) {
    streak++
    week = previousWeek(week)
  }
  return streak
}

export function bestStreak(finishedAt: readonly number[]): number {
  const counts = weeklyCounts(finishedAt)
  const full = [...counts].filter(([, n]) => n >= WEEKLY_GOAL).map(([w]) => w).sort((a, b) => a - b)
  let best = 0
  let run = 0
  let prev: number | undefined
  for (const week of full) {
    run = prev !== undefined && previousWeek(week) === prev ? run + 1 : 1
    best = Math.max(best, run)
    prev = week
  }
  return best
}
