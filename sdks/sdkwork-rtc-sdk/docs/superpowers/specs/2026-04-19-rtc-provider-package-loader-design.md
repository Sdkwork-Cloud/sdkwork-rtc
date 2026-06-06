# RTC Provider Package Loader Design

## Summary

`sdkwork-rtc-sdk` already standardizes provider metadata, package boundaries, capability catalogs,
and module registration. The remaining gap is the plugin-loading layer between the assembly-driven
provider package catalog and runtime driver registration.

This design adds a first-class TypeScript reference SPI for provider package loading so official
provider packages can be discovered, loaded, and installed by standard contract instead of ad hoc
application code.

## Problem

The current TypeScript baseline supports:

- `RtcDriverManager`
- `RtcProviderModule`
- `registerRtcProviderModule(...)`
- `registerRtcProviderModules(...)`
- assembly-driven provider package metadata

What it does not standardize yet is the step between package metadata and registration:

- resolve provider package by `providerKey` or `packageIdentity`
- load the provider package through a caller-supplied loader
- resolve the required exported module symbol from the loaded package
- install one or many provider packages atomically

Without this layer, plugin loading is possible but not standardized.

## Goals

- Keep the JDBC-style split intact:
  - package discovery
  - package loading
  - driver registration
- Preserve package-boundary isolation for non-builtin providers.
- Support on-demand loading without bundling vendor SDKs.
- Keep the runtime agnostic:
  - no hard dependency on Node-only resolution
  - no hidden package scanning
- Make the package-loading flow machine-readable and verifiable.

## Non-Goals

- Re-implement vendor media engines.
- Introduce provider-specific business policy into the core SDK.
- Turn provider loading into implicit filesystem scanning.
- Add runtime bridges to reserved non-TypeScript workspaces in this round.

## Approaches Considered

### Option A: Keep only manual module registration

Pros:

- zero new API surface

Cons:

- plugin loading remains application-specific
- package-boundary standard stops one layer too early

### Option B: Add a standard provider package loader and installer SPI

Pros:

- directly matches the requested pluggable adapter model
- keeps package loading explicit and testable
- works for builtin and package-boundary providers
- preserves low coupling by requiring a caller-supplied loader

Cons:

- introduces a new public contract surface

### Option C: Put dynamic import logic directly into `RtcDriverManager`

Pros:

- convenient API

Cons:

- mixes registry responsibilities with package loading
- makes environment assumptions leak into the manager

## Decision

Choose Option B.

`RtcDriverManager` remains the registration and selection authority. A new provider package loader
SPI becomes the standard bridge between:

1. provider package catalog
2. runtime module loading
3. provider module registration

## Architecture

### New TypeScript Reference Module

Add `sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts`.

It owns:

- request resolution by `providerKey` and `packageIdentity`
- package-identity lookup against the materialized package catalog
- loader contract types
- package import helper factory
- provider-module export extraction
- single-package install
- batch package install

### Standard Loader Contract

The SDK will not scan the filesystem or assume Node resolution. Instead it will accept a
caller-supplied package loader function that receives the assembly-driven package entry.

That keeps the SPI usable in:

- Node
- browser bundlers
- desktop runtimes
- custom plugin hosts

### Standard Install Flow

The standard install path becomes:

1. Resolve package boundary from catalog.
2. Load package namespace through the caller-supplied loader.
3. Resolve the assembly-declared `moduleSymbol`.
4. Validate the provider module contract.
5. Register via existing `registerRtcProviderModule(...)` or
   `registerRtcProviderModules(...)`.

Batch install remains atomic by delegating to the existing batch registration contract.

## Public API Additions

The TypeScript reference baseline will expose:

- `RtcProviderPackageLoadRequest`
- `RtcProviderPackageLoader`
- `RtcProviderModuleNamespace`
- `createRtcProviderPackageLoader(...)`
- `resolveRtcProviderPackageLoadTarget(...)`
- `loadRtcProviderModule(...)`
- `installRtcProviderPackage(...)`
- `installRtcProviderPackages(...)`
- `getRtcProviderPackageByPackageIdentity(...)`

## Error Semantics

Add explicit package-loading errors:

- `provider_package_not_found`
- `provider_package_identity_mismatch`
- `provider_package_load_failed`
- `provider_module_export_missing`

Existing errors remain authoritative for registration drift:

- `provider_module_contract_mismatch`
- `provider_not_official`
- `provider_metadata_mismatch`
- `driver_already_registered`

## Verification

This round updates:

- TypeScript tests for load/install behavior
- root verification so the new SPI is treated as part of the standard
- manual docs and materialized docs so the new SPI is discoverable

## Expected Outcome

After this change, `sdkwork-rtc-sdk` no longer stops at “provider packages exist.” It will define
the complete reference-standard path for package-boundary RTC adapter loading:

- discover
- load
- validate
- install

That closes the plugin standard gap while preserving the current adapter architecture and default
provider policy (`volcengine`).
