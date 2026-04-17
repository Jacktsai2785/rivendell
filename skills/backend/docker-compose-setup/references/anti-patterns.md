# Docker Anti-Pattern Catalog

Source: OpenAEC-Foundation/Docker-Claude-Skill-Package (multiple skills)

## Dockerfile Anti-Patterns

### 1. COPY before dependency install (cache buster)
```dockerfile
# BAD: Any source file change invalidates cache and reinstalls ALL deps
COPY . .
RUN npm install

# GOOD: Only lockfile changes trigger reinstall
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

### 2. Separate apt-get update and install
```dockerfile
# BAD: cached update layer becomes stale
RUN apt-get update
RUN apt-get install -y curl

# GOOD: always fresh
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

### 3. Shell form ENTRYPOINT (signal handling broken)
```dockerfile
# BAD: app runs under /bin/sh -c, never receives SIGTERM
ENTRYPOINT /usr/bin/app

# GOOD: app is PID 1, receives signals directly
ENTRYPOINT ["/usr/bin/app"]
```

### 4. Running as root
```dockerfile
# BAD: no USER instruction, runs as root
FROM node:20-alpine
COPY . .
CMD ["node", "server.js"]

# GOOD: explicit non-root user
FROM node:20-alpine
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app
COPY --chown=1001:1001 . .
USER 1001:1001
CMD ["node", "server.js"]
```

### 5. Secrets in image layers
```dockerfile
# BAD: secret visible in docker history
ENV API_KEY=sk-secret123
COPY credentials.json /app/

# GOOD: BuildKit secret mount (never persisted in layers)
RUN --mount=type=secret,id=api_key cat /run/secrets/api_key > /dev/null
```

### 6. No .dockerignore
```
# Without .dockerignore, the ENTIRE directory tree is sent to the daemon:
# .git/ (entire repo history, potentially 100s MB)
# node_modules/ (500MB+)
# .env files (secrets!)
```

### 7. Using `latest` tag in production
```dockerfile
# BAD: non-reproducible, changes without warning
FROM node:latest

# GOOD: pinned version
FROM node:22-alpine

# BEST: pinned with digest
FROM node:22-alpine@sha256:abc123...
```

### 8. Debug tools in production image
```dockerfile
# BAD: increases attack surface
FROM node:22-alpine
RUN apk add --no-cache curl vim strace

# GOOD: separate debug stage
FROM node:22-alpine AS production
# ... production-only layers

FROM production AS debug
RUN apk add --no-cache curl vim strace
```

### 9. Single-stage build shipping build tools
```dockerfile
# BAD: ships gcc, make, dev headers in production (~800MB)
FROM golang:1.22
COPY . .
RUN go build -o server
CMD ["./server"]

# GOOD: multi-stage, production image ~7MB
FROM golang:1.22 AS build
COPY . .
RUN CGO_ENABLED=0 go build -o server

FROM alpine:3.19
COPY --from=build /go/server /usr/local/bin/server
CMD ["server"]
```

## Compose Anti-Patterns

### 1. Deprecated version field
```yaml
# BAD: ignored by Compose v2, generates warnings
version: "3.8"
services: ...

# GOOD: just omit it
services: ...
```

### 2. Bare depends_on (no health condition)
```yaml
# BAD: only waits for container start, NOT app readiness
depends_on:
  - db

# GOOD: waits for healthy status
depends_on:
  db:
    condition: service_healthy
```

### 3. Hardcoded container IPs
```yaml
# BAD: IPs change on restart
environment:
  DB_HOST: 172.18.0.3

# GOOD: use service name DNS
environment:
  DB_HOST: db
```

### 4. No resource limits
```yaml
# BAD: container can consume all host memory
services:
  api:
    image: myapp

# GOOD: bounded resources
services:
  api:
    image: myapp
    deploy:
      resources:
        limits:
          memory: 512m
          cpus: "1.5"
          pids: 200
```

### 5. Using -p for container-to-container communication
```yaml
# BAD: unnecessarily exposes port to host
services:
  db:
    image: postgres
    ports:
      - "5432:5432"  # Only needed if host needs direct access

# GOOD: containers on same network reach all ports directly
# Only publish ports that external clients need
```

### 6. Default bridge network (docker run)
```bash
# BAD: no DNS resolution between containers
docker run --name web nginx
docker run --name api node

# GOOD: user-defined network with DNS
docker network create mynet
docker run --network mynet --name web nginx
docker run --network mynet --name api node
```

### 7. container_name on scalable services
```yaml
# BAD: prevents scaling (names must be unique)
services:
  worker:
    image: myworker
    container_name: my-worker

# GOOD: let Compose generate names
services:
  worker:
    image: myworker
    # scale with: docker compose up --scale worker=3
```

## Build Optimization Anti-Patterns

### Cache invalidation from broad COPY
```dockerfile
# BAD: copying entire project invalidates cache even for README changes
COPY . .
RUN go build

# GOOD: copy only what each step needs
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build
```

### No cache mounts for package managers
```dockerfile
# BAD: downloads all packages from scratch every build
RUN pip install -r requirements.txt

# GOOD: caches downloaded packages across builds
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

### Using --no-cache as a permanent fix
```bash
# BAD: treats symptom, not cause
docker build --no-cache .   # Every single time

# GOOD: fix the root cause of cache invalidation
# Then build normally (cache works correctly)
docker build .
```

## Runtime Anti-Patterns

### Using docker commit for production
```bash
# BAD: unreproducible, undocumented
docker exec mycontainer apt-get install -y curl
docker commit mycontainer myapp:v2

# GOOD: reproducible via Dockerfile
# Add to Dockerfile, rebuild
```

### Binding to 127.0.0.1 inside container
```python
# BAD: only reachable from inside the container itself
app.run(host='127.0.0.1', port=8000)

# GOOD: reachable from other containers on the network
app.run(host='0.0.0.0', port=8000)
```

### No health check defined
```yaml
# BAD: Compose has no way to know if service is ready
services:
  db:
    image: postgres

# GOOD: proper health check
services:
  db:
    image: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
```
