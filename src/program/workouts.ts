import type { LadderId } from './ladders.ts'

export type WorkoutId = 'A' | 'B'

export interface Block {
  label: string
  /** Mais de um exercício = superset: alterna os exercícios a cada série. */
  ladders: readonly LadderId[]
  sets: number
  /** Descanso (s) depois de cada rodada do bloco. */
  rest: number
}

export const WORKOUTS: Record<WorkoutId, readonly Block[]> = {
  A: [
    { label: 'Empurrar · peito e tríceps', ladders: ['push_h'], sets: 3, rest: 90 },
    { label: 'Puxar · costas', ladders: ['pull_v'], sets: 3, rest: 90 },
    { label: 'Pernas · quadríceps', ladders: ['legs_squat'], sets: 3, rest: 90 },
    { label: 'Braços · superset', ladders: ['biceps', 'triceps'], sets: 3, rest: 60 },
    { label: 'Core', ladders: ['core_hanging'], sets: 3, rest: 60 },
  ],
  B: [
    { label: 'Empurrar · ombros', ladders: ['push_v'], sets: 3, rest: 90 },
    { label: 'Puxar · costas', ladders: ['pull_h'], sets: 3, rest: 90 },
    { label: 'Pernas · posterior e glúteo', ladders: ['legs_hinge'], sets: 3, rest: 90 },
    { label: 'Ombros · superset', ladders: ['lateral', 'face_pull'], sets: 3, rest: 60 },
    { label: 'Core', ladders: ['core_floor'], sets: 3, rest: 60 },
  ],
}

export interface Slot {
  blockIndex: number
  ladderId: LadderId
  set: number
  /** Descanso (s) depois desta série; 0 = segue direto (superset ou fim). */
  rest: number
}

/** Sequência linear de séries do treino, na ordem em que são feitas. */
export function buildSlots(workout: WorkoutId): Slot[] {
  const slots: Slot[] = []
  WORKOUTS[workout].forEach((block, blockIndex) => {
    for (let set = 0; set < block.sets; set++) {
      block.ladders.forEach((ladderId, i) => {
        const lastInRound = i === block.ladders.length - 1
        slots.push({ blockIndex, ladderId, set, rest: lastInRound ? block.rest : 0 })
      })
    }
  })
  slots[slots.length - 1].rest = 0
  return slots
}

export function otherWorkout(workout: WorkoutId): WorkoutId {
  return workout === 'A' ? 'B' : 'A'
}

export const WARMUP = {
  seconds: 5 * 60,
  moves: [
    '60 s de polichinelo',
    '10 círculos de braço para frente e 10 para trás',
    '10 agachamentos lentos',
    '10 rotações de quadril para cada lado',
    '20 s pendurado na barra',
    '5 flexões inclinadas',
  ],
}
