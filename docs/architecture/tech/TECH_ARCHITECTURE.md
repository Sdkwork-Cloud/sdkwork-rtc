# RTC Technical Architecture

Status: active  
Owner: SDKWork maintainers  
Updated: 2026-06-29  
Specs: `../sdkwork-specs/ARCHITECTURE_DECISION_SPEC.md`, `../sdkwork-specs/DOCUMENTATION_SPEC.md`

## Document Map

| Topic | Document |
| --- | --- |
| Authority migration | [TECH-2026-06-06-sdkwork-rtc-authority-migration.md](TECH-2026-06-06-sdkwork-rtc-authority-migration.md) |
| Provider plugin boundary | [TECH-2026-06-09-rtc-only-provider-plugin-boundary.md](TECH-2026-06-09-rtc-only-provider-plugin-boundary.md) |
| RTC ↔ IM boundary | [TECH-rtc-im-boundary.md](TECH-rtc-im-boundary.md) |
| Runtime topology | [TECH-topology-standard.md](TECH-topology-standard.md) |
| Production deployment | [../../guides/operator/deployment.md](../../guides/operator/deployment.md) |

## 1. Architecture Overview

`sdkwork-rtc` is the **RTC authority workspace**: provider plugins, media runtime contracts, persistence, HTTP APIs, SDK families, and runnable client surfaces. Call **signaling** remains in `sdkwork-im` (`/im/v3/api/calls/*`).

```
┌─────────────────────────────────────────────────────────────────┐
│  Client surfaces (apps/)                                        │
│  PC · H5 · Flutter · Mini Program                               │
│  → generated app/backend SDKs (no raw HTTP)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS /app|backend/v3/api/rtc/*
┌───────────────────────────▼─────────────────────────────────────┐
│  sdkwork-rtc-standalone-gateway                                 │
│  sdkwork-web-framework + sdkwork-iam-web-adapter                │
│  sdkwork-routes-rtc-app-api / sdkwork-routes-rtc-backend-api      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 communication-rtc-service  repository-sqlx   service-host
 (domain + provider ports)  (sdkwork-database) (Drive import)
        │                   │                   │
        └─────────┬─────────┴───────────────────┘
                  ▼
           plugins/rtc-* (Volcengine, Tencent, Agora, Aliyun, LiveKit)
```

## 2. Technology Choices

| Layer | Stack |
| --- | --- |
| HTTP runtime | Rust, Axum, `sdkwork-web-framework` |
| Persistence | PostgreSQL/SQLite via `sdkwork-database` + sqlx repository |
| File / recording storage | `sdkwork-drive` uploader + RTC Drive space references |
| Shared utilities | `sdkwork-utils-rust`, `@sdkwork/utils` |
| Client | React (PC/H5), Flutter, WeChat mini program |
| API contracts | OpenAPI under `apis/`, materialized to `sdks/` |
| Packaging | `sdkwork.workflow.json`, GitHub Actions, K8s/systemd/Docker |

**Not used (by design):** `sdkwork-discovery` — no RPC services in this workspace yet.

## 3. System Boundaries And Modules

| Owns | Does not own |
| --- | --- |
| `/app/v3/api/rtc/*`, `/backend/v3/api/rtc/*` | IM call signaling (`/im/v3/api/calls/*`) |
| Media sessions, rooms, credentials, artifacts | Direct multipart file upload endpoints |
| Provider registry, webhooks, query jobs | Vendor bucket URLs in persistence |
| RTC SDK families | IM domain error types in IM crates |

See [TECH-rtc-im-boundary.md](TECH-rtc-im-boundary.md) for dependency direction.

## 4. Directory And Package Layout

| Path | Responsibility |
| --- | --- |
| `apis/` | OpenAPI authority inputs |
| `crates/sdkwork-communication-rtc-service` | Domain types, provider ports, live streaming contracts (`domain/live_stream.rs`), capability snapshots (`provider_capability.rs`), shared webhook/recording helpers, registry (`constants.rs`, `domain/*`, `provider/*`, `provider_webhook_parse.rs`, `provider_recording_export.rs`, `time.rs`; thin `lib.rs` assembly root) |
| `crates/sdkwork-communication-rtc-repository-sqlx` | Persistence + database bootstrap |
| `crates/sdkwork-routes-rtc-*-api` | HTTP handlers wired through web framework |
| `crates/sdkwork-rtc-service-host` | Drive-backed recording import |
| `crates/sdkwork-rtc-standalone-gateway` | Production HTTP entrypoint |
| `plugins/rtc-*` | Vendor provider adapters |
| `configs/provider-registry/` | Default provider plugin roster (`platform-default.json`) |
| `configs/recording-policy/` | Recording artifact retention and lifecycle thresholds (`platform-default.json`) |
| `configs/provider-schemas/` | Provider admin schemas and capability declarations |
| `sdks/` | SDK generation workspaces and route manifests |
| `apps/` | Runnable client application roots |

App packages live under `apps/<app-root>/packages/` — never at repository root.

## 5. API, SDK, And Data Ownership

### HTTP envelope (mandatory)

All L2+ app-api and backend-api success bodies use `SdkWorkApiResponse`:

```json
{ "code": 0, "data": { "item": {} }, "traceId": "<uuid>" }
```

Errors use HTTP 4xx/5xx with `application/problem+json` (`ProblemDetail`, numeric `code`, `traceId`).

Legacy envelopes (`RtcApiResult`, `*ApiResult`, bare root DTOs) are forbidden.

### SDK consumption

- Server: route manifests → `sdkwork-web-contract` code generation
- Clients: `sdkwork-rtc-app-sdk` / `sdkwork-rtc-backend-sdk` generated TypeScript; envelope helpers in core packages

### Drive integration

Recording artifacts import through `sdkwork-drive-workspace-service` uploader. Persistence stores `RtcDriveReference` (`spaceType: "rtc"`), not vendor object keys.

## 6. Security, Privacy, And Observability

- Authentication: `sdkwork-iam-web-adapter` + `WebRequestContext` (no custom route middleware)
- Rate limiting: declared per route in route manifests (`rateLimitTier`, idempotency on mutations)
- Session storage: app-scoped keys (`sdkwork-rtc-pc:session:v1`, etc.)
- Webhook ingress: backend-api with `openApiDefault` tier
- Health: `/healthz`; metrics: `/metrics`; database readiness when pool configured

## 7. Deployment And Runtime Topology

Topology spec: `specs/topology.spec.json` (archetype `application-http-gateway`).

| Profile | Use case |
| --- | --- |
| `standalone.split-services` | Local dev, on-prem appliance (systemd) |
| `cloud.split-services` | Platform API gateway + K8s |

Release artifacts: server tar.gz, container image (`ghcr.io/sdkwork/rtc-standalone-gateway`), cloud gateway config bundle.

Operator guide: [../../guides/operator/deployment.md](../../guides/operator/deployment.md).

## 8. Architecture Decision Index

| ID | Decision |
| --- | --- |
| ADR-RTC-001 | RTC authority separated from IM signaling |
| ADR-RTC-002 | Provider plugins under `plugins/`, not service crate deps |
| ADR-RTC-003 | File artifacts via Drive, not RTC upload APIs |
| ADR-RTC-004 | Defer discovery until RPC services exist |

Detailed shards linked in Document Map above.

## 9. Verification

```powershell
pnpm run verify
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .
node ../sdkwork-specs/tools/check-database-framework-standard.mjs --root .
cargo test --workspace
```

Component spec verification list: `specs/component.spec.json`.
