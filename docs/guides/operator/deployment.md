# RTC Production Deployment

Operator guide for shipping `sdkwork-rtc-api-server` and `sdkwork-rtc-reconcile` to production.

## Release artifacts

| Artifact | Path / registry | Contents |
| --- | --- | --- |
| Server archive | `artifacts/release/server/sdkwork-rtc-*-server.tar.gz` | `sdkwork-rtc-api-server`, `sdkwork-rtc-reconcile`, systemd units, env template |
| Container image | `ghcr.io/sdkwork/rtc-api-server` | Both binaries under `/opt/sdkwork/rtc/bin/` |
| Gateway config bundle | `dist/config-bundle/` | Cloud ingress / gateway topology (when using split gateway) |

Build locally:

```powershell
node scripts/package-server.mjs package
```

CI builds the container image on release tags via `.github/workflows/rtc-server-image.yml`.

## Required environment

Copy `deployments/templates/server.env.example` to a protected location and set:

- `SDKWORK_RTC_ENVIRONMENT=production`
- `SDKWORK_RTC_DEPLOYMENT_PROFILE` — `standalone` or `cloud`
- `SDKWORK_RTC_SERVICE_LAYOUT=split-services`
- Database URL and pool settings (`SDKWORK_DATABASE_*`)
- JWT / IAM verification settings consumed by `sdkwork-iam-web-adapter`
- Provider plugin credentials (Volcengine, Tencent, Agora, Aliyun, LiveKit) via secret manager

Production **requires** database persistence. The API server refuses to start without a configured RTC database when `SDKWORK_RTC_ENVIRONMENT` is not `development`, `dev`, `local`, or `test`.

## Deployment profiles

### Kubernetes (cloud split-services)

Manifests: `deployments/kubernetes/cloud-split-services/`

1. Create namespace and ConfigMaps from `*.example.yaml` (replace placeholders).
2. Deploy `rtc-api-server` Deployment + Service (port `18088`, health at `/healthz`, metrics at `/metrics`).
3. Schedule `rtc-reconcile` CronJob (see `jobs/schedules/rtc-session-reconciliation.yaml`).

### systemd (standalone appliance)

Units: `deployments/systemd/`

1. Install binaries from the server archive to `/opt/sdkwork/rtc/bin/`.
2. Enable `sdkwork-rtc-api-server.service`.
3. Enable `sdkwork-rtc-reconcile.timer` for periodic reconciliation.

### Docker / compose

See `deployments/docker/README.md`. Example compose: `deployments/docker/docker-compose.standalone.example.yaml`.

## Reconciliation job

Binary: `sdkwork-rtc-reconcile`

Runbook: `jobs/runbooks/rtc-session-reconciliation.md`

- Discovers tenant scopes from active `rtc_media_session` rows.
- Override scopes: `SDKWORK_RTC_RECONCILE_TENANT_SCOPES=tenant:org,tenant:org`
- Exits non-zero when reconciliation failures remain (suitable for CronJob alerting).

RTC does **not** call IM signaling APIs. Cross-service IM/RTC drift healing is owned by `sdkwork-im` per `docs/rtc-im-boundary.md`.

## Observability

- Health: `GET /healthz`
- Metrics: `GET /metrics` (Prometheus text format)
- Structured logs via `RUST_LOG` / tracing subscriber

## Verification before go-live

```powershell
pnpm run verify
cargo test --workspace
node scripts/package-server.mjs validate
```

## Related specs

- `deployments/README.md`
- `../sdkwork-specs/DEPLOYMENT_SPEC.md`
- `../sdkwork-specs/RELEASE_SPEC.md`
- `../sdkwork-specs/SECURITY_SPEC.md`
