# RTC recording artifact lifecycle policy

Status: active  
Owner: SDKWork maintainers

## Purpose

Platform-default retention and deletion thresholds for Drive-backed RTC media artifacts (`rtc_media_artifact`).

Authority for reconcile workers: `sdkwork-rtc-reconcile` reads this manifest unless overridden by `SDKWORK_RTC_RECORDING_POLICY_PATH`.

## Fields

| Field | Meaning |
| --- | --- |
| `readyRetentionDays` | Artifacts stay `ready` while younger than this age (from `endedAt`, else `startedAt`). |
| `softDeleteAfterDays` | Older `ready`/`failed` artifacts transition to `deleted` status (metadata retained). |
| `hardDeleteAfterDays` | Older `deleted` artifacts invoke the hard-delete port (Drive purge when configured). |

## Verification

- `cargo test -p sdkwork-communication-rtc-service recording_policy`
- `pnpm run test:workspace-standard` (recording policy manifest test)
