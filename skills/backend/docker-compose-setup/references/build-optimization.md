# Docker Build Optimization Reference

Source: OpenAEC-Foundation/Docker-Claude-Skill-Package (docker-impl-build-optimization, docker-syntax-multistage)

## Layer Caching Rules

**Critical rule:** Once ANY layer's cache is invalidated, ALL subsequent layers MUST rebuild.

### Cache Invalidation Triggers

| Instruction | Cache Key | Invalidation Trigger |
|-------------|-----------|---------------------|
| `FROM` | Image reference | Base image tag/digest changed |
| `RUN` | Command string only | Command text changed (NOT external resources) |
| `COPY` | File content checksums | File content changed (mtime NOT checked) |
| `ADD` | File checksums + URL content | File content or URL content changed |
| `ENV` | Key=Value pair | Value changed |
| `ARG` | Name=Value pair | Value changed |

## Cache Mount Patterns by Package Manager

### npm
```dockerfile
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
```

### pnpm
```dockerfile
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
```

### yarn
```dockerfile
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install --frozen-lockfile
```

### pip
```dockerfile
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
```

### uv (Python)
```dockerfile
COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev
```

### Go modules
```dockerfile
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -o /app/server ./cmd
```

### apt-get (ALWAYS use sharing=locked)
```dockerfile
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends curl
```

### Cargo (Rust)
```dockerfile
COPY Cargo.toml Cargo.lock ./
RUN --mount=type=cache,target=/app/target/ \
    --mount=type=cache,target=/usr/local/cargo/git/db \
    --mount=type=cache,target=/usr/local/cargo/registry/ \
    cargo build --release
```

## Multi-Stage Build Patterns

### Image Size Impact

| Language | Without Multi-Stage | With Multi-Stage | Reduction |
|----------|-------------------|-----------------|-----------|
| Go | ~800 MB | ~7 MB (alpine) | 99% |
| Node.js | ~1.1 GB | ~180 MB (slim) | 83% |
| Python | ~1.0 GB | ~150 MB (slim) | 85% |
| Rust | ~1.4 GB | ~7 MB (alpine) | 99% |
| Java | ~700 MB | ~220 MB (JRE) | 69% |

### Final Stage Base Image Selection

| Base Image | Size | Use When |
|-----------|------|----------|
| `scratch` | 0 MB | Statically compiled binaries (Go, Rust musl) |
| `alpine` | ~7 MB | Need a shell and minimal utilities |
| `distroless/static` | ~2 MB | Static binaries without shell |
| `distroless/base` | ~20 MB | Binaries needing glibc but no shell |
| `*-slim` variants | 30-80 MB | Need package manager for runtime deps |

### Parallel Build Stages (BuildKit)

BuildKit automatically parallelizes independent stages:

```dockerfile
# syntax=docker/dockerfile:1

# These two stages build simultaneously
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/ .
RUN npm ci && npm run build

FROM python:3.12-slim AS backend-build
WORKDIR /backend
COPY backend/ .
RUN pip install uv && uv sync --frozen --no-dev

# Final stage combines both
FROM python:3.12-slim AS production
COPY --from=backend-build /backend/.venv ./.venv
COPY --from=frontend-build /frontend/dist ./static
```

### Debug Stage Pattern

```dockerfile
FROM alpine:3.19 AS production
COPY --from=build /app/server /usr/local/bin/server
USER 1001:1001
ENTRYPOINT ["/usr/local/bin/server"]

FROM production AS debug
USER root
RUN apk add --no-cache curl strace busybox-extras
USER 1001:1001
```

```bash
docker build -t myapp:latest .                    # production (lean)
docker build --target debug -t myapp:debug .       # with debug tools
```

## CI/CD Cache Backends

### GitHub Actions Cache
```yaml
- uses: docker/build-push-action@v7
  with:
    push: true
    tags: user/app:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Registry Cache
```bash
docker buildx build --push -t registry/app:latest \
  --cache-to type=registry,ref=registry/app:buildcache,mode=max \
  --cache-from type=registry,ref=registry/app:buildcache .
```

### Multi-Branch Cache Strategy
```bash
docker buildx build --push -t registry/app:latest \
  --cache-to type=registry,ref=registry/app:cache:$BRANCH \
  --cache-from type=registry,ref=registry/app:cache:$BRANCH \
  --cache-from type=registry,ref=registry/app:cache:main .
```

ALWAYS fall back to main branch cache when feature branch cache misses.
ALWAYS use `mode=max` in CI to cache ALL intermediate layers.

## Forcing Cache Invalidation

```bash
docker build --no-cache .                     # invalidate ALL cache
docker build --no-cache-filter install .      # invalidate specific stage
docker build --pull .                         # pull fresh base images
docker builder prune                          # clear entire builder cache
docker builder prune --keep-storage 5GB       # clear with size limit
```

## .dockerignore Template

```
.git
.gitignore
node_modules
__pycache__
*.pyc
.venv
.next
dist
build
coverage
.pytest_cache
Dockerfile*
docker-compose*.yml
.dockerignore
*.md
LICENSE
docs/
.env
.env.*
*.pem
*.key
.vscode
.idea
.DS_Store
.github
tests/
```

**Negation syntax:** Use `!` to re-include excluded files:
```
*.md
!README.md
```
