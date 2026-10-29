import { useLiveQuery } from 'dexie-react-hooks'
import type { FlowActions } from '../App.tsx'
import { InstallHint } from '../components/InstallHint.tsx'
import { db, finishedSessions, unfinishedSession, type Session } from '../db.ts'
import { findStep, resolveStep } from '../program/ladders.ts'
import { currentSteps, nextWorkoutAfter, startOfDay, startOfWeek } from '../program/session.ts'
import { WORKOUTS, buildSlots } from '../program/workouts.ts'

const WEEKLY_GOAL = 3

export function TodayScreen({ actions }: { actions: FlowActions }) {
  const data = useLiveQuery(async () => {
    const [tested, history, inProgress, steps] = await Promise.all([
      db.levelTests.count(),
      finishedSessions(),
      unfinishedSession(),
      currentSteps(),
    ])
    return { tested: tested > 0, history, inProgress, steps }
  })

  if (!data) return null
  const { tested, history, inProgress, steps } = data

  const weekCount = history.filter((s) => s.finishedAt! >= startOfWeek()).length
  const trainedToday = history.some((s) => s.finishedAt! >= startOfDay())
  const next = nextWorkoutAfter(history)

  return (
    <>
      <header className="screen-header">
        <p className="eyebrow">{formatToday()}</p>
        <h1>Hoje</h1>
      </header>

      <InstallHint />

      {!tested ? (
        <section className="card card-primary">
          <p className="eyebrow">Primeiro passo</p>
          <h2>Teste de nível</h2>
          <p>~20 min para descobrir em que degrau de cada exercício você começa.</p>
          <button type="button" className="button-primary" onClick={actions.startLevelTest}>
            Fazer o teste
          </button>
        </section>
      ) : inProgress ? (
        <section className="card card-primary">
          <p className="eyebrow">Em andamento</p>
          <h2>Treino {inProgress.workout}</h2>
          <p>{resumeText(inProgress)}</p>
          <button type="button" className="button-primary" onClick={() => actions.resumeWorkout(inProgress.id!)}>
            Continuar treino
          </button>
        </section>
      ) : (
        <section className={`card${trainedToday ? '' : ' card-primary'}`}>
          <p className="eyebrow">{trainedToday ? 'Treino de hoje feito ✓ · Próximo' : 'Treino de hoje · ~40 min'}</p>
          <h2>Treino {next}</h2>
          <ul className="plan-compact">
            {WORKOUTS[next].flatMap((block) =>
              block.ladders.map((ladderId) => <li key={ladderId}>{resolveStep(ladderId, steps[ladderId]).name}</li>),
            )}
          </ul>
          {trainedToday ? (
            <p className="muted">Descanse: o músculo cresce na recuperação. Próximo treino amanhã ou depois.</p>
          ) : (
            <button type="button" className="button-primary" onClick={() => actions.startWorkout(next)}>
              Começar
            </button>
          )}
        </section>
      )}

      <section className="card">
        <div className="row">
          <h2>Semana</h2>
          <span className="muted">
            {weekCount} de {WEEKLY_GOAL}
          </span>
        </div>
        <div className="week-dots" aria-label={`${weekCount} de ${WEEKLY_GOAL} treinos nesta semana`}>
          {Array.from({ length: Math.max(WEEKLY_GOAL, weekCount) }, (_, i) => (
            <span key={i} className={`dot${i < weekCount ? ' done' : ''}`} />
          ))}
        </div>
      </section>
    </>
  )
}

function resumeText(session: Session): string {
  const slot = buildSlots(session.workout)[session.cursor]
  if (!slot) return 'Bora terminar?'
  const entry = session.entries.find((e) => e.ladderId === slot.ladderId)!
  return `Você parou em ${findStep(slot.ladderId, entry.stepId).name.toLowerCase()}, série ${slot.set + 1}. Bora terminar?`
}

function formatToday(): string {
  const text = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}
