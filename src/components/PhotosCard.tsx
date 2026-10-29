import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, type Photo, type Pose } from '../db.ts'
import { compressImage } from '../lib/image.ts'
import { formatKg } from '../program/nutrition.ts'
import { startOfDay } from '../program/session.ts'
import { BlobImage } from './BlobImage.tsx'

const POSES: { id: Pose; label: string }[] = [
  { id: 'frente', label: 'Frente' },
  { id: 'lado', label: 'Lado' },
  { id: 'costas', label: 'Costas' },
]

const formatDate = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

/** Fotos mensais (frente/lado/costas), guardadas só no aparelho, com comparação lado a lado. */
export function PhotosCard() {
  const today = startOfDay()
  const data = useLiveQuery(async () => {
    const [photos, weighIns] = await Promise.all([db.photos.orderBy('date').toArray(), db.weighIns.orderBy('date').toArray()])
    return { photos, weighIns }
  })
  const [pose, setPose] = useState<Pose>('frente')
  const [pair, setPair] = useState<[number?, number?]>([])
  const [managing, setManaging] = useState(false)

  if (!data) return null
  const { photos, weighIns } = data
  const todays = new Map(photos.filter((p) => p.date === today).map((p) => [p.pose, p]))
  const datesForPose = [...new Set(photos.filter((p) => p.pose === pose).map((p) => p.date))]
  const allDates = [...new Set(photos.map((p) => p.date))].reverse()

  const before = pair[0] ?? datesForPose[0]
  const after = pair[1] ?? datesForPose.at(-1)
  const photoAt = (date: number | undefined) => photos.find((p) => p.date === date && p.pose === pose)
  const weightAt = (date: number) => [...weighIns].reverse().find((w) => w.date <= date)?.weightKg

  return (
    <section className="card" id="fotos">
      <h2>Fotos de progresso</h2>
      <p className="muted small">
        Uma vez por mês, mesma luz, mesmo lugar, mesma hora do dia. Ficam só neste aparelho (e no seu backup).
      </p>

      <div className="photo-slots">
        {POSES.map(({ id, label }) => (
          <PhotoSlot key={id} label={label} photo={todays.get(id)} onFile={(file) => void savePhoto(today, id, file)} />
        ))}
      </div>

      {allDates.length > 1 && (
        <>
          <div className="segmented" role="tablist">
            {POSES.map(({ id, label }) => (
              <button key={id} type="button" role="tab" aria-selected={pose === id} onClick={() => setPose(id)}>
                {label}
              </button>
            ))}
          </div>
          {datesForPose.length < 2 ? (
            <p className="muted small">Tire mais uma foto de {pose} em outro dia para comparar.</p>
          ) : (
            <div className="photo-compare">
              {[before, after].map((date, i) => (
                <figure key={i}>
                  {photoAt(date) && <BlobImage blob={photoAt(date)!.blob} alt={`${pose} em ${formatDate(date!)}`} />}
                  <select
                    aria-label={i === 0 ? 'Data da foto antes' : 'Data da foto depois'}
                    value={date}
                    onChange={(e) => setPair((p) => (i === 0 ? [Number(e.target.value), p[1]] : [p[0], Number(e.target.value)]))}
                  >
                    {datesForPose.map((d) => (
                      <option key={d} value={d}>
                        {formatDate(d)}
                      </option>
                    ))}
                  </select>
                  {date !== undefined && weightAt(date) && <figcaption className="muted small">{formatKg(weightAt(date)!)} kg</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </>
      )}

      {allDates.length > 0 && (
        <button type="button" className="button-link" onClick={() => setManaging((m) => !m)}>
          {managing ? 'Fechar' : 'Gerenciar fotos'}
        </button>
      )}
      {managing && (
        <ul className="log-list">
          {allDates.map((date) => (
            <li key={date}>
              <span>{formatDate(date)}</span>
              <span className="muted">{photos.filter((p) => p.date === date).length} fotos</span>
              <button
                type="button"
                className="remove"
                aria-label={`Apagar fotos de ${formatDate(date)}`}
                onClick={() => {
                  if (confirm(`Apagar as fotos de ${formatDate(date)}?`)) void db.photos.where('date').equals(date).delete()
                }}
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

function PhotoSlot({ label, photo, onFile }: { label: string; photo?: Photo; onFile: (file: File) => void }) {
  return (
    <label className={`photo-slot${photo ? ' filled' : ''}`}>
      {photo ? <BlobImage blob={photo.blob} alt={label} /> : <span className="photo-plus">+</span>}
      <span className="photo-label">{photo ? `${label} · trocar` : label}</span>
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </label>
  )
}

async function savePhoto(date: number, pose: Pose, file: File) {
  const blob = await compressImage(file)
  await db.transaction('rw', db.photos, async () => {
    await db.photos.where('[date+pose]').equals([date, pose]).delete()
    await db.photos.add({ date, pose, blob })
  })
}
