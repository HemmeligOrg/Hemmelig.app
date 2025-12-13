# Health Check Endpoints

Hemmelig provides health check endpoints for monitoring and container orchestration.

## Endpoints

### Liveness Probe

```
GET /api/health/live
```

Simple check confirming the process is running. Use for Kubernetes liveness probes.

**Response:** `200 OK`

```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Readiness Probe

```
GET /api/health/ready
```

Comprehensive check verifying all dependencies are operational. Use for Kubernetes readiness probes.

**Checks performed:**

| Check        | Description                              |
| ------------ | ---------------------------------------- |
| **Database** | Executes `SELECT 1`, measures latency    |
| **Storage**  | Verifies uploads directory is read/write |
| **Memory**   | Checks RSS is below 1GB threshold        |

**Response:** `200 OK` (all healthy) or `503 Service Unavailable` (one or more failed)

```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "checks": {
        "database": { "status": "healthy", "latency_ms": 2 },
        "storage": { "status": "healthy" },
        "memory": {
            "status": "healthy",
            "heap_used_mb": 128,
            "heap_total_mb": 256,
            "rss_mb": 312,
            "rss_threshold_mb": 1024
        }
    }
}
```

### Legacy Endpoint

```
GET /api/healthz
```

Kept for backwards compatibility. Consider using `/api/health/live` instead.

## Kubernetes Configuration

```yaml
livenessProbe:
    httpGet:
        path: /api/health/live
        port: 3000
    initialDelaySeconds: 5
    periodSeconds: 10

readinessProbe:
    httpGet:
        path: /api/health/ready
        port: 3000
    initialDelaySeconds: 10
    periodSeconds: 30
```

## Docker Compose

```yaml
healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health/ready']
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 10s
```
