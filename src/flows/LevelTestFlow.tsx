import { useState } from 'react'
import { Counter } from '../components/Counter.tsx'
import { ExerciseInfo } from '../components/ExerciseInfo.tsx'
import { FlowShell } from '../components/FlowShell.tsx'
import { RestTimer } from '../components/RestTimer.tsx'
import { Stopwatch } from '../components/Stopwatch.tsx'
import { db, type LevelTest } from '../db.ts'
import { useWakeLock } from '../lib/hooks.ts'
import { unlockAudio } from '../lib/sound.ts'
import { LADDER_IDS, LADDERS, resolveStep, type LadderId } from '../program/ladders.ts'
import { LEVEL_TEST, LEVEL_TEST_REST, startingStep } from '../program/levelTest.ts'

type Phase = { kind: 'intro' } | { kind: 'test'; index: number } | { kind: 'rest'; index: number } | { kind: 'results' }

export function LevelTestFlow({ onDone }: { onDone: () => void }) {
  useWakeLock()
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' })
  const [values, setValues] = useState<number[]>([])
  const [steps, setSteps] = useState<Partial<Record<LadderId, number>>>({})

  const record = (index: number, value: number) => {
    const item = LEVEL_TEST[index]
    setValues((v) => Object.assign([...v], { [index]: value }))
    setSteps((s) => ({ ...s, [item.ladderId]: startingStep(item, value) }))
    setPhase(index + 1 < LEVEL_TEST.length ? { kind: 'rest', index: index + 1 } : { kind: 'results' })
  }

  const save = async () => {
    const now = Date.now()
    const results: LevelTest['results'] = {}
    LEVEL_TEST.forEach((item, i) => {
      results[item.ladderId] = {
        stepId: resolveStep(item.ladderId, item.testStep).id,
        value: values[i],
        startingStep: steps[item.ladderId]!,
      }
    })
    await db.transaction('rw', db.ladders, db.levelTests, async () => {
      const existing = new Map((await db.ladders.toArray()).map((s) => [s.ladderId, s.stepIndex]))
      await db.ladders.bulkPut(
        LADDER_IDS.map((ladderId) => ({
          ladderId,
          stepIndex: steps[ladderId] ?? existing.get(ladderId) ?? 0,
          updatedAt: now,
        })),
      )
      await db.levelTests.add({ date: now, results })
    })
    onDone()
  }

  const close = () => {
    if (phase.kind === 'intro' || confirm('Sair do teste? Os resultados não serão salvos.')) onDone()
  }

  const progress = phase.kind === 'intro' ? 0 : phase.kind === 'results' ? 1 : phase.index / LEVEL_TEST.length

  return (
    <FlowShell title="Teste de nível" progress={progress} onClose={close}>
      {phase.kind === 'intro' && (
        <div className="flow-content">
          <h1>Teste de nível</h1>
          <p>
            {LEVEL_TEST.length} movimentos, ~20 min. Em cada um, faça o <strong>máximo que conseguir com boa forma</strong> e
            registre o número. O resultado define em que degrau você começa cada exercício.
          </p>
          <ul className="tips">
            <li>Faça 5 min de aquecimento leve antes.</li>
            <li>Pare quando a forma quebrar — repetição feia não conta.</li>
            <li>Descanso de {LEVEL_TEST_REST} s entre os movimentos.</li>
            <li>Errou o nível? Você ajusta os degraus no final e durante os treinos.</li>
          </ul>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              unlockAudio()
              setPhase({ kind: 'test', index: 0 })
            }}
          >
            Começar
          </button>
        </div>
      )}

      {phase.kind === 'test' && <TestItem key={phase.index} index={phase.index} onRecord={(v) => record(phase.index, v)} />}

      {phase.kind === 'rest' && (
        <RestTimer seconds={LEVEL_TEST_REST} onDone={() => setPhase({ kind: 'test', index: phase.index })}>
          <p className="muted rest-next">
            Próximo: <strong>{resolveStep(LEVEL_TEST[phase.index].ladderId, LEVEL_TEST[phase.index].testStep).name}</strong>
          </p>
        </RestTimer>
      )}

      {phase.kind === 'results' && (
        <div className="flow-content">
          <h1>Seus degraus iniciais</h1>
          <p className="muted">Ajuste com ‹ › se achar que ficou fácil ou difícil demais.</p>
          <ul className="result-list">
            {LEVEL_TEST.map((item, i) => {
              const step = resolveStep(item.ladderId, steps[item.ladderId] ?? 0)
              const total = LADDERS[item.ladderId].steps.length
              const tested = resolveStep(item.ladderId, item.testStep)
              return (
                <li key={item.ladderId} className="result-item">
                  <div>
                    <p className="eyebrow">{LADDERS[item.ladderId].name}</p>
                    <p className="result-step">{step.name}</p>
                    <p className="muted small">
                      Teste: {values[i]}
                      {tested.unit === 'seconds' ? ' s' : ' rep.'} em {tested.name.toLowerCase()}
                    </p>
                  </div>
                  <div className="result-arrows">
                    <button
                      type="button"
                      className="step-arrow"
                      aria-label="Mais fácil"
                      disabled={step.index === 0}
                      onClick={() => setSteps((s) => ({ ...s, [item.ladderId]: step.index - 1 }))}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="step-arrow"
                      aria-label="Mais difícil"
                      disabled={step.index === total - 1}
                      onClick={() => setSteps((s) => ({ ...s, [item.ladderId]: step.index + 1 }))}
                    >
                      ›
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="muted small">Exercícios com elástico começam no elástico leve.</p>
          <button type="button" className="button-primary" onClick={save}>
            Salvar e começar
          </button>
        </div>
      )}
    </FlowShell>
  )
}

function TestItem({ index, onRecord }: { index: number; onRecord: (value: number) => void }) {
  const item = LEVEL_TEST[index]
  const step = resolveStep(item.ladderId, item.testStep)
  const [value, setValue] = useState(0)
  return (
    <div className="flow-content">
      <p className="eyebrow">
        Movimento {index + 1} de {LEVEL_TEST.length}
      </p>
      <ExerciseInfo step={step} />
      <div className="card">
        <p>
          {step.unit === 'seconds'
            ? 'Segure o máximo de tempo com boa forma.'
            : `Faça o máximo de repetições seguidas com boa forma${step.perSide ? ' (por lado)' : ''}.`}
        </p>
        {item.tip && <p className="muted small">{item.tip}</p>}
        {step.unit === 'seconds' && <Stopwatch target={60} onStop={setValue} />}
        <Counter value={value} unit={step.unit} onChange={setValue} />
      </div>
      <button type="button" className="button-primary" onClick={() => onRecord(value)}>
        Registrar
      </button>
    </div>
  )
}
