import type { Unit } from '../program/ladders.ts'
import { increment } from '../program/progression.ts'

export function Counter({ value, unit, onChange }: { value: number; unit: Unit; onChange: (v: number) => void }) {
  const delta = increment(unit)
  return (
    <div className="counter">
      <button type="button" className="counter-button" aria-label="Menos" onClick={() => onChange(Math.max(0, value - delta))}>
        −
      </button>
      <output className="counter-value" aria-live="polite">
        {value}
        {unit === 'seconds' && <small>s</small>}
      </output>
      <button type="button" className="counter-button" aria-label="Mais" onClick={() => onChange(value + delta)}>
        +
      </button>
    </div>
  )
}
