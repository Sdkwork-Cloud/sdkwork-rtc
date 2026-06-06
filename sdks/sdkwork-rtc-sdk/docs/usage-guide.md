# SDKWork RTC SDK Usage Guide

This document is the entrypoint for adopting `sdkwork-rtc-sdk`.

It focuses on the standardized provider model, current runnable baselines, default `volcengine`
selection contract, and the recommended runtime-specific guides.

## 1. Positioning

`sdkwork-rtc-sdk` is not a reimplementation of vendor media engines.

Its responsibility is to provide one provider-neutral RTC standard:

- JDBC-style `DriverManager` / `DataSource` / `Client` contracts
- standardized provider selection and default-provider resolution
- standardized capability negotiation, error semantics, and extension metadata
- pluggable provider integration through official catalogs and package boundaries
- one consistent runtime surface across web, mobile, and future language workspaces

The standard intentionally keeps vendor SDK ownership on the application side:

- official vendor SDKs remain consumer-supplied
- `sdkwork-rtc-sdk` provides the standard contracts and adapter boundaries
- runtime bridges map vendor behavior into the standard surface instead of hiding vendor engines

## 2. Official Providers

The current official provider catalog is:

| Provider key | Display name | Tier | Builtin | Current role |
| --- | --- | --- | --- | --- |
| `volcengine` | Volcengine RTC | `tier-a` | `true` | default provider and current runnable baseline across `TypeScript` and `Flutter` executable workspaces |
| `aliyun` | Aliyun RTC | `tier-a` | `true` | official builtin catalog entry; runtime activation remains language-matrix driven |
| `tencent` | Tencent RTC | `tier-a` | `true` | official builtin catalog entry; runtime activation remains language-matrix driven |
| `agora` | Agora RTC | `tier-a` | `true` | official builtin catalog entry; runtime activation remains language-matrix driven |
| `zego` | ZEGO RTC | `tier-b` | `false` | official package-boundary target |
| `livekit` | LiveKit RTC | `tier-a` | `true` | official builtin catalog entry; runtime activation remains language-matrix driven |
| `twilio` | Twilio Video | `tier-b` | `false` | official package-boundary target |
| `jitsi` | Jitsi Meet | `tier-b` | `false` | official package-boundary target |
| `janus` | Janus RTC | `tier-c` | `false` | future SPI target |
| `mediasoup` | mediasoup RTC | `tier-c` | `false` | future SPI target |

Notes:

- `builtin = true` means the provider is part of the official assembly-driven builtin catalog
- builtin does not mean the vendor runtime is bundled into every language workspace
- non-default providers still follow the same provider metadata, capability, and activation rules

## 3. Language Status

Current language workspace status:

| Language | Workspace | Public package | Maturity | Runtime bridge | Current role |
| --- | --- | --- | --- | --- | --- |
| TypeScript | `sdkwork-rtc-sdk-typescript` | `@sdkwork/rtc-sdk` | `reference` | yes | Executable reference implementation |
| Flutter | `sdkwork-rtc-sdk-flutter` | `rtc_sdk` | `reference` | yes | Executable mobile runtime baseline |
| Rust | `sdkwork-rtc-sdk-rust` | `rtc_sdk` | `reserved` | no | Reserved workspace skeleton |
| Java | `sdkwork-rtc-sdk-java` | `com.sdkwork:rtc-sdk` | `reserved` | no | Reserved workspace skeleton |
| C# | `sdkwork-rtc-sdk-csharp` | `Sdkwork.Rtc.Sdk` | `reserved` | no | Reserved workspace skeleton |
| Swift | `sdkwork-rtc-sdk-swift` | `RtcSdk` | `reserved` | no | Reserved workspace skeleton |
| Kotlin | `sdkwork-rtc-sdk-kotlin` | `com.sdkwork:rtc-sdk` | `reserved` | no | Reserved workspace skeleton |
| Go | `sdkwork-rtc-sdk-go` | `github.com/sdkwork/rtc-sdk` | `reserved` | no | Reserved workspace skeleton |
| Python | `sdkwork-rtc-sdk-python` | `sdkwork-rtc-sdk` | `reserved` | no | Reserved workspace skeleton |

Current conclusion:

- TypeScript is the executable web/browser baseline
- Flutter is the executable mobile baseline
- current runnable baselines default to `volcengine`
- remaining languages preserve standardized metadata, provider selection, lookup helpers, and
  package-boundary scaffolds for future runtime-bridge landings

## 4. Default Provider Contract

The default provider remains `volcengine`.

Canonical defaults:

- `DEFAULT_RTC_PROVIDER_KEY = 'volcengine'`
- `DEFAULT_RTC_PROVIDER_PLUGIN_ID = 'rtc-volcengine'`
- `DEFAULT_RTC_PROVIDER_DRIVER_ID = 'sdkwork-rtc-driver-volcengine'`

Provider selection precedence remains:

1. `providerUrl`
2. `providerKey`
3. `tenantOverrideProviderKey`
4. `deploymentProfileProviderKey`
5. `defaultProvider`

That means the web/browser and mobile baselines fall back to `volcengine` when the caller does not explicitly override provider selection.

## 5. Runnable Baselines

### TypeScript / Web

TypeScript is the executable web/browser baseline.

The current web/browser runtime path is:

- standard package: `@sdkwork/rtc-sdk`
- default provider: `volcengine`
- vendor SDK package: `@volcengine/rtc`
- vendor SDK import path: `@volcengine/rtc`
- signaling SDK package: `@sdkwork/rtc-sdk`
- signaling SDK import path: `@sdkwork/rtc-sdk`
- signaling live receive path: RTC transport/liveConnection over WebSocket
- standard call/session entrypoint: `StandardRtcCallController`
- recommended quick-start entrypoint: `createStandardRtcCallControllerStack`
- smoke command: `node ./bin/sdk-call-smoke.mjs --json`
- smoke mode: `runtime-backed`
- smoke variants: `default` and `reuse-live-connection`

Use the detailed guide here:

- [`docs/typescript-volcengine-signaling-usage.md`](./typescript-volcengine-signaling-usage.md)

### Flutter / Mobile

Flutter is the executable mobile baseline.

The current mobile runtime path is:

- standard package: `rtc_sdk`
- default provider: `volcengine`
- vendor SDK package: `volc_engine_rtc`
- vendor SDK import path: `package:volc_engine_rtc/volc_engine_rtc.dart`
- signaling SDK package: `rtc_sdk`
- signaling SDK import path: `package:rtc_sdk/rtc_sdk.dart`
- signaling live receive path: RTC transport/liveConnection over WebSocket
- standard call/session entrypoint: `StandardRtcCallController`
- recommended quick-start entrypoint: `createStandardRtcCallControllerStack`
- smoke command: `node ./bin/sdk-call-smoke.mjs --json`
- smoke mode: `analysis-backed`
- smoke variants: `default` and `reuse-live-connection`

Use the detailed guide here:

- [`docs/flutter-volcengine-signaling-usage.md`](./flutter-volcengine-signaling-usage.md)

## 6. Standard Integration Boundary

The correct vendor integration boundary is still the same:

- `sdkwork-rtc-sdk` owns the standard contracts and provider-neutral runtime surface
- the vendor SDK owns real media behavior
- the application wires vendor SDK instances into the standard driver/runtime-controller boundary
- signaling adapters map application-supplied RTC transport semantics into the RTC call/session standard
- executable baselines keep signaling WebSocket-first through RTC transport/liveConnection; the RTC standard
  does not expose polling controls
- executable baselines surface WebSocket auth policy through `connectOptions.webSocketAuth`
- executable baselines can reuse one app-owned RTC live connection through `liveConnection`
  instead of opening a second RTC-specific socket

For the current runnable baselines, this boundary is already materialized:

- TypeScript binds the standard surface to the official `@volcengine/rtc` runtime bridge
- Flutter binds the standard surface to the official `package:volc_engine_rtc/volc_engine_rtc.dart` runtime bridge
- executable baselines compose RTC-owned signaling through `@sdkwork/rtc-sdk`, `package:rtc_sdk/rtc_sdk.dart`
- executable baselines publish call invites over conversation-scoped RTC signals and reconcile remote
  accept, reject, end, SDP, and ICE events through the standard `CallController`

## 7. WebSocket Signaling And Auth Standard

Executable baselines keep RTC signaling on the RTC live WebSocket path and never expose polling
fallback controls.

The assembly-driven `signalingTransportStandard` is materialized into
`sdkwork-rtc-sdk-typescript/src/signaling-transport.ts`, the Flutter root-public module
`sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart`, and the root-public
`RTC_SIGNALING_TRANSPORT_STANDARD` plus `rtcSignalingTransportStandard` contracts.

Cross-language rules:

- RTC `deviceId` is top-level and authoritative across the standard stack
- `connectOptions.deviceId` stays optional and must match the top-level `deviceId` when both
  are supplied
- `connectOptions.webSocketAuth` is passed through the caller-supplied RTC signaling adapter;
  RTC does not introduce provider-specific auth shims
- standard auth modes are `automatic`, `queryBearer`, `headerBearer`, and `none`
- `automatic` remains the recommended default; browser WebSocket paths can resolve to
  query-bearer while native or custom-socket paths can resolve to header-bearer when headers are
  available
- prefer `credentialProvider` with short-lived realtime tickets instead of long-lived access
  tokens, especially when query-parameter auth is required
- if the application already owns one shared RTC live connection, pass `liveConnection`; RTC keeps
  subscription sync on that same socket instead of opening a second connection
- auth failure should fail fast on the WebSocket connect path; the RTC standard does not downgrade
  to polling


## 8. Non-Builtin Provider Packages

For providers such as `zego`, `twilio`, `jitsi`, `janus`, `mediasoup`,
the standard path is package-boundary integration instead of deep root-entrypoint coupling.

That contract stays:

- official provider metadata remains assembly-driven
- package identity, manifest path, README path, and source symbol stay standardized
- runtime code is loaded through the provider-package loader SPI
- runtime bridge ownership stays with the integrating application or provider package

## 9. Error Semantics

Important standardized error codes include:

- `invalid_provider_url`
- `driver_not_found`
- `provider_not_supported`
- `provider_package_not_found`
- `provider_package_identity_mismatch`
- `provider_package_load_failed`
- `provider_module_export_missing`
- `provider_module_contract_mismatch`
- `provider_metadata_mismatch`
- `native_sdk_not_available`
- `signaling_not_available`
- `call_state_invalid`
- `vendor_error`

The two most important runtime distinctions are:

- `provider_not_supported`: the provider exists in the official catalog but no runnable driver is
  registered in the current runtime
- `native_sdk_not_available`: the standard surface exists but the actual vendor runtime bridge is
  missing or misconfigured

## 10. Local Verification

Use the following commands in the workspace root:

```powershell
node .\bin\materialize-sdk.mjs
node .\test\verify-sdk-automation.test.mjs
node .\bin\verify-sdk.mjs
node .\bin\sdk-call-smoke.mjs --json
node .\bin\sdk-call-smoke.mjs --json --reuse-live-connection
node .\bin\sdk-call-smoke.mjs --language flutter --json
node .\bin\sdk-call-smoke.mjs --language flutter --json --reuse-live-connection
node .\bin\smoke-sdk.mjs
```

Verification intent:

- `materialize-sdk.mjs` keeps generated catalogs, READMEs, matrices, and this usage guide aligned to the assembly
- `verify-sdk-automation.test.mjs` protects standard assets and materialization behavior
- `verify-sdk.mjs` validates assembly contracts and generated output
- TypeScript smoke mode is `runtime-backed`: `node ./bin/sdk-call-smoke.mjs --json` exercises the public default-provider baseline without live services
- Flutter smoke mode is `analysis-backed`: `node ./bin/sdk-call-smoke.mjs --json` currently verifies the public baseline through the Flutter CLI wrapper and `flutter analyze` because the official vendor runtime is not yet CLI-runnable through the Dart VM toolchain
- `smoke-sdk.mjs` runs the repository regression entrypoint, including
  the default and shared-`liveConnection` call-smoke variants for executable languages, plus
  `flutter analyze ./bin/sdk-call-smoke.dart` and `flutter analyze` when the Flutter toolchain
  is available

## 11. Practical Adoption Guidance

Use this rule of thumb:

- if you need the web/browser baseline, start from
  [`docs/typescript-volcengine-signaling-usage.md`](./typescript-volcengine-signaling-usage.md)
- if you need the mobile baseline, start from
  [`docs/flutter-volcengine-signaling-usage.md`](./flutter-volcengine-signaling-usage.md)
- if you need to understand the cross-language standard and provider package boundary model, read
  [`docs/package-standards.md`](./package-standards.md) and
  [`docs/provider-adapter-standard.md`](./provider-adapter-standard.md)

Current reality is straightforward:

- `volcengine` is the default provider
- executable language baselines are `typescript` and `flutter`
- the RTC signaling adapter is the standard path for invite discovery, RTC lifecycle, and WebRTC
  signal exchange in the current end-to-end call flow
- the remaining language workspaces stay standardized and extensible without pretending they are
  already executable runtimes
