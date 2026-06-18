# RTC ↔ IM Boundary

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

## Recording And Drive

RTC stores recording **metadata** and canonical Drive references in RTC business tables. Binary recording files are stored through `sdkwork-drive`:

- RTC persists `RtcDriveReference` (`drive://spaces/{space_id}/nodes/{node_id}`)
- Provider adapters export artifacts; RTC normalizes them into Drive-backed `RtcMediaArtifact` records
- RTC tables do not persist provider bucket keys, presigned URLs, or raw object storage secrets

## Rust Integration (target)

`sdkwork-im` Rust runtime should consume **live** `sdkwork-rtc` paths:

```toml
# sdkwork-im/Cargo.toml [workspace.dependencies] — target layout
sdkwork-communication-rtc-service = { path = "../sdkwork-rtc/crates/sdkwork-communication-rtc-service" }
sdkwork-rtc-adapter-volcengine = { path = "../sdkwork-rtc/plugins/rtc-volcengine" }
# ... other plugins under ../sdkwork-rtc/plugins/rtc-*
```

Forbidden in IM workspace:

- `../sdkwork-rtc-im-compat/*` as runtime authority
- `sdkwork-rtc-core` from legacy compat layout
- `sdkwork-rtc-signaling-service` (signaling stays in IM)

## Migration Checklist (sdkwork-im)

When aligning a sibling `sdkwork-im` checkout:

1. Replace `../sdkwork-rtc-im-compat` Cargo paths with `../sdkwork-rtc/crates/` and `../sdkwork-rtc/plugins/`.
2. Migrate `sdkwork-rtc-core` usage to `sdkwork-communication-rtc-service`.
3. Remove `sdks/sdkwork-rtc-sdk` from IM; consume `../../../sdkwork-rtc/sdks/sdkwork-rtc-sdk` via pnpm workspace only.
4. Keep `CallService` on `@sdkwork/im-sdk` and `RtcMediaService` on `@sdkwork/rtc-sdk`.
5. Ensure gateway uses `services/sdkwork-im-gateway` and routes calls, not RTC app API.

## Verification

From `sdkwork-rtc` root:

```powershell
pnpm run audit:migration
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
