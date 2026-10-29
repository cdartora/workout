import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { AchievementsCard } from '../components/AchievementsCard.tsx'
import { LineChart } from '../components/LineChart.tsx'
import { PhotosCard } from '../components/PhotosCard.tsx'
import { TrainingCalendar } from '../components/TrainingCalendar.tsx'
import { db, finishedSessions, proteinByDay } from '../db.ts'
import { computeAchievements } from '../program/achievements.ts'
import { LADDERS, LADDER_IDS, formatValue, resolveStep, type LadderId } from '../program/ladders.ts'
import { formatKg } from '../program/nutrition.ts'
import { currentSteps } from '../program/session.ts'
import { bestStreak, currentStreak } from '../program/streaks.ts'

export function ProgressScreen() {
  const data = useLiveQuery(async () => {
    const [sessions, steps, weighIns, protein] = await Promise.all([
      finishedSessions(),
      currentSteps(),
      db.weighIns.orderBy('date').toArray(),
      proteinByDay(),
    ])
    return { sessions, steps, weighIns, protein, now: Date.now() }
  })
  const [ladder, setLadder] = useState<LadderId>('push_h')

  // Link "#progresso/fotos" (vindo da tela Hoje) rola até as fotos.
  useEffect(() => {
    if (data && window.location.hash.endsWith('/fotos')) document.getElementById('fotos')?.scrollIntoView()
  }, [data])

  if (!data) return null
  const { sessions, steps, weighIns, protein, now } = data
  const finished = sessions.map((s) => s.finishedAt!)
  const achievements = computeAchievements({ sessions, weighIns, proteinByDay: protein })

  return (
    <>
      <header className="screen-header">
        <h1>Progresso</h1>
      </header>

      <div className="stat-row three">
        <div className="stat">
          <span className="stat-value">🔥 {currentStreak(finished, now)}</span>
          <span className="muted small">semanas seguidas</span>
        </div>
        <div className="stat">
          <span className="stat-value">{bestStreak(finished)}</span>
          <span className="muted small">melhor sequência</span>
        </div>
        <div className="stat">
          <span className="stat-value">{sessions.length}</span>
          <span className="muted small">treinos</span>
        </div>
      </div>

      <section className="card">
        <h2>Calendário</h2>
        <TrainingCalendar sessions={sessions} now={now} />
      </section>

      <ExerciseProgress ladder={ladder} onSelect={setLadder} sessions={sessions} stepIndex={steps[ladder]} />

      <section className="card">
        <div className="row">
          <h2>Peso</h2>
          {weighIns.length > 1 && (
            <span className="muted">{formatKg(weighIns.at(-1)!.weightKg - weighIns[0].weightKg, true)} kg no total</span>
          )}
        </div>
        {weighIns.length > 1 ? (
          <LineChart label="Peso" points={weighIns.map((w) => ({ x: w.date, y: w.weightKg }))} formatY={(y) => formatKg(y)} />
        ) : (
          <p className="muted">O gráfico aparece a partir da segunda pesagem.</p>
        )}
      </section>

      <AchievementsCard achievements={achievements} />

      <PhotosCard />
    </>
  )
}

function ExerciseProgress({
  ladder,
  onSelect,
  sessions,
  stepIndex,
}: {
  ladder: LadderId
  onSelect: (id: LadderId) => void
  sessions: Awaited<ReturnType<typeof finishedSessions>>
  stepIndex: number
}) {
  const step = resolveStep(ladder, stepIndex)
  // Evolução dentro do degrau atual: total da sessão (soma das séries).
  const points = sessions
    .flatMap((s) =>
      s.entries
        .filter((e) => e.stepId === step.id && e.sets.length > 0)
        .map((e) => ({
          x: s.finishedAt!,
          y: e.sets.reduce((a, b) => a + b, 0),
          detail: e.sets.map((v) => formatValue(v, step.unit)).join(' · '),
        })),
    )
    .reverse()
  const unit = step.unit === 'seconds' ? 's' : 'rep.'

  return (
    <section className="card">
      <h2>Exercícios</h2>
      <div className="chips scroll">
        {LADDER_IDS.map((id) => (
          <button key={id} type="button" className="chip" aria-pressed={id === ladder} onClick={() => onSelect(id)}>
            {LADDERS[id].name}
          </button>
        ))}
      </div>
      <div>
        <div className="row">
          <strong>{step.name}</strong>
          <span className="muted small">
            degrau {step.index + 1} de {LADDERS[ladder].steps.length}
          </span>
        </div>
        <div className="ladder-bar" aria-hidden="true">
          {LADDERS[ladder].steps.map((s, i) => (
            <span key={s.id} className={i <= step.index ? 'filled' : ''} />
          ))}
        </div>
      </div>
      {points.length > 1 ? (
        <>
          <p className="muted small">Total por treino ({unit}) neste degrau</p>
          <LineChart label={`${step.name}, total por treino`} points={points} formatY={(y) => `${Math.round(y)}`} />
        </>
      ) : (
        <p className="muted small">
          {points.length === 1
            ? `Último: ${points[0].detail}. O gráfico aparece a partir do segundo treino neste degrau.`
            : 'Ainda sem treinos neste degrau.'}
        </p>
      )}
    </section>
  )
}
