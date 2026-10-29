import { isIOS, isStandalone } from '../platform.ts'

// No iPhone o PWA só guarda dados com segurança e recebe atalhos quando está na Tela de Início.
export function InstallHint() {
  if (isStandalone()) return null
  return (
    <section className="card card-hint">
      <h2>Instale na Tela de Início</h2>
      {isIOS() ? (
        <ol>
          <li>
            Toque em <strong>Compartilhar</strong> (quadrado com seta) no Safari.
          </li>
          <li>
            Escolha <strong>Adicionar à Tela de Início</strong>.
          </li>
          <li>Abra o Workout pelo ícone novo.</li>
        </ol>
      ) : (
        <p>Use a opção “Instalar app” ou “Adicionar à tela inicial” do navegador.</p>
      )}
      <p className="muted">Assim o app abre em tela cheia, funciona offline e seus dados ficam protegidos.</p>
    </section>
  )
}
