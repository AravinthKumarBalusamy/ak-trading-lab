# Folder Structure

This document outlines the directory structure of the TradingLab monorepo workspace.

## Monorepo Layout

```
trading-lab/
├── .husky/                   # Git hook definitions (pre-commit checks)
├── .vscode/                  # Shared VSCode settings and recommendations
├── apps/                     # Application deployments
│   ├── backend/              # Express API Server
│   │   ├── prisma/           # Schema definitions
│   │   └── src/
│   │       ├── config/       # Environment parsing, loggers, Prisma singleton
│   │       ├── controllers/  # Request handlers
│   │       ├── middleware/   # Express middlewares (errors, request-loggers)
│   │       ├── routes/       # Mapping controllers to HTTP endpoints
│   │       ├── utils/        # Error definitions
│   │       └── index.ts      # Server bootstrap & graceful shutdown
│   └── frontend/             # React SPA Client
│       ├── src/
│       │   ├── components/   # UI elements (Cards, Badges, Navigation)
│       │   ├── routes/       # Route Tree layout and page definitions
│       │   ├── store/        # Zustand global state (theme, auth)
│       │   ├── App.tsx       # Root React provider hook
│       │   └── main.tsx      # Main application bootstrap
│       └── index.html        # SPA root HTML
└── packages/                 # Shared libraries
    ├── config/               # Build configurations (ESLint, TSConfig base templates)
    ├── shared/               # Shared TS types and Zod validator schemas
    └── ui/                   # Shared React component library
```

---

## Detailed Directory Explanations

### `packages/config`

Houses base templates to keep styling, build steps, and type checks consistent.

- `tsconfig/`: Exports `base.json`, `node.json`, and `react.json`.
- `eslint/`: Exports standard rule definitions for general JS/TS and React-focused apps.

### `packages/shared`

Exported code that is built and consumed by both `apps/frontend` and `apps/backend`. It ensures API response schemas and types remain in sync across layers.

### `packages/ui`

A centralized design system containing shared presentation components, ensuring visual consistency.

### `apps/backend`

The modular backend application. Logic is isolated into layers:

- `config/`: System bootstrap variables.
- `controllers/`: Handles validation of client inputs and maps actions.
- `routes/`: Express endpoint wiring.
- `middleware/`: Common filters (e.g. error boundary capture, log metrics).
- `utils/`: Custom helpers (e.g. error mapping objects).
