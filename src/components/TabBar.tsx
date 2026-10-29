import { TABS, type Tab } from './tabs.tsx'

export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="tabbar-item"
          aria-current={tab.id === active ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
