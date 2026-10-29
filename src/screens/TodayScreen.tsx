import { InstallHint } from '../components/InstallHint.tsx'

export function TodayScreen() {
  return (
    <>
      <header className="screen-header">
        <p className="eyebrow">{formatToday()}</p>
        <h1>Hoje</h1>
      </header>

      <InstallHint />

      <section className="card card-primary">
        <p className="eyebrow">Primeiro passo</p>
        <h2>Teste de nível</h2>
        <p>~15 min para descobrir em que degrau de cada exercício você começa.</p>
        <button type="button" className="button-primary" disabled>
          Em breve
        </button>
      </section>

      <section className="card">
        <div className="row">
          <h2>Semana</h2>
          <span className="muted">0 de 3</span>
        </div>
        <div className="week-dots" aria-label="0 de 3 treinos nesta semana">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </section>
    </>
  )
}

function formatToday(): string {
  const text = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}
