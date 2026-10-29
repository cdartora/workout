import { useEffect, useState } from 'react'
import { isStandalone } from '../platform.ts'

export function SettingsScreen() {
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
      <section className="card empty">
        <p>Backup, guia de lembretes no Atalhos e refazer teste de nível chegam em breve.</p>
      </section>
    </>
  )
}
