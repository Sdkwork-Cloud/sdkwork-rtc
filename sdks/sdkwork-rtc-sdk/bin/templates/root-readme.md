# SDKWork RTC SDK Workspace

`sdkwork-rtc-sdk` is the provider-standard RTC media runtime workspace for SDKWork.

It is not an OpenAPI-generated HTTP SDK family. It owns provider-neutral media contracts,
provider catalogs, provider package loader contracts, capability negotiation, and language
scaffold standards.
Business conversation delivery, invite lifecycle, session state, and user workflow orchestration
belong to the owning IM SDK and service layer.

## Scope

This workspace owns:

- provider-neutral contracts: `RtcProviderDriver`, `RtcDriverManager`, `RtcDataSource`,
  `RtcClient`, `RtcProviderMetadata`, `RtcSdkException`, and `unwrap()`
- provider discovery, provider selection, provider support classification, and provider package
  lookup contracts
- provider capability metadata and capability negotiation status
- stable media runtime methods: `join`, `leave`, `publish`, `unpublish`, `startScreenShare`,
  `stopScreenShare`, `muteAudio`, and `muteVideo`
- runtime immutability rules for assembly-driven metadata and runtime context snapshots
- TypeScript and Flutter provider-plugin media runtime baselines
- reserved scaffold boundaries for Rust, Java, C#, Swift, Kotlin, Go, and Python
- documentation and verification assets generated from `.sdkwork-assembly.json`

This workspace does not own:

- app HTTP endpoints
- user invite workflows
- conversation delivery
- business lifecycle state
- token/session login for an application websocket
- provider media engine reimplementation

## Architecture

The current standard follows a JDBC-style provider model:

- `RtcProviderDriver`
- `RtcDriverManager`
- `RtcDataSource`
- `RtcClient`
- `RtcProviderMetadata`
- `RtcSdkException`
- `unwrap()`

Applications supply provider room identifiers, participant identifiers, and provider credentials
from their own authenticated domain flow. RTC SDK objects consume those inputs and drive media
runtime behavior through the selected provider adapter.

## Materialization

The root materializer keeps docs, catalog source files, workspace READMEs, and reserved-language
scaffolds aligned to `.sdkwork-assembly.json`:

```powershell
node .\bin\materialize-sdk.mjs
```

Generated and materialized files must be changed through the assembly or generator source, not by
editing generated output in place.

## Verification

Use these commands from the SDK family root:

```powershell
node .\bin\materialize-sdk.mjs
node .\test\verify-sdk-automation.test.mjs
node .\bin\verify-sdk.mjs
node .\bin\smoke-sdk.mjs
```

Fast runtime smoke commands:

{{RTC_FAST_RUNTIME_SMOKE_COMMANDS}}

Required runtime smoke steps:

{{RTC_REQUIRED_RUNTIME_SMOKE_STEPS}}

Optional runtime smoke steps:

{{RTC_OPTIONAL_RUNTIME_SMOKE_STEPS}}

## Current Runtime Baselines

- TypeScript: `@sdkwork/rtc-sdk` stays provider-neutral and loads concrete media runtime adapters
  through provider plugin packages such as `@sdkwork/rtc-sdk-provider-volcengine`.
- Flutter: `rtc_sdk` stays provider-neutral; provider-specific native bridges belong to plugin
  packages such as `rtc_sdk_provider_volcengine`.
- Reserved languages: catalog, provider package, provider selection, provider support, and loader
  scaffolds only until their runtime bridge is verified.

## Boundary Rule

RTC SDK package exports must stay media-runtime focused. If a consumer needs business call
workflow, it must integrate the owning IM SDK facade and pass only media-room inputs into this SDK.
