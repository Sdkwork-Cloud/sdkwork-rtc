> Migrated from `docs/rtc-im-boundary.md` on 2026-06-24.
> Owner: SDKWork maintainers

This document defines the dependency direction and responsibility split between `sdkwork-rtc` and `sdkwork-im`.

## Dependency Direction

```
sdkwork-im (signaling, call workflow)
        │
        │ depends on (one-way)
        ▼
sdkwork-rtc (providers, media runtime, call data, recordings)
        │
        │ persists recording artifacts via Drive references
        ▼
sdkwork-drive (file storage for recording artifacts)
```

**Rules**

| Rule | Owner |
|------|-------|
| `sdkwork-rtc` must **not** depend on `sdkwork-im` crates, SDKs, APIs, or signaling tables | `sdkwork-rtc` |
| `sdkwork-im` may depend on `sdkwork-rtc` Rust crates, provider plugins, and `@sdkwork/rtc-sdk` | `sdkwork-im` |
| RTC authority (OpenAPI, route manifests, provider plugins, backend admin API) lives only in `sdkwork-rtc` | `sdkwork-rtc` |
| Call invitation, ringing, accept/reject/end, participant call lifecycle, and WebSocket call workflow live only in `sdkwork-im` | `sdkwork-im` |

There is no reverse dependency. If RTC code imports IM contracts or IM routes expose RTC provider authority, that is a boundary violation.

## Responsibility Split

### sdkwork-rtc owns

- All RTC provider encapsulation (`plugins/rtc-*`, `RtcProviderPort`)
- Media session lifecycle: rooms, media sessions, participants, credentials, tracks
- Provider webhooks, health, and active-provider query normalization
- Call **data** persistence: rooms, sessions, participants, quality samples, recording metadata
- Recording artifact export and **Drive-backed** storage references (`RtcDriveReference`, `RtcMediaArtifact`)
- App API: `/app/v3/api/rtc/*`
- Backend admin API: `/backend/v3/api/rtc/*`
- SDK families: `sdkwork-rtc-sdk`, `sdkwork-rtc-app-sdk`, `sdkwork-rtc-backend-sdk`

### sdkwork-im owns

- Call **signaling** and conversation-integrated call workflow
- IM API: `/im/v3/api/calls/*` (start, invite, watch, accept, reject, end, retrieve)
- IM call state store and WebSocket business protocol for calls
- Orchestration: IM call service issues participant credentials through IM calls API, then delegates media join/publish to `@sdkwork/rtc-sdk`

### sdkwork-rtc does **not** own

- Signaling routes (`/signals`, invitations, ringing state machines)
- WebSocket call subprotocols tied to IM conversation flow
- IM message or conversation APIs
- `/im/v3/api/rtc/*` or any RTC authority under IM API prefixes

### sdkwork-im does **not** own

- RTC provider plugin source (`plugins/rtc-*`)
- RTC OpenAPI / route manifest authority
- Duplicate `sdks/sdkwork-rtc-sdk` workspace inside IM
- Pinned shadow checkouts such as `sdkwork-rtc-im-compat` for long-term runtime use

## Client Integration Pattern

IM PC app (`sdkwork-im-pc`) follows this split:

| Layer | Service | SDK / API |
|-------|---------|-----------|
| Signaling | `CallService.ts` | `@sdkwork/im-sdk` → `.calls.*` |
| Media | `RtcMediaService.ts` | `@sdkwork/rtc-sdk` → join, publish, mute |

Signaling must not import `@sdkwork/rtc-sdk`. Media must not re-implement call invite/accept/reject through RTC app APIs.

## API Ownership

| Concern | API prefix | Authority repo |
|---------|------------|----------------|
| Call signaling | `/im/v3/api/calls/*` | `sdkwork-im` |
| Media runtime | `/app/v3/api/rtc/*` | `sdkwork-rtc` |
| Provider admin | `/backend/v3/api/rtc/*` | `sdkwork-rtc` |

IM gateway proxies `/im/v3/api/calls/{*path}` only. It must **not** proxy `/app/v3/api/rtc/{*path}` as IM-owned surface.

## Cross-System Consistency

| Concern | Owner | Contract |
|---------|-------|------------|
| Shared media session identity | IM + RTC | IM call workflow passes stable `mediaSessionId` from RTC create response; retries use the same idempotency key (`Idempotency-Key` / `x-idempotency-key`) on `rtc.mediaSessions.create`. |
| Restart / multi-instance | RTC | RTC hydrates persisted media sessions from DB on bootstrap; in-memory state is a cache, not authority. |
| Ended call / active media | Reconciliation | IM `calls.end` is signaling truth; RTC `media_sessions.close` is media truth. `jobs/runbooks/rtc-session-reconciliation.md` heals drift. |
| Provider vs DB ordering | RTC | Provider side effects run after RTC persistence succeeds, or are compensated by reconciliation jobs. |

## Recording And Drive

RTC stores recording **metadata** and canonical Drive references in RTC business tables. Binary recording files are stored through `sdkwork-drive`:

- RTC persists `RtcDriveReference` (`drive://spaces/{space_id}/nodes/{node_id}`)
- Provider adapters export artifacts; RTC normalizes them into Drive-backed `RtcMediaArtifact` records
- RTC tables do not persist provider bucket keys, presigned URLs, or raw object storage secrets

## Rust Integration

`sdkwork-im` Rust runtime consumes **live** `sdkwork-rtc` paths:

```toml
# sdkwork-im/Cargo.toml [workspace.dependencies]
sdkwork-communication-rtc-service = { path = "../sdkwork-rtc/crates/sdkwork-communication-rtc-service" }
sdkwork-rtc-adapter-volcengine = { path = "../sdkwork-rtc/plugins/rtc-volcengine" }
# ... other plugins under ../sdkwork-rtc/plugins/rtc-*
```

Forbidden in IM workspace:

- `../sdkwork-rtc-im-compat/*` as runtime authority
- Legacy crate name `sdkwork-rtc-core` (use `sdkwork-communication-rtc-service`)
- `sdkwork-rtc-signaling-service` (signaling stays in IM)

## IM alignment checklist (sibling repository)

When verifying a `sdkwork-im` checkout against this boundary:

1. Cargo paths point to `../sdkwork-rtc/crates/` and `../sdkwork-rtc/plugins/` (not compat shims).
2. Domain code uses `sdkwork-communication-rtc-service`, not `sdkwork-rtc-core`.
3. IM does not host a duplicate `sdks/sdkwork-rtc-sdk` authority; consume the RTC workspace SDK family.
4. `CallService` stays on `@sdkwork/im-sdk`; `RtcMediaService` stays on `@sdkwork/rtc-sdk`.
5. IM gateway routes `/im/v3/api/calls/*` only, not `/app/v3/api/rtc/*`.

## Verification

From `sdkwork-rtc` root:

```powershell
pnpm run test:contract:migration
```

Relevant contract tests:

- `sdkwork-rtc Rust services do not depend back on sdkwork-im crates`
- `sdkwork-rtc SDK does not depend on the IM SDK for signaling`
- `sdkwork-im PC app consumes the RTC SDK from sdkwork-rtc`
- `sdkwork-im Rust runtime consumes RTC media/provider crates but not RTC signaling service`
- `sdkwork-im no longer owns the RTC SDK workspace source`

## Related Specs

- `../sdkwork-specs/DOMAIN_SPEC.md`
- `../sdkwork-specs/API_SPEC.md`
- `../sdkwork-specs/INTEGRATION_SPEC.md`
- `docs/superpowers/plans/2026-06-06-sdkwork-rtc-authority-migration.md`

