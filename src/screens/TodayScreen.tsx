import { useLiveQuery } from 'dexie-react-hooks'
import type { FlowActions } from '../App.tsx'
import { BackupCard } from '../components/BackupCard.tsx'
import { InstallHint } from '../components/InstallHint.tsx'
import { ProteinCard } from '../components/ProteinCard.tsx'
import { WeightCard } from '../components/WeightCard.tsx'
import { db, finishedSessions, unfinishedSession, type Session } from '../db.ts'
import { findStep, resolveStep } from '../program/ladders.ts'
import { currentSteps, nextWorkoutAfter, startOfDay, startOfWeek } from '../program/session.ts'
import { WEEKLY_GOAL, currentStreak } from '../program/streaks.ts'
import { WORKOUTS, buildSlots } from '../program/workouts.ts'

const DAY = 24 * 60 * 60 * 1000
/** Sugere refazer o teste de nível depois de 4 semanas (spec: a cada 4–6). */
const RETEST_AFTER = 28 * DAY
/** Fotos de progresso: uma rodada por mês. */
const PHOTOS_EVERY = 28 * DAY

export function TodayScreen({ actions }: { actions: FlowActions }) {
  const data = useLiveQuery(async () => {
    const [lastTest, history, inProgress, steps, lastPhoto] = await Promise.all([
      db.levelTests.orderBy('date').last(),
      finishedSessions(),
      unfinishedSession(),
      currentSteps(),
      db.photos.orderBy('date').last(),
    ])
    const now = Date.now()
    return {
      tested: lastTest !== undefined,
      retestDue: lastTest !== undefined && now - lastTest.date >= RETEST_AFTER && !inProgress,
      photosDue: lastTest !== undefined && (!lastPhoto || now - lastPhoto.date >= PHOTOS_EVERY),
      history,
      inProgress,
      steps,
      streak: currentStreak(history.map((s) => s.finishedAt!), now),
      // Segunda-feira: a pesagem vem antes de tudo.
      isMonday: new Date(now).getDay() === 1,
    }
  })

  if (!data) return null
  const { tested, retestDue, photosDue, history, inProgress, steps, streak, isMonday } = data

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

      {isMonday && <WeightCard prompt />}

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
        {streak > 0 && (
          <p className="small">
            🔥 <strong>{streak}</strong> {streak === 1 ? 'semana completa' : 'semanas seguidas'}
            {weekCount < WEEKLY_GOAL && ' — complete esta semana para manter'}
          </p>
        )}
      </section>

      {retestDue && (
        <section className="card">
          <p className="eyebrow">Marco de progresso</p>
          <h2>Hora de refazer o teste de nível</h2>
          <p className="muted small">Já faz 4 semanas. Compare seus números com o último teste e recalibre os degraus.</p>
          <button type="button" className="button-secondary" onClick={actions.startLevelTest}>
            Refazer teste
          </button>
        </section>
      )}

      {photosDue && (
        <section className="card">
          <p className="eyebrow">Fotos do mês</p>
          <h2>Registre como você está hoje</h2>
          <p className="muted small">Frente, lado e costas. Daqui a uns meses você vai agradecer.</p>
          <a className="button-secondary as-link" href="#progresso/fotos">
            Tirar fotos
          </a>
        </section>
      )}

      {!isMonday && <WeightCard prompt />}

      <BackupCard reminder />

      <ProteinCard />
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
