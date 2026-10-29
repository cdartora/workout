// Bipes via Web Audio. O iOS só libera o áudio depois de um toque do usuário,
// então unlockAudio() deve ser chamado num handler de clique (ex.: "Começar").
// Obs.: o iPhone não tem vibração para sites e respeita a chave de silencioso.
let ctx: AudioContext | undefined

export function unlockAudio(): void {
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
}

export function beep(frequency = 880, duration = 0.15, delay = 0): void {
  if (!ctx) return
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.4, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export function finishBeep(): void {
  beep(988, 0.12)
  beep(1319, 0.3, 0.15)
}
