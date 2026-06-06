# RTC SDK Package Standards

This document defines the package-contract rules that apply inside `sdks/sdkwork-rtc-sdk`.

## TypeScript Standard

The TypeScript RTC SDK uses one official consumer package:

- workspace: `sdkwork-rtc-sdk-typescript`
- package: `@sdkwork/rtc-sdk`
- primary runtime surface: provider-neutral RTC semantic SDK

Rules:

- provider-neutral contracts live under `src/**` outside `src/providers/**`
- provider adapters live only under `src/providers/**`
- provider static metadata lives in `.sdkwork-assembly.json` and the materialized
  `src/provider-catalog.ts`, not inside hand-written adapter modules
- capability descriptors live in `.sdkwork-assembly.json` as `capabilityCatalog` and materialize
  into `src/capability-catalog.ts`
- provider extension descriptors live in `.sdkwork-assembly.json` as `providerExtensionCatalog`
  and materialize into `src/provider-extension-catalog.ts`
- language workspace descriptors live in `.sdkwork-assembly.json` as `languages[]` and materialize
  into `src/language-workspace-catalog.ts`
- provider activation descriptors for the TypeScript baseline live in `.sdkwork-assembly.json` as
  `languages[].providerActivations` and materialize into `src/provider-activation-catalog.ts`
- provider package descriptors for the TypeScript baseline materialize into
  `src/provider-package-catalog.ts`
- provider selection helpers live in `src/provider-selection.ts`
- capability negotiation helpers live in `src/capability-negotiation.ts`
- provider support helpers live in `src/provider-support.ts`
- the materialized provider catalog must expose `DEFAULT_RTC_PROVIDER_KEY`,
  `DEFAULT_RTC_PROVIDER_PLUGIN_ID`, and `DEFAULT_RTC_PROVIDER_DRIVER_ID`
- the materialized provider catalog must also expose `getBuiltinRtcProviderMetadataByKey(...)` and
  `getOfficialRtcProviderMetadataByKey(...)` so provider metadata lookup stays standard across the
  root SDK and direct catalog consumers
- the materialized provider catalog must also expose `getRtcProviderByProviderKey(...)` so
  cross-language provider-catalog lookup semantics stay explicit by provider key
- the materialized provider catalog must also expose the TypeScript vendor SDK contract for every
  official provider
- the materialized provider catalog must also expose the assembly-driven `typescriptPackage`
  contract for every official provider
- the materialized provider catalog must also expose `extensionKeys` for every official provider
- the materialized language workspace catalog must also expose
  `getRtcLanguageWorkspaceByLanguage(...)` so language workspace lookup stays explicit by language
- the materialized provider activation catalog must also expose
  `getRtcProviderActivationByProviderKey(...)` so provider activation lookup stays explicit by
  provider key
- the materialized capability catalog must also expose `getRtcCapabilityDescriptor(...)` so
  capability lookup stays explicit by capability key
- the materialized provider package catalog must expose one machine-readable package-boundary entry
  per official provider, including manifest path, README path, executable entrypoint path,
  declaration path, source module, driver factory, metadata symbol, module symbol, root-public
  policy, runtime bridge status, and provider extension keys
- the materialized provider package catalog must also expose
  `getRtcProviderPackageByProviderKey(...)` and
  `getRtcProviderPackageByPackageIdentity(...)` so provider package boundary lookup stays explicit
  by provider key and package identity
- the TypeScript provider package loader module must expose
  `RtcProviderPackageLoadRequest`, `RtcProviderPackageLoader`,
  `createRtcProviderPackageLoader(...)`, `resolveRtcProviderPackageLoadTarget(...)`,
  `loadRtcProviderModule(...)`, `installRtcProviderPackage(...)`, and
  `installRtcProviderPackages(...)`
- the TypeScript provider package loader module must keep package loading runtime agnostic by
  accepting a caller-supplied package import function instead of scanning the filesystem
- the TypeScript provider package loader module must fail with
  `provider_package_not_found`, `provider_package_identity_mismatch`,
  `provider_package_load_failed`, and `provider_module_export_missing` when package-boundary
  loading cannot satisfy the standard contract
- the materialized provider extension catalog must also expose
  `getRtcProviderExtensionDescriptor(...)`, `getRtcProviderExtensionsForProvider(...)`, and
  `hasRtcProviderExtension(...)` so provider extension lookup stays explicit by extension key,
  provider key, and selected extension set
- Flutter/mobile metadata modules and the remaining reserved non-TypeScript metadata scaffolds must
  keep the same explicit lookup semantics
  with language-idiomatic helper names:
  `getRtcProviderByProviderKey(...)` / `GetRtcProviderByProviderKey(...)` /
  `get_rtc_provider_by_provider_key(...)`, plus provider package lookup by provider key and
  package identity, and the corresponding capability and provider-extension helper families
- `lookupHelperNamingStandard` is the canonical source for those helper families and for the
  `lower-camel-rtc`, `upper-camel-rtc`, and `snake-case-rtc` naming profiles
- Flutter/mobile and the remaining reserved non-TypeScript language workspaces must also expose
  standalone provider selection helpers with language-idiomatic names for source catalogs,
  precedence catalogs, provider-URL parsing, and selection resolution instead of burying
  precedence inside `RtcDriverManager`
- the provider selection module must expose `RtcProviderSelectionRequest`,
  `RTC_PROVIDER_SELECTION_SOURCES`, `RTC_PROVIDER_SELECTION_PRECEDENCE`,
  `parseRtcProviderUrl(...)`, and `resolveRtcProviderSelection(...)`
- `.sdkwork-assembly.json` must declare `providerSelectionStandard.sourceTerms`,
  `providerSelectionStandard.precedence`, and `providerSelectionStandard.defaultSource`
- the provider selection precedence order is fixed as `provider_url`, `provider_key`,
  `tenant_override`, `deployment_profile`, and `default_provider`
- Flutter/mobile resolution modules and the remaining reserved non-TypeScript language resolution
  scaffolds must delegate provider-selection resolution to that standalone helper module and keep
  driver-manager code free of duplicated precedence rules
- the provider support module must expose `RtcProviderSupportStateRequest`,
  `RTC_PROVIDER_SUPPORT_STATUSES`, `resolveRtcProviderSupportStatus(...)`, and
  `createRtcProviderSupportState(...)`
- `.sdkwork-assembly.json` must declare `providerSupportStandard.statusTerms`
- the provider support status set is fixed as `builtin_registered`, `official_registered`,
  `official_unregistered`, and `unknown`
- the capability negotiation module must expose `RTC_CAPABILITY_NEGOTIATION_STATUSES`,
  `RTC_CAPABILITY_NEGOTIATION_RULES`, and `resolveRtcCapabilityNegotiationStatus(...)`
- `.sdkwork-assembly.json` must declare `capabilityNegotiationStandard.statusTerms` and
  `capabilityNegotiationStandard.statusRules`
- the runtime surface module must expose `RTC_RUNTIME_SURFACE_METHODS`,
  `RTC_RUNTIME_SURFACE_FAILURE_CODE`, and `RTC_RUNTIME_SURFACE_STANDARD`
- `.sdkwork-assembly.json` must declare `runtimeSurfaceStandard.methodTerms` and
  `runtimeSurfaceStandard.failureCode`
- the TypeScript signaling-transport module must expose `RTC_SIGNALING_TRANSPORT_TERM`,
  `RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH`,
  `RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM`,
  `RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS`,
  `RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE`,
  `RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM`,
  `RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM`,
  `RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM`,
  `RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM`,
  `RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM`, and `RTC_SIGNALING_TRANSPORT_STANDARD`
- the Flutter signaling-transport module must expose `rtcSignalingTransportTerm`,
  `rtcSignalingTransportAuthConfigPath`,
  `rtcSignalingTransportAuthPassThroughTerm`,
  `rtcSignalingTransportAuthModeTerms`,
  `rtcSignalingTransportRecommendedAuthMode`,
  `rtcSignalingTransportDeviceIdAuthorityTerm`,
  `rtcSignalingTransportConnectOptionsDeviceIdRuleTerm`,
  `rtcSignalingTransportLiveConnectionTerm`,
  `rtcSignalingTransportPollingFallbackTerm`,
  `rtcSignalingTransportAuthFailureTerm`, and `rtcSignalingTransportStandard`
- `.sdkwork-assembly.json` must declare `signalingTransportStandard.transportTerm`,
  `signalingTransportStandard.authConfigPath`,
  `signalingTransportStandard.authPassThroughTerm`,
  `signalingTransportStandard.authModeTerms`,
  `signalingTransportStandard.recommendedAuthMode`,
  `signalingTransportStandard.deviceIdAuthorityTerm`,
  `signalingTransportStandard.connectOptionsDeviceIdRuleTerm`,
  `signalingTransportStandard.liveConnectionTerm`,
  `signalingTransportStandard.pollingFallbackTerm`, and
  `signalingTransportStandard.authFailureTerm`
- the runtime immutability module must expose `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, and
  `RTC_RUNTIME_IMMUTABILITY_STANDARD`
- `.sdkwork-assembly.json` must declare `runtimeImmutabilityStandard.frozenTerm`,
  `runtimeImmutabilityStandard.snapshotTerm`,
  `runtimeImmutabilityStandard.controllerContextTerm`, and
  `runtimeImmutabilityStandard.nativeClientTerm`
- the root-public-surface module must expose
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, and
  `RTC_ROOT_PUBLIC_SURFACE_STANDARD`
- the lookup-helper-naming module must expose
  `RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`,
  `RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, and `RTC_LOOKUP_HELPER_NAMING_STANDARD`
- `.sdkwork-assembly.json` must declare
  `rootPublicSurfaceStandard.typescriptProviderNeutralExportPaths`,
  `rootPublicSurfaceStandard.typescriptBuiltinProviderExportPaths`,
  `rootPublicSurfaceStandard.typescriptInlineHelperNames`,
  `rootPublicSurfaceStandard.reservedSurfaceFamilies`,
  `rootPublicSurfaceStandard.reservedEntryPointKinds`,
  `rootPublicSurfaceStandard.builtinProviderExposureTerm`, and
  `rootPublicSurfaceStandard.nonBuiltinProviderExposureTerm`
- `.sdkwork-assembly.json` must declare `lookupHelperNamingStandard.profileTerms`,
  `lookupHelperNamingStandard.familyTerms`, and `lookupHelperNamingStandard.profiles`
- the errors module must expose `RTC_SDK_ERROR_CODES`, `RTC_SDK_ERROR_FALLBACK_CODE`,
  and `RtcSdkException`
- `.sdkwork-assembly.json` must declare `errorCodeStandard.codeTerms` and
  `errorCodeStandard.fallbackCode`
- Flutter/mobile resolution modules and the remaining reserved non-TypeScript language resolution
  scaffolds must delegate provider-support classification to that standalone helper module after
  provider catalog and provider activation lookup instead of re-embedding status logic inside
  driver managers
- the remaining reserved non-TypeScript language resolution scaffolds must also expose a
  standalone provider package loader module through
  `resolutionScaffold.providerPackageLoaderRelativePath`
- that reserved provider package loader module must preserve `RtcProviderPackageLoadRequest`,
  `RtcResolvedProviderPackageLoadTarget`, `RtcProviderPackageLoader`,
  `createRtcProviderPackageLoader(...)`, `resolveRtcProviderPackageLoadTarget(...)`,
  `loadRtcProviderModule(...)`, `installRtcProviderPackage(...)`, and
  `installRtcProviderPackages(...)` with language-idiomatic naming
- that reserved provider package loader module must keep package-boundary lookup explicit through
  provider-key and package-identity helpers instead of ad hoc array scans
- that reserved provider package loader module must preserve the stable failure codes
  `provider_package_not_found`, `provider_package_identity_mismatch`,
  `provider_package_load_failed`, and `provider_module_export_missing` until an executable runtime
  bridge is verified
- the materialized capability catalog must expose one descriptor per capability with a
  `category` and `surface`
- the materialized capability catalog must keep `getRtcCapabilityCatalog(...)` and
  `getRtcCapabilityDescriptor(...)` stable inside the executable TypeScript baseline
- the materialized provider extension catalog must keep `getRtcProviderExtensionCatalog(...)`,
  `getRtcProviderExtensionDescriptor(...)`, `getRtcProviderExtensionsForProvider(...)`,
  `getRtcProviderExtensions(...)`, and `hasRtcProviderExtension(...)` stable inside the executable
  TypeScript baseline
- the materialized provider catalog, capability catalog, provider extension catalog, and builtin
  provider module list must be `runtime-frozen` so assembly-driven standard metadata cannot be
  mutated by downstream consumers at runtime
- the materialized provider package catalog must also be `runtime-frozen`
- runtime-created standard contract objects must also be immutable snapshots, including capability
  sets, provider metadata snapshots, provider selections, provider support descriptors, capability
  support descriptors, and capability negotiation results
- provider drivers must snapshot and freeze their metadata contract instead of retaining mutable
  caller-owned metadata references
- `category` values are standardized as `required-baseline` or `optional-advanced`
- `surface` values are standardized as `control-plane`, `runtime-bridge`, or `cross-surface`
- provider extension access values are standardized as `unwrap-only` or `extension-object`
- provider extension status values are standardized as `reference-baseline` or `reserved`
- `capabilityStandard` is the canonical source for capability `categoryTerms` and `surfaceTerms`
- `capabilityNegotiationStandard` is the canonical source for capability negotiation `statusTerms`
  and `statusRules`
- `runtimeSurfaceStandard` is the canonical source for provider-neutral runtime method vocabulary
  and missing-runtime failure semantics
- `signalingTransportStandard` is the canonical source for WebSocket-only RTC signaling,
  `connectOptions.webSocketAuth`, auth pass-through, canonical auth modes, recommended
  `automatic` auth, authoritative `deviceId`, `liveConnection` reuse, no-polling policy, and
  fail-fast auth behavior
- `runtimeImmutabilityStandard` is the canonical source for runtime-frozen metadata, immutable
  snapshot semantics, shallow-immutable runtime-controller context semantics, and mutable
  native-client preservation semantics
- `errorCodeStandard` is the canonical source for the shared RTC SDK error vocabulary and fallback
  semantics
- `providerExtensionStandard` is the canonical source for provider extension `accessTerms` and
  `statusTerms`
- `providerTierStandard` is the canonical source for provider `tierTerms` and `tierSummaries`
- `languageMaturityStandard` is the canonical source for workspace `tierTerms` and `tierSummaries`
- capability negotiation status values are standardized as `supported`, `degraded`, and
  `unsupported`
- RTC SDK error values are standardized as `provider_package_not_found`,
  `provider_package_identity_mismatch`, `provider_package_load_failed`,
  `provider_module_export_missing`, `provider_module_contract_mismatch`,
  `driver_already_registered`, `driver_not_found`, `provider_not_official`,
  `provider_not_supported`, `provider_metadata_mismatch`, `provider_selection_failed`,
  `capability_not_supported`, `invalid_provider_url`, `native_sdk_not_available`, and
  `vendor_error`
- the shared RTC SDK fallback error must stay `vendor_error`
- provider package boundaries live under `providers/rtc-sdk-provider-<providerKey>/`
- every provider package must publish executable `index.js` and `index.d.ts` entrypoints
- every provider package manifest must declare `exports` so `import` and `default` resolve to
  `index.js` and `types` resolve to `index.d.ts`
- TypeScript provider package status values are standardized as
  `root_public_reference_boundary` for builtin root-public package boundaries and
  `package_reference_boundary` for executable non-builtin package boundaries
- assembly-driven TypeScript language role highlights, the TypeScript workspace README, and every
  materialized language workspace catalog must use that exact status vocabulary for TypeScript
  package-boundary descriptions
- legacy TypeScript package-boundary wording such as
  `reserved TypeScript provider package boundaries`, `builtin_reference_boundary`, and
  `official_reserved_boundary` is forbidden in assembly-driven language workspace contracts and
  materialized language workspace assets
- every provider package manifest must declare the TypeScript vendor SDK contract:
  `consumer-supplied` provisioning, `native-factory` binding, and `must-not-bundle`
  bundle policy
- every provider package manifest must also declare the TypeScript runtime bridge baseline:
  `reference-baseline` runtime bridge status with an official vendor SDK requirement of `required`
- every provider package manifest must declare the assembly-driven `requiredCapabilities` and
  `optionalCapabilities` lists so call audio, call video, live broadcast, and live audience support
  are visible at the independent package boundary
- the top-level `typescriptAdapterStandard` owns that TypeScript vendor SDK contract vocabulary and
  the canonical `referenceContract` baseline used by provider packages and runtime documentation
- the provider-neutral runtime surface is fixed as `join`, `leave`, `publish`, `unpublish`,
  `muteAudio`, and `muteVideo`
- the TypeScript runtime surface module must keep `RTC_RUNTIME_SURFACE_METHODS` and
  `RTC_RUNTIME_SURFACE_FAILURE_CODE` aligned to `runtimeSurfaceStandard`
- the TypeScript signaling-transport module must keep
  `RTC_SIGNALING_TRANSPORT_TERM`,
  `RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH`,
  `RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM`,
  `RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS`,
  `RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE`,
  `RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM`,
  `RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM`,
  `RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM`,
  `RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM`,
  `RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM`, and
  `RTC_SIGNALING_TRANSPORT_STANDARD` aligned to `signalingTransportStandard`
- the Flutter signaling-transport module must keep
  `rtcSignalingTransportTerm`,
  `rtcSignalingTransportAuthConfigPath`,
  `rtcSignalingTransportAuthPassThroughTerm`,
  `rtcSignalingTransportAuthModeTerms`,
  `rtcSignalingTransportRecommendedAuthMode`,
  `rtcSignalingTransportDeviceIdAuthorityTerm`,
  `rtcSignalingTransportConnectOptionsDeviceIdRuleTerm`,
  `rtcSignalingTransportLiveConnectionTerm`,
  `rtcSignalingTransportPollingFallbackTerm`,
  `rtcSignalingTransportAuthFailureTerm`, and
  `rtcSignalingTransportStandard` aligned to `signalingTransportStandard`
- the TypeScript runtime-immutability module must keep
  `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, and
  `RTC_RUNTIME_IMMUTABILITY_STANDARD` aligned to `runtimeImmutabilityStandard`
- `rootPublicSurfaceStandard` is the canonical source for the TypeScript root export graph,
  builtin-provider root exposure, reserved single-entrypoint surface families, and the
  `root-public-builtin-only` plus `package-boundary-only` exposure terms
- the TypeScript root-public-surface module must keep
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, and
  `RTC_ROOT_PUBLIC_SURFACE_STANDARD` aligned to `rootPublicSurfaceStandard`
- `lookupHelperNamingStandard` is the canonical source for reserved-language helper families and
  the `lower-camel-rtc`, `upper-camel-rtc`, and `snake-case-rtc` naming profiles
- the TypeScript lookup-helper-naming module must keep
  `RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`,
  `RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, and `RTC_LOOKUP_HELPER_NAMING_STANDARD` aligned to
  `lookupHelperNamingStandard`
- provider adapters must forward the consumer-supplied `runtimeController` into the shared driver
  contract instead of implementing provider-private lifecycle entrypoints
- runtime-controller context wrappers must stay `shallow-immutable-context` while preserving a
  `mutable-native-client` reference so vendor SDK objects are not frozen by the standard layer
- the shared runtime surface must throw `native_sdk_not_available` when no runtime bridge has been
  supplied
- downstream consumers import only from `@sdkwork/rtc-sdk`
- downstream consumers must not import provider-private source paths
- the root public entrypoint may expose core contracts, official provider catalog metadata, and
  builtin helper wiring, but it must not expose non-builtin provider driver factories
- the root public entrypoint may expose builtin provider modules, but it must not expose future
  non-builtin provider modules
- `root-public-builtin-only` is the canonical exposure term for builtin provider modules that may
  cross the TypeScript root public boundary
- `package-boundary-only` is the canonical exposure term for non-builtin provider factories and
  modules that must stay outside the TypeScript root public boundary
- the root public entrypoint may expose the provider package loader and installer SPI because it is
  provider-neutral package-boundary infrastructure, not a non-builtin driver factory
- the root public entrypoint may expose `RTC_RUNTIME_SURFACE_METHODS` and
  `RTC_RUNTIME_SURFACE_FAILURE_CODE` because they are provider-neutral runtime surface constants
- the root public entrypoint may expose `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, and `RTC_RUNTIME_IMMUTABILITY_STANDARD` because
  they are provider-neutral runtime immutability constants
- reserved root public entrypoints must stay assembly-governed where the language ecosystem expects
  a single barrel or package initializer, including `sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart`
  and `sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/__init__.py`
- those reserved root public entrypoints must re-export the standard contract, provider catalog,
  provider package catalog, provider activation catalog, capability catalog, provider extension
  catalog, language workspace catalog, provider selection, provider package loader, provider
  support, driver manager, and data source surfaces instead of pushing consumers onto private
  submodules
- `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES` and
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS` are the canonical root-public-surface
  constants for those reserved single-entrypoint families
- reserved Go metadata and resolution DTOs must expose PascalCase public fields such as
  `ProviderKey`, `PluginId`, `DriverId`, `PackageIdentity`, `RuntimeBridgeStatus`, and
  `DefaultProviderKey` so the standard structs remain consumable outside the package
- builtin provider module objects must be `runtime-frozen` together with their shared metadata
  references so provider package boundary contracts remain immutable after load
- every provider package manifest must bind to one real source module and declare its driver
  factory, metadata symbol, module symbol, and root-public exposure policy
- the assembly-driven `typescriptPackageStandard` owns the canonical TypeScript package naming
  patterns, not ad hoc helpers or handwritten conventions
- the assembly-driven TypeScript package contract is canonical, not free-form:
  `typescriptPackage.packageName` must equal `@sdkwork/rtc-sdk-provider-<providerKey>`
- the assembly-driven TypeScript package contract is canonical, not free-form:
  `typescriptPackage.sourceModule` must equal `../../src/providers/<providerKey>.ts`
- the assembly-driven TypeScript package contract is canonical, not free-form:
  `typescriptPackage.driverFactory` must equal `create<ProviderPascal>RtcDriver`
- the assembly-driven TypeScript package contract is canonical, not free-form:
  `typescriptPackage.metadataSymbol` must equal `<PROVIDER_UPPER>_RTC_PROVIDER_METADATA`
- the assembly-driven TypeScript package contract is canonical, not free-form:
  `typescriptPackage.moduleSymbol` must equal `<PROVIDER_UPPER>_RTC_PROVIDER_MODULE`
- every provider package manifest must align its package name, source module, driver factory,
  metadata symbol, module symbol, and root-public exposure policy with the provider
  `typescriptPackage` contract declared in `.sdkwork-assembly.json`
- every provider package manifest and README must declare the provider extension keys that are bound
  to that package
- every provider package manifest and README must also declare the provider capability lists that
  are bound to that package
- every provider package README and entrypoint file is materialized output and must stay aligned
  with the manifest-declared provider contract
- every materialized asset must exactly match the root materializer output; local edits to generated
  READMEs, manifests, or provider catalog files are invalid drift

## Cross-Language Standard

Every official language workspace must declare:

- the assembly-driven `displayName`
- the language workspace catalog path as `workspaceCatalogRelativePath`
- the public package name
- whether it currently ships control SDK support
- whether it currently ships runtime bridge support
- the current maturity tier
- the current role summary as `currentRole`
- the workspace summary text as `workspaceSummary`
- the role highlight list as `roleHighlights`, materialized into the workspace README
- the per-provider activation matrix as `providerActivations`
- the workspace-wide capability descriptor catalog as `capabilityCatalog`

Every official language workspace must also materialize a language workspace catalog so language
identity, package identity, runtime/control support, maturity tier, and role highlights stay
machine-readable without scraping README prose.
Each language workspace catalog entry must also preserve a machine-readable
`defaultProviderContract` with `providerKey`, `pluginId`, and `driverId` aligned to the
assembly-driven default provider identity, a machine-readable `providerSelectionContract` aligned
to `providerSelectionStandard`, and a machine-readable `providerSupportContract` aligned to
`providerSupportStandard`.
Each language workspace catalog entry must also preserve a machine-readable
`providerActivationContract` aligned to `providerActivationStandard`.
Each language workspace catalog entry must also preserve a machine-readable
`providerPackageBoundaryContract` aligned to `providerPackageBoundaryStandard`.

Allowed `providerActivations[].activationStatus` values in the current standard:

- `root-public-builtin` for providers that are runtime-available through the language root public API
- `package-boundary` for providers that are runtime-available only through a one-provider package
  boundary and are not root-public
- `control-metadata-only` for providers that are present only as control-plane metadata and
  selection entries, without a runtime bridge

Allowed maturity tiers in the current standard:

- `reference` for the executable baseline language workspace
- `reserved` for official but not yet executable runtime-bridge workspaces

No language workspace may claim runtime bridge support when no official vendor SDK baseline exists.

Every official non-TypeScript reserved workspace must also declare a `contractScaffold` in
`.sdkwork-assembly.json` and ship the referenced code-level scaffold file.
That scaffold file must preserve the standard core abstraction names:

- `RtcProviderDriver`
- `RtcDriverManager`
- `RtcDataSource`
- `RtcClient`
- `RtcRuntimeController`

Reserved language scaffolds may stay non-executable, but they must not hide provider-specific
logic, fake runtime bridge support, or invent a language-private abstraction model that diverges
from the JDBC-style core contract.

Every official non-TypeScript reserved workspace must also declare a `packageScaffold` in
`.sdkwork-assembly.json` and ship the referenced package/build manifest file.
That package scaffold must declare:

- the reserved language build system
- the manifest file path
- the public package identity declared by the language workspace

Reserved package scaffolds may stay minimal, but they must be real package boundaries rather than
empty placeholder folders.
Future runtime bridge work must extend these package scaffolds instead of replacing them with
language-private layouts that break the cross-language standard.

Every official language workspace must also declare a `providerPackageBoundary` in
`.sdkwork-assembly.json`.
That cross-language boundary summary is the canonical topology contract exposed through the
language workspace catalog and must declare:

- `defaultProviderContract.providerKey` as the default provider key for that language workspace
- `defaultProviderContract.pluginId` as the default provider plugin id for that language workspace
- `defaultProviderContract.driverId` as the default provider driver id for that language workspace
- `providerSelectionContract.sourceTerms` as the canonical selection-source vocabulary used by that
  language workspace
- `providerSelectionContract.precedence` as the canonical provider-selection precedence order used
  by that language workspace
- `providerSelectionContract.defaultSource` as the canonical fallback selection source used by that
  language workspace
- `providerSupportContract.statusTerms` as the canonical provider-support vocabulary used by that
  language workspace
- `providerActivationContract.statusTerms` as the canonical provider-activation vocabulary used by
  that language workspace
- `providerPackageBoundaryContract.modeTerms` as the canonical package-boundary mode vocabulary
- `providerPackageBoundaryContract.rootPublicPolicyTerms` as the canonical root-public-policy
  vocabulary
- `providerPackageBoundaryContract.lifecycleStatusTerms` as the canonical package-boundary
  lifecycle vocabulary
- `providerPackageBoundaryContract.runtimeBridgeStatusTerms` as the canonical package-boundary
  runtime-bridge vocabulary
- `providerPackageBoundary.mode` as the language-wide package-boundary mode
- `providerPackageBoundary.rootPublicPolicy` as the language-wide root public exposure policy
- `providerPackageBoundary.lifecycleStatusTerms` as the canonical lifecycle vocabulary used by that
  language workspace
- `providerPackageBoundary.runtimeBridgeStatusTerms` as the canonical runtime-bridge-status
  vocabulary used by that language workspace

The current standard fixes only two legal modes:

- TypeScript uses `catalog-governed-mixed`
- Flutter/mobile and the remaining reserved non-TypeScript workspaces use
  `scaffold-per-provider-package`

The current standard fixes only two legal root public policies:

- TypeScript uses `builtin-only`
- Flutter/mobile and the remaining reserved non-TypeScript workspaces use `none`

The current standard also fixes the boundary vocabularies:

- every language `providerSelectionContract.sourceTerms` must be
  `provider_url`, `provider_key`, `tenant_override`, `deployment_profile`, `default_provider`
- every language `providerSelectionContract.precedence` must be
  `provider_url`, `provider_key`, `tenant_override`, `deployment_profile`, `default_provider`
- every language `providerSelectionContract.defaultSource` must be `default_provider`
- every language `providerSupportContract.statusTerms` must be
  `builtin_registered`, `official_registered`, `official_unregistered`, `unknown`
- every language `providerActivationContract.statusTerms` must be
  `root-public-builtin`, `package-boundary`, `control-metadata-only`
- every language `providerPackageBoundaryContract.modeTerms` must be
  `catalog-governed-mixed`, `scaffold-per-provider-package`
- every language `providerPackageBoundaryContract.rootPublicPolicyTerms` must be
  `builtin-only`, `none`
- every language `providerPackageBoundaryContract.lifecycleStatusTerms` must be
  `root_public_reference_boundary`, `package_reference_boundary`, `future-runtime-bridge-only`
- every language `providerPackageBoundaryContract.runtimeBridgeStatusTerms` must be
  `reference-baseline`, `reserved`
- TypeScript `providerPackageBoundary.lifecycleStatusTerms` must be
  `root_public_reference_boundary` and `package_reference_boundary`
- TypeScript `providerPackageBoundary.runtimeBridgeStatusTerms` must be
  `reference-baseline`
- the remaining reserved non-TypeScript language workspaces must keep
  `providerPackageBoundary.lifecycleStatusTerms` fixed at `future-runtime-bridge-only`
- the remaining reserved non-TypeScript language workspaces must keep
  `providerPackageBoundary.runtimeBridgeStatusTerms` fixed at `reserved`

Every official non-TypeScript reserved workspace must also declare a `providerPackageScaffold` in
`.sdkwork-assembly.json` and ship the referenced provider package scaffold file.
That provider package scaffold must declare:

- `providerPackageScaffold.relativePath` as the scaffold file path
- `providerPackageScaffold.directoryPattern` as the per-provider directory pattern
- `providerPackageScaffold.packagePattern` as the per-provider package identity pattern
- `providerPackageScaffold.manifestFileName` as the provider-package manifest file name
- `providerPackageScaffold.readmeFileName` as the provider-package README file name
- `providerPackageScaffold.sourceFilePattern` as the provider-package source stub relative path
- `providerPackageScaffold.sourceSymbolPattern` as the provider-package source symbol pattern
- `providerPackageScaffold.templateTokens` as the exact template-token set used by the provider
  directory, package, and manifest patterns
- `providerPackageScaffold.sourceTemplateTokens` as the exact template-token set used by the
  provider source file and source symbol patterns
- `providerPackageScaffold.runtimeBridgeStatus` as the reserved provider-package runtime bridge
  status
- `providerPackageScaffold.rootPublic` as the reserved provider-package root public exposure policy
- `providerPackageScaffold.status` as the reserved provider-package lifecycle status

Allowed provider package template tokens in the current standard:

- `{providerKey}`
- `{providerPascal}`

`providerPackageScaffold.templateTokens` must be the exact set of template tokens used by
`providerPackageScaffold.directoryPattern`, `providerPackageScaffold.packagePattern`, and
`providerPackageScaffold.manifestFileName`.
`providerPackageScaffold.sourceTemplateTokens` must be the exact set of template tokens used by
`providerPackageScaffold.sourceFilePattern` and `providerPackageScaffold.sourceSymbolPattern`.
No reserved language may introduce undeclared template tokens or language-private placeholders.

Reserved provider package scaffolds must keep one-provider-only package boundaries explicit before
runtime bridge work starts.
They must preserve these rules:

- one provider per package boundary
- `providerPackageBoundary.mode` stays fixed at `scaffold-per-provider-package`
- `providerPackageBoundary.rootPublicPolicy` stays fixed at `none`
- `providerPackageBoundary.lifecycleStatusTerms` stays exactly aligned with the concrete
  `providerPackageScaffold.status` value
- `providerPackageBoundary.runtimeBridgeStatusTerms` stays exactly aligned with the concrete
  `providerPackageScaffold.runtimeBridgeStatus` value
- `status` stays fixed at `future-runtime-bridge-only`
- `runtimeBridgeStatus` stays fixed at `reserved`
- `rootPublic` stays fixed at `false`
- the package stays outside the root public API by default
- package identity stays assembly-governed instead of ad hoc per language
- every official provider gets a materialized reserved package boundary directory with the declared
  manifest file, README file, and metadata-only source stub
- provider packages wrap the official vendor SDK instead of re-implementing media runtime
- provider packages preserve `providerKey`, `pluginId`, and `driverId` alignment with the official
  provider catalog
- provider packages preserve `requiredCapabilities` and `optionalCapabilities` alignment with the
  official provider catalog
- provider package source stubs keep a deterministic source symbol and do not claim a runtime
  bridge before one is verified

Every official non-TypeScript reserved workspace must also declare a `metadataScaffold` in
`.sdkwork-assembly.json` and ship the referenced metadata files:

- provider catalog
- provider package catalog
- provider activation catalog
- capability catalog
- provider extension catalog
- provider selection contract

Reserved metadata scaffolds must stay provider-neutral and assembly-aligned.
They must preserve the standard metadata tokens:

- `RtcProviderCatalog`
- `DEFAULT_RTC_PROVIDER_KEY`
- `providerKey`
- `pluginId`
- `driverId`
- `RtcProviderPackageCatalog`
- `packageIdentity`
- `manifestPath`
- `readmePath`
- `sourcePath`
- `sourceSymbol`
- `builtin`
- `rootPublic`
- `RtcProviderActivationCatalog`
- `activationStatus`
- `runtimeBridge`
- `packageBoundary`
- `RtcCapabilityCatalog`
- `capabilityKey`
- `category`
- `surface`
- `RtcProviderExtensionCatalog`
- `extensionKey`
- `displayName`
- `access`
- `status`
- `RtcProviderSelection`
- `providerUrl`
- `tenantOverrideProviderKey`
- `deploymentProfileProviderKey`

The `metadataScaffold` contract therefore requires these relative-path fields:

- `providerCatalogRelativePath`
- `providerPackageCatalogRelativePath`
- `providerActivationCatalogRelativePath`
- `capabilityCatalogRelativePath`
- `providerExtensionCatalogRelativePath`
- `providerSelectionRelativePath`

These reserved metadata layers are not runtime implementations.
They exist so every future language implementation starts from the same provider registry,
capability vocabulary, and selection semantics instead of inventing local conventions.
The provider package catalog closes the package-discovery gap by making every official provider
package identity, manifest path, README path, metadata-only source path, and source symbol
assembly-driven instead of directory-scan driven.
The language workspace catalog closes the workspace-discovery gap by making every official language
workspace identity, package identity, maturity tier, control/runtime support state, current role,
workspace summary, and role highlights machine-readable inside each language workspace.
The provider activation catalog closes the activation-discovery gap by making every official
provider activation status, runtime-bridge flag, root-public flag, package-boundary flag, builtin
flag, and package identity machine-readable inside each language workspace.

Every official non-TypeScript reserved workspace must also declare a `resolutionScaffold` in
`.sdkwork-assembly.json` and ship the referenced metadata-only resolution files:

- driver manager
- data source
- provider support
- provider package loader

That `resolutionScaffold` contract must keep `driverManagerRelativePath`,
`dataSourceRelativePath`, `providerSupportRelativePath`, and
`providerPackageLoaderRelativePath` explicit in assembly metadata so each language workspace has a
deterministic public file boundary for future runtime integration.

Reserved resolution scaffolds must stay provider-neutral and assembly-aligned.
They must preserve the standard resolution tokens:

- `RtcDriverManager`
- `resolveSelection`
- `describeProviderSupport`
- `listProviderSupport`
- `RtcDataSource`
- `RtcDataSourceOptions`
- `describeSelection`
- `defaultProviderKey`
- `RtcProviderSupport`
- `builtin`
- `official`
- `registered`
- `official_unregistered`
- `unknown`
- `RtcProviderPackageLoadRequest`
- `RtcResolvedProviderPackageLoadTarget`
- `RtcProviderPackageLoader`
- `provider_package_not_found`
- `provider_package_identity_mismatch`
- `provider_package_load_failed`
- `provider_module_export_missing`

These reserved resolution layers are not runtime bridges.
They exist so every future language implementation inherits the same metadata-only `DriverManager`
and `DataSource` selection vocabulary plus the same provider package loading and installation
boundary before any native RTC SDK is bound.

Capability descriptors must distinguish control-plane capability metadata from runtime-bridge
capability metadata.
Capabilities that span both surfaces must be marked `cross-surface`.

Capability negotiation must be surface-aware.
Missing required capabilities produce `unsupported`.
Missing only optional capabilities produce `degraded`.
Missing runtime bridge registration does not change capability metadata; it is a runtime binding
failure and must surface as `native_sdk_not_available`.

## Workspace Artifact Governance

The root `.gitignore` is a required workspace contract file.
It must ignore transient local non-source artifacts produced by workspace verification or language
toolchains, including:

- `sdkwork-rtc-sdk-typescript/dist/`
- `sdkwork-rtc-sdk-rust/target/`
- `sdkwork-rtc-sdk-java/target/`
- `sdkwork-rtc-sdk-csharp/src/**/bin/`
- `sdkwork-rtc-sdk-csharp/src/**/obj/`
- `sdkwork-rtc-sdk-flutter/build/`
- `sdkwork-rtc-sdk-kotlin/build/`
- `sdkwork-rtc-sdk-swift/.build/`
- `sdkwork-rtc-sdk-python/**/__pycache__/`

The same `.gitignore` contract may also ignore local scratch and package-manager state such as
`.tmp/`, `.sdkwork/tmp/`, `node_modules/`, `.npm-cache/`, `.dart_tool/`, and local `*.tgz`
archives.

The assembly snapshot `.sdkwork-assembly.json` is not a transient artifact.
It remains checked-in source of truth and must not be ignored.

## Provider Package Rule

Provider adapters are one-provider-only packages or modules.

Allowed examples:

- `@sdkwork/rtc-sdk-provider-volcengine`
- `@sdkwork/rtc-sdk-provider-aliyun`
- `@sdkwork/rtc-sdk-provider-tencent`
- `sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-volcengine`
- `sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-agora`

Forbidden:

- one package that bundles every provider
- hidden conditional provider imports inside the core contract layer
