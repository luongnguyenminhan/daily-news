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

## Adding a feed and crawling

Register RSS sources, then trigger a crawl. Some example feeds to try:

| Name | URL | Topic |
|---|---|---|
| Hacker News | `https://hnrss.org/frontpage` | tech |
| arXiv cs.AI | `http://export.arxiv.org/rss/cs.AI` | ai |
| arXiv cs.LG | `http://export.arxiv.org/rss/cs.LG` | ai |
| Hugging Face Blog | `https://huggingface.co/blog/feed.xml` | ai |

```bash
curl -X POST http://localhost:3001/feeds \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://hnrss.org/frontpage", "name": "Hacker News", "topic": "tech"}'

curl -X POST http://localhost:3001/feeds \
  -H 'Content-Type: application/json' \
  -d '{"url": "http://export.arxiv.org/rss/cs.AI", "name": "arXiv cs.AI", "topic": "ai"}'

curl -X POST http://localhost:3001/feeds \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://huggingface.co/blog/feed.xml", "name": "Hugging Face Blog", "topic": "ai"}'

curl -X POST http://localhost:3001/crawl
```

Pull trending repos from GitHub for a topic instead:

```bash
curl -X POST 'http://localhost:3001/crawl/github?topic=llm'
```

Set `GITHUB_TOKEN` in `.env` to raise the GitHub search rate limit. Read back what was ingested with `GET /articles?topic=tech`.

## Summarizing articles

Once articles are crawled, generate an AI summary post (title + body) for
each one via Google Gemini's Batch API:

```bash
curl -X POST http://localhost:3001/summarize
```

This fetches each unsummarized article's full source (webpage text, or the
README for GitHub repos) and calls Gemini directly for each one, writing the
result back as it completes. Failed articles (a dead link, a model error)
are retried the next time you call this endpoint.

Set `GEMINI_API_KEY` in `.env` (get one at
https://aistudio.google.com/apikey). `GEMINI_MODEL` defaults to
`gemini-3.8-flash`.

## Architecture

See [`docs/architecture.html`](docs/architecture.html) for an interactive diagram of the system (web, API, Postgres, and the RSS/GitHub crawl sources). Open it in a browser.

## Structure

```
apps/web   Next.js (App Router, TypeScript)
apps/api   NestJS + Prisma (PostgreSQL)
```

Add DB models in `apps/api/prisma/schema.prisma`, then `npx prisma migrate dev` (from `apps/api`).
