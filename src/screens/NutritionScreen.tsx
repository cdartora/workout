import { ProteinCard } from '../components/ProteinCard.tsx'
import { ShortcutEditor } from '../components/ShortcutEditor.tsx'
import { WeightCard } from '../components/WeightCard.tsx'

export function NutritionScreen() {
  return (
    <>
      <header className="screen-header">
        <h1>Nutrição</h1>
      </header>
      <ProteinCard showLog />
      <WeightCard />
      <ShortcutEditor />
      <p className="muted small disclaimer">
        Referências gerais para hipertrofia (1,8 g de proteína por kg; ganho de 0,2–0,35 kg/semana). Não substituem a
        orientação de um nutricionista.
      </p>
    </>
  )
}
