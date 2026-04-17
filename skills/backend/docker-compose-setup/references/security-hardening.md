# Docker Security Hardening Reference

Source: OpenAEC-Foundation/Docker-Claude-Skill-Package (docker-core-security)

## Minimum Viable Security (Every Production Container)

```yaml
# Compose template
services:
  app:
    image: myapp:v1
    read_only: true
    tmpfs:
      - /tmp:size=64m
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges=true
    deploy:
      resources:
        limits:
          memory: 512m
          cpus: "1.5"
          pids: 200
    user: "1001:1001"
```

## Security Hardening Decision Tree

```
Container needs hardening?
|
+-- Is the image from a trusted source?
|   +-- NO --> Pin to verified digest: FROM image@sha256:...
|   +-- YES --> Pin version tag, scan with Docker Scout
|
+-- Does the app need root?
|   +-- NO --> Add USER 1001:1001 to Dockerfile
|   +-- YES --> Document WHY, use --cap-drop ALL --cap-add <specific>
|
+-- Does the app write to the filesystem?
|   +-- NO --> Use --read-only
|   +-- YES to specific dirs --> Use --read-only --tmpfs /path
|   +-- YES broadly --> Skip --read-only, log a security debt ticket
|
+-- Does the app need special kernel access?
|   +-- NO --> Use --cap-drop ALL (add nothing)
|   +-- YES --> --cap-drop ALL --cap-add <EXACT_CAP>
|
+-- Is this exposed to the internet?
|   +-- YES --> Add resource limits, no-new-privileges, seccomp default
|   +-- NO --> Still apply resource limits (defense in depth)
```

## Non-Root USER Patterns

### Alpine-based
```dockerfile
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
USER 1001:1001
```

### Debian/Ubuntu-based
```dockerfile
RUN groupadd -r -g 1001 appgroup && useradd --no-log-init -r -u 1001 -g appgroup appuser
USER 1001:1001
```

ALWAYS use numeric UID/GID for deterministic behavior across environments.
ALWAYS use `--no-log-init` on Debian to prevent `/var/log/faillog` from filling with NULL chars.

## Linux Capabilities Reference

| Capability | Purpose | When Needed |
|------------|---------|-------------|
| `NET_BIND_SERVICE` | Bind to ports < 1024 | Web servers on port 80/443 |
| `CHOWN` | Change file ownership | Apps managing file permissions |
| `SETUID` / `SETGID` | Change process UID/GID | Apps switching users at runtime |
| `SYS_PTRACE` | Process tracing | Debugging, profiling tools |
| `NET_ADMIN` | Network configuration | VPN containers, network tools |
| `SYS_ADMIN` | Mount operations | **Avoid** -- use specific caps instead |
| `DAC_OVERRIDE` | Bypass file permission checks | **Avoid** -- fix file permissions instead |

## Build-Time Secret Management

NEVER bake secrets into image layers. ALWAYS use BuildKit secret mounts:

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=aws_creds,target=/root/.aws/credentials \
    aws s3 cp s3://bucket/file /app/file
```

```bash
docker buildx build --secret id=aws_creds,src=$HOME/.aws/credentials .
```

## Image Scanning

```bash
# Docker Scout (quick check)
docker scout cves --only-severity critical,high myapp:v1

# Trivy (CI gate)
trivy image --exit-code 1 --severity CRITICAL myapp:v1

# Docker Bench for Security (CIS audit)
docker run --rm --net host --pid host \
  --userns host --cap-add audit_control \
  -v /var/lib:/var/lib:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /etc:/etc:ro \
  docker/docker-bench-security
```

## Resource Limits (DoS Prevention)

| Flag | Purpose | Recommended |
|------|---------|-------------|
| `-m, --memory` | Hard memory limit | Set based on profiling |
| `--memory-swap` | Memory + swap | 2x memory or equal (no swap) |
| `--cpus` | CPU quota | Start conservative |
| `--pids-limit` | Fork bomb prevention | 200 for most apps |
| `--ulimit nofile` | File descriptor limit | 1024:2048 |

## Critical NEVER Rules

- NEVER use `--privileged` in production
- NEVER store secrets in ENV, ARG, or COPY instructions
- NEVER run containers as root unless technically required
- NEVER use `latest` tag in production
- NEVER expose Docker daemon API over TCP without TLS
- NEVER disable seccomp (`seccomp=unconfined`) in production
