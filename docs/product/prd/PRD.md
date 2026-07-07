# RTC PRD

Status: active  
Owner: SDKWork maintainers  
Application: rtc  
Updated: 2026-07-07  
Specs: `../../sdkwork-specs/REQUIREMENTS_SPEC.md`, `../../sdkwork-specs/DOCUMENTATION_SPEC.md`

## 1. Background And Problem

SDKWork RTC is the media runtime authority: rooms, media sessions, provider credentials, recording artifacts, and operator control-plane APIs. IM call signaling remains in `sdkwork-im`.

## 2. Target Users

- **Tenant operators** — configure RTC providers, credentials, routes, and webhooks via backend admin.
- **End users** — join media sessions from PC, H5, Flutter, or WeChat mini program clients.
- **Platform integrators** — consume `@sdkwork/rtc-app-sdk` / `@sdkwork/rtc-backend-sdk` without raw HTTP.

## 3. Goals And Non-Goals

**Goals**

- Production-grade HTTP APIs (`/app|backend/v3/api/rtc/*`) with SdkWork v3 envelopes and SQL-backed pagination.
- Multi-provider plugin runtime (Volcengine, Tencent, Agora, Aliyun, LiveKit).
- PostgreSQL canonical persistence with SQLite for local development.

**Non-goals**

- IM call signaling (`/im/v3/api/calls/*`).
- Direct multipart upload endpoints (recordings use Drive references).

## 4. Scope

| In scope | Out of scope |
| --- | --- |
| Media sessions, rooms, credentials, artifacts | IM signaling |
| Provider registry, webhooks, query jobs | Vendor bucket URLs in persistence |
| Runnable client surfaces under `apps/` | Legacy API envelopes |

## 5. User Scenarios

1. Operator provisions provider account → application → credentials → active profile.
2. User authenticates via IAM, creates or joins a media session, receives provider credential.
3. Operator lists rooms, webhook events, and recording artifacts with server-side pagination (offset or cursor per API).

## 6. Success Metrics

- All list APIs bounded to O(page size) at SQL layer.
- Gateway production profile: rate limits, circuit breakers, metrics enabled.
- `pnpm run verify` and `cargo test --workspace` green on release branches.

## 7. Phases

| Phase | Deliverable | Status |
| --- | --- | --- |
| P0 | API envelope + SQL pagination + bounded persistence hydrate | Done |
| P0 | PostgreSQL/SQLite lifecycle parity (18 tables) | Done |
| P0 | Fail-closed provider credentials in non-dev | Done |
| P0 | DB read-through retrieve + optimistic locking on media sessions | Done |
| P0 | Atomic idempotency for media session create and credential issue | Done |
| P1 | DB-driven reconciliation worker (`sdkwork-rtc-reconcile`) | Done |
| P1 | App context signature enforcement in production | Done |
| P1 | Mini program credential-backed media join | Done |
| P1 | Admin server-side paginated lists + room filters (PC/H5/Flutter) | Done |
| P1 | Bounded startup hydration (rooms, webhooks, query jobs/snapshots, idempotency, token grants) | Done |
| P1 | Token grant lifecycle (atomic revoke, participant re-issue, idempotency retry) | Done |
| P1 | Client SDK v3 envelope alignment + admin `/admin/rooms` UX | Done |
| P1 | E2E call flow tests, client observability | Active |
| P2 | Live streaming UI | Planned |

## 8. Linked Requirements

- `docs/architecture/tech/TECH_ARCHITECTURE.md`
- `docs/rtc-im-boundary.md`
- `docs/guides/operator/deployment.md`

## 9. Open Questions

- **Admin IAM surface timeline.** End-user app clients (PC, H5, Flutter) authenticate via IAM OAuth callback (`iamRuntime`). Backend admin surfaces (PC, H5, Flutter) still use a manual dual-token gate (`AuthGate` / `admin_auth.dart`) with `accessToken` + `authToken` in app session storage — no first-class admin IAM login from `sdkwork-iam` yet. Timeline depends on platform admin SDK availability and cross-app IAM session federation. Until then, operators paste backend tokens manually or load deployment presets.
