import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, saveWeighIn } from '../db.ts'
import { formatKg, parseDecimal, weightAdvice, type WeightAdvice } from '../program/nutrition.ts'
import { startOfDay, startOfWeek } from '../program/session.ts'

const ADVICE: Record<WeightAdvice['kind'], string> = {
  none: 'Pese-se de novo na próxima semana para ver a tendência. Alvo: +0,2 a +0,35 kg por semana.',
  stalled:
    'Peso parado há ~2 semanas. Coma ~300 kcal a mais por dia — ex.: pão com pasta de amendoim e um copo de leite, ou banana com aveia.',
  slow: 'Ganho abaixo do alvo (+0,2 a +0,35 kg/semana). Se repetir na próxima semana, coma um pouco mais.',
  'on-track': 'No alvo! Ganho de peso no ritmo certo para ganhar músculo. Siga assim.',
  fast: 'Um pouco acima do alvo. Tudo bem, mas fique de olho na próxima pesagem.',
  'too-fast': 'Rápido demais — parte disso tende a ser gordura. Segure um pouco: ~200 kcal a menos por dia.',
}

/** Pesagem semanal. `prompt`: versão curta para a tela Hoje (só aparece se faltar a pesagem da semana). */
export function WeightCard({ prompt = false }: { prompt?: boolean }) {
  const weighIns = useLiveQuery(() => db.weighIns.orderBy('date').reverse().toArray())
  const [editing, setEditing] = useState(false)

  if (!weighIns) return null
  const weighedThisWeek = weighIns.some((w) => w.date >= startOfWeek())
  if (prompt && weighedThisWeek) return null

  const [latest, ...older] = weighIns
  const advice = weightAdvice(weighIns)

  if (prompt) {
    return (
      <section className="card card-primary">
        <p className="eyebrow">Pesagem semanal</p>
        <h2>Hora de subir na balança</h2>
        <p className="muted small">De preferência às segundas, ao acordar, em jejum e depois do banheiro.</p>
        <WeighInForm initial={latest?.weightKg} />
      </section>
    )
  }

  return (
    <section className="card">
      <div className="row">
        <h2>Peso</h2>
        {latest && (
          <span>
            <strong>{formatKg(latest.weightKg)} kg</strong>
            {advice.kind !== 'none' && (
              <span className={advice.weeklyChange >= 0.2 ? 'up' : 'muted'}>
                {' '}
                {formatKg(advice.weeklyChange, true)}/sem
              </span>
            )}
          </span>
        )}
      </div>
      {latest ? <p className="small">{ADVICE[advice.kind]}</p> : <p className="muted">Registre seu peso de hoje para começar.</p>}

      {!latest || editing || !weighedThisWeek ? (
        <WeighInForm initial={latest?.weightKg} onSaved={() => setEditing(false)} />
      ) : (
        <button type="button" className="button-secondary" onClick={() => setEditing(true)}>
          Registrar peso
        </button>
      )}

      {older.length > 0 && (
        <ul className="log-list">
          {[latest, ...older].slice(0, 8).map((w) => (
            <li key={w.id}>
              <span>{new Date(w.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
              <span className="muted">{formatKg(w.weightKg)} kg</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function WeighInForm({ initial, onSaved }: { initial?: number; onSaved?: () => void }) {
  const [text, setText] = useState(initial ? formatKg(initial) : '')
  const value = parseDecimal(text)
  const valid = value !== undefined && value >= 30 && value <= 250
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        void saveWeighIn(startOfDay(), Math.round(value * 10) / 10).then(onSaved)
      }}
    >
      <label className="input-with-unit">
        <input
          type="text"
          inputMode="decimal"
          placeholder="73,0"
          aria-label="Peso em kg"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <span className="muted">kg</span>
      </label>
      <button type="submit" className="button-primary" disabled={!valid}>
        Salvar
      </button>
    </form>
  )
}
