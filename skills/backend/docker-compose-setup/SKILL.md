---
name: docker-compose-setup
description: >
  Set up Docker Compose for multi-service projects (Next.js + FastAPI + Postgres/Redis).
  Generates Dockerfiles, docker-compose.yml (dev + prod), .env.example, .dockerignore,
  and healthchecks. TRIGGER when: user says "用 docker 包裝", "一鍵啟動", "containerize",
  "docker-compose", "幫我加 Docker", "打包成 container", "docker 部署", "Docker 設定".
  DO NOT TRIGGER when: user is asking about cloud deployment platforms (use deploy skill)
  or GitHub Actions CI/CD (use ci-pipeline skill).
tags: [backend, deploy]
version: 1.0.0
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash, Glob, Grep"
---

# Docker Compose Setup

Multi-service containerization for local dev and production.

## Step 1: Detect Project Stack

```bash
# Find services
ls */package.json */pyproject.toml */requirements.txt 2>/dev/null
grep -r "next\|react\|vue\|nuxt" */package.json 2>/dev/null | head -3
grep -r "fastapi\|flask\|django\|express" */pyproject.toml */requirements.txt */package.json 2>/dev/null | head -3
```

Map each detected service → Dockerfile pattern:
| Stack | Dockerfile pattern |
|-------|--------------------|
| Next.js | Multi-stage: deps → builder → runner (node:22-alpine) |
| FastAPI / Python | Multi-stage: builder (uv) → runner (python:3.12-slim) |
| Express / Node | Multi-stage: deps → builder → runner (node:22-alpine) |
| Postgres | Use official image, no custom Dockerfile |
| Redis | Use official image, no custom Dockerfile |

---

## Step 2: Dockerfiles

### Next.js (multi-stage)

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN corepack enable 2>/dev/null || true && \
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    else npm ci; fi

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable 2>/dev/null || true && \
    if [ -f pnpm-lock.yaml ]; then pnpm build; \
    elif [ -f yarn.lock ]; then yarn build; \
    else npm run build; fi

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

### FastAPI / Python (uv)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim AS runner
WORKDIR /app
RUN adduser --system --uid 1001 appuser
COPY --from=builder /app/.venv ./.venv
COPY . .
USER appuser
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

> For `requirements.txt` projects: replace `uv sync` with `pip install -r requirements.txt --target /app/.venv/lib`.

---

## Step 3: docker-compose.yml

```yaml
# docker-compose.yml  (production)
services:
  web:
    build:
      context: ./frontend          # adjust to actual dir
      target: runner
    ports:
      - "${WEB_PORT:-3000}:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped

  api:
    build:
      context: ./backend           # adjust to actual dir
      target: runner
    ports:
      - "${API_PORT:-8000}:8000"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - REPORTS_DIR=/data/reports
    volumes:
      - reports:/data/reports
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-myapp}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
  reports:
```

### docker-compose.dev.yml (override for local dev)

```yaml
# docker-compose.dev.yml
services:
  web:
    build:
      target: deps          # use deps stage for hot reload
    volumes:
      - ./frontend:/app
      - /app/node_modules   # keep container node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev

  api:
    volumes:
      - ./backend:/app      # live reload via uvicorn --reload
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Run dev: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`

---

## Step 4: .env.example

```bash
# Auto-generate from docker-compose.yml env references
grep -oP '\$\{[A-Z_]+[^}]*\}' docker-compose.yml | sort -u | \
  sed 's/\${\([^:}]*\)[^}]*}/\1=/' > .env.example
```

Always include these at minimum:
```
POSTGRES_DB=myapp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme
WEB_PORT=3000
API_PORT=8000
```

---

## Step 5: .dockerignore

```
node_modules
.next
dist
.git
.env
.env.*
*.log
coverage
__pycache__
.pytest_cache
.venv
*.pyc
```

---

## Step 6: Verify

```bash
# Build and start
docker compose build --no-cache
docker compose up -d

# Check all services healthy
docker compose ps

# Spot-check API
curl http://localhost:${API_PORT:-8000}/health

# View logs
docker compose logs -f api
```

## Common Issues

| Issue | Fix |
|-------|-----|
| Port already in use | Check `port-map.html`, change `WEB_PORT`/`API_PORT` in `.env` |
| `Path(__file__).parent×N` wrong in container | Use env var: `Path(os.environ.get("REPORTS_DIR", fallback))` |
| node_modules conflict | Mount override: `- /app/node_modules` in volumes |
| Hot reload not working | Ensure dev override is loaded; check `WATCHPACK_POLLING=true` for Docker on macOS |
| DB connection refused | Add `depends_on: db: condition: service_healthy`; verify `pg_isready` healthcheck |
