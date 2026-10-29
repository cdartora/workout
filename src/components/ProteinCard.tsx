import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { addFoodLog, db, latestWeight } from '../db.ts'
import { proteinGoal } from '../program/nutrition.ts'
import { startOfDay } from '../program/session.ts'

/** Proteína do dia: barra de progresso + atalhos de um toque (com desfazer). */
export function ProteinCard({ showLog = false }: { showLog?: boolean }) {
  const today = startOfDay()
  const data = useLiveQuery(async () => {
    const [logs, shortcuts, weight] = await Promise.all([
      db.foodLogs.where('day').equals(today).sortBy('createdAt'),
      db.foodShortcuts.orderBy('order').toArray(),
      latestWeight(),
    ])
    return { logs, shortcuts, weight }
  }, [today])
  const [undo, setUndo] = useState<{ id: number; label: string }>()

  useEffect(() => {
    if (!undo) return
    const id = setTimeout(() => setUndo(undefined), 4000)
    return () => clearTimeout(id)
  }, [undo])

  if (!data) return null
  const { logs, shortcuts, weight } = data
  const total = logs.reduce((sum, l) => sum + l.protein, 0)
  const goal = weight ? proteinGoal(weight) : undefined
  const progress = goal ? Math.min(1, total / goal) : 0

  const add = async (name: string, protein: number) => {
    const id = await addFoodLog(name, protein, today)
    setUndo({ id, label: `${name} (+${protein} g)` })
  }

  return (
    <section className="card">
      <div className="row">
        <h2>Proteína hoje</h2>
        <span className={goal && total >= goal ? 'up' : 'muted'}>
          <strong>{total}</strong>
          {goal ? ` / ${goal} g` : ' g'}
        </span>
      </div>
      <div className="meter" aria-hidden="true">
        <div style={{ width: `${progress * 100}%` }} />
      </div>
      {!goal && <p className="muted small">Registre seu peso para calcular a meta (1,8 g por kg).</p>}
      {goal && total >= goal && <p className="up small">Meta batida! 💪</p>}

      <div className="chips">
        {shortcuts.map((s) => (
          <button key={s.id} type="button" className="chip" onClick={() => void add(s.name, s.protein)}>
            {s.name} <span className="muted">{s.protein} g</span>
          </button>
        ))}
      </div>

      {undo && (
        <div className="toast" role="status">
          <span>Adicionado: {undo.label}</span>
          <button
            type="button"
            className="button-link"
            onClick={() => {
              void db.foodLogs.delete(undo.id)
              setUndo(undefined)
            }}
          >
            Desfazer
          </button>
        </div>
      )}

      {showLog && logs.length > 0 && (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span>{log.name}</span>
              <span className="muted">{log.protein} g</span>
              <button
                type="button"
                className="remove"
                aria-label={`Remover ${log.name}`}
                onClick={() => void db.foodLogs.delete(log.id!)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
