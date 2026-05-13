# Christian Kim — Portfolio

Personal portfolio site in the **micrographics** design language — a paper-white
"engineering spec sheet" look: bold Archivo display type, JetBrains Mono labels,
crop marks, dotted leaders, block-diagram schematics, one signal-orange accent.

Built with **Vite + vanilla TypeScript** — no UI framework, static output.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
```

## Build & preview

```bash
npm run build        # type-checks, then bundles to dist/
npm run preview       # serve the production build locally
```

## Editing content

All copy lives in typed files under `src/data/` — no need to touch markup:

| File | What it holds |
| --- | --- |
| `src/data/site.ts` | Name, role, status, social links, nav items, résumé filename |
| `src/data/experience.ts` | The "Field Log" entries (clubs / labs / roles) |
| `src/data/projects.ts` | The "Build Index" project cards + spec lists |
| `src/data/skills.ts` | The "Inventory" skill groups |

Section markup is in `src/components/*`; the design system is one file, `src/style.css`;
reusable SVG bits (gauges, crosshairs, barcodes, schematic boxes) are in
`src/components/micro.ts` and `src/components/projects.ts`.

Replace `public/christian-kim-resume.pdf` to update the résumé link, and drop a
`public/portrait.jpg` to fill the portrait slot in the About section (then point
the `.portrait-slot` markup at it).

## Deploy to GitHub Pages

1. `npm run build` → produces `dist/`.
2. Push `dist/` to the `gh-pages` branch (or use a GitHub Action), or set Pages to
   serve from `/docs` and rename `dist` → `docs`.
3. **Project page** (`username.github.io/portfolio`): set `base: '/portfolio/'` in
   `vite.config.ts` before building. **User/root site**: leave `base: './'`.

## Notes / TODO

- Project repo + write-up links are placeholders (`#`, rendered disabled) — set real
  URLs in `src/data/projects.ts`.
- GitHub handle is set to `github.com/shmuffy` in `src/data/site.ts` — change if needed.
- Reference inspiration lives in `reference/` (not bundled).
