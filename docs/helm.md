# Helm Deployment

Deploy Hemmelig on Kubernetes using Helm.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- PV provisioner support (for persistence)

## Quick Start

```bash
# Add the chart from local directory
cd Hemmelig.app

# Install with default values
helm install hemmelig ./helm/hemmelig \
  --set config.betterAuthSecret="$(openssl rand -base64 32)" \
  --set config.baseUrl="https://hemmelig.example.com"
```

## Installation

### From Local Chart

```bash
# Clone the repository
git clone https://github.com/HemmeligOrg/Hemmelig.app.git
cd Hemmelig.app

# Install the chart
helm install hemmelig ./helm/hemmelig -f my-values.yaml
```

### Example values.yaml

```yaml
# my-values.yaml
config:
    betterAuthSecret: 'your-secret-key-min-32-chars'
    baseUrl: 'https://hemmelig.example.com'

ingress:
    enabled: true
    className: nginx
    annotations:
        cert-manager.io/cluster-issuer: letsencrypt-prod
    hosts:
        - host: hemmelig.example.com
          paths:
              - path: /
                pathType: Prefix
    tls:
        - secretName: hemmelig-tls
          hosts:
              - hemmelig.example.com

persistence:
    data:
        enabled: true
        size: 1Gi
    uploads:
        enabled: true
        size: 10Gi

resources:
    limits:
        cpu: 500m
        memory: 512Mi
    requests:
        cpu: 100m
        memory: 128Mi
```

## Configuration

### Required Values

| Parameter                 | Description                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `config.betterAuthSecret` | Authentication secret (min 32 characters). Generate with `openssl rand -base64 32` |
| `config.baseUrl`          | Public URL of your instance (required for OAuth)                                   |

### Common Values

| Parameter                     | Description                     | Default             |
| ----------------------------- | ------------------------------- | ------------------- |
| `replicaCount`                | Number of replicas              | `1`                 |
| `image.repository`            | Image repository                | `hemmelig/hemmelig` |
| `image.tag`                   | Image tag                       | `v7`                |
| `service.type`                | Kubernetes service type         | `ClusterIP`         |
| `service.port`                | Service port                    | `3000`              |
| `ingress.enabled`             | Enable ingress                  | `false`             |
| `persistence.data.enabled`    | Enable persistence for database | `true`              |
| `persistence.data.size`       | Database PVC size               | `1Gi`               |
| `persistence.uploads.enabled` | Enable persistence for uploads  | `true`              |
| `persistence.uploads.size`    | Uploads PVC size                | `5Gi`               |

### Using Existing Secrets

Instead of setting `config.betterAuthSecret` directly, use an existing Kubernetes secret:

```yaml
existingSecret: my-hemmelig-secret
```

Create the secret:

```bash
kubectl create secret generic my-hemmelig-secret \
  --from-literal=BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
```

### Additional Environment Variables

```yaml
env:
    - name: HEMMELIG_ANALYTICS_ENABLED
      value: 'true'
```

## Ingress Examples

### Nginx Ingress

```yaml
ingress:
    enabled: true
    className: nginx
    annotations:
        nginx.ingress.kubernetes.io/proxy-body-size: '50m'
    hosts:
        - host: hemmelig.example.com
          paths:
              - path: /
                pathType: Prefix
```

### Traefik Ingress

```yaml
ingress:
    enabled: true
    className: traefik
    annotations:
        traefik.ingress.kubernetes.io/router.tls: 'true'
    hosts:
        - host: hemmelig.example.com
          paths:
              - path: /
                pathType: Prefix
```

## Upgrading

```bash
helm upgrade hemmelig ./helm/hemmelig -f my-values.yaml
```

## Uninstalling

```bash
helm uninstall hemmelig
```

**Note:** PersistentVolumeClaims are not deleted automatically. To remove all data:

```bash
kubectl delete pvc -l app.kubernetes.io/name=hemmelig
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -l app.kubernetes.io/name=hemmelig
kubectl logs -l app.kubernetes.io/name=hemmelig
```

### Check PVC Status

```bash
kubectl get pvc -l app.kubernetes.io/name=hemmelig
```

### Port Forward for Testing

```bash
kubectl port-forward svc/hemmelig 3000:3000
# Visit http://localhost:3000
```
