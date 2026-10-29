import { useEffect, useRef, useState } from 'react'
import { useNow } from '../lib/hooks.ts'
import { beep, finishBeep } from '../lib/sound.ts'

/** Cronômetro para isometrias: conta para cima e bipa ao atingir a meta. */
export function Stopwatch({ target, onStop }: { target: number; onStop: (seconds: number) => void }) {
  const [startedAt, setStartedAt] = useState<number>()
  const now = useNow(200)
  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0
  const beeped = useRef(false)

  useEffect(() => {
    if (startedAt && !beeped.current && elapsed >= target) {
      beeped.current = true
      finishBeep()
    }
  }, [elapsed, startedAt, target])

  if (!startedAt) {
    return (
      <button
        type="button"
        className="button-secondary"
        onClick={() => {
          beeped.current = false
          beep(660, 0.1)
          setStartedAt(Date.now())
        }}
      >
        Iniciar cronômetro
      </button>
    )
  }
  return (
    <button
      type="button"
      className={`button-secondary stopwatch-running${elapsed >= target ? ' reached' : ''}`}
      onClick={() => {
        setStartedAt(undefined)
        onStop(elapsed)
      }}
    >
      Parar · {elapsed}s
    </button>
  )
}
