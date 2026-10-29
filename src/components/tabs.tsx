import type { ReactNode } from 'react'
import { NutritionIcon, ProgressIcon, SettingsIcon, TodayIcon } from './icons.tsx'

export type Tab = 'hoje' | 'progresso' | 'nutricao' | 'ajustes'

export const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'hoje', label: 'Hoje', icon: <TodayIcon /> },
  { id: 'progresso', label: 'Progresso', icon: <ProgressIcon /> },
  { id: 'nutricao', label: 'Nutrição', icon: <NutritionIcon /> },
  { id: 'ajustes', label: 'Ajustes', icon: <SettingsIcon /> },
]
