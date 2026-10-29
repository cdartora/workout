import { useEffect, useState } from 'react'
import { TabBar } from './components/TabBar.tsx'
import { TABS, type Tab } from './components/tabs.tsx'
import { NutritionScreen } from './screens/NutritionScreen.tsx'
import { ProgressScreen } from './screens/ProgressScreen.tsx'
import { SettingsScreen } from './screens/SettingsScreen.tsx'
import { TodayScreen } from './screens/TodayScreen.tsx'

// A aba ativa vive no hash (#progresso) para sobreviver a recarregamentos.
function tabFromHash(): Tab {
  const hash = window.location.hash.slice(1)
  return TABS.some((t) => t.id === hash) ? (hash as Tab) : 'hoje'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash)

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const changeTab = (next: Tab) => {
    window.location.hash = next
    window.scrollTo(0, 0)
  }

  return (
    <div className="app">
      <main className="screen">
        {tab === 'hoje' && <TodayScreen />}
        {tab === 'progresso' && <ProgressScreen />}
        {tab === 'nutricao' && <NutritionScreen />}
        {tab === 'ajustes' && <SettingsScreen />}
      </main>
      <TabBar active={tab} onChange={changeTab} />
    </div>
  )
}
