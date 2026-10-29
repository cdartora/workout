import { useState } from 'react'

const REMINDERS = [
  {
    title: 'Treino',
    when: 'Semanalmente: segunda, quarta e sexta às 19:00',
    text: 'Hora do treino 💪 ~40 min. Abra o Workout.',
  },
  {
    title: 'Proteína',
    when: 'Diariamente às 21:00',
    text: 'Já bateu a proteína hoje? Registre no Workout.',
  },
  {
    title: 'Pesagem e backup',
    when: 'Semanalmente: segunda às 7:00',
    text: 'Pesagem semanal: em jejum, antes do café. Depois, faça o backup no Workout.',
  },
]

/** Passo a passo para criar lembretes no app Atalhos (sites não agendam notificações no iPhone). */
export function RemindersGuide() {
  const [copied, setCopied] = useState<string>()

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
    } catch {
      setCopied(undefined)
    }
  }

  return (
    <section className="card">
      <h2>Lembretes no iPhone</h2>
      <p className="muted small">
        O iPhone não deixa sites agendarem notificações, então os lembretes ficam no app <strong>Atalhos</strong>. Leva
        2 minutos e é bem confiável.
      </p>
      <details className="guide">
        <summary>Como criar cada lembrete</summary>
        <ol className="tips">
          <li>
            Abra o app <strong>Atalhos</strong> e vá na aba <strong>Automação</strong>.
          </li>
          <li>
            Toque em <strong>+</strong> (Nova Automação) e escolha <strong>Hora do Dia</strong>.
          </li>
          <li>Defina o horário e a repetição (veja abaixo) e marque <strong>Executar Imediatamente</strong>.</li>
          <li>
            Toque em <strong>Seguinte</strong> → <strong>Nova Automação em Branco</strong> → adicione a ação{' '}
            <strong>Mostrar Notificação</strong>.
          </li>
          <li>Cole o texto do lembrete e toque em OK.</li>
        </ol>
        <p className="muted small">Os nomes podem variar um pouco conforme a versão do iOS.</p>
      </details>
      <ul className="reminder-list">
        {REMINDERS.map((r) => (
          <li key={r.title}>
            <div>
              <strong>{r.title}</strong>
              <p className="muted small">{r.when}</p>
              <p className="small">“{r.text}”</p>
            </div>
            <button type="button" className="button-secondary small-button" onClick={() => void copy(r.text)}>
              {copied === r.text ? 'Copiado ✓' : 'Copiar texto'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
