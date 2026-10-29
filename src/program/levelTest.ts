import type { LadderId } from './ladders.ts'

// Teste de nível: um movimento de referência por escada. O resultado (máximo com boa forma)
// define o degrau inicial pelo maior limiar atingido.
export interface LevelTestItem {
  ladderId: LadderId
  /** Degrau usado no teste (índice na escada). */
  testStep: number
  /** [valor mínimo, degrau inicial], em ordem crescente de valor. */
  thresholds: readonly (readonly [min: number, stepIndex: number])[]
  tip?: string
}

export const LEVEL_TEST: readonly LevelTestItem[] = [
  { ladderId: 'push_h', testStep: 2, thresholds: [[0, 1], [8, 2], [20, 3]] },
  { ladderId: 'legs_squat', testStep: 0, thresholds: [[0, 0], [20, 1], [40, 2]] },
  {
    ladderId: 'pull_v',
    testStep: 3,
    thresholds: [[0, 1], [1, 2], [6, 3], [15, 4]],
    tip: 'Não conseguiu nenhuma? Registre 0 — você começa pelas negativas.',
  },
  { ladderId: 'push_v', testStep: 1, thresholds: [[0, 0], [6, 1], [16, 2]] },
  {
    ladderId: 'legs_hinge',
    testStep: 1,
    thresholds: [[0, 0], [12, 1], [25, 2]],
    tip: 'Faça as duas pernas e registre a mais fraca.',
  },
  { ladderId: 'pull_h', testStep: 1, thresholds: [[0, 0], [8, 1], [20, 2]] },
  { ladderId: 'core_hanging', testStep: 0, thresholds: [[0, 0], [15, 1]] },
  { ladderId: 'core_floor', testStep: 0, thresholds: [[0, 0], [60, 1]] },
]

export const LEVEL_TEST_REST = 90

export function startingStep(item: LevelTestItem, value: number): number {
  let step = item.thresholds[0][1]
  for (const [min, index] of item.thresholds) if (value >= min) step = index
  return step
}
