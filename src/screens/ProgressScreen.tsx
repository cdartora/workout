import { useLiveQuery } from 'dexie-react-hooks'
import { LADDERS, LADDER_IDS, resolveStep } from '../program/ladders.ts'
import { currentSteps } from '../program/session.ts'

export function ProgressScreen() {
  const steps = useLiveQuery(currentSteps)

  return (
    <>
      <header className="screen-header">
        <h1>Progresso</h1>
      </header>
      {steps && (
        <section className="card">
          <h2>Degraus atuais</h2>
          <ul className="ladder-list">
            {LADDER_IDS.map((id) => {
              const total = LADDERS[id].steps.length
              const step = resolveStep(id, steps[id])
              return (
                <li key={id}>
                  <div className="row">
                    <span>{step.name}</span>
                    <span className="muted small">
                      {step.index + 1}/{total}
                    </span>
                  </div>
                  <div className="ladder-bar" aria-hidden="true">
                    {LADDERS[id].steps.map((s, i) => (
                      <span key={s.id} className={i <= step.index ? 'filled' : ''} />
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <section className="card empty">
        <p>Gráficos, conquistas e fotos chegam numa próxima etapa.</p>
      </section>
    </>
  )
}
