import { useEffect, useState } from 'react'
import { TabBar } from './components/TabBar.tsx'
import { TABS, type Tab } from './components/tabs.tsx'
import { LevelTestFlow } from './flows/LevelTestFlow.tsx'
import { WorkoutFlow } from './flows/WorkoutFlow.tsx'
import { startSession } from './program/session.ts'
import type { WorkoutId } from './program/workouts.ts'
import { NutritionScreen } from './screens/NutritionScreen.tsx'
import { ProgressScreen } from './screens/ProgressScreen.tsx'
import { SettingsScreen } from './screens/SettingsScreen.tsx'
import { TodayScreen } from './screens/TodayScreen.tsx'

// A aba ativa vive no hash (#progresso) para sobreviver a recarregamentos.
function tabFromHash(): Tab {
  // "#progresso/fotos" abre a aba Progresso (o resto do hash é tratado pela tela).
  const hash = window.location.hash.slice(1).split('/')[0]
  return TABS.some((t) => t.id === hash) ? (hash as Tab) : 'hoje'
}

type Flow = { kind: 'levelTest' } | { kind: 'workout'; sessionId: number }

export interface FlowActions {
  startLevelTest: () => void
  startWorkout: (workout: WorkoutId) => void
  resumeWorkout: (sessionId: number) => void
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [flow, setFlow] = useState<Flow>()

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const changeTab = (next: Tab) => {
    window.location.hash = next
    window.scrollTo(0, 0)
  }

  const actions: FlowActions = {
    startLevelTest: () => setFlow({ kind: 'levelTest' }),
    startWorkout: (workout) => void startSession(workout).then((sessionId) => setFlow({ kind: 'workout', sessionId })),
    resumeWorkout: (sessionId) => setFlow({ kind: 'workout', sessionId }),
  }

  const closeFlow = () => {
    setFlow(undefined)
    window.scrollTo(0, 0)
  }

  if (flow?.kind === 'levelTest') return <LevelTestFlow onDone={closeFlow} />
  if (flow?.kind === 'workout') return <WorkoutFlow sessionId={flow.sessionId} onDone={closeFlow} />

  return (
    <div className="app">
      <main className="screen">
        {tab === 'hoje' && <TodayScreen actions={actions} />}
        {tab === 'progresso' && <ProgressScreen />}
        {tab === 'nutricao' && <NutritionScreen />}
        {tab === 'ajustes' && <SettingsScreen actions={actions} />}
      </main>
      <TabBar active={tab} onChange={changeTab} />
    </div>
  )
}
