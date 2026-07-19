# Developer Setup & Standards

This document describes coding standards, git strategies, and execution commands.

## Getting Started

### 1. Installation

Clone the repository and install workspace dependencies:

```bash
pnpm install
```

### 2. Startup Services

```bash
# Start local PostgreSQL and Redis DB services
docker compose up -d
```

### 3. Run Development Servers

```bash
# Runs frontend (3000) and backend (3001) concurrently
pnpm dev
```

---

## Coding Standards

### TypeScript

- **No `any`**: The codebase strictly forbids the use of `any` types. Ensure you provide type-safe interfaces or generic bounds.
- **Imports**: Use relative imports with the `.js` extension when importing between TypeScript files under ESM (e.g. `import { helper } from "./helper.js"`).

### Linting & Formatting

- Monorepo rules are configured via root and package-level configurations.
- Runs on every commit using Husky and `lint-staged`.
- Manual checks:
  ```bash
  # Check formatting
  pnpm format

  # Run ESLint rules
  pnpm lint
  ```

---

## Git Workflows

### Branch Naming Conventions

- **Develop branch**: `develop`
- **Production branch**: `main`
- **Features**: Prefix with `feature/` (e.g. `feature/backend`, `feature/frontend`).

### Commit Standard

We utilize semantic prefix commits:

- `feat: ...` for new features.
- `fix: ...` for bug fixes.
- `docs: ...` for documentation additions or changes.
- `refactor: ...` for code quality cleanups.
