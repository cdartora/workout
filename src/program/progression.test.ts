import { describe, expect, it } from 'vitest'
import { startingStep, LEVEL_TEST } from './levelTest.ts'
import { nextTargets, readyToStepUp } from './progression.ts'
import { buildSlots } from './workouts.ts'

describe('nextTargets', () => {
  it('começa no início da faixa sem histórico', () => {
    expect(nextTargets(undefined, [6, 12], 'reps', 3)).toEqual([6, 6, 6])
  })

  it('soma 1 repetição na série mais fraca', () => {
    expect(nextTargets([9, 8, 8], [6, 12], 'reps', 3)).toEqual([9, 9, 8])
  })

  it('soma 5 s em exercícios isométricos', () => {
    expect(nextTargets([30, 25, 25], [15, 45], 'seconds', 3)).toEqual([30, 30, 25])
  })

  it('não passa do topo da faixa', () => {
    expect(nextTargets([12, 12, 11], [6, 12], 'reps', 3)).toEqual([12, 12, 12])
  })

  it('mantém o topo quando já bateu todas as séries', () => {
    expect(nextTargets([12, 12, 12], [6, 12], 'reps', 3)).toEqual([12, 12, 12])
  })

  it('completa séries que faltaram com a última registrada', () => {
    expect(nextTargets([8], [6, 12], 'reps', 3)).toEqual([9, 8, 8])
  })
})

describe('readyToStepUp', () => {
  it('exige todas as séries no topo', () => {
    expect(readyToStepUp([12, 12, 12], [6, 12], 3)).toBe(true)
    expect(readyToStepUp([12, 12, 11], [6, 12], 3)).toBe(false)
    expect(readyToStepUp([12, 12], [6, 12], 3)).toBe(false)
  })
})

describe('startingStep', () => {
  const pullUps = LEVEL_TEST.find((t) => t.ladderId === 'pull_v')!

  it('mapeia o resultado da barra para o degrau inicial', () => {
    expect(startingStep(pullUps, 0)).toBe(1) // negativa
    expect(startingStep(pullUps, 3)).toBe(2) // com elástico
    expect(startingStep(pullUps, 7)).toBe(3) // barra fixa
    expect(startingStep(pullUps, 15)).toBe(4) // com mochila
  })
})

describe('buildSlots', () => {
  it('alterna exercícios do superset e descansa só no fim da rodada', () => {
    const slots = buildSlots('A')
    const arms = slots.filter((s) => s.blockIndex === 3)
    expect(arms.map((s) => s.ladderId)).toEqual(['biceps', 'triceps', 'biceps', 'triceps', 'biceps', 'triceps'])
    expect(arms.map((s) => s.rest)).toEqual([0, 60, 0, 60, 0, 60])
    expect(slots).toHaveLength(18)
    expect(slots.at(-1)!.rest).toBe(0)
  })
})
