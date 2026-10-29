import { useState, type ReactNode } from 'react'
import type { Session } from '../db.ts'
import { startOfDay, startOfWeek } from '../program/session.ts'

const WEEKS = 16
const DAY = 24 * 60 * 60 * 1000
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

/** Calendário estilo GitHub: últimas 16 semanas, uma coluna por semana (segunda a domingo). */
export function TrainingCalendar({ sessions, now }: { sessions: readonly Session[]; now: number }) {
  const [selected, setSelected] = useState<number>()
  const byDay = new Map<number, Session[]>()
  for (const s of sessions) {
    const day = startOfDay(new Date(s.finishedAt!))
    byDay.set(day, [...(byDay.get(day) ?? []), s])
  }

  const today = startOfDay(new Date(now))
  const thisWeek = startOfWeek(new Date(now))
  // Dias calculados por data (não por milissegundos) para não sofrer com horário de verão.
  const dayAt = (week: number, weekday: number) => {
    const d = new Date(thisWeek)
    d.setDate(d.getDate() - (WEEKS - 1 - week) * 7 + weekday)
    return d.getTime()
  }

  const months = Array.from({ length: WEEKS }, (_, w) => {
    const first = new Date(dayAt(w, 0))
    const prev = new Date(dayAt(w, 0) - 7 * DAY)
    return w === 0 || first.getMonth() !== prev.getMonth()
      ? first.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      : ''
  })

  const selectedSessions = selected !== undefined ? byDay.get(selected) : undefined

  return (
    <div className="calendar">
      <div className="calendar-grid" style={{ gridTemplateColumns: `14px repeat(${WEEKS}, 1fr)` }}>
        <span />
        {months.map((m, w) => (
          <span key={w} className="calendar-month">
            {m}
          </span>
        ))}
        {WEEKDAYS.map((label, weekday) => (
          <Row key={weekday} label={label}>
            {Array.from({ length: WEEKS }, (_, w) => {
              const day = dayAt(w, weekday)
              const trained = byDay.has(day)
              const future = day > today
              const date = new Date(day).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
              return (
                <button
                  key={w}
                  type="button"
                  className={`calendar-cell${trained ? ' trained' : ''}${day === today ? ' today' : ''}${day === selected ? ' selected' : ''}`}
                  disabled={future}
                  aria-label={`${date}${trained ? ': treinou' : ''}`}
                  onClick={() => setSelected(day === selected ? undefined : day)}
                />
              )
            })}
          </Row>
        ))}
      </div>
      <p className="muted small calendar-caption">
        {selected === undefined
          ? 'Cada quadrado é um dia. Toque para ver.'
          : `${new Date(selected).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}: ${
              selectedSessions ? selectedSessions.map((s) => `Treino ${s.workout}`).join(' + ') : 'descanso'
            }`}
      </p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="calendar-weekday">{label}</span>
      {children}
    </>
  )
}
