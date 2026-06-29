# RTC Architecture Roadmap

Status: active  
Owner: SDKWork maintainers  
Updated: 2026-06-29  
Scope: **sdkwork-rtc authority workspace only**

Cross-repository work (IM provider decoupling, call signaling) belongs in `sdkwork-im`. See [rtc-im-boundary.md](rtc-im-boundary.md).

## Current baseline (production-ready)

The following are implemented and verified by `pnpm run verify`:

- SDKWork workspace directory dictionary and component specs
- HTTP APIs with `SdkWorkApiResponse` / `ProblemDetail` envelopes
- `sdkwork-web-framework`, `sdkwork-database`, `sdkwork-utils`, `sdkwork-drive` integration
- Route manifests with `WebRequestContext`, rate limits, and idempotency
- Client surfaces (PC, H5, Flutter, mini program) consuming generated SDKs
- Deployment manifests (K8s, Docker, systemd), reconcile job, packaging workflow
- RTC-only provider plugin boundary (no IM signaling in this repo)

## Remaining RTC-scoped improvements

| Priority | Item | Rationale |
| --- | --- | --- |
| P3 | Live streaming capability dimensions (`cdn-relay`, audience) | First-class CDN/audience types on provider port |
| P4 | `sdkwork-discovery` | **Only when RPC services are introduced** |

## Completed in this workspace (2026-06-29)

- `sdkwork-communication-rtc-service` modularized: `lib.rs` is a thin assembly root; domain, provider, and time modules own contract types and ports.
- Provider registry defaults externalized to `configs/provider-registry/platform-default.json`; runtime bootstrap reads the same manifest via `platform_default_provider_kinds()`.
- `sdkwork-rtc-plugin-bootstrap` crate wires adapter factories from the manifest; `sdkwork-rtc-service-host` stays adapter-free.
- Shared provider plugin helpers live in `sdkwork-communication-rtc-service`: `provider_webhook_parse.rs`, `provider_recording_export.rs`, and `plugin_descriptor_from_provider_schema()`; capability authority is `configs/provider-schemas/*.json` (not duplicated Rust constants).
- `RtcRecordingPolicy` port, `configs/recording-policy/platform-default.json`, and reconcile integration soft-delete aged artifacts; hard-delete uses optional `RtcRecordingArtifactHardDeletePort` (Drive purge when wired).

## Explicitly out of scope here

- IM `VolcengineRtcProvider` direct construction → track in `sdkwork-im`
- IM domain-core `RtcContractError` coupling → track in `sdkwork-im`
- Call workflow UI or `/im/v3/api/calls/*` routes

## Verification gate for each roadmap item

1. `cargo test --workspace`
2. `pnpm run verify`
3. `node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .`
4. Update this document and [architecture/tech/TECH_ARCHITECTURE.md](architecture/tech/TECH_ARCHITECTURE.md) when the item ships
