# RTC Production Deployment

Operator guide for shipping `sdkwork-rtc-standalone-gateway` and `sdkwork-rtc-reconcile` to production.

## Release artifacts

| Artifact | Path / registry | Contents |
| --- | --- | --- |
| Server archive | `artifacts/release/server/sdkwork-rtc-*-server.tar.gz` | `sdkwork-rtc-standalone-gateway`, `sdkwork-rtc-reconcile`, systemd units, env template |
| Container image | `ghcr.io/sdkwork/rtc-standalone-gateway` | Both binaries under `/opt/sdkwork/rtc/bin/` |
| Gateway config bundle | `dist/config-bundle/` | Cloud ingress / gateway topology (when using split gateway) |

Build locally:

```powershell
node scripts/package-server.mjs package
```

CI builds the container image on release tags via `.github/workflows/rtc-server-image.yml`.

## Required environment

Copy `deployments/templates/server.env.example` to a protected location and set:

- `SDKWORK_RTC_ENVIRONMENT=production`
- `SDKWORK_RTC_APP_CONTEXT_REQUIRE_SIGNATURE=true` — validates `x-sdkwork-context-signature` on incoming app-context headers; gateway refuses requests with missing or invalid signatures
- `SDKWORK_RTC_APP_CONTEXT_SIGNATURE_SECRET` — shared HMAC secret (store in secret manager, not ConfigMap); **required** when `SDKWORK_RTC_APP_CONTEXT_REQUIRE_SIGNATURE=true`; must match the value used by upstream gateways or IAM proxies that sign `x-sdkwork-*` headers
- `SDKWORK_RTC_HYDRATE_TENANT_ID` / `SDKWORK_RTC_HYDRATE_ORGANIZATION_ID` — tenant scope loaded into in-memory runtime at API server startup
- `SDKWORK_RTC_DEPLOYMENT_PROFILE` — `standalone` or `cloud`
- `SDKWORK_RTC_SERVICE_LAYOUT=split-services`
- Database URL and pool settings (`SDKWORK_DATABASE_*` or `SDKWORK_RTC_DATABASE_*` / `SDKWORK_CLAW_DATABASE_*` per deployment template)
- JWT / IAM verification settings consumed by `sdkwork-iam-web-adapter`
- Provider plugin credentials (Volcengine, Tencent, Agora, Aliyun, LiveKit) via secret manager

Production **requires** database persistence. The API server refuses to start without a configured RTC database when `SDKWORK_RTC_ENVIRONMENT` is not `development`, `dev`, `local`, or `test`.

When `SDKWORK_RTC_DEPLOYMENT_PROFILE` is `production`, `staging`, or `prod`, the gateway also refuses to start if `SDKWORK_RTC_ENVIRONMENT` is still a development profile. Provider plugins reject unsigned credential placeholders in the same conditions.

### App context signature (production)

Upstream gateways or IAM proxies sign canonical `x-sdkwork-*` headers with HMAC-SHA256; RTC validates the `x-sdkwork-context-signature` header on every request (`sdkwork-rtc-app-context`).

| Variable | Required | Notes |
| --- | --- | --- |
| `SDKWORK_RTC_APP_CONTEXT_REQUIRE_SIGNATURE` | Yes (production) | Set `true`; gateway rejects missing or invalid signatures |
| `SDKWORK_RTC_APP_CONTEXT_SIGNATURE_SECRET` | Yes when above is `true` | Shared HMAC secret — inject via secret manager, **not** the committed `server.env.example` (template enables signing but omits the secret) |

The gateway validates signatures on every authenticated HTTP request. The reconcile worker does not accept HTTP traffic and does not read these variables.

### Startup hydration caps

Hydration bounds how many recent rows per entity type are loaded from SQL into the in-memory runtime on gateway startup. Queries select newest-first (`ORDER BY updated_at DESC`) with a SQL `LIMIT`; nested session children (tracks, artifacts, quality samples, completion records) load per hydrated media session. Caps prevent unbounded memory use after long-running deployments; rows outside the window remain in the database and are available via read-through retrieve on demand.

| Env var | Default | Max | Loaded entities |
| --- | --- | --- | --- |
| `SDKWORK_RTC_HYDRATION_MAX_MEDIA_SESSIONS` | `200` | `2000` | Active/preparing/closing media sessions + nested children |
| `SDKWORK_RTC_HYDRATION_MAX_ROOMS` | `500` | `5000` | Rooms |
| `SDKWORK_RTC_HYDRATION_MAX_WEBHOOK_EVENTS` | `500` | `10000` | Provider webhook events |
| `SDKWORK_RTC_HYDRATION_MAX_PROVIDER_QUERY_JOBS` | `200` | `5000` | Provider query jobs |
| `SDKWORK_RTC_HYDRATION_MAX_PROVIDER_QUERY_SNAPSHOTS` | `200` | `5000` | Provider query snapshots |
| `SDKWORK_RTC_HYDRATION_MAX_IDEMPOTENCY_RECORDS` | `500` | `10000` | Media session idempotency rows |
| `SDKWORK_RTC_HYDRATION_MAX_SESSION_TOKEN_GRANTS` | `500` | `10000` | Session token grants (restart-safe revocation) |

Raise caps only when a single tenant scope routinely exceeds defaults and memory headroom allows it. The reconcile worker skips gateway startup hydration env vars; it discovers scopes from `rtc_media_session` rows and hydrates each scope with the same caps before running reconciliation jobs.

## Deployment profiles

### Kubernetes (cloud split-services)

Manifests: `deployments/kubernetes/cloud-split-services/`

1. Create namespace and ConfigMaps from `*.example.yaml` (replace placeholders).
2. Deploy `rtc-standalone-gateway` Deployment + Service (port `18088`, health at `/healthz`, metrics at `/metrics`).
3. Schedule `rtc-reconcile` CronJob (see `jobs/schedules/rtc-session-reconciliation.yaml`).

### systemd (standalone appliance)

Units: `deployments/systemd/`

1. Install binaries from the server archive to `/opt/sdkwork/rtc/bin/`.
2. Enable `sdkwork-rtc-standalone-gateway.service`.
3. Enable `sdkwork-rtc-reconcile.timer` for periodic reconciliation.

### Docker / compose

See `deployments/docker/README.md`. Example compose: `deployments/docker/docker-compose.standalone.example.yaml`.

## Reconciliation job

Binary: `sdkwork-rtc-reconcile`

Runbook: `jobs/runbooks/rtc-session-reconciliation.md`

- Skips gateway `SDKWORK_RTC_HYDRATE_*` bootstrap; discovers tenant scopes from `rtc_media_session` rows in `Preparing`, `Active`, `Closing`, or `Failed`, then hydrates each scope before reconciliation.
- Override scopes: `SDKWORK_RTC_RECONCILE_TENANT_SCOPES=100:0,200:0` (`tenant_id:organization_id` segments)
- Closes stale sessions, syncs provider drift when supported, compensates failed sessions with lingering provider ids, and runs recording-artifact lifecycle passes.
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
