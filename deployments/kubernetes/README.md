# RTC Kubernetes Deployments

Cloud production topology for RTC authority (`cloud.production`).

## Layout

| Path | Purpose |
|------|---------|
| `cloud/namespace.yaml` | `sdkwork-rtc` namespace |
| `cloud/rtc-standalone-gateway/` | Standalone gateway Deployment, Service, runtime ConfigMap |
| `cloud/rtc-reconcile/` | Session reconciliation CronJob (`sdkwork-rtc-reconcile`) |

## Prerequisites

1. Materialize secrets from `deployments/templates/server.env.example` into cluster Secrets (`rtc-standalone-gateway-secrets`).
2. Apply `configmap.example.yaml` files with production database and tenant values.
3. Build/publish container image that ships:
   - `/opt/sdkwork/rtc/bin/sdkwork-api-rtc-standalone-gateway`
   - `/opt/sdkwork/rtc/bin/sdkwork-rtc-reconcile`

## Apply order

```powershell
kubectl apply -f deployments/kubernetes/cloud/namespace.yaml
kubectl apply -f deployments/kubernetes/cloud/rtc-standalone-gateway/
kubectl apply -f deployments/kubernetes/cloud/rtc-reconcile/
```

## Related

- Schedule: `jobs/schedules/rtc-session-reconciliation.yaml`
- Runbook: `jobs/runbooks/rtc-session-reconciliation.md`
