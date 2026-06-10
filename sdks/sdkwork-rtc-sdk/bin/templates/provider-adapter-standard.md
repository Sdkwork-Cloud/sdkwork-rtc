# RTC Provider Adapter Standard

This document defines the official provider adapter standard for `sdkwork-rtc-sdk`.

## JDBC-Style Model

Provider integration follows a JDBC-like runtime model:

- `RtcProviderDriver`
- `RtcDriverManager`
- `RtcDataSource`
- `RtcClient`
- `RtcProviderMetadata`
- `RtcSdkException`
- `unwrap()`

## Adapter Responsibilities

Provider adapters own:

- native client factory integration
- provider metadata mapping onto the standard catalog entry
- stable media runtime method delegation
- provider-native `unwrap()` support
- capability metadata exposure through assembly-driven catalogs

Provider adapters do not own:

- business provider selection policy beyond consuming the resolved provider key
- provider registry governance
- user invite lifecycle
- conversation delivery
- authenticated application websocket workflow
- fake provider-neutral media engine behavior

## Runtime Surface

The stable provider-neutral media runtime surface is:

- `join(options)`
- `leave()`
- `publish(options)`
- `unpublish(trackId)`
- `startScreenShare(options)`
- `stopScreenShare(trackId)`
- `muteAudio(muted?)`
- `muteVideo(muted?)`

Adapters bind those methods through a consumer-supplied native provider runtime. If the native
runtime is missing, the SDK must fail with `native_sdk_not_available` instead of pretending the
operation succeeded.

## Selection And Support

Provider selection is standardized through the assembly-driven selection contract:

- provider URL
- provider key
- tenant override
- deployment profile
- default provider

Provider support status is standardized as:

- `builtin_registered`
- `official_registered`
- `official_unregistered`
- `unknown`

Adapters consume these contracts and must not redefine their own precedence or status vocabulary.

## Immutability

Assembly-driven metadata and runtime-created standard contract objects must be immutable snapshots.
Runtime controller contexts are shallow immutable while preserving mutable native provider handles.

## Provider Packages

Provider package modules must expose a stable package-aware adapter contract:

- provider metadata
- driver factory
- module symbol
- runtime bridge status
- capability metadata
- package lifecycle status

Vendor SDKs are consumer supplied. Provider packages must not bundle official vendor SDK engines.
