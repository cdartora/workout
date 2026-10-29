import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { addFoodLog, db, type FoodShortcut } from '../db.ts'
import { startOfDay } from '../program/session.ts'

/** Cadastro de atalhos (porções que você realmente come) e registro avulso. */
export function ShortcutEditor() {
  const shortcuts = useLiveQuery(() => db.foodShortcuts.orderBy('order').toArray())
  const [editing, setEditing] = useState<FoodShortcut | 'new'>()

  if (!shortcuts) return null

  const save = async (name: string, protein: number) => {
    if (editing === 'new') {
      const order = (shortcuts.at(-1)?.order ?? -1) + 1
      await db.foodShortcuts.add({ name, protein, order })
    } else if (editing) {
      await db.foodShortcuts.update(editing.id!, { name, protein })
    }
    setEditing(undefined)
  }

  return (
    <>
      <section className="card">
        <h2>Algo fora dos atalhos?</h2>
        <FoodForm submitLabel="Adicionar" onSubmit={(name, protein) => void addFoodLog(name, protein, startOfDay())} clearOnSubmit />
      </section>

      <section className="card">
        <div className="row">
          <h2>Atalhos</h2>
          <button type="button" className="button-link" onClick={() => setEditing('new')}>
            + Novo
          </button>
        </div>
        <p className="muted small">Cadastre as porções que você come de verdade, com a proteína da porção (veja no rótulo).</p>
        {editing === 'new' && <FoodForm submitLabel="Criar atalho" onSubmit={save} onCancel={() => setEditing(undefined)} />}
        <ul className="log-list">
          {shortcuts.map((s) =>
            editing !== 'new' && editing?.id === s.id ? (
              <li key={s.id} className="log-edit">
                <FoodForm
                  initial={s}
                  submitLabel="Salvar"
                  onSubmit={save}
                  onCancel={() => setEditing(undefined)}
                  onDelete={() => {
                    void db.foodShortcuts.delete(s.id!)
                    setEditing(undefined)
                  }}
                />
              </li>
            ) : (
              <li key={s.id}>
                <button type="button" className="log-button" onClick={() => setEditing(s)}>
                  <span>{s.name}</span>
                  <span className="muted">{s.protein} g ›</span>
                </button>
              </li>
            ),
          )}
        </ul>
      </section>
    </>
  )
}

function FoodForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
  clearOnSubmit = false,
}: {
  initial?: { name: string; protein: number }
  submitLabel: string
  onSubmit: (name: string, protein: number) => void
  onCancel?: () => void
  onDelete?: () => void
  clearOnSubmit?: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [protein, setProtein] = useState(initial ? String(initial.protein) : '')
  const grams = Math.round(Number(protein))
  const valid = name.trim().length > 0 && grams > 0 && grams < 500

  return (
    <form
      className="food-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSubmit(name.trim(), grams)
        if (clearOnSubmit) {
          setName('')
          setProtein('')
        }
      }}
    >
      <input type="text" placeholder="Ex.: 2 fatias de queijo" aria-label="Alimento" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="input-with-unit">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Proteína"
          aria-label="Proteína em gramas"
          value={protein}
          onChange={(e) => setProtein(e.target.value.replace(/\D/g, ''))}
        />
        <span className="muted">g</span>
      </label>
      <div className="form-actions">
        <button type="submit" className="button-primary" disabled={!valid}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="button-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
      {onDelete && (
        <button type="button" className="button-link danger" onClick={onDelete}>
          Apagar atalho
        </button>
      )}
    </form>
  )
}
