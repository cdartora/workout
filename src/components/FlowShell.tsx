import type { ReactNode } from 'react'

/** Tela cheia para fluxos guiados (treino, teste de nível), sem a barra de abas. */
export function FlowShell({
  title,
  progress,
  onClose,
  closeLabel = 'Fechar',
  children,
}: {
  title: string
  progress?: number
  onClose: () => void
  closeLabel?: string
  children: ReactNode
}) {
  return (
    <div className="flow">
      <header className="flow-header">
        <span className="flow-title">{title}</span>
        <button type="button" className="flow-close" onClick={onClose}>
          {closeLabel}
        </button>
      </header>
      {progress !== undefined && (
        <div className="flow-progress" aria-hidden="true">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      <div className="flow-body">{children}</div>
    </div>
  )
}
