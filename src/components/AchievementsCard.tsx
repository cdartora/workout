import type { Achievement } from '../program/achievements.ts'

const formatDate = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })

export function AchievementsCard({ achievements }: { achievements: readonly Achievement[] }) {
  const unlocked = achievements.filter((a) => a.unlockedAt).sort((a, b) => b.unlockedAt! - a.unlockedAt!)
  const locked = achievements.filter((a) => !a.unlockedAt)
  return (
    <section className="card">
      <div className="row">
        <h2>Conquistas</h2>
        <span className="muted">
          {unlocked.length} de {achievements.length}
        </span>
      </div>
      {unlocked.length > 0 ? (
        <ul className="badges">
          {unlocked.map((a) => (
            <li key={a.id} className="badge">
              <span className="badge-emoji" aria-hidden="true">
                {a.emoji}
              </span>
              <span className="badge-title">{a.title}</span>
              <span className="muted small">{formatDate(a.unlockedAt!)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">Conclua seu primeiro treino para desbloquear a primeira.</p>
      )}
      {locked.length > 0 && (
        <details className="locked-list">
          <summary>Próximas ({locked.length})</summary>
          <ul className="log-list">
            {locked.map((a) => (
              <li key={a.id}>
                <span className="locked-emoji" aria-hidden="true">
                  {a.emoji}
                </span>
                <span>
                  <strong>{a.title}</strong>
                  <br />
                  <span className="muted small">{a.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
