# daily-news

Fullstack TypeScript monorepo: Next.js (`apps/web`) + NestJS (`apps/api`) + Postgres (Prisma), npm workspaces, Docker.

## Run with Docker (recommended)

```bash
cp .env.example .env   # already done, edit if needed
docker compose up --build
```

- web: http://localhost:3000
- api: http://localhost:3001
- postgres: localhost:5432

The `api` container runs `prisma migrate deploy` on start. First time only, create the initial migration once (with postgres up):

```bash
docker compose exec api npx prisma migrate dev --name init
```

## Run locally without Docker

```bash
npm install
docker compose up -d postgres     # just the database
npm run dev:api                   # apps/api, http://localhost:3001
npm run dev:web                   # apps/web, http://localhost:3000
```

## Structure

```
apps/web   Next.js (App Router, TypeScript)
apps/api   NestJS + Prisma (PostgreSQL)
```

Add DB models in `apps/api/prisma/schema.prisma`, then `npx prisma migrate dev` (from `apps/api`).
