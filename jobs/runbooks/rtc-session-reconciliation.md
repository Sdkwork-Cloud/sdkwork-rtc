# RTC Session Reconciliation Runbook

## Purpose

Detect and heal operational drift between IM call state and RTC media sessions, and close stale `Active` sessions that exceeded provider TTL.

## Checks

1. **Stale Active sessions** — `rtc_media_session.status = Active` with `started_at` older than provider profile TTL + grace window.
2. **Orphan provider rooms** — provider session exists without matching RTC row (requires provider active query).
3. **Ended IM call / Active RTC** — IM `calls.end` is signaling truth; RTC `media_sessions.close` is media truth. RTC worker does **not** call IM APIs (see `docs/rtc-im-boundary.md`). Cross-service healing is owned by `sdkwork-im` orchestration or platform jobs that invoke RTC close after IM end.

## Actions

- Transition stale sessions to `Closing`, persist, then invoke backend close with reason `reconcile:{session_id}:{date}`.
- Query provider `MediaSessionState` for active sessions when profile supports `active_query`; close drift with `ProviderStateSync`.
- Compensate `Failed` sessions that still hold provider session ids by calling provider close.
- Emit observability events per `sdkwork-specs/OBSERVABILITY_SPEC.md`.
- Never delete rows; append completion records and audit facts.

## Worker implementation

Runnable binary: `sdkwork-rtc-reconcile` (`crates/sdkwork-rtc-standalone-gateway/src/bin/reconcile.rs`).

Library crate: `crates/sdkwork-communication-rtc-worker/` exposes `RtcWorker::run_job(RtcWorkerJob::SessionReconciliation)`, which runs stale TTL close, provider drift sync, and failed-session compensation in one pass.

Hydration:

- Discovers tenant scopes from `rtc_media_session` rows in `Preparing`, `Active`, `Closing`, or `Failed` status.
- Optional override: `SDKWORK_RTC_RECONCILE_TENANT_SCOPES=tenant:org,tenant:org`.
