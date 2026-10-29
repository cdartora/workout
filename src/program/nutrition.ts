// Nutrição simples: meta de proteína pelo peso e leitura da tendência de peso semanal.

export const PROTEIN_PER_KG = 1.8
/** Faixa-alvo de ganho de peso (kg/semana) para um bulking limpo. */
export const WEEKLY_GAIN_TARGET = [0.2, 0.35] as const

const DAY = 24 * 60 * 60 * 1000

export function proteinGoal(weightKg: number): number {
  return Math.round((weightKg * PROTEIN_PER_KG) / 5) * 5
}

export interface WeighInPoint {
  date: number
  weightKg: number
}

export type WeightAdvice =
  | { kind: 'none' }
  | { kind: 'stalled' | 'slow' | 'on-track' | 'fast' | 'too-fast'; weeklyChange: number }

/** Variação semanal (kg/semana) entre a pesagem mais recente e uma de ~1 semana antes. */
export function weeklyChange(points: readonly WeighInPoint[]): number | undefined {
  const sorted = [...points].sort((a, b) => b.date - a.date)
  const [latest] = sorted
  if (!latest) return undefined
  const previous = sorted.find((p) => latest.date - p.date >= 5 * DAY)
  if (!previous) return undefined
  const weeks = (latest.date - previous.date) / (7 * DAY)
  return (latest.weightKg - previous.weightKg) / weeks
}

export function weightAdvice(points: readonly WeighInPoint[]): WeightAdvice {
  const change = weeklyChange(points)
  if (change === undefined) return { kind: 'none' }

  // Estagnado: em ~2 semanas ganhou menos de 0,2 kg.
  const sorted = [...points].sort((a, b) => b.date - a.date)
  const twoWeeksAgo = sorted.find((p) => sorted[0].date - p.date >= 12 * DAY)
  if (twoWeeksAgo && sorted[0].weightKg - twoWeeksAgo.weightKg < 0.2) return { kind: 'stalled', weeklyChange: change }

  const [low, high] = WEEKLY_GAIN_TARGET
  if (change > 0.5) return { kind: 'too-fast', weeklyChange: change }
  if (change > high) return { kind: 'fast', weeklyChange: change }
  if (change >= low) return { kind: 'on-track', weeklyChange: change }
  return { kind: 'slow', weeklyChange: change }
}

/** Aceita "73,4" ou "73.4". */
export function parseDecimal(text: string): number | undefined {
  const value = Number(text.trim().replace(',', '.'))
  return Number.isFinite(value) && value > 0 ? value : undefined
}

export function formatKg(value: number, signed = false): string {
  const text = value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return signed && value > 0 ? `+${text}` : text
}

export const DEFAULT_SHORTCUTS: readonly { name: string; protein: number }[] = [
  { name: '3 ovos', protein: 18 },
  { name: 'Frango 150 g', protein: 45 },
  { name: 'Carne moída 150 g', protein: 39 },
  { name: 'Whey 1 scoop', protein: 24 },
  { name: 'Copo de leite', protein: 8 },
  { name: 'Iogurte natural', protein: 7 },
  { name: 'Feijão 1 concha', protein: 6 },
  { name: 'Atum 1 lata', protein: 25 },
]
