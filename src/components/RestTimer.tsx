import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { formatClock, useNow } from '../lib/hooks.ts'
import { beep, finishBeep } from '../lib/sound.ts'

/** Contagem regressiva baseada em horário de término (não atrasa em segundo plano). */
export function RestTimer({ seconds, onDone, children }: { seconds: number; onDone: () => void; children?: ReactNode }) {
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000)
  const now = useNow()
  const remaining = (endAt - now) / 1000
  const lastBeep = useRef<number>(undefined)
  const done = useRef(false)

  useEffect(() => {
    const whole = Math.ceil(remaining)
    if (whole <= 3 && whole >= 1 && lastBeep.current !== whole) {
      lastBeep.current = whole
      beep(660, 0.1)
    }
    if (remaining <= 0 && !done.current) {
      done.current = true
      finishBeep()
      onDone()
    }
  }, [remaining, onDone])

  const progress = Math.min(1, Math.max(0, 1 - remaining / seconds))
  return (
    <div className="rest">
      <p className="eyebrow">Descanso</p>
      <div className="rest-clock" style={{ '--progress': progress } as CSSProperties}>
        <span>{formatClock(remaining)}</span>
      </div>
      <div className="rest-actions">
        <button type="button" className="button-secondary" onClick={() => setEndAt((t) => t + 30_000)}>
          +30 s
        </button>
        <button type="button" className="button-secondary" onClick={onDone}>
          Pular
        </button>
      </div>
      {children}
    </div>
  )
}
