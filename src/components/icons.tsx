// Ícones da barra de abas (traço, herdam a cor do texto).
const common = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function TodayIcon() {
  return (
    <svg {...common} aria-hidden="true">
      <path d="M4 6h16M7 4v4M17 4v4" />
      <path d="M6 20h4v-4h4v-4h4" />
    </svg>
  )
}

export function ProgressIcon() {
  return (
    <svg {...common} aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

export function NutritionIcon() {
  return (
    <svg {...common} aria-hidden="true">
      <path d="M12 21c4.4 0 8-3.6 8-8 0-3-2-5-4.5-5-1.6 0-2.6.8-3.5 1.5C11.1 8.8 10.1 8 8.5 8 6 8 4 10 4 13c0 4.4 3.6 8 8 8z" />
      <path d="M12 9.5C12 6 13.5 4 16 3" />
    </svg>
  )
}

export function SettingsIcon() {
  return (
    <svg {...common} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  )
}
