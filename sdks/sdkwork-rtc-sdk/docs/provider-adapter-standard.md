# RTC Provider Adapter Standard

This document defines the official provider adapter standard for `sdkwork-rtc-sdk`.

## JDBC-Style Rule

RTC provider integration must follow a JDBC-like model:

- `RtcProviderDriver`
- `RtcDriverManager`
- `RtcDataSource`
- `RtcClient`
- `RtcProviderMetadata`
- `RtcSdkException`
- `unwrap()`

## Provider Adapter Responsibilities

Provider adapters own:

- native client factory integration
- runtime bridge delegation for the stable runtime surface
- provider-specific metadata mapping onto the standard catalog entry
- provider-native `unwrap()` support

Provider adapters do not hand-author provider descriptors or capability lists.
Those fields are declared once in `.sdkwork-assembly.json` and materialized into the TypeScript
provider catalog under `src/provider-catalog.ts` and the TypeScript capability catalog under
`src/capability-catalog.ts`.
Provider extension metadata is also assembly-driven through `providerExtensionCatalog` and
materialized into `src/provider-extension-catalog.ts`.
The assembly-driven `runtimeImmutabilityStandard` is canonical for `runtime-frozen`,
`immutable-snapshots`, `shallow-immutable-context`, and `mutable-native-client`.
Runtime-created contract objects must remain immutable snapshots so adapter consumers cannot drift
standard metadata, selection state, or negotiated capability results after construction.

The root `@sdkwork/rtc-sdk` public entrypoint must not re-export future non-builtin provider driver
factories. Those adapters remain internal modules today and may later move to dedicated provider
packages without breaking the root public API.

Provider adapters do not own:

- business-level provider selection policy
- business-level provider support classification policy
- provider registry governance
- fake provider-neutral RTC engine behavior
- fake emulation of unsupported advanced capabilities

The TypeScript executable baseline keeps provider selection as a first-class standard module at
`src/provider-selection.ts`, not as provider-private adapter logic.
That module owns `parseRtcProviderUrl(...)`, `resolveRtcProviderSelection(...)`, and the stable
selection precedence order:

- `provider_url`
- `provider_key`
- `tenant_override`
- `deployment_profile`
- `default_provider`

Provider adapters must consume the resolved provider identity and must not redefine or reorder that
standard precedence locally.
The assembly-driven `providerSelectionStandard` is canonical, and every language workspace catalog
must preserve it through `providerSelectionContract.sourceTerms`,
`providerSelectionContract.precedence`, and `providerSelectionContract.defaultSource`.
Flutter/mobile and the remaining reserved non-TypeScript language workspaces must preserve the same
rule through standalone provider-selection helper modules with language-idiomatic names for source
catalogs, precedence catalogs, provider-URL parsing, and selection resolution. Their
`RtcDriverManager` scaffolds must delegate to that helper module instead of re-embedding
precedence logic inline.

The TypeScript executable baseline also keeps provider support as a first-class standard module at
`src/provider-support.ts`, not as provider-private adapter logic.
That module owns `resolveRtcProviderSupportStatus(...)`,
`createRtcProviderSupportState(...)`, and the stable status set:

- `builtin_registered`
- `official_registered`
- `official_unregistered`
- `unknown`

Provider adapters and driver wiring must consume that standard support-state classification and must
not redefine those support statuses locally.
The assembly-driven `providerSupportStandard` is canonical, and every language workspace catalog
must preserve it through `providerSupportContract.statusTerms`.
Flutter/mobile and the remaining reserved non-TypeScript language workspaces must preserve the same
rule through standalone provider-support helper modules with language-idiomatic names for
support-status catalogs, `RtcProviderSupportStateRequest` contracts, status resolution, and
support-state construction. Their `RtcDriverManager` scaffolds must query the provider catalog and
provider-activation catalog, then delegate support-state construction to the provider-support
helper module instead of keeping ad hoc support-classification logic inline.

The assembly-driven `providerActivationStandard` is canonical, and every language workspace catalog
must preserve it through `providerActivationContract.statusTerms`.
Flutter/mobile and the remaining reserved non-TypeScript language workspaces must preserve the same
vocabulary in their provider activation catalogs so activation exposure stays assembly-governed
instead of becoming language-private wording.

The assembly-driven `providerPackageBoundaryStandard` is canonical, and every language workspace
catalog must preserve it through `providerPackageBoundaryContract.modeTerms`,
`providerPackageBoundaryContract.rootPublicPolicyTerms`,
`providerPackageBoundaryContract.lifecycleStatusTerms`, and
`providerPackageBoundaryContract.runtimeBridgeStatusTerms`.
Provider adapters must consume those standard vocabularies and must not invent alternate
package-boundary status or root-public-policy terms locally.

The assembly-driven `capabilityStandard`, `capabilityNegotiationStandard`,
`runtimeSurfaceStandard`, `signalingTransportStandard`, `runtimeImmutabilityStandard`, `rootPublicSurfaceStandard`,
`lookupHelperNamingStandard`, `errorCodeStandard`, `providerExtensionStandard`,
`providerTierStandard`, and
`languageMaturityStandard` are also canonical.
Provider adapters, catalogs, and docs must consume those top-level vocabularies instead of
redeclaring capability categories, capability surfaces, extension access/status terms, provider
tiers, or language maturity tiers in isolated module-local constants.

Runtime registration must reject:

- provider keys that are not present in the official catalog
- metadata drift from the official catalog entry for a provider

TypeScript provider packages must keep the vendor SDK dependency contract explicit:

- vendor SDK provisioning is `consumer-supplied`
- runtime binding happens through `native-factory`
- provider packages must `must-not-bundle` the vendor SDK
- the TypeScript runtime bridge baseline is `reference-baseline`
- the official vendor SDK requirement is `required`
- those adapter terms are assembly-governed through `typescriptAdapterStandard`

## Runtime Bridge Rule

The stable runtime surface is fixed across adapters:

- `join(options)`
- `leave()`
- `publish(options)`
- `unpublish(trackId)`
- `muteAudio(muted?)`
- `muteVideo(muted?)`

These methods are provider-neutral contract methods, not direct vendor SDK symbols.
Provider adapters must bind them through a consumer-supplied runtime bridge that wraps the official
vendor SDK.
The assembly-driven `runtimeSurfaceStandard` is canonical for that method vocabulary and for the
missing-runtime failure code.
The TypeScript runtime-surface module at `src/runtime-surface.ts` keeps
`RTC_RUNTIME_SURFACE_METHODS`, `RTC_RUNTIME_SURFACE_FAILURE_CODE`, and
`RTC_RUNTIME_SURFACE_STANDARD` aligned to that contract.
The assembly-driven `signalingTransportStandard` is canonical for WebSocket-only RTC signaling,
`connectOptions.webSocketAuth`, auth pass-through, canonical auth modes, recommended
`automatic` auth, authoritative `deviceId`, `liveConnection` reuse, no-polling policy, and
fail-fast auth behavior.
The TypeScript signaling-transport module at `src/signaling-transport.ts` keeps
`RTC_SIGNALING_TRANSPORT_TERM`, `RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH`,
`RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM`, `RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS`,
`RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE`,
`RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM`,
`RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM`,
`RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM`,
`RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM`,
`RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM`, and `RTC_SIGNALING_TRANSPORT_STANDARD` aligned to
that contract.
The Flutter signaling-transport module at
`../sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart` keeps
`rtcSignalingTransportTerm`, `rtcSignalingTransportAuthConfigPath`,
`rtcSignalingTransportAuthPassThroughTerm`, `rtcSignalingTransportAuthModeTerms`,
`rtcSignalingTransportRecommendedAuthMode`, `rtcSignalingTransportDeviceIdAuthorityTerm`,
`rtcSignalingTransportConnectOptionsDeviceIdRuleTerm`, `rtcSignalingTransportLiveConnectionTerm`,
`rtcSignalingTransportPollingFallbackTerm`, `rtcSignalingTransportAuthFailureTerm`, and
`rtcSignalingTransportStandard` aligned to that contract.
The TypeScript runtime-immutability module at `src/runtime-immutability.ts` keeps
`RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`, `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
`RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`,
`RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, and `RTC_RUNTIME_IMMUTABILITY_STANDARD` aligned to
the assembly-driven runtime immutability contract.
The TypeScript root-public-surface module at `src/root-public-surface.ts` keeps
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`,
`RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`,
`RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, and
`RTC_ROOT_PUBLIC_SURFACE_STANDARD` aligned to the assembly-driven root public surface contract.
The TypeScript lookup-helper-naming module at `src/lookup-helper-naming.ts` keeps
`RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`,
`RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, and `RTC_LOOKUP_HELPER_NAMING_STANDARD` aligned to the
assembly-driven lookup helper naming contract so `lower-camel-rtc`, `upper-camel-rtc`, and
`snake-case-rtc` stay standardized across adapters and reserved-language scaffolds.

Provider adapters must not:

- emulate RTC session state when no vendor runtime is present
- silently skip runtime operations
- downgrade runtime failures into fake successful responses

If an adapter is registered without a runtime bridge, the stable runtime surface must fail
explicitly with `native_sdk_not_available`.
This keeps the standard honest: the SDK unifies adapter shape and lifecycle semantics, but it does
not invent a fake cross-provider media engine.
Runtime-controller context wrappers must be shallow-immutable while preserving the mutable native
SDK instance returned by `unwrap()`. In canonical top-level terms, they stay
`shallow-immutable-context` while the vendor handle remains `mutable-native-client`.

## Provider Module Rule

TypeScript provider integration must pass through a stable package-aware adapter contract:

- `RtcProviderModule`
- `registerRtcProviderModule(...)`
- `registerRtcProviderModules(...)`
- `createRtcProviderPackageLoader(...)`
- `resolveRtcProviderPackageLoadTarget(...)`
- `loadRtcProviderModule(...)`
- `installRtcProviderPackage(...)`
- `installRtcProviderPackages(...)`

The module contract standardizes:

- the one-provider-only package name
- the provider metadata bound to that package
- the TypeScript vendor SDK contract bound to that package
- the driver factory used when a runtime registers the adapter
- the concrete source module and symbol names bound to the package manifest
- the executable `index.js` and `index.d.ts` package entrypoints
- the package `exports` contract that maps `import` and `default` to `index.js` and `types` to
  `index.d.ts`

`registerRtcProviderModule(...)` is the one-provider registration primitive.
`registerRtcProviderModules(...)` is the standard batch registration entrypoint for wiring a driver
manager with multiple official provider modules in one pass while keeping the same package-aware
contract validation behavior.
Batch registration is atomic: if any module contract validation or driver registration fails, the
target `RtcDriverManager` must remain unchanged.

`resolveRtcProviderPackageLoadTarget(...)` is the standard package-resolution primitive.
It resolves an official package boundary by `providerKey` or `packageIdentity` through the
materialized TypeScript provider package catalog.

`createRtcProviderPackageLoader(...)` is the standard loader factory.
It wraps a caller-supplied package import function so host runtimes can decide how package loading
happens while the RTC SDK keeps one stable contract for provider package loading.

`loadRtcProviderModule(...)` is the standard package-loading primitive.
It resolves the package boundary, loads the package namespace, and extracts the assembly-declared
provider module symbol.

`installRtcProviderPackage(...)` is the one-package install primitive.
`installRtcProviderPackages(...)` is the standard batch install entrypoint.
Batch install remains atomic: all provider modules must load and validate before registration
mutates the target `RtcDriverManager`.

Builtin provider packages may expose their driver factory and provider module symbol through the
root `@sdkwork/rtc-sdk` entrypoint because they are builtin baselines.
Future non-builtin provider modules must stay outside the root public API.
The TypeScript executable baseline must also materialize a provider package catalog so package
discovery stays machine-readable without scraping package manifests. That catalog must preserve
`providerKey`, `pluginId`, `driverId`, `packageIdentity`, `manifestPath`, `readmePath`,
`sourcePath`, `declarationPath`, `sourceSymbol`, `sourceModule`, `driverFactory`,
`metadataSymbol`, `moduleSymbol`, `builtin`, `rootPublic`, `status`, `runtimeBridgeStatus`, and
`extensionKeys`.
That TypeScript package catalog must also keep `getRtcProviderPackageByProviderKey(...)` and
`getRtcProviderPackageByPackageIdentity(...)` stable so package-boundary lookup stays explicit by
provider key and package identity.

The TypeScript executable baseline must also keep provider package loading explicit through
`src/provider-package-loader.ts`.
That loader layer must preserve:

- caller-supplied package import behavior
- stable `provider_package_not_found` failures
- stable `provider_package_identity_mismatch` failures
- stable `provider_package_load_failed` failures
- stable `provider_module_export_missing` failures
- assembly-declared `moduleSymbol` extraction
- package-boundary install through `RtcProviderModule`

Each official language must also expose a cross-language `providerPackageBoundary` contract through
its language workspace catalog.
That language workspace catalog entry must preserve the canonical default-provider and
package-topology contracts:

- `defaultProviderContract.providerKey`
- `defaultProviderContract.pluginId`
- `defaultProviderContract.driverId`
- `providerSelectionContract.sourceTerms`
- `providerSelectionContract.precedence`
- `providerSelectionContract.defaultSource`
- `providerSupportContract.statusTerms`
- `providerPackageBoundary.mode`
- `providerPackageBoundary.rootPublicPolicy`
- `providerPackageBoundary.lifecycleStatusTerms`
- `providerPackageBoundary.runtimeBridgeStatusTerms`

The current adapter standard fixes only two legal boundary modes:

- TypeScript uses `catalog-governed-mixed`
- Flutter/mobile and the remaining reserved non-TypeScript workspaces use
  `scaffold-per-provider-package`

The current adapter standard fixes only two legal root public policies:

- TypeScript uses `builtin-only`
- Flutter/mobile and the remaining reserved non-TypeScript workspaces use `none`

The current adapter standard also fixes the canonical status vocabularies:

- every language `providerSelectionContract.sourceTerms` must be
  `provider_url`, `provider_key`, `tenant_override`, `deployment_profile`, `default_provider`
- every language `providerSelectionContract.precedence` must be
  `provider_url`, `provider_key`, `tenant_override`, `deployment_profile`, `default_provider`
- every language `providerSelectionContract.defaultSource` must be `default_provider`
- every language `providerSupportContract.statusTerms` must be
  `builtin_registered`, `official_registered`, `official_unregistered`, `unknown`
- TypeScript `providerPackageBoundary.lifecycleStatusTerms` must be
  `root_public_reference_boundary` and `package_reference_boundary`
- TypeScript `providerPackageBoundary.runtimeBridgeStatusTerms` must be
  `reference-baseline`
- the remaining reserved non-TypeScript language workspaces must keep
  `providerPackageBoundary.lifecycleStatusTerms` fixed at `future-runtime-bridge-only`
- the remaining reserved non-TypeScript language workspaces must keep
  `providerPackageBoundary.runtimeBridgeStatusTerms` fixed at `reserved`

Flutter/mobile and the remaining reserved non-TypeScript workspaces must also declare a
`providerPackageScaffold` so future provider packages inherit a fixed directory pattern, package
identity pattern, and manifest file name before runtime bridge work begins.
That scaffold contract must also declare exact `templateTokens`, `sourceFilePattern`,
`sourceSymbolPattern`, and `sourceTemplateTokens`, keep `rootPublic` fixed at `false`, keep
`runtimeBridgeStatus` fixed at `reserved`, and keep `status` fixed at
`future-runtime-bridge-only` until a verified language runtime bridge exists.
Each reserved language must also materialize one future provider package boundary per official
provider so the manifest path, README path, and metadata-only source stub path are already fixed
before runtime code lands.
That source stub is part of the provider package contract. It must stay metadata-only until the
package becomes a verified runtime bridge and must preserve the assembly-driven provider identity
and source symbol.
Each reserved language metadata scaffold must also materialize a provider package catalog so package
discovery stays machine-readable. That provider package catalog must preserve the same
`providerKey`, `pluginId`, `driverId`, `packageIdentity`, `manifestPath`, `readmePath`,
`sourcePath`, `sourceSymbol`, `builtin`, `rootPublic`, `status`, and `runtimeBridgeStatus`
metadata that the provider package boundary materializes on disk.
That reserved provider package catalog must also keep package-boundary lookup explicit through
provider-key and package-identity helpers with language-idiomatic naming, not through ad hoc array
scans.
That reserved scaffold must stay aligned with the cross-language `providerPackageBoundary`
contract:

- `providerPackageBoundary.mode` stays fixed at `scaffold-per-provider-package`
- `providerPackageBoundary.rootPublicPolicy` stays fixed at `none`
- `providerPackageBoundary.lifecycleStatusTerms` stays exactly aligned with the concrete
  `providerPackageScaffold.status`
- `providerPackageBoundary.runtimeBridgeStatusTerms` stays exactly aligned with the concrete
  `providerPackageScaffold.runtimeBridgeStatus`

Each official language must also expose a provider activation catalog so runtime availability,
root-public exposure, and package-boundary activation stay machine-readable without reading docs or
inferring from package layout. That catalog must preserve `providerKey`, `pluginId`, `driverId`,
`activationStatus`, `runtimeBridge`, `rootPublic`, `packageBoundary`, `builtin`, and
`packageIdentity`.
Each official language must also expose a provider catalog lookup helper so provider identity stays
queryable by `providerKey` instead of forcing downstream code to scan arrays. The cross-language
semantic contract is `provider catalog by provider key`, with language-idiomatic naming:
`getRtcProviderByProviderKey(...)`, `GetRtcProviderByProviderKey(...)`, or
`get_rtc_provider_by_provider_key(...)`.
That naming split is governed by `lookupHelperNamingStandard`, not by provider-local convention.
The TypeScript executable baseline keeps that lookup explicit through
`getRtcProviderByProviderKey(...)` alongside `getBuiltinRtcProviderMetadataByKey(...)` and
`getOfficialRtcProviderMetadataByKey(...)`.
The TypeScript executable baseline keeps activation lookup explicit through
`getRtcProviderActivationByProviderKey(...)`.
The TypeScript executable baseline keeps capability lookup explicit through
`getRtcCapabilityCatalog(...)` and `getRtcCapabilityDescriptor(...)`.
The TypeScript executable baseline keeps provider extension lookup explicit through
`getRtcProviderExtensionCatalog(...)`, `getRtcProviderExtensionDescriptor(...)`,
`getRtcProviderExtensionsForProvider(...)`, `getRtcProviderExtensions(...)`, and
`hasRtcProviderExtension(...)`.
Flutter/mobile language workspace catalogs and the remaining reserved non-TypeScript language
workspace catalogs and metadata scaffolds must preserve the same semantics with language-idiomatic
helper naming for capability and provider-extension catalogs, not just provider identity catalogs.
They must also preserve the same helper-profile split:
`lower-camel-rtc` for Flutter/Java/Swift/Kotlin, `upper-camel-rtc` for C#/Go, and
`snake-case-rtc` for Rust/Python.
Each remaining reserved non-TypeScript language workspace must also declare
`resolutionScaffold.providerPackageLoaderRelativePath` and ship a provider-package loader scaffold.
That scaffold fixes the future package-resolution and installation boundary before runtime code
exists. It must preserve:

- `RtcProviderPackageLoadRequest`
- `RtcResolvedProviderPackageLoadTarget`
- `RtcProviderPackageLoader`
- `createRtcProviderPackageLoader(...)`
- `resolveRtcProviderPackageLoadTarget(...)`
- `loadRtcProviderModule(...)`
- `installRtcProviderPackage(...)`
- `installRtcProviderPackages(...)`
- `provider_package_not_found`
- `provider_package_identity_mismatch`
- `provider_package_load_failed`
- `provider_module_export_missing`

Reserved root public entrypoints such as `sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart` and
`sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/__init__.py` must also re-expose that provider-package
loader surface so consumers do not need private imports for the standard boundary.
The canonical exposure terms are `root-public-builtin-only` for builtin provider modules that may
cross the TypeScript root public boundary and `package-boundary-only` for non-builtin provider
factories or modules that must remain package-scoped.
Each official language must also expose a language workspace catalog so language identity, public
package identity, maturity tier, runtime/control support, current role, workspace summary, and
role highlights stay machine-readable without scraping README prose. That catalog must preserve
`language`, `workspace`, `displayName`, `publicPackage`, `maturityTier`, `controlSdk`,
`runtimeBridge`, `currentRole`, `workspaceSummary`, and `roleHighlights`.
The TypeScript executable baseline keeps that lookup explicit through
`getRtcLanguageWorkspaceByLanguage(...)`.

The materialized TypeScript provider catalog entry and the runtime `RtcProviderModule` object must
expose the same TypeScript vendor SDK contract so installers do not need to read package manifests
to understand provider runtime requirements.
That contract includes the `reference-baseline` runtime bridge status and the `required` official
vendor SDK prerequisite, and it is assembly-governed through `typescriptAdapterStandard`.
The materialized provider catalog entry and the provider package manifest must also expose the same
`extensionKeys` list so provider-specific escape hatches stay standardized.
They must also expose the same `requiredCapabilities` and `optionalCapabilities` lists so voice
calling, video calling, live broadcast, and live audience support remain inspectable at the
provider-package boundary instead of being inferred from README prose or app code.
The TypeScript package identity contract is likewise assembly-governed through
`typescriptPackageStandard` so package name, source module, driver factory, metadata symbol, and
module symbol stay canonical across manifests, catalogs, and package entrypoints.

Runtime registration must fail with `provider_module_contract_mismatch` when a provider module drifts
from its assembly-driven package contract.
That error is mandatory when `packageName`, `builtin` versus `rootPublic`, or the
`typescriptAdapter` contract no longer matches the official provider metadata.
Atomic batch registration and atomic batch package installation must preserve the same failure
semantics instead of partially registering earlier modules and leaving the manager in a
half-mutated state.

## Capability Rule

Every adapter must declare:

- required baseline capability support
- optional advanced capability support
- unsupported capability absence

Capability declarations are assembly-driven through `capabilityCatalog`.
Every capability descriptor must declare:

- `category`
- `surface`

Allowed `category` values:

- `required-baseline`
- `optional-advanced`

Allowed `surface` values:

- `control-plane`
- `runtime-bridge`
- `cross-surface`

The required baseline capability set is fixed workspace-wide and must stay identical across every
official provider catalog entry.

The capability catalog must make the control-plane versus runtime-bridge distinction explicit.
If a capability participates in both surfaces, it must be marked `cross-surface` instead of being
flattened into one side.

Unsupported capabilities must not be faked.

## Capability Negotiation Rule

The core contract must support explicit capability negotiation and degradation decisions.
The TypeScript executable baseline keeps that contract explicit through
`src/capability-negotiation.ts`, which owns `RTC_CAPABILITY_NEGOTIATION_STATUSES`,
`RTC_CAPABILITY_NEGOTIATION_RULES`, and `resolveRtcCapabilityNegotiationStatus(...)`.
The assembly-driven `capabilityNegotiationStandard` is canonical for both status vocabulary and
status-rule vocabulary.

Stable negotiation result statuses are:

- `supported`
- `degraded`
- `unsupported`

Negotiation must stay surface-aware.
If a capability is missing, the result must preserve whether that gap is on the `control-plane`,
`runtime-bridge`, or `cross-surface`.

Provider adapters must not silently emulate missing required capabilities just to produce a
`supported` result.
Optional capability gaps may produce `degraded`, but missing required capabilities must produce
`unsupported`.

## Selection Rule

Provider selection precedence is fixed:

1. `providerUrl`
2. `providerKey`
3. `tenant override`
4. `deployment profile`
5. workspace default

This order must stay stable across language implementations.

## Error Semantics Rule

- the TypeScript errors module at `src/errors.ts` owns `RTC_SDK_ERROR_CODES`,
  `RTC_SDK_ERROR_FALLBACK_CODE`, and `RtcSdkException`
- the assembly-driven `errorCodeStandard` is canonical for both the shared error vocabulary and
  the fallback error contract
- the canonical RTC SDK error set is `provider_package_not_found`,
  `provider_package_identity_mismatch`, `provider_package_load_failed`,
  `provider_module_export_missing`, `provider_module_contract_mismatch`,
  `driver_already_registered`, `driver_not_found`, `provider_not_official`,
  `provider_not_supported`, `provider_metadata_mismatch`, `provider_selection_failed`,
  `capability_not_supported`, `invalid_provider_url`, `native_sdk_not_available`, and
  `vendor_error`
- the canonical fallback error remains `vendor_error`
- use `provider_not_supported` when a provider exists in the official catalog but the current runtime
  has not registered a driver for it
- use `driver_not_found` only when the requested provider is unknown to the official catalog

## Vendor Escape Hatch Rule

Provider-specific advanced integration must happen through:

- `unwrap()`
- provider extension metadata

The core contract must stay provider-neutral even when vendor-specific power is available.

Provider extension metadata is declared once in `providerExtensionCatalog`.
Every extension descriptor must declare:

- `extensionKey`
- `providerKey`
- `displayName`
- `surface`
- `access`
- `status`

Allowed extension `access` values:

- `unwrap-only`
- `extension-object`

Allowed extension `status` values:

- `reference-baseline`
- `reserved`

The current baseline standard uses `*.native-client` descriptors with `unwrap-only` access.
That means the standardized contract points consumers at the vendor-native object through
`unwrap()`, rather than inventing fake cross-provider extension wrappers.
