# Prometheus Metrics

Hemmelig provides a Prometheus-compatible metrics endpoint for monitoring your instance.

## Enabling Metrics

1. Go to **Dashboard > Instance > Metrics** tab
2. Enable the **Enable Prometheus Metrics** toggle
3. Optionally, set a **Metrics Secret** for authentication
4. Save the settings

## Endpoint

```
GET /api/metrics
```

## Authentication

If a metrics secret is configured, you must include it as a Bearer token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_METRICS_SECRET" https://your-instance.com/api/metrics
```

If no secret is configured, the endpoint is accessible without authentication (not recommended for production).

## Available Metrics

### Application Metrics

| Metric                                   | Type      | Description                                  |
| ---------------------------------------- | --------- | -------------------------------------------- |
| `hemmelig_secrets_created_total`         | Counter   | Total number of secrets created              |
| `hemmelig_secrets_viewed_total`          | Counter   | Total number of secrets viewed               |
| `hemmelig_secrets_expired_total`         | Counter   | Total number of secrets that expired         |
| `hemmelig_secrets_active_count`          | Gauge     | Current number of active (unexpired) secrets |
| `hemmelig_users_total`                   | Gauge     | Total number of registered users             |
| `hemmelig_http_request_duration_seconds` | Histogram | Duration of HTTP requests in seconds         |

### Default Node.js Metrics

The endpoint also exposes default Node.js runtime metrics including:

- `nodejs_heap_size_total_bytes` - Process heap size
- `nodejs_heap_size_used_bytes` - Process heap size used
- `nodejs_external_memory_bytes` - Node.js external memory
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_active_handles_total` - Number of active handles
- `nodejs_active_requests_total` - Number of active requests
- `process_cpu_user_seconds_total` - User CPU time spent
- `process_cpu_system_seconds_total` - System CPU time spent
- `process_start_time_seconds` - Process start time
- `process_resident_memory_bytes` - Resident memory size

## Prometheus Configuration

Add the following job to your `prometheus.yml`:

```yaml
scrape_configs:
    - job_name: 'hemmelig'
      scrape_interval: 30s
      static_configs:
          - targets: ['your-instance.com']
      metrics_path: '/api/metrics'
      scheme: https
      # If using authentication:
      authorization:
          type: Bearer
          credentials: 'YOUR_METRICS_SECRET'
```

## Grafana Dashboard

You can create a Grafana dashboard to visualize these metrics. Here's an example panel query for active secrets:

```promql
hemmelig_secrets_active_count
```

For secrets creation rate over time:

```promql
rate(hemmelig_secrets_created_total[5m])
```

## Security Considerations

- Always use a strong, randomly generated secret for the metrics endpoint in production
- Consider using network-level restrictions (firewall, VPN) to limit access to the metrics endpoint
- The metrics endpoint does not expose any sensitive data (secret contents, user data, etc.)
