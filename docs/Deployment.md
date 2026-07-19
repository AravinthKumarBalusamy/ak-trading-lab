# Deployment Guide

This document describes the process of deploying the TradingLab application to development and production environments.

## Local Infrastructure (Development)

We orchestrate local dependencies (PostgreSQL and Redis) using Docker Compose.

### Starting Dev Services

```bash
# Run PostgreSQL and Redis containers in the background
docker compose up -d
```

- **PostgreSQL**: Bound to `localhost:5432`
- **Redis**: Bound to `localhost:6379`

### Stopping Dev Services

```bash
docker compose down
```

---

## Production Deployment Layout

### 1. Database (PostgreSQL)

- **Hosting**: Neon PostgreSQL (serverless DB hosting) or AWS RDS.
- **Configuration**: Set the connection string in the `DATABASE_URL` environment variable.

### 2. Backend (Express API)

- **Hosting**: Railway, Render, or Heroku.
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm --filter backend start`
- **Port**: Configure `PORT` environment variable (e.g. `8080`).

### 3. Frontend (React SPA)

- **Hosting**: Vercel, Netlify, or AWS Amplify.
- **Build Command**: `pnpm --filter frontend build`
- **Output Directory**: `apps/frontend/dist`
- **Env Vars**:
  - Set `VITE_API_URL` if proxying is not used, or rely on Vercel rewrites to proxy `/api` calls to the hosted backend.
