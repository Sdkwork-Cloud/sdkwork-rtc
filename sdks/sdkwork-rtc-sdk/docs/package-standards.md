# RTC SDK Package Standards

This document defines package rules for `sdks/sdkwork-rtc-sdk`.

## Ownership

`sdkwork-rtc-sdk` owns provider/media runtime contracts. It does not own app workflow endpoints,
conversation delivery, authenticated application websocket login, invite lifecycle, or business
session state.

Consumers that need business workflow must integrate the owning IM SDK facade and pass provider
room, participant, and credential inputs into this SDK.

## TypeScript Package

The TypeScript package is `@sdkwork/rtc-sdk`.

Rules:

- root exports are stable provider-neutral media runtime APIs, catalogs, loader contracts, manager
  contracts, data source contracts, and provider SPI only
- provider-neutral contracts live under `src/**`
- concrete provider adapters live in provider plugin packages under `providers/**`
- provider catalogs, capability catalogs, provider extension catalogs, provider activation catalogs,
  and language workspace catalogs are assembly-driven
- provider selection and provider support stay first-class helper modules
- runtime surface methods are `join`, `leave`, `publish`, `unpublish`, `startScreenShare`,
  `stopScreenShare`, `muteAudio`, and `muteVideo`
- provider package loading accepts caller-supplied import functions instead of scanning local
  filesystems
- runtime-created metadata and standard contract objects are immutable snapshots
- vendor SDKs are consumer supplied by provider plugin packages and must not be bundled by the root
  standard package

## Flutter Package

The Flutter package is `rtc_sdk`.

Rules:

- the root package is provider-neutral; provider plugins own native bridge dependencies
- `RtcDataSource` and `RtcDriverManager` remain provider-neutral
- provider package and metadata catalogs follow the assembly
- root exports must remain media-runtime oriented
- reserved providers stay metadata-only until their runtime bridge is verified

## Reserved Languages

Rust, Java, C#, Swift, Kotlin, Go, and Python workspaces are scaffolded standards. They may expose
catalogs, metadata, provider selection, provider support, provider package loader contracts, and
lookup helpers, but must not claim executable media runtime support before verification exists.

## Provider Package Boundary

Provider package boundaries must declare:

- provider key
- package identity
- manifest and README path
- source path and source symbol
- runtime bridge status
- root-public policy
- lifecycle status
- required and optional capability metadata

No provider package is root-public from the root SDK. Built-in provider metadata may remain in the
root catalog, but executable provider factories, provider modules, vendor SDK dependencies, and
runtime bridge code must live in provider plugin packages and be installed explicitly.

## Verification

Package changes must be verified with:

```powershell
node .\bin\materialize-sdk.mjs
node .\test\verify-sdk-automation.test.mjs
node .\bin\verify-sdk.mjs
node .\bin\smoke-sdk.mjs
```
