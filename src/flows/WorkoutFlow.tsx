import { useEffect, useMemo, useState } from 'react'
import { Counter } from '../components/Counter.tsx'
import { ExerciseInfo } from '../components/ExerciseInfo.tsx'
import { FlowShell } from '../components/FlowShell.tsx'
import { RestTimer } from '../components/RestTimer.tsx'
import { Stopwatch } from '../components/Stopwatch.tsx'
import { db, type Session } from '../db.ts'
import { formatClock, useNow, useWakeLock } from '../lib/hooks.ts'
import { unlockAudio } from '../lib/sound.ts'
import { findStep, formatValue } from '../program/ladders.ts'
import { changeSessionStep } from '../program/session.ts'
import { WARMUP, WORKOUTS, buildSlots, type Slot } from '../program/workouts.ts'
import { WorkoutSummary } from './WorkoutSummary.tsx'

type Phase = 'overview' | 'warmup' | 'set' | 'rest' | 'summary'

export function WorkoutFlow({ sessionId, onDone }: { sessionId: number; onDone: () => void }) {
  useWakeLock()
  // Estado local é a fonte da verdade na tela; cada mudança também é gravada no banco
  // (para retomar o treino se o app fechar).
  const [session, setSession] = useState<Session>()
  const [chosenPhase, setPhase] = useState<Phase>()

  useEffect(() => {
    void db.sessions.get(sessionId).then(setSession)
  }, [sessionId])
  const workout = session?.workout
  const slots = useMemo(() => (workout ? buildSlots(workout) : []), [workout])

  if (!session) return null
  // Fase inicial: treino retomado vai direto para a próxima série.
  const phase = chosenPhase ?? (session.finishedAt ? 'summary' : session.cursor > 0 ? 'set' : 'overview')

  const save = (changes: Partial<Session>) => {
    setSession({ ...session, ...changes })
    void db.sessions.update(sessionId, changes)
  }

  const finish = () => {
    if (session.entries.every((e) => e.sets.length === 0)) {
      void db.sessions.delete(sessionId).then(onDone)
      return
    }
    save({ finishedAt: Date.now() })
    setPhase('summary')
  }

  const close = () => {
    if (phase === 'summary') return onDone()
    if (phase === 'overview') {
      void db.sessions.delete(sessionId).then(onDone)
      return
    }
    if (confirm('Encerrar o treino agora? As séries feitas ficam salvas.')) finish()
  }

  const completeSet = (slot: Slot, value: number) => {
    const entries = session.entries.map((e) => (e.ladderId === slot.ladderId ? { ...e, sets: [...e.sets, value] } : e))
    const cursor = session.cursor + 1
    if (cursor >= slots.length) {
      save({ entries, cursor, finishedAt: Date.now() })
      setPhase('summary')
    } else {
      save({ entries, cursor })
      setPhase(slot.rest > 0 ? 'rest' : 'set')
    }
  }

  const changeStep = (slot: Slot, stepIndex: number) => {
    void changeSessionStep(session, slot.ladderId, stepIndex).then((entries) => setSession((s) => s && { ...s, entries }))
  }

  const title = `Treino ${session.workout}`
  const progress = phase === 'summary' ? 1 : session.cursor / slots.length
  const closeLabel = phase === 'overview' || phase === 'summary' ? 'Fechar' : 'Encerrar'

  return (
    <FlowShell title={title} progress={phase === 'overview' ? undefined : progress} onClose={close} closeLabel={closeLabel}>
      {phase === 'overview' && (
        <Overview
          session={session}
          onStart={(withWarmup) => {
            unlockAudio()
            setPhase(withWarmup ? 'warmup' : 'set')
          }}
        />
      )}
      {phase === 'warmup' && <Warmup onDone={() => setPhase('set')} />}
      {phase === 'set' && (
        <SetScreen
          // Trocar o degrau recalcula as metas: remonta para o contador partir da nova meta.
          key={`${session.cursor}-${session.entries.find((e) => e.ladderId === slots[session.cursor].ladderId)!.stepId}`}
          session={session}
          slot={slots[session.cursor]}
          onChangeStep={(index) => changeStep(slots[session.cursor], index)}
          onDone={(value) => completeSet(slots[session.cursor], value)}
        />
      )}
      {phase === 'rest' && (
        <RestTimer key={session.cursor} seconds={slots[session.cursor - 1].rest} onDone={() => setPhase('set')}>
          <NextUp session={session} slot={slots[session.cursor]} />
        </RestTimer>
      )}
      {phase === 'summary' && <WorkoutSummary session={session} onDone={onDone} />}
    </FlowShell>
  )
}

function Overview({ session, onStart }: { session: Session; onStart: (withWarmup: boolean) => void }) {
  return (
    <div className="flow-content">
      <p className="eyebrow">~40 min · {WORKOUTS[session.workout].length} blocos</p>
      <h1>Treino {session.workout}</h1>
      <ul className="plan-list">
        {WORKOUTS[session.workout].map((block) => (
          <li key={block.label}>
            <p className="eyebrow">{block.label}</p>
            {block.ladders.map((ladderId) => {
              const entry = session.entries.find((e) => e.ladderId === ladderId)!
              const step = findStep(ladderId, entry.stepId)
              return (
                <div key={ladderId} className="plan-row">
                  <span>{step.name}</span>
                  <span className="muted">{entry.targets.map((t) => formatValue(t, step.unit)).join(' · ')}</span>
                </div>
              )
            })}
          </li>
        ))}
      </ul>
      <button type="button" className="button-primary" onClick={() => onStart(true)}>
        Começar com aquecimento
      </button>
      <button type="button" className="button-link" onClick={() => onStart(false)}>
        Já aqueci, pular aquecimento
      </button>
    </div>
  )
}

function Warmup({ onDone }: { onDone: () => void }) {
  const [endAt] = useState(() => Date.now() + WARMUP.seconds * 1000)
  const remaining = (endAt - useNow()) / 1000
  return (
    <div className="flow-content">
      <p className="eyebrow">Aquecimento · {formatClock(remaining)}</p>
      <h1>Aqueça o corpo</h1>
      <ul className="tips">
        {WARMUP.moves.map((move) => (
          <li key={move}>{move}</li>
        ))}
      </ul>
      <button type="button" className="button-primary" onClick={onDone}>
        {remaining > 0 ? 'Pronto, vamos lá' : 'Começar o treino'}
      </button>
    </div>
  )
}

function SetScreen({
  session,
  slot,
  onChangeStep,
  onDone,
}: {
  session: Session
  slot: Slot
  onChangeStep: (index: number) => void
  onDone: (value: number) => void
}) {
  const entry = session.entries.find((e) => e.ladderId === slot.ladderId)!
  const step = findStep(slot.ladderId, entry.stepId)
  const block = WORKOUTS[session.workout][slot.blockIndex]
  const target = entry.targets[slot.set]
  const [value, setValue] = useState(target)
  const [saving, setSaving] = useState(false)

  return (
    <div className="flow-content">
      <p className="eyebrow">{block.label}</p>
      <ExerciseInfo
        step={step}
        onChangeStep={entry.sets.length === 0 ? onChangeStep : undefined}
      />
      <div className="card set-card">
        <div className="row">
          <h2>
            Série {slot.set + 1} de {block.sets}
          </h2>
          <span className="muted">
            faixa {step.range[0]}–{step.range[1]}
            {step.unit === 'seconds' ? ' s' : ''}
          </span>
        </div>
        <p className="target">
          Meta: <strong>{formatValue(target, step.unit)}</strong>
          {step.perSide && ' por lado'}
        </p>
        {entry.sets.length > 0 && (
          <p className="muted small">Feitas: {entry.sets.map((s) => formatValue(s, step.unit)).join(' · ')}</p>
        )}
        {step.unit === 'seconds' && <Stopwatch target={target} onStop={setValue} />}
        <Counter value={value} unit={step.unit} onChange={setValue} />
      </div>
      <button
        type="button"
        className="button-primary"
        disabled={saving}
        onClick={() => {
          setSaving(true)
          onDone(value)
        }}
      >
        Feito
      </button>
    </div>
  )
}

function NextUp({ session, slot }: { session: Session; slot: Slot }) {
  const entry = session.entries.find((e) => e.ladderId === slot.ladderId)!
  const step = findStep(slot.ladderId, entry.stepId)
  return (
    <div className="card next-up">
      <p className="eyebrow">A seguir</p>
      <h2>{step.name}</h2>
      <p className="muted">
        Série {slot.set + 1} · meta {formatValue(entry.targets[slot.set], step.unit)}
        {step.perSide && ' por lado'}
      </p>
    </div>
  )
}
