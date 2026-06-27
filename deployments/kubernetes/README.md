# RTC Kubernetes Deployments

Cloud split-services topology for production RTC authority.

## Layout

| Path | Purpose |
|------|---------|
| `cloud-split-services/namespace.yaml` | `sdkwork-rtc` namespace |
| `cloud-split-services/rtc-standalone-gateway/` | Standalone gateway Deployment, Service, runtime ConfigMap |
| `cloud-split-services/rtc-reconcile/` | Session reconciliation CronJob (`sdkwork-rtc-reconcile`) |

## Prerequisites

1. Materialize secrets from `deployments/templates/server.env.example` into cluster Secrets (`rtc-standalone-gateway-secrets`).
2. Apply `configmap.example.yaml` files with production database and tenant values.
3. Build/publish container image that ships:
   - `/opt/sdkwork/rtc/bin/sdkwork-rtc-standalone-gateway`
   - `/opt/sdkwork/rtc/bin/sdkwork-rtc-reconcile`

## Apply order

```powershell
kubectl apply -f deployments/kubernetes/cloud-split-services/namespace.yaml
kubectl apply -f deployments/kubernetes/cloud-split-services/rtc-standalone-gateway/
kubectl apply -f deployments/kubernetes/cloud-split-services/rtc-reconcile/
```

## Related

- Schedule: `jobs/schedules/rtc-session-reconciliation.yaml`
- Runbook: `jobs/runbooks/rtc-session-reconciliation.md`
