import { describe, expect, it } from 'vitest'
import type { Session } from '../db.ts'
import { computeAchievements } from './achievements.ts'
import { bestStreak, currentStreak } from './streaks.ts'

// Segunda-feira, 5 de outubro de 2026 (horário local).
const monday = new Date(2026, 9, 5, 19).getTime()
const DAY = 24 * 60 * 60 * 1000
/** Treinos na semana `w` (0 = semana de 5/out) nos dias informados (0 = segunda). */
const week = (w: number, ...days: number[]) => days.map((d) => monday + (w * 7 + d) * DAY)

describe('currentStreak', () => {
  it('conta semanas completas seguidas, incluindo a atual se já completa', () => {
    const done = [...week(0, 0, 2, 4), ...week(1, 0, 2, 4), ...week(2, 1, 3, 5)]
    expect(currentStreak(done, monday + (2 * 7 + 6) * DAY)).toBe(3)
  })

  it('semana atual incompleta não quebra a sequência', () => {
    const done = [...week(0, 0, 2, 4), ...week(1, 0, 2, 4), ...week(2, 1)]
    expect(currentStreak(done, monday + (2 * 7 + 2) * DAY)).toBe(2)
  })

  it('uma semana incompleta no passado quebra a sequência', () => {
    const done = [...week(0, 0, 2, 4), ...week(1, 0, 2), ...week(2, 0, 2, 4)]
    expect(currentStreak(done, monday + (2 * 7 + 6) * DAY)).toBe(1)
    expect(bestStreak(done)).toBe(1)
  })

  it('melhor sequência', () => {
    const done = [...week(0, 0, 2, 4), ...week(1, 0, 2, 4), ...week(3, 0, 2, 4)]
    expect(bestStreak(done)).toBe(2)
  })
})

describe('computeAchievements', () => {
  const session = (finishedAt: number, entries: Session['entries']): Session => ({
    workout: 'A',
    startedAt: finishedAt - 40 * 60 * 1000,
    finishedAt,
    cursor: 0,
    entries,
  })
  const pull = (stepId: string, sets: number[]) => ({ ladderId: 'pull_v' as const, stepId, targets: [], sets })

  it('detecta primeira barra, subida de degrau e semana completa', () => {
    const [d1, d2, d3] = week(0, 0, 2, 4)
    const achievements = computeAchievements({
      sessions: [
        session(d1, [pull('barra_elastico', [12, 12, 12])]),
        session(d2, [pull('barra_fixa', [2, 1, 1])]),
        session(d3, [pull('barra_fixa', [3, 2, 1])]),
      ],
      weighIns: [
        { date: d1, weightKg: 73 },
        { date: d3, weightKg: 75.6 },
      ],
      proteinByDay: new Map(),
    })
    const at = (id: string) => achievements.find((a) => a.id === id)!.unlockedAt
    expect(at('first_workout')).toBe(d1)
    expect(at('first_pullup')).toBe(d2)
    expect(at('step_up_1')).toBe(d2)
    expect(at('full_week')).toBe(d3)
    expect(at('weight_2_5')).toBe(d3)
    expect(at('weight_5')).toBeUndefined()
    expect(at('pullups_10')).toBeUndefined()
  })
})
