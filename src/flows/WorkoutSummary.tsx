import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { bestSetFor, db, finishedSessions, lastSetsFor, type Session } from '../db.ts'
import { LADDERS, findStep, formatValue, resolveStep, type LadderId } from '../program/ladders.ts'
import { readyToStepUp } from '../program/progression.ts'
import { setLadderStep } from '../program/session.ts'
import { WORKOUTS } from '../program/workouts.ts'

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0)

export function WorkoutSummary({ session, onDone }: { session: Session; onDone: () => void }) {
  // Histórico anterior a este treino, para comparar.
  const history = useLiveQuery(async () => (await finishedSessions()).filter((s) => s.id !== session.id), [session.id])
  const ladders = useLiveQuery(() => db.ladders.toArray())
  const [decided, setDecided] = useState<Partial<Record<LadderId, 'up' | 'keep'>>>({})

  if (!history || !ladders) return null

  const minutes = Math.round(((session.finishedAt ?? session.startedAt) - session.startedAt) / 60_000)
  const done = session.entries.filter((e) => e.sets.length > 0)

  const rows = done.map((entry) => {
    const step = findStep(entry.ladderId, entry.stepId)
    const previous = lastSetsFor(history, entry.stepId)
    const previousBest = bestSetFor(history, entry.stepId)
    const block = WORKOUTS[session.workout].find((b) => b.ladders.includes(entry.ladderId))!
    const current = ladders.find((l) => l.ladderId === entry.ladderId)?.stepIndex ?? 0
    const canStepUp =
      readyToStepUp(entry.sets, step.range, block.sets) &&
      step.index < LADDERS[entry.ladderId].steps.length - 1 &&
      (current === step.index || decided[entry.ladderId] === 'up')
    return {
      entry,
      step,
      delta: previous ? sum(entry.sets) - sum(previous) : undefined,
      record: previous !== undefined && Math.max(...entry.sets) > previousBest,
      canStepUp,
    }
  })

  const totalDelta = sum(rows.map((r) => r.delta ?? 0))
  const records = rows.filter((r) => r.record).length

  return (
    <div className="flow-content">
      <p className="eyebrow">Treino {session.workout} concluído · {minutes} min</p>
      <h1>Mandou bem! 💪</h1>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-value">{totalDelta > 0 ? `+${totalDelta}` : totalDelta}</span>
          <span className="muted small">vs. último treino</span>
        </div>
        <div className="stat">
          <span className="stat-value">{records}</span>
          <span className="muted small">{records === 1 ? 'recorde' : 'recordes'}</span>
        </div>
      </div>

      {rows
        .filter((r) => r.canStepUp)
        .map(({ entry, step }) => {
          const next = resolveStep(entry.ladderId, step.index + 1)
          const choice = decided[entry.ladderId]
          return (
            <div key={entry.ladderId} className="card card-primary">
              <p className="eyebrow">Hora de subir de degrau</p>
              <h2>
                {step.name} → {next.name}
              </h2>
              {choice === 'up' ? (
                <p>Feito! No próximo treino você começa em {next.name.toLowerCase()}.</p>
              ) : choice === 'keep' ? (
                <p className="muted">Ok, mais uma semana neste degrau.</p>
              ) : (
                <>
                  <p>
                    Você bateu {entry.sets.map((s) => formatValue(s, step.unit)).join(' · ')}, o topo da faixa. Bora para o
                    próximo?
                  </p>
                  <div className="rest-actions">
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => {
                        void setLadderStep(entry.ladderId, step.index + 1)
                        setDecided((d) => ({ ...d, [entry.ladderId]: 'up' }))
                      }}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setDecided((d) => ({ ...d, [entry.ladderId]: 'keep' }))}
                    >
                      Manter
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}

      <ul className="plan-list">
        {rows.map(({ entry, step, delta, record }) => (
          <li key={entry.ladderId} className="plan-row">
            <span>
              {step.name}
              {record && ' 🏆'}
            </span>
            <span className="muted">
              {entry.sets.map((s) => formatValue(s, step.unit)).join(' · ')}
              {delta !== undefined && delta !== 0 && (
                <strong className={delta > 0 ? 'up' : 'down'}> {delta > 0 ? `+${delta}` : delta}</strong>
              )}
            </span>
          </li>
        ))}
      </ul>

      <button type="button" className="button-primary" onClick={onDone}>
        Concluir
      </button>
    </div>
  )
}
