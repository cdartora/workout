# Workout

Companion pessoal de calistenia para hipertrofia — PWA para iPhone, com dados só no aparelho.
A especificação completa está em [SPEC.md](SPEC.md).

App publicado: https://cdartora.github.io/workout/

## Desenvolvimento

```bash
npm install
npm run dev      # servidor local
npm run lint
npm test         # testes da lógica (progressão, nutrição, sequências, conquistas, backup)
npm run build    # gera dist/ (com service worker)
```

Ícones PNG: `node scripts/generate-icons.mjs` (requer Playwright) a partir de `public/favicon.svg`.

## Deploy

Cada push na `main` publica no GitHub Pages via `.github/workflows/deploy.yml`
(Settings → Pages → Source: **GitHub Actions**).
