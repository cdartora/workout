import { useEffect, useState } from 'react'

/** Hora atual, atualizada a cada `interval` ms. */
export function useNow(interval = 250): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}

/** Mantém a tela acesa enquanto montado (Screen Wake Lock, iOS 16.4+). */
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | undefined
    let active = true
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (!active) void lock.release()
      } catch {
        // Sem permissão ou não suportado: segue sem manter a tela acesa.
      }
    }
    // O sistema solta o lock quando o app vai para segundo plano.
    const onVisible = () => document.visibilityState === 'visible' && void request()
    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [])
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
