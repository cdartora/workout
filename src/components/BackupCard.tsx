import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db.ts'
import { backupToFile, lastBackupAt, markBackupDone, parseBackup, restoreBackup } from '../lib/backup.ts'

const DAY = 24 * 60 * 60 * 1000
const REMIND_AFTER = 7 * DAY

type State =
  | { kind: 'idle' }
  | { kind: 'preparing' }
  | { kind: 'ready'; file: File }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

/**
 * Backup no iCloud Drive pelo menu de compartilhar do iOS.
 * Em dois passos: o iOS só abre o menu se `share()` for chamado direto do toque,
 * e montar o arquivo (com fotos) leva um tempo.
 */
export function BackupCard({ reminder = false }: { reminder?: boolean }) {
  const info = useLiveQuery(async () => {
    const [last, sessions, weighIns] = await Promise.all([lastBackupAt(), db.sessions.count(), db.weighIns.count()])
    const now = Date.now()
    return {
      last,
      daysAgo: last ? Math.floor((now - last) / DAY) : undefined,
      due: sessions + weighIns > 0 && (!last || now - last >= REMIND_AFTER),
    }
  })
  const [state, setState] = useState<State>({ kind: 'idle' })

  if (!info) return null
  if (reminder && !info.due && state.kind !== 'done') return null

  const prepare = async () => {
    setState({ kind: 'preparing' })
    try {
      setState({ kind: 'ready', file: await backupToFile() })
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Falha ao gerar o backup.' })
    }
  }

  const save = async (file: File) => {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Backup do Workout' })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(file)
        a.download = file.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
      }
      await markBackupDone()
      setState({ kind: 'done' })
    } catch (e) {
      // Fechou o menu sem salvar: continua pronto para tentar de novo.
      if (e instanceof DOMException && e.name === 'AbortError') return
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Falha ao salvar o backup.' })
    }
  }

  const lastText =
    info.daysAgo === undefined ? 'Nenhum backup ainda.' : info.daysAgo === 0 ? 'Último backup: hoje.' : `Último backup: há ${info.daysAgo} ${info.daysAgo === 1 ? 'dia' : 'dias'}.`

  return (
    <section className={`card${reminder ? ' card-primary' : ''}`}>
      {reminder && <p className="eyebrow">Backup semanal</p>}
      <h2>{reminder ? 'Proteja seu histórico' : 'Backup'}</h2>
      <p className="muted small">
        {lastText} Salve em <strong>Arquivos → iCloud Drive</strong>. Se trocar de celular ou apagar o app, é só importar.
      </p>

      {state.kind === 'idle' && (
        <button type="button" className="button-primary" onClick={() => void prepare()}>
          Fazer backup
        </button>
      )}
      {state.kind === 'preparing' && (
        <button type="button" className="button-primary" disabled>
          Preparando…
        </button>
      )}
      {state.kind === 'ready' && (
        <>
          <button type="button" className="button-primary" onClick={() => void save(state.file)}>
            Salvar backup ({formatSize(state.file.size)})
          </button>
          <p className="muted small">No menu, toque em “Salvar em Arquivos” e escolha o iCloud Drive.</p>
        </>
      )}
      {state.kind === 'done' && <p className="up">Backup feito! ✓</p>}
      {state.kind === 'error' && <p className="down small">{state.message}</p>}

      {!reminder && <ImportButton />}
    </section>
  )
}

function ImportButton() {
  const [message, setMessage] = useState<string>()
  return (
    <>
      <label className="button-secondary as-link">
        Importar backup
        <input
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              const backup = parseBackup(await file.text())
              const date = new Date(backup.exportedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
              if (!confirm(`Substituir TODOS os dados deste aparelho pelo backup de ${date}? Isso não pode ser desfeito.`)) return
              const result = await restoreBackup(backup)
              const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
              setMessage(
                `Backup restaurado: ${plural(result.sessions, 'treino', 'treinos')} e ${plural(result.photos, 'foto', 'fotos')}.`,
              )
            } catch (err) {
              setMessage(err instanceof Error ? err.message : 'Falha ao importar o backup.')
            }
          }}
        />
      </label>
      {message && <p className="small">{message}</p>}
    </>
  )
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}
