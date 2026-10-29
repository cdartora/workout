// Gera os ícones PNG do PWA a partir de public/favicon.svg.
// Uso: node scripts/generate-icons.mjs (requer Playwright/Chromium instalado)
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

// Playwright vem do ambiente (global), não é dependência do projeto.
const { chromium } = createRequire(import.meta.url)('playwright')

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8')
// Fundo quadrado: o iOS e o Android aplicam a própria máscara de cantos.
const square = svg.replace('rx="112"', 'rx="0"')

const targets = [
  { file: 'apple-touch-icon.png', size: 180, scale: 1 },
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  // Maskable: conteúdo dentro da zona segura (80% central).
  { file: 'icon-maskable-512.png', size: 512, scale: 0.8 },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { file, size, scale } of targets) {
  await page.setViewportSize({ width: size, height: size })
  const inner = square.replace('<rect width="512" height="512" rx="0" fill="#0e0f13"/>', '')
  await page.setContent(`
    <body style="margin:0;background:#0e0f13;display:grid;place-items:center;width:${size}px;height:${size}px">
      <div style="width:${size * scale}px;height:${size * scale}px">${inner.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
    </body>`)
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname })
  console.log('gerado', file)
}
await browser.close()
