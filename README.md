# Legend Viewer

Interactive architecture visualization app built with React, TypeScript, and @xyflow/react.

## Development

```bash
npm i              # Install dependencies
npm run dev        # Dev server on http://[::]:8080
npm run build      # Production build (verifies types)
npm run lint       # ESLint
npm test           # Vitest
```

## Architecture

Four zoom levels: Context (L1) -> System (L2) -> Module (L3) -> Directory (L4)

Graph data loaded from `public/generated/<repoId>.json` (produced by the pipeline).

See the root `CLAUDE.md` for full architecture documentation.
