import { useEffect, useState } from 'react'
import type { FlowActions } from '../App.tsx'
import { BackupCard } from '../components/BackupCard.tsx'
import { RemindersGuide } from '../components/RemindersGuide.tsx'
import { isStandalone } from '../platform.ts'

export function SettingsScreen({ actions }: { actions: FlowActions }) {
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(false))
  }, [])

  return (
    <>
      <header className="screen-header">
        <h1>Ajustes</h1>
      </header>
      <section className="card">
        <h2>Status</h2>
        <dl className="status-list">
          <div>
            <dt>Instalado na Tela de Início</dt>
            <dd>{isStandalone() ? 'Sim' : 'Não'}</dd>
          </div>
          <div>
            <dt>Armazenamento protegido</dt>
            <dd>{persisted === null ? '…' : persisted ? 'Sim' : 'Não'}</dd>
          </div>
          <div>
            <dt>Versão</dt>
            <dd>{__APP_VERSION__}</dd>
          </div>
        </dl>
      </section>
      <section className="card">
        <h2>Teste de nível</h2>
        <p className="muted">Refaça a cada 4–6 semanas para medir sua evolução e recalibrar os degraus.</p>
        <button type="button" className="button-secondary" onClick={actions.startLevelTest}>
          Refazer teste de nível
        </button>
      </section>
      <BackupCard />
      <RemindersGuide />
    </>
  )
}
