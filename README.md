# Trading Lab Monorepo

Production-grade stock trading dashboard workspace.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, Zustand, React Hook Form, Zod.
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Kite Connect SDK, JWT, Winston.
- **Infrastructure**: Docker, Docker Compose.
- **Tooling**: ESLint, Prettier, Husky, lint-staged, Vitest, Playwright, pnpm.

## Workspace Layout

```
├── apps/
│   ├── frontend/        # React 19 SPA
│   └── backend/         # Express API
└── packages/
    ├── config/          # Central shared config (TSConfig, ESLint, Prettier)
    ├── shared/          # Shared validators, types, and DTOs
    └── ui/              # Component library (React 19, Tailwind)
```

## Getting Started

### Prerequisites

- Node.js v22.17.0+
- pnpm v10+
- Docker & Docker Compose

### Installation

```bash
# Install all dependencies across the workspace
pnpm install
```

### Development

1. Start infrastructure services (PostgreSQL, Redis):

```bash
docker compose up -d
```

2. Run development servers (runs both backend and frontend):

```bash
pnpm dev
```

### Formatting and Linting

```bash
# Run lint checks across all apps and packages
pnpm lint

# Format codebase using Prettier
pnpm format
```

### Production Build

```bash
# Build all packages and applications in the correct order
pnpm build
```
