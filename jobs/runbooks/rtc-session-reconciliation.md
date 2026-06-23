# RTC Session Reconciliation Runbook

## Purpose

Detect and heal operational drift between IM call state and RTC media sessions, and close stale `Active` sessions that exceeded provider TTL.

## Checks

1. **Stale Active sessions** — `rtc_media_session.status = Active` with `started_at` older than provider profile TTL + grace window.
2. **Orphan provider rooms** — provider session exists without matching RTC row (requires provider active query).
3. **Ended IM call / Active RTC** — when IM reports call ended but RTC session is still `Active` (IM owns signaling; RTC owns media data per `docs/rtc-im-boundary.md`).

## Actions

- Transition stale sessions to `Closing`, persist, then invoke backend close with reason `reconcile:{session_id}:{date}`.
- Query provider `MediaSessionState` for active sessions when profile supports `active_query`; close drift with `ProviderStateSync`.
- Compensate `Failed` sessions that still hold provider session ids by calling provider close.
- Emit observability events per `sdkwork-specs/OBSERVABILITY_SPEC.md`.
- Never delete rows; append completion records and audit facts.

## Worker implementation

Rust worker crate: `crates/sdkwork-communication-rtc-worker/` exposes `RtcWorker::run_job(RtcWorkerJob::SessionReconciliation)`, which runs stale TTL close, provider drift sync, and failed-session compensation in one pass.
