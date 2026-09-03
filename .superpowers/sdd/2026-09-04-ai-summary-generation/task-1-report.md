# Task 1 Implementation Report: Prisma schema, dependencies, and environment wiring

Date: 2026-09-04
Branch: `feat/ai-summary`
Commit: `dbb31568e980555339775d119b71de41ce1b7dd3` (`feat: add Summary model, Gemini deps, and env wiring for AI summaries`)

## Files included in the Task 1 commit

The commit contains only the files permitted by the Task 1 brief:

- `.env.example`
  - Confirmed/documented `GEMINI_API_KEY=` and `GEMINI_MODEL=gemini-3.8-flash`.
- `apps/api/package.json`
  - Added `@google/genai`, `@mozilla/readability`, and `jsdom` dependencies.
  - Added `@types/jsdom` as a dev dependency.
- `package-lock.json`
  - Updated the root npm workspace lockfile. There is no separate `apps/api/package-lock.json`.
- `apps/api/prisma/schema.prisma`
  - Confirmed the existing Task 1 `Summary` model, 1:1 `Article` relation, and `SummaryStatus` enum.
- `apps/api/prisma/migrations/20260903181945_add_summary/migration.sql`
  - Created and applied the migration for `SummaryStatus`, `Summary`, its unique `articleId` index, and foreign key.
- `docker-compose.yml`
  - Added `GEMINI_API_KEY` and `GEMINI_MODEL` passthroughs to the API service.

The generated Prisma client was regenerated successfully but is intentionally not committed because `apps/api/.gitignore` ignores `src/generated/prisma/`. It is present in the checkout for later tasks.

## Validation and command results

- Initial requested root validation:
  - Command: `npx prisma validate --schema=apps/api/prisma/schema.prisma`
  - Result: blocked with `sh: prisma: command not found` because the Prisma CLI is installed in the API workspace.
- Correct workspace validation:
  - Command: `npx prisma validate --schema=prisma/schema.prisma` from `apps/api`
  - Result: `The schema at prisma/schema.prisma is valid 🚀`.
- Dependency installation:
  - Commands:
    - `npm install --workspace=api @google/genai @mozilla/readability jsdom`
    - `npm install --workspace=api -D @types/jsdom`
  - Result: completed successfully; npm reported 79 packages added in the first install and 3 in the second. The API manifest contains `@google/genai ^2.21.0`, `@mozilla/readability ^0.6.0`, `jsdom ^30.0.1`, and `@types/jsdom ^30.0.0`.
- Local Postgres:
  - Command: `docker compose up -d postgres`
  - Result: `daily-news-postgres-1` started successfully.
- Migration:
  - First host attempt used the local `.env` hostname `postgres` and returned `P1001: Can't reach database server at postgres:5432`.
  - Corrected command used a one-command host override without modifying `.env`:
    - `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/daily_news?schema=public' npx prisma migrate dev --name add_summary`
  - Result: migration `20260903181945_add_summary` created/applied; database reported in sync; Prisma Client 6.19.3 regenerated to `apps/api/src/generated/prisma`.
- Generated-client check:
  - Command: `grep -n "SummaryStatus" apps/api/src/generated/prisma/enums.ts`
  - Result: enum exported with `PROCESSING`, `DONE`, and `FAILED`; `apps/api/src/generated/prisma/models/Summary.ts` exists.
- Formatting:
  - Command: `npm run format`
  - Result: completed successfully; all listed API/web files reported `unchanged`.
- API build:
  - Command: `npm run build --workspace=api`
  - Result: exit 0; Nest build completed.
- API tests:
  - Command: `npm run test --workspace=api`
  - Result: 1 test file passed, 1 test passed.
- Compose validation:
  - Command: `GEMINI_API_KEY='' GEMINI_MODEL='' docker compose config --quiet`
  - Result: exit 0.
- Whitespace validation:
  - Command: `git diff --check` for all staged Task 1 files
  - Result: exit 0.
- Commit scope verification:
  - `git show --name-status HEAD` lists exactly the six files above.
  - Unrelated README, frontend, and docs changes remain unstaged.

## Live-key and provider verification

Skipped intentionally per the user instruction. No real `GEMINI_API_KEY` was obtained, written, displayed, or used. The gitignored `.env` was not modified, and no live Gemini/manual provider request was made. The variables are documented in `.env.example` and wired into the API container with an empty-key default.

## Concerns

- npm reported the existing dependency audit result as 9 vulnerabilities (2 low, 2 moderate, 5 high); no audit remediation was attempted because it is outside Task 1.
- npm reported a deprecated transitive `node-domexception@1.0.0` package.
- The generated Prisma client is ignored by repository policy, so later clean checkouts must run Prisma generation after dependency installation/migration; the generated artifacts are available in this checkout.
- Host-side migration required overriding the container hostname `postgres` with `localhost`; the Docker Compose API configuration continues to use the correct container hostname.
- npm emitted install-script approval warnings for existing/new packages, but dependency installation, schema validation, migration, build, and tests all completed successfully.


## Task 1 Important Findings Fix Report

Date: 2026-09-04
Scope: dependency exact-version pinning and concrete Node 22 Docker base only.

### Changes

- Pinned the four newly added direct dependencies in `apps/api/package.json`:
  - `@google/genai`: `2.21.0`
  - `@mozilla/readability`: `0.6.0`
  - `jsdom`: `30.0.1`
  - `@types/jsdom`: `30.0.0`
- Updated the root `package-lock.json` workspace importer to the same exact specs. Resolved package versions remained unchanged.
- Changed `apps/api/Dockerfile` from `node:22-alpine` to `node:22.22.3-alpine`.
- The lockfile records jsdom `30.0.1` with engine `^22.22.2 || ^24.15.0 || >=26.0.0`; Node `22.22.3` satisfies that range. It also avoids the `^22.22.3` engine warnings emitted by three other lockfile packages during the initial `22.22.2` image test.

### Commands and outputs

```text
node lockfile consistency check:
@google/genai: manifest=2.21.0 importer=2.21.0 installed=2.21.0
@mozilla/readability: manifest=0.6.0 importer=0.6.0 installed=0.6.0
jsdom: manifest=30.0.1 importer=30.0.1 installed=30.0.1
@types/jsdom: manifest=30.0.0 importer=30.0.0 installed=30.0.0
jsdom engines=^22.22.2 || ^24.15.0 || >=26.0.0
```

```bash
npm install --workspace=api --package-lock-only --ignore-scripts
```

```text
up to date, audited 811 packages in 7s
9 vulnerabilities (2 low, 2 moderate, 5 high)
```

```bash
npm ci --ignore-scripts
```

```text
added 808 packages, and audited 811 packages in 1m
9 vulnerabilities (2 low, 2 moderate, 5 high)
```

```bash
npm run build --workspace=api
```

```text
> api@0.0.1 build
> nest build
(exit 0)
```

```bash
npm run test --workspace=api
```

```text
Test Files  1 passed (1)
Tests       1 passed (1)
(exit 0)
```

```bash
docker manifest inspect node:22.22.3-alpine
```

```text
node:22.22.3-alpine manifests: 10
```

```bash
docker build --file apps/api/Dockerfile --tag daily-news-api-task1-fix .
docker run --rm daily-news-api-task1-fix node --version
```

```text
FROM docker.io/library/node:22.22.3-alpine@sha256:e58326d0d441090181ac150dc2078d3e2cf6a0d42e809aebba3ef5880935ffdd
RUN npm ci ... DONE
RUN npm exec --workspace=api -- prisma generate ... DONE
RUN npm run build --workspace=api ... DONE
naming to docker.io/library/daily-news-api-task1-fix:latest done
v22.22.3
(exit 0)
```

```bash
git diff --check -- apps/api/package.json apps/api/Dockerfile package-lock.json
```

```text
git diff --check: passed
```

The initial worktree's unrelated frontend, README, and docs changes were not staged or modified by this fix. The report file is ignored by `.superpowers/sdd/.gitignore` and will be force-added as the requested fix report.

Remaining non-blocking concerns: npm reports the existing 9 audit vulnerabilities and the deprecated transitive `node-domexception@1.0.0`; no remediation was attempted because it is outside Task 1.
