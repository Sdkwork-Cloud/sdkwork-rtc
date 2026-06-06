# SDKWork RTC SDK Workspace

`sdkwork-rtc-sdk` is the provider-standard RTC SDK workspace for SDKWork RTC.

It is not a route-generated SDK workspace and must remain independent from the OpenAPI-generated
HTTP SDK families.

It is a workspace, not a single package. The workspace owns:

- the JDBC-style RTC provider integration standard
- provider-neutral RTC contracts and capability vocabulary
- official provider adapter naming, selection, and verification rules
- reserved provider package boundaries for one-provider-only adapter extraction
- the executable TypeScript reference implementation and Flutter mobile runtime baseline
- the official multi-language workspace family for `typescript`, `flutter`, `rust`, `java`,
  `csharp`, `swift`, `kotlin`, `go`, and `python`
- code-level contract scaffold boundaries for reserved language workspaces
- package/build scaffold boundaries for reserved language workspaces
- provider package scaffold boundaries for reserved language workspaces
- materialized future provider package manifest and README boundaries for reserved language workspaces
- materialized metadata-only source stub boundaries for reserved language provider packages
- metadata/catalog scaffold boundaries for reserved language workspaces
- metadata-only driver manager, data source, provider support, and provider package loader
  scaffold boundaries for reserved language workspaces
- package-level documentation for provider adapters, capability matrices, and verification

## Scope

This workspace standardizes:

- provider driver discovery and selection
- the explicit TypeScript provider selection contract at
  `sdkwork-rtc-sdk-typescript/src/provider-selection.ts`
- the explicit TypeScript provider support contract at
  `sdkwork-rtc-sdk-typescript/src/provider-support.ts`
- provider metadata and capability declaration from one assembly source of truth
- explicit capability negotiation and degradation with surface-aware results
- assembly-driven RTC error vocabulary and fallback semantics
- provider extension metadata and escape hatch contracts from one assembly source of truth
- assembly-driven default provider constants materialized into the core catalog
- assembly-driven provider-tier and language-maturity documentation
- assembly-driven `capabilityStandard`, `capabilityNegotiationStandard`,
  `runtimeSurfaceStandard`, `signalingTransportStandard`, `runtimeImmutabilityStandard`, `rootPublicSurfaceStandard`,
  `lookupHelperNamingStandard`,
  `errorCodeStandard`, `providerExtensionStandard`, `providerTierStandard`, and
  `languageMaturityStandard` vocabularies
- assembly-driven `typescriptAdapterStandard` and `typescriptPackageStandard` contracts for
  TypeScript provider adapter and package identity normalization
- assembly-driven language workspace identity, role, summary, and default-provider contracts
- assembly-driven language workspace catalog contracts across the TypeScript baseline, the
  Flutter/mobile baseline, and the remaining reserved language workspaces
- assembly-driven language-provider activation matrix contracts
- assembly-driven provider activation catalog contracts across the TypeScript baseline, the
  Flutter/mobile baseline, and the remaining reserved language workspaces
- assembly-driven provider package catalog contracts across the TypeScript baseline, the
  Flutter/mobile baseline, and the remaining reserved language workspaces
- standard TypeScript provider package loader and installer SPI for package-boundary adapter loading
- assembly-driven TypeScript vendor SDK package contracts
- assembly-driven TypeScript runtime bridge baseline contracts
- assembly-driven reserved provider package template token, source file, source symbol, lifecycle
  status, and root-public exposure contracts for future non-TypeScript provider packages
- provider-neutral client and data-source interfaces
- built-in provider adapter baselines for `volcengine`, `aliyun`, and `tencent`
- future provider adapter positions for `agora`, `zego`, `livekit`, `twilio`, `jitsi`, `janus`,
  and `mediasoup`
- cross-language control-plane and runtime-bridge boundaries

This workspace does not:

- re-implement vendor media engines
- claim uniform support for all provider-specific advanced features
- turn RTC runtime integration into an OpenAPI-generated transport problem

## Release Snapshot Boundary

This workspace inherits the current SDK release snapshot from
`artifacts/releases/wave-d-2026-04-08/sdk-release-catalog.json`.

- `state = template_only_pending_generation`
- `generationStatus = template_only_pending_generation`
- `releaseStatus = not_published`
- `plannedVersion = null`
- `versionStatus = version_unassigned_pending_freeze`
- `versionDecisionSourcePath = null`

## Current Standard Baseline

The workspace follows a JDBC-inspired architecture:

- `RtcProviderDriver`
- `RtcDriverManager`
- `RtcDataSource`
- `RtcClient`
- `RtcProviderMetadata`
- `RtcSdkException`
- `unwrap()`

RTC-specific additions to that JDBC model are mandatory:

- explicit `RtcCapabilitySet`
- provider degradation rules
- capability negotiation statuses `supported`, `degraded`, and `unsupported`
- stable runtime surface methods `join`, `leave`, `publish`, `unpublish`, `muteAudio`, and
  `muteVideo`
- provider extension escape hatches
- explicit runtime bridge failure semantics through `native_sdk_not_available`

Capability negotiation must stay explicit.
If all requested capabilities are present, the result is `supported`.
If required capabilities are present but optional capabilities are missing, the result is `degraded`.
If any required capability is missing, the result is `unsupported`.

The top-level assembly also fixes the shared vocabulary standards:

- `capabilityStandard.categoryTerms`
- `capabilityStandard.surfaceTerms`
- `capabilityNegotiationStandard.statusTerms`
- `capabilityNegotiationStandard.statusRules`
- `runtimeSurfaceStandard.methodTerms`
- `runtimeSurfaceStandard.failureCode`
- `signalingTransportStandard.transportTerm`
- `signalingTransportStandard.authConfigPath`
- `signalingTransportStandard.authPassThroughTerm`
- `signalingTransportStandard.authModeTerms`
- `signalingTransportStandard.recommendedAuthMode`
- `signalingTransportStandard.deviceIdAuthorityTerm`
- `signalingTransportStandard.connectOptionsDeviceIdRuleTerm`
- `signalingTransportStandard.liveConnectionTerm`
- `signalingTransportStandard.pollingFallbackTerm`
- `signalingTransportStandard.authFailureTerm`
- `runtimeImmutabilityStandard.frozenTerm`
- `runtimeImmutabilityStandard.snapshotTerm`
- `runtimeImmutabilityStandard.controllerContextTerm`
- `runtimeImmutabilityStandard.nativeClientTerm`
- `rootPublicSurfaceStandard.typescriptProviderNeutralExportPaths`
- `rootPublicSurfaceStandard.typescriptBuiltinProviderExportPaths`
- `rootPublicSurfaceStandard.typescriptInlineHelperNames`
- `rootPublicSurfaceStandard.reservedSurfaceFamilies`
- `rootPublicSurfaceStandard.reservedEntryPointKinds`
- `rootPublicSurfaceStandard.builtinProviderExposureTerm`
- `rootPublicSurfaceStandard.nonBuiltinProviderExposureTerm`
- `lookupHelperNamingStandard.profileTerms`
- `lookupHelperNamingStandard.familyTerms`
- `errorCodeStandard.codeTerms`
- `errorCodeStandard.fallbackCode`
- `providerExtensionStandard.accessTerms`
- `providerExtensionStandard.statusTerms`
- `providerTierStandard.tierTerms`
- `providerTierStandard.tierSummaries`
- `languageMaturityStandard.tierTerms`
- `languageMaturityStandard.tierSummaries`
- `typescriptAdapterStandard.sdkProvisioningTerms`
- `typescriptAdapterStandard.bindingStrategyTerms`
- `typescriptAdapterStandard.bundlePolicyTerms`
- `typescriptAdapterStandard.runtimeBridgeStatusTerms`
- `typescriptAdapterStandard.officialVendorSdkRequirementTerms`
- `typescriptAdapterStandard.referenceContract`
- `typescriptPackageStandard.packageNamePattern`
- `typescriptPackageStandard.sourceModulePattern`
- `typescriptPackageStandard.driverFactoryPattern`
- `typescriptPackageStandard.metadataSymbolPattern`
- `typescriptPackageStandard.moduleSymbolPattern`
- `typescriptPackageStandard.rootPublicRule`

The runtime surface is standardized, but vendor media engines are still consumer-supplied.
Provider adapters delegate runtime work through a consumer-supplied runtime bridge bound to the
official vendor SDK. If no runtime bridge is supplied, the stable runtime methods must fail
explicitly with `native_sdk_not_available` instead of pretending a provider-neutral RTC engine
exists.
The runtime immutability contract is also standardized. `runtimeImmutabilityStandard` fixes the
canonical `runtime-frozen`, `immutable-snapshots`, `shallow-immutable-context`, and
`mutable-native-client` terms. The TypeScript runtime-immutability module at
`sdkwork-rtc-sdk-typescript/src/runtime-immutability.ts` must keep
`RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`, `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
`RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`,
`RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, and `RTC_RUNTIME_IMMUTABILITY_STANDARD` aligned to
that assembly-driven contract so metadata freezing, runtime snapshot semantics, runtime-controller
context semantics, and native-client mutability preservation do not drift between languages.
The root public exposure contract is also standardized. `rootPublicSurfaceStandard` fixes the
TypeScript provider-neutral export paths, builtin provider export paths, root-only helper names,
reserved single-entrypoint surface families, and the `root-public-builtin-only` plus
`package-boundary-only` exposure terms. The TypeScript root-public-surface module at
`sdkwork-rtc-sdk-typescript/src/root-public-surface.ts` must keep
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`,
`RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`,
`RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, and `RTC_ROOT_PUBLIC_SURFACE_STANDARD`
aligned to that assembly-driven contract so the root export graph cannot drift by accident.
The lookup helper naming contract is also standardized. `lookupHelperNamingStandard` fixes the
cross-language lookup-helper families and the canonical helper profiles `lower-camel-rtc`,
`upper-camel-rtc`, and `snake-case-rtc`. The TypeScript lookup-helper-naming module at
`sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts` must keep
`RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`, `RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, and
`RTC_LOOKUP_HELPER_NAMING_STANDARD` aligned to that assembly-driven contract so reserved-language
helper naming cannot drift across web/browser, Flutter/mobile, and future server/tooling
workspaces.

## Default Provider

The default provider remains `volcengine`, aligned with the current platform runtime provider
registry and existing built-in adapters under:

- `adapters/rtc-volcengine`
- `adapters/rtc-aliyun`
- `adapters/rtc-tencent`

The root assembly and the materialized TypeScript catalog are the single source of truth for that
default selection. The core provider catalog at
`sdkwork-rtc-sdk-typescript/src/provider-catalog.ts` must expose:

- `DEFAULT_RTC_PROVIDER_KEY`
- `DEFAULT_RTC_PROVIDER_PLUGIN_ID`
- `DEFAULT_RTC_PROVIDER_DRIVER_ID`
- `getBuiltinRtcProviderMetadataByKey(...)`
- `getOfficialRtcProviderMetadataByKey(...)`
- `getRtcProviderByProviderKey(...)`

The TypeScript selection helper module at
`sdkwork-rtc-sdk-typescript/src/provider-selection.ts` fixes the standard precedence order:

- `provider_url`
- `provider_key`
- `tenant_override`
- `deployment_profile`
- `default_provider`

It must also keep `parseRtcProviderUrl(...)` and `resolveRtcProviderSelection(...)` stable so
selection behavior stays explicit instead of being hidden inside driver-manager internals.
Flutter/mobile and the remaining reserved non-TypeScript workspaces must preserve the same
semantics through standalone
provider-selection helper modules with language-idiomatic names, stable source and precedence
catalogs, explicit provider-URL parsing helpers, and a driver-manager delegation rule:
`RtcDriverManager` resolves selection by calling the provider-selection helper module instead of
re-embedding precedence logic.

The TypeScript provider-support helper module at
`sdkwork-rtc-sdk-typescript/src/provider-support.ts` fixes the support-status contract for
provider discovery and registration introspection. The stable status set is:

- `builtin_registered`
- `official_registered`
- `official_unregistered`
- `unknown`

It must also keep `resolveRtcProviderSupportStatus(...)` and `createRtcProviderSupportState(...)`
stable so provider-support classification stays explicit instead of being reimplemented ad hoc
across runtime entrypoints.
Flutter/mobile and the remaining reserved non-TypeScript workspaces must preserve the same
semantics through standalone
provider-support helper modules with language-idiomatic names, explicit
`RtcProviderSupportStateRequest` contracts, stable support-status catalogs, and a driver-manager
delegation rule: provider-support description must flow through the support helper after querying
the provider catalog and provider-activation catalog, not through ad hoc inline status logic.

The TypeScript capability catalog module at `sdkwork-rtc-sdk-typescript/src/capability-catalog.ts`
must also keep `getRtcCapabilityCatalog(...)` and `getRtcCapabilityDescriptor(...)` stable so
capability metadata stays queryable by capability key instead of being reimplemented through ad hoc
array scans.

The TypeScript capability negotiation module at
`sdkwork-rtc-sdk-typescript/src/capability-negotiation.ts` must also keep
`RTC_CAPABILITY_NEGOTIATION_STATUSES`, `RTC_CAPABILITY_NEGOTIATION_RULES`, and
`resolveRtcCapabilityNegotiationStatus(...)` stable so negotiation outcomes and downgrade rules stay
assembly-governed instead of being re-embedded as ad hoc string literals inside runtime entrypoints.

The TypeScript errors module at `sdkwork-rtc-sdk-typescript/src/errors.ts` must also keep
`RTC_SDK_ERROR_CODES`, `RTC_SDK_ERROR_FALLBACK_CODE`, and `RtcSdkException` stable so the shared
error vocabulary stays assembly-governed instead of being re-embedded as ad hoc string literals.
The canonical fallback remains `vendor_error`.

The TypeScript runtime-surface module at
`sdkwork-rtc-sdk-typescript/src/runtime-surface.ts` must also keep
`RTC_RUNTIME_SURFACE_METHODS`, `RTC_RUNTIME_SURFACE_FAILURE_CODE`, and
`RTC_RUNTIME_SURFACE_STANDARD` aligned to `runtimeSurfaceStandard` so provider-neutral runtime
method vocabulary and missing-runtime failure semantics stay assembly-governed.

The TypeScript signaling-transport module at
`sdkwork-rtc-sdk-typescript/src/signaling-transport.ts` must also keep
`RTC_SIGNALING_TRANSPORT_TERM`, `RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH`,
`RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM`, `RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS`,
`RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE`,
`RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM`,
`RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM`,
`RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM`,
`RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM`,
`RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM`, and `RTC_SIGNALING_TRANSPORT_STANDARD` aligned to
`signalingTransportStandard` so WebSocket-only RTC signaling, auth pass-through, authoritative
`deviceId`, `liveConnection` reuse, no-polling policy, and fail-fast auth semantics stay
assembly-governed.
The Flutter signaling-transport module at
`sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart` must also keep
`rtcSignalingTransportTerm`, `rtcSignalingTransportAuthConfigPath`,
`rtcSignalingTransportAuthPassThroughTerm`, `rtcSignalingTransportAuthModeTerms`,
`rtcSignalingTransportRecommendedAuthMode`, `rtcSignalingTransportDeviceIdAuthorityTerm`,
`rtcSignalingTransportConnectOptionsDeviceIdRuleTerm`, `rtcSignalingTransportLiveConnectionTerm`,
`rtcSignalingTransportPollingFallbackTerm`, `rtcSignalingTransportAuthFailureTerm`, and
`rtcSignalingTransportStandard` aligned to `signalingTransportStandard` so the mobile baseline
inherits the same WebSocket-only signaling, auth pass-through, authoritative `deviceId`,
`liveConnection` reuse, no-polling policy, and fail-fast auth semantics.

The TypeScript provider-package catalog module at
`sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts` must also keep
`getRtcProviderPackageByProviderKey(...)` and `getRtcProviderPackageByPackageIdentity(...)` stable
so provider package boundary lookup stays explicit instead of being reimplemented through ad hoc
manifest scans.

The TypeScript provider-package loader module at
`sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts` must also keep
`createRtcProviderPackageLoader(...)`, `resolveRtcProviderPackageLoadTarget(...)`,
`loadRtcProviderModule(...)`, `installRtcProviderPackage(...)`, and
`installRtcProviderPackages(...)` stable so package-boundary provider loading and installation stay
standardized instead of being rebuilt differently in every host application.

The TypeScript provider-activation catalog module at
`sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts` must also keep
`getRtcProviderActivationByProviderKey(...)` stable so package-boundary versus root-public runtime
activation lookup stays explicit by provider key.

The TypeScript provider-extension catalog module at
`sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts` must also keep
`getRtcProviderExtensionCatalog(...)`, `getRtcProviderExtensionDescriptor(...)`,
`getRtcProviderExtensionsForProvider(...)`, `getRtcProviderExtensions(...)`, and
`hasRtcProviderExtension(...)` stable so extension metadata stays queryable by extension key,
provider key, and selected extension set.

The TypeScript language-workspace catalog module at
`sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts` must also keep
`getRtcLanguageWorkspaceByLanguage(...)` stable so official language workspace lookup stays
explicit instead of being inferred from README prose or directory scanning.
Each `RtcLanguageWorkspaceCatalogEntry` must also keep a machine-readable
`defaultProviderContract` with `providerKey`, `pluginId`, and `driverId` aligned to the
assembly-driven default provider identity, a `providerSelectionContract` with
`sourceTerms`, `precedence`, and `defaultSource` aligned to the assembly-driven
`providerSelectionStandard`, and a `providerSupportContract` with `statusTerms` aligned to the
assembly-driven `providerSupportStandard`.
Each `RtcLanguageWorkspaceCatalogEntry` must also keep a machine-readable
`providerActivationContract` with `statusTerms` aligned to the assembly-driven
`providerActivationStandard`.
Reference language workspaces must also keep any machine-readable `runtimeBaseline`
metadata aligned to the assembly-driven executable baseline, including the official vendor SDK
package identity, signaling SDK package identity, recommended entrypoint, smoke command, and
smoke mode for the current landing.
Each `RtcLanguageWorkspaceCatalogEntry` must also keep a machine-readable
`providerPackageBoundaryContract` with `modeTerms`, `rootPublicPolicyTerms`,
`lifecycleStatusTerms`, and `runtimeBridgeStatusTerms` aligned to the assembly-driven
`providerPackageBoundaryStandard`.

Flutter/mobile metadata modules and the remaining reserved non-TypeScript metadata scaffolds must
keep the same explicit lookup semantics with language-idiomatic naming:

- provider catalog by provider key
- provider package catalog by provider key
- provider package catalog by package identity
- provider activation catalog by provider key
- capability descriptor by capability key
- provider extension catalog by extension key and provider key
- language workspace catalog by language

Canonical forms:

- Flutter, Java, Swift, Kotlin:
  `getRtcProviderByProviderKey(...)`, `getRtcProviderPackageByProviderKey(...)`,
  `getRtcProviderPackageByPackageIdentity(...)`,
  `getRtcProviderActivationByProviderKey(...)`, `getRtcCapabilityDescriptor(...)`,
  `getRtcProviderExtensionDescriptor(...)`, `getRtcProviderExtensionsForProvider(...)`,
  `hasRtcProviderExtension(...)`, `getRtcLanguageWorkspaceByLanguage(...)`
- C#, Go:
  `GetRtcProviderByProviderKey(...)`, `GetRtcProviderPackageByProviderKey(...)`,
  `GetRtcProviderPackageByPackageIdentity(...)`,
  `GetRtcProviderActivationByProviderKey(...)`, `GetRtcCapabilityDescriptor(...)`,
  `GetRtcProviderExtensionDescriptor(...)`, `GetRtcProviderExtensionsForProvider(...)`,
  `HasRtcProviderExtension(...)`, `GetRtcLanguageWorkspaceByLanguage(...)`
- Rust, Python:
  `get_rtc_provider_by_provider_key(...)`, `get_rtc_provider_package_by_provider_key(...)`,
  `get_rtc_provider_package_by_package_identity(...)`,
  `get_rtc_provider_activation_by_provider_key(...)`, `get_rtc_capability_descriptor(...)`,
  `get_rtc_provider_extension_descriptor(...)`, `get_rtc_provider_extensions_for_provider(...)`,
  `has_rtc_provider_extension(...)`, `get_rtc_language_workspace_by_language(...)`

Every official language workspace entry must also declare a cross-language
`providerPackageBoundary` contract in the language workspace catalog.
That boundary summary is the canonical package-topology contract:
`providerPackageBoundary.mode`, `providerPackageBoundary.rootPublicPolicy`,
`providerPackageBoundary.lifecycleStatusTerms`, and
`providerPackageBoundary.runtimeBridgeStatusTerms`.
The same language workspace catalog entry must also preserve `defaultProviderContract.providerKey`,
`defaultProviderContract.pluginId`, and `defaultProviderContract.driverId` so the default provider
identity stays machine-readable across languages.
It must also preserve `providerSelectionContract.sourceTerms`,
`providerSelectionContract.precedence`, `providerSelectionContract.defaultSource`, and
`providerSupportContract.statusTerms` so selection precedence and provider-support vocabulary stay
assembly-governed across languages instead of becoming runtime-private conventions.
It must also preserve `providerActivationContract.statusTerms` so provider activation vocabulary
stays assembly-governed through `providerActivationStandard`, and
`providerPackageBoundaryContract.modeTerms`,
`providerPackageBoundaryContract.rootPublicPolicyTerms`,
`providerPackageBoundaryContract.lifecycleStatusTerms`, and
`providerPackageBoundaryContract.runtimeBridgeStatusTerms` so the allowed package-boundary
vocabulary stays assembly-governed through `providerPackageBoundaryStandard`.
TypeScript is the only `catalog-governed-mixed` workspace and keeps
`rootPublicPolicy` fixed at `builtin-only`.
Flutter is an executable mobile runtime baseline that still keeps
`providerPackageBoundary.mode` fixed at `scaffold-per-provider-package` and
`rootPublicPolicy` fixed at `none` because only the root-public builtin `volcengine` path is
executable in the current landing.
The remaining reserved languages stay `scaffold-per-provider-package` and keep `rootPublicPolicy`
fixed at `none`.

TypeScript provider package boundaries under
`sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-<providerKey>/` must also ship executable
`index.js` and `index.d.ts` entrypoints and declare `exports` for `import`, `default`, and `types`.
TypeScript provider package statuses are standardized as
`root_public_reference_boundary` for builtin root-public package boundaries and
`package_reference_boundary` for executable non-builtin package boundaries.
The assembly-driven `typescriptAdapterStandard` fixes the TypeScript adapter baseline as
`consumer-supplied`, `native-factory`, `must-not-bundle`, `reference-baseline`, and `required`.
The assembly-driven `typescriptPackageStandard` and per-provider `typescriptPackage` contract are
canonical and must not drift:
`@sdkwork/rtc-sdk-provider-<providerKey>`,
`../../src/providers/<providerKey>.ts`,
`create<ProviderPascal>RtcDriver`,
`<PROVIDER_UPPER>_RTC_PROVIDER_METADATA`, and
`<PROVIDER_UPPER>_RTC_PROVIDER_MODULE`.
Legacy TypeScript package-boundary wording such as
`reserved TypeScript provider package boundaries`, `builtin_reference_boundary`, and
`official_reserved_boundary` is invalid in assembly-driven language workspace contracts,
materialized language workspace READMEs, and language workspace catalogs.
The TypeScript runtime bridge baseline for official providers is `reference-baseline`, and it always
keeps the official vendor SDK requirement set to `required`.
Flutter/mobile and the remaining reserved non-TypeScript provider package boundaries must also
materialize one metadata-only source stub per official provider so future adapter work inherits a
deterministic source stub and source symbol layout before runtime code exists.

Language root public entrypoints must also stay standardized wherever the language ecosystem uses a
single package barrel or package initializer:

- Flutter root barrel: `sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart`
- Python package root: `sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/__init__.py`

Those root public entrypoints must re-expose the standard contract, provider catalog, provider
package catalog, provider activation catalog, capability catalog, provider extension catalog,
language workspace catalog, provider-selection helpers, provider-package loader helpers,
provider-support helpers, driver manager, and data source without forcing consumers onto private
module paths.
That exposure rule is materialized in
`sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`, where
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
`RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`, and
`RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS` keep the TypeScript root export graph and the
Flutter/Python single-entrypoint families assembly-governed.

The TypeScript root public entrypoint may additionally expose the provider package loader and
installer SPI because that surface is provider-neutral package-boundary infrastructure, not a
non-builtin driver factory.
The remaining reserved non-TypeScript language workspaces must also reserve one provider-package
loader scaffold per language so future runtime bridge work inherits a deterministic
package-resolution and package-installation boundary before executable adapters land.

Go reserved-language public structs must also export their shared DTO fields in PascalCase so the
standard metadata stays usable from external packages. The required public field family includes
`ProviderKey`, `PluginId`, `DriverId`, `PackageIdentity`, `RuntimeBridgeStatus`, and
`DefaultProviderKey`.

## Workspace Layout

```text
sdkwork-rtc-sdk/
  docs/
  bin/
  test/
  sdkwork-rtc-sdk-typescript/
    providers/
  sdkwork-rtc-sdk-flutter/
  sdkwork-rtc-sdk-rust/
  sdkwork-rtc-sdk-java/
  sdkwork-rtc-sdk-csharp/
  sdkwork-rtc-sdk-swift/
  sdkwork-rtc-sdk-kotlin/
  sdkwork-rtc-sdk-go/
  sdkwork-rtc-sdk-python/
```

## Verification

The root materialization entrypoint is:

```powershell
node .\bin\materialize-sdk.mjs
```

Use it to rematerialize:

- `README.md`
- `docs/README.md`
- `docs/multilanguage-capability-matrix.md`
- official language workspace READMEs, including assembly-driven display names, current roles,
  workspace summaries, and role highlights
- the assembly-driven language workspace catalog at
  `sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts`
- reserved language package/build manifests
- reserved language code-level contract scaffolds
- reserved language workspace catalog assets
- reserved language provider package scaffolds
- reserved language future provider package manifests, READMEs, and metadata-only source stubs
- reserved language metadata scaffolds for provider catalog, provider package catalog, capability
  catalog, provider activation catalog, provider extension catalog, and provider selection
- reserved language resolution scaffolds for driver manager, data source, provider support, and
  provider package loader
- the assembly-driven language workspace catalog matrix inside
  `docs/multilanguage-capability-matrix.md`
- the assembly-driven language-provider activation matrix inside
  `docs/multilanguage-capability-matrix.md`
- the materialized TypeScript provider package catalog at
  `sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts`
- the manual TypeScript provider package loader module at
  `sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts`
- the materialized TypeScript provider catalog at `sdkwork-rtc-sdk-typescript/src/provider-catalog.ts`
- the materialized TypeScript provider activation catalog at
  `sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts`
- the explicit lookup helpers inside the materialized TypeScript language workspace, provider
  package, provider activation, capability, and provider extension catalogs
- the standard TypeScript provider package load-and-install helpers used to resolve package
  boundaries, import provider modules, and atomically install provider adapters
- the materialized TypeScript provider extension catalog at
  `sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts`
- the materialized TypeScript runtime-immutability module at
  `sdkwork-rtc-sdk-typescript/src/runtime-immutability.ts`
- the materialized TypeScript root-public-surface module at
  `sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`
- the assembly-driven default provider constants inside that provider catalog
- the TypeScript vendor SDK contract inside the materialized provider catalog entries
- the TypeScript runtime bridge baseline and official vendor SDK requirement inside the materialized
  provider catalog entries
- the provider extension key mapping inside the materialized provider catalog entries
- TypeScript provider package manifests
- TypeScript provider package `index.js` and `index.d.ts` entrypoints
- TypeScript provider package READMEs
- the TypeScript vendor SDK contract inside each provider package manifest and README
- the TypeScript runtime bridge baseline contract inside each provider package manifest and README
- the required and optional provider capability lists inside each provider package manifest and README
- the provider extension keys inside each provider package manifest and README
- stale legacy generated assets such as `sdkwork-rtc-sdk-typescript/src/providers/catalog.ts`

The root verification entrypoint is:

```powershell
node .\bin\verify-sdk.mjs
```

The root full regression entrypoint is:

```powershell
node .\bin\smoke-sdk.mjs
```

The fast public call smoke entrypoints are:

```powershell
node .\bin\sdk-call-smoke.mjs --json
node .\bin\sdk-call-smoke.mjs --json --reuse-live-connection
node .\bin\sdk-call-smoke.mjs --language flutter --json
node .\bin\sdk-call-smoke.mjs --language flutter --json --reuse-live-connection
```

The root smoke dispatcher forwards language-specific arguments unchanged, so standard variants such
as `--reuse-live-connection` stay part of the public RTC smoke contract.

Run the full regression command before describing the RTC SDK workspace as complete. It executes
materialization, root automation tests, root verification, TypeScript package tests, the default
and shared-`liveConnection` call-smoke variants for executable languages, and optional language
smoke checks when the corresponding toolchains are installed.

The verifier is responsible for:

- root docs presence
- root documentation clause coverage for provider package entrypoints and default provider constants
- root documentation clause coverage for capability negotiation and degradation semantics
- root documentation clause coverage for provider extension metadata semantics
- TypeScript provider selection standard presence and token coverage
- TypeScript provider support standard presence and token coverage
- assembly metadata alignment
- exact materialized standard asset alignment, not just presence
- stale legacy generated asset rejection
- official language workspace presence
- language workspace catalog presence
- TypeScript executable baseline presence
- built-in provider baseline presence
- TypeScript provider package boundary presence
- reserved language provider package scaffold presence
- reserved language future provider package boundary presence
- reserved language provider package source stub presence
- reserved language provider package loader scaffold presence

## Ownership Rules

The root `.gitignore` is part of the RTC workspace contract.
Verification and smoke commands are allowed to create local non-source artifacts such as
`sdkwork-rtc-sdk-typescript/dist/`, `sdkwork-rtc-sdk-rust/target/`,
`sdkwork-rtc-sdk-java/target/`, `sdkwork-rtc-sdk-csharp/src/**/bin/`,
`sdkwork-rtc-sdk-csharp/src/**/obj/`, and `sdkwork-rtc-sdk-python/**/__pycache__/`.
Those directories are build outputs, not contract inputs, and they must stay ignored instead of
being treated as source drift.

The assembly snapshot `.sdkwork-assembly.json` remains checked-in source of truth.
It must not be ignored or relocated into transient local state.

## Related Docs

- `docs/README.md`
- `docs/package-standards.md`
- `docs/provider-adapter-standard.md`
- `docs/multilanguage-capability-matrix.md`
- `docs/verification-matrix.md`
