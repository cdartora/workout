import { useState } from 'react'
import { useWidth } from '../lib/hooks.ts'

export interface ChartPoint {
  x: number
  y: number
  /** Texto extra no tooltip (ex.: séries "9 · 8 · 8"). */
  detail?: string
}

const HEIGHT = 168
const PAD = { top: 20, right: 16, bottom: 26, left: 40 }

const shortDate = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })

/** Linha de uma série só: grade discreta, rótulo no último ponto e toque para ver cada valor. */
export function LineChart({ points, formatY, label }: { points: readonly ChartPoint[]; formatY: (y: number) => string; label: string }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number>()

  const ys = points.map((p) => p.y)
  let [min, max] = [Math.min(...ys), Math.max(...ys)]
  if (min === max) [min, max] = [min - 1, max + 1]
  const span = max - min
  ;[min, max] = [min - span * 0.15, max + span * 0.15]
  const ticks = [0, 0.5, 1].map((f) => min + (max - min) * f)

  const x0 = points[0]?.x ?? 0
  const x1 = points.at(-1)?.x ?? 1
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const sx = (x: number) => PAD.left + (x1 === x0 ? plotW / 2 : ((x - x0) / (x1 - x0)) * plotW)
  const sy = (y: number) => PAD.top + (1 - (y - min) / (max - min)) * plotH
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')

  const pick = (clientX: number, target: SVGSVGElement) => {
    const left = target.getBoundingClientRect().left
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(sx(p.x) - (clientX - left)) < Math.abs(sx(points[best].x) - (clientX - left))) best = i
    })
    setActive(best)
  }

  const last = points.at(-1)
  const shown = active !== undefined ? points[active] : undefined

  return (
    <div className="chart" ref={ref}>
      <div className="chart-tooltip" aria-live="polite">
        {shown ? (
          <>
            <strong>{formatY(shown.y)}</strong> · {shortDate(shown.x)}
            {shown.detail && <span className="muted"> · {shown.detail}</span>}
          </>
        ) : (
          <span className="muted">Toque no gráfico para ver cada ponto</span>
        )}
      </div>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${label}: de ${formatY(points[0].y)} em ${shortDate(x0)} a ${formatY(last!.y)} em ${shortDate(x1)}`}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && pick(e.clientX, e.currentTarget)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(undefined)}
          style={{ touchAction: 'pan-y' }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} />
              <text className="chart-axis" x={PAD.left - 6} y={sy(t)} textAnchor="end" dominantBaseline="middle">
                {formatY(t)}
              </text>
            </g>
          ))}
          <text className="chart-axis" x={PAD.left} y={HEIGHT - 6}>
            {shortDate(x0)}
          </text>
          {x1 !== x0 && (
            <text className="chart-axis" x={width - PAD.right} y={HEIGHT - 6} textAnchor="end">
              {shortDate(x1)}
            </text>
          )}
          {shown && <line className="chart-crosshair" x1={sx(shown.x)} x2={sx(shown.x)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />}
          <path className="chart-line" d={path} />
          {points.map((p, i) => (
            <circle key={p.x} className={`chart-dot${i === active ? ' active' : ''}`} cx={sx(p.x)} cy={sy(p.y)} r={i === active ? 6 : 4} />
          ))}
          {last && active === undefined && (
            <text className="chart-label" x={sx(last.x)} y={sy(last.y) - 12} textAnchor="end">
              {formatY(last.y)}
            </text>
          )}
        </svg>
      )}
      <details className="chart-table">
        <summary>Ver dados</summary>
        <table>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.x}>
                <td>{shortDate(p.x)}</td>
                <td>{formatY(p.y)}</td>
                {p.detail !== undefined && <td className="muted">{p.detail}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
