import type { Range, Unit } from './ladders.ts'

// Dupla progressão: subir repetições dentro da faixa; quando todas as séries
// chegam ao topo, subir de degrau e recomeçar do início da faixa.

export function increment(unit: Unit): number {
  return unit === 'seconds' ? 5 : 1
}

/** Metas da próxima sessão a partir das séries da última sessão no mesmo degrau. */
export function nextTargets(previous: readonly number[] | undefined, range: Range, unit: Unit, sets: number): number[] {
  const [min, max] = range
  if (!previous || previous.length === 0) return Array(sets).fill(min)

  const targets = Array.from({ length: sets }, (_, i) => previous[i] ?? previous[previous.length - 1])
  if (targets.every((v) => v >= max)) return targets

  // +1 repetição (ou +5 s) na série mais fraca.
  const weakest = targets.indexOf(Math.min(...targets))
  targets[weakest] = Math.min(targets[weakest] + increment(unit), max)
  return targets
}

/** Todas as séries no topo da faixa: hora de sugerir o próximo degrau. */
export function readyToStepUp(sets: readonly number[], range: Range, requiredSets: number): boolean {
  return sets.length >= requiredSets && sets.every((v) => v >= range[1])
}
