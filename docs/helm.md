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
  --set config.betterAuthUrl="https://hemmelig.example.com"
```

## Installation

### From the OCI Registry

Each server release publishes the chart to GitHub Container Registry. The chart version matches the release, without the `v` prefix:

```bash
helm install hemmelig oci://ghcr.io/hemmeligorg/charts/hemmelig \
  --version 7.5.0 \
  -f my-values.yaml
```

To see the default values of a version:

```bash
helm show values oci://ghcr.io/hemmeligorg/charts/hemmelig --version 7.5.0
```

Flux and other GitOps tools can use the same `oci://ghcr.io/hemmeligorg/charts` address as an OCI Helm repository.

The chart keeps `image.tag: v7` by default, so it follows the latest v7 image. To run exactly the image of the chart version, set `image.tag: ""`.

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
    betterAuthUrl: 'https://hemmelig.example.com'

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
| `config.betterAuthUrl`    | Public URL of your instance (required for OAuth and cookie handling)               |

### Common Values

| Parameter                     | Description                                                                                                                  | Default                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `replicaCount`                | Number of replicas                                                                                                           | `1`                    |
| `image.repository`            | Image repository                                                                                                             | `hemmeligapp/hemmelig` |
| `image.tag`                   | Image tag                                                                                                                    | `v7`                   |
| `service.type`                | Kubernetes service type                                                                                                      | `ClusterIP`            |
| `service.port`                | Service port                                                                                                                 | `3000`                 |
| `ingress.enabled`             | Enable ingress                                                                                                               | `false`                |
| `persistence.data.enabled`    | Enable persistence for database                                                                                              | `true`                 |
| `persistence.data.size`       | Database PVC size                                                                                                            | `1Gi`                  |
| `persistence.uploads.enabled` | Enable persistence for uploads                                                                                               | `true`                 |
| `persistence.uploads.size`    | Uploads PVC size                                                                                                             | `5Gi`                  |
| `config.trustedProxies`       | IPs or CIDR ranges of the proxies in front of Hemmelig, for example the ingress controller. Sets `HEMMELIG_TRUSTED_PROXIES`. | `""`                   |
| `env`                         | Extra environment variables                                                                                                  | `[]`                   |
| `extraEnvFrom`                | Secrets or ConfigMaps to load as environment variables                                                                       | `[]`                   |

### Using Existing Secrets

Instead of setting `config.betterAuthSecret` directly, use an existing Kubernetes secret:

```yaml
existingSecret: my-hemmelig-secret
```

Create the secret:

```bash
kubectl create secret generic my-hemmelig-secret \
  --from-literal=BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=HEMMELIG_ANALYTICS_HMAC_SECRET="$(openssl rand -base64 32)"
```

The chart reads `HEMMELIG_ANALYTICS_HMAC_SECRET` from the secret when the key exists.

### Additional Environment Variables

Use `env` for single variables:

```yaml
env:
    - name: HEMMELIG_ANALYTICS_ENABLED
      value: 'true'
```

Use `extraEnvFrom` to load every key of a Secret or a ConfigMap as a variable. This works for any `HEMMELIG_*` setting, for example all OAuth settings in one Secret:

```bash
kubectl create secret generic hemmelig-oauth \
  --from-literal=HEMMELIG_AUTH_GITHUB_ID=your-client-id \
  --from-literal=HEMMELIG_AUTH_GITHUB_SECRET=your-client-secret
```

```yaml
extraEnvFrom:
    - secretRef:
          name: hemmelig-oauth
```

### Behind an Ingress

Hemmelig trusts forwarded client IP headers only from trusted proxies. Set the address range of your ingress controller, or IP restrictions and rate limits see the proxy address for every client:

```yaml
config:
    trustedProxies: '10.0.0.0/8'
```

## OAuth Configuration

The Hemmelig Helm Chart supports comprehensive OAuth provider configuration. For detailed setup instructions and examples, see:

**[OAuth Configuration with Helm](helm-oauth.md)**

This guide covers:

- All supported OAuth providers (GitHub, Google, Microsoft, Discord, GitLab, Apple, Twitter/X)
- Generic OAuth providers (Authentik, Authelia, Keycloak, etc.)
- Default secret vs existing secret management
- Required configuration for OAuth callbacks

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
# From the OCI registry
helm upgrade hemmelig oci://ghcr.io/hemmeligorg/charts/hemmelig --version 7.5.0 -f my-values.yaml

# From the local chart
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
