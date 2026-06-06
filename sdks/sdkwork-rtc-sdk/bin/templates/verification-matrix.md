# RTC SDK Verification Matrix

This document summarizes the verification responsibilities inside `sdkwork-rtc-sdk`.

## Root Materialization Entry Point

The first materialization command for maintainers is:

```powershell
node .\bin\materialize-sdk.mjs
```

## Root Materialization

The root materializer must rewrite from `.sdkwork-assembly.json`:

- `docs/README.md`
- `docs/multilanguage-capability-matrix.md`
- official language workspace READMEs
- `docs/usage-guide.md`
- `docs/typescript-volcengine-signaling-usage.md`
- `docs/flutter-volcengine-signaling-usage.md`
- the assembly-driven language workspace display names, current roles, summaries, and role
  highlights used by those READMEs
- the assembly-driven language workspace catalog matrix materialized into
  `docs/multilanguage-capability-matrix.md`
- the TypeScript language workspace catalog at
  `sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts`
- the assembly-driven `defaultProviderContract` materialized into every language workspace catalog
- the assembly-driven `providerSelectionContract` materialized into every language workspace catalog
- the assembly-driven `providerSupportContract` materialized into every language workspace catalog
- the assembly-driven `providerActivationContract` materialized into every language workspace catalog
- any assembly-driven `runtimeBaseline` metadata materialized into executable language workspace
  catalogs and READMEs
- the executable language manifests preserve the assembly-driven `runtimeBaseline`
  dependency package identities in their language-native dependency sections
- the assembly-driven `providerPackageBoundaryContract` materialized into every language workspace catalog
- the assembly-driven `capabilityStandard`, `capabilityNegotiationStandard`,
  `runtimeSurfaceStandard`, `signalingTransportStandard`, `runtimeImmutabilityStandard`, `rootPublicSurfaceStandard`,
  `lookupHelperNamingStandard`,
  `errorCodeStandard`, `providerExtensionStandard`, `providerTierStandard`, and
  `languageMaturityStandard` materialized into docs and matrix assets
- the assembly-driven `capabilityCatalog` materialized into
  `docs/multilanguage-capability-matrix.md`
- the assembly-driven `providerExtensionCatalog` materialized into
  `docs/multilanguage-capability-matrix.md`
- the assembly-driven language-provider activation matrix materialized into
  `docs/multilanguage-capability-matrix.md`
- the TypeScript capability catalog at `sdkwork-rtc-sdk-typescript/src/capability-catalog.ts`
- the TypeScript provider extension catalog at
  `sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts`
- the TypeScript provider activation catalog at
  `sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts`
- the TypeScript provider catalog at `sdkwork-rtc-sdk-typescript/src/provider-catalog.ts`
- the TypeScript runtime surface module at `sdkwork-rtc-sdk-typescript/src/runtime-surface.ts`
- the TypeScript signaling transport module at `sdkwork-rtc-sdk-typescript/src/signaling-transport.ts`
- the Flutter signaling transport module at `sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart`
- the TypeScript runtime immutability module at
  `sdkwork-rtc-sdk-typescript/src/runtime-immutability.ts`
- the TypeScript root public surface module at
  `sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`
- the TypeScript lookup helper naming module at
  `sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts`
- the default provider constants `DEFAULT_RTC_PROVIDER_KEY`,
  `DEFAULT_RTC_PROVIDER_PLUGIN_ID`, and `DEFAULT_RTC_PROVIDER_DRIVER_ID` inside that catalog
- the root public runtime surface constants `RTC_RUNTIME_SURFACE_METHODS` and
  `RTC_RUNTIME_SURFACE_FAILURE_CODE`
- the root public signaling transport constants
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
  `RTC_SIGNALING_TRANSPORT_STANDARD`
- the Flutter root public signaling transport constants
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
  `rtcSignalingTransportStandard`
- the root public runtime immutability constants
  `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, and
  `RTC_RUNTIME_IMMUTABILITY_STANDARD`
- the root public surface constants
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, and
  `RTC_ROOT_PUBLIC_SURFACE_STANDARD`
- the root public lookup helper naming constants
  `RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`,
  `RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, and `RTC_LOOKUP_HELPER_NAMING_STANDARD`
- the TypeScript providers directory README
- every TypeScript provider package manifest
- every TypeScript provider package `index.js` entrypoint
- every TypeScript provider package `index.d.ts` declaration entrypoint
- every TypeScript provider package README
- the assembly-driven `typescriptPackage` contract inside every materialized TypeScript provider
  catalog entry
- every TypeScript provider package extension key contract
- every TypeScript provider package vendor SDK contract
- every reserved language provider package loader scaffold
- and remove stale legacy generated assets that belong to superseded standard layouts

## Root Verification Entry Point

The first verification command for maintainers is:

```powershell
node .\bin\verify-sdk.mjs
```

## Root Full Regression Entry Point

The final full regression command for maintainers is:

```powershell
node .\bin\smoke-sdk.mjs
```

The fast public call smoke commands for maintainers are:

```powershell
{{RTC_FAST_CALL_SMOKE_COMMANDS}}
```

When an executable language supports shared RTC live-connection ownership, the forwarded
`--reuse-live-connection` smoke variant is part of the public regression contract and must stay in
the generated command list.

The full regression entrypoint must run, in order:

- `node .\bin\materialize-sdk.mjs`
- `node .\test\verify-sdk-automation.test.mjs`
- `node .\bin\verify-sdk.mjs`
- `node .\sdkwork-rtc-sdk-typescript\bin\package-task.mjs test`
{{RTC_REQUIRED_CALL_SMOKE_STEPS}}

The full regression entrypoint must also attempt the following optional language smoke checks and
skip them only when the corresponding toolchain is unavailable:

- `python -m compileall -q sdkwork-rtc-sdk-python/sdkwork_rtc_sdk`
{{RTC_OPTIONAL_CALL_SMOKE_STEPS}}
- `flutter analyze ./bin/sdk-call-smoke.dart`
- `flutter analyze`
- `cargo check`
- `go build ./...`
- `dotnet build src/SDKWork.Rtc.Sdk/SDKWork.Rtc.Sdk.csproj -nologo`
- `javac -d target/classes ...`
- `swift build`
- `kotlinc -d build/classes ...`

## Root Checks

The root verifier must confirm:

- root `.gitignore` exists
- root `.gitignore` ignores standard transient non-source artifacts such as
  `sdkwork-rtc-sdk-typescript/dist/`, `**/.dart_tool/`, `sdkwork-rtc-sdk-rust/target/`,
  `sdkwork-rtc-sdk-java/target/`, `sdkwork-rtc-sdk-csharp/src/**/bin/`,
  `sdkwork-rtc-sdk-csharp/src/**/obj/`, `sdkwork-rtc-sdk-kotlin/build/`,
  `sdkwork-rtc-sdk-swift/.build/`, and `sdkwork-rtc-sdk-python/**/__pycache__/`
- root `.gitignore` does not ignore the checked-in source-of-truth assembly snapshot
  `.sdkwork-assembly.json`
- root docs exist
- root docs include the required clauses for provider package entrypoints and default provider
  constants
- root docs include the required clauses for `registerRtcProviderModules(...)` and
  `provider_module_contract_mismatch`
- `.sdkwork-assembly.json` exists and is parseable
- the default provider is `volcengine`
- exactly one provider is marked `defaultSelected`, and it matches the default provider key
- `.sdkwork-assembly.json` declares `providerSelectionStandard.sourceTerms`,
  `providerSelectionStandard.precedence`, and `providerSelectionStandard.defaultSource`
- `.sdkwork-assembly.json` declares `providerSupportStandard.statusTerms`
- `.sdkwork-assembly.json` declares `providerActivationStandard.statusTerms`
- `.sdkwork-assembly.json` declares `capabilityStandard.categoryTerms` and
  `capabilityStandard.surfaceTerms`
- `.sdkwork-assembly.json` declares `capabilityNegotiationStandard.statusTerms` and
  `capabilityNegotiationStandard.statusRules`
- `.sdkwork-assembly.json` declares `runtimeSurfaceStandard.methodTerms` and
  `runtimeSurfaceStandard.failureCode`
- `.sdkwork-assembly.json` declares `signalingTransportStandard.transportTerm`,
  `signalingTransportStandard.authConfigPath`,
  `signalingTransportStandard.authPassThroughTerm`,
  `signalingTransportStandard.authModeTerms`,
  `signalingTransportStandard.recommendedAuthMode`,
  `signalingTransportStandard.deviceIdAuthorityTerm`,
  `signalingTransportStandard.connectOptionsDeviceIdRuleTerm`,
  `signalingTransportStandard.liveConnectionTerm`,
  `signalingTransportStandard.pollingFallbackTerm`, and
  `signalingTransportStandard.authFailureTerm`
- `.sdkwork-assembly.json` declares `runtimeImmutabilityStandard.frozenTerm`,
  `runtimeImmutabilityStandard.snapshotTerm`,
  `runtimeImmutabilityStandard.controllerContextTerm`, and
  `runtimeImmutabilityStandard.nativeClientTerm`
- `.sdkwork-assembly.json` declares
  `rootPublicSurfaceStandard.typescriptProviderNeutralExportPaths`,
  `rootPublicSurfaceStandard.typescriptBuiltinProviderExportPaths`,
  `rootPublicSurfaceStandard.typescriptInlineHelperNames`,
  `rootPublicSurfaceStandard.reservedSurfaceFamilies`,
  `rootPublicSurfaceStandard.reservedEntryPointKinds`,
  `rootPublicSurfaceStandard.builtinProviderExposureTerm`, and
  `rootPublicSurfaceStandard.nonBuiltinProviderExposureTerm`
- `.sdkwork-assembly.json` declares `lookupHelperNamingStandard.profileTerms`,
  `lookupHelperNamingStandard.familyTerms`, and `lookupHelperNamingStandard.profiles`
- `.sdkwork-assembly.json` declares `errorCodeStandard.codeTerms` and
  `errorCodeStandard.fallbackCode`
- `.sdkwork-assembly.json` declares `providerExtensionStandard.accessTerms` and
  `providerExtensionStandard.statusTerms`
- `.sdkwork-assembly.json` declares `providerTierStandard.tierTerms` and
  `providerTierStandard.tierSummaries`
- `.sdkwork-assembly.json` declares `languageMaturityStandard.tierTerms` and
  `languageMaturityStandard.tierSummaries`
- `.sdkwork-assembly.json` declares `providerPackageBoundaryStandard.modeTerms`,
  `providerPackageBoundaryStandard.rootPublicPolicyTerms`,
  `providerPackageBoundaryStandard.lifecycleStatusTerms`,
  and `providerPackageBoundaryStandard.runtimeBridgeStatusTerms`
- `capabilityCatalog` exists, is unique by `capabilityKey`, and covers the workspace capability set
- `providerExtensionCatalog` exists, is unique by `extensionKey`, and covers the workspace provider
  extension key set
- every capability descriptor uses a recognized `category`
- every capability descriptor uses a recognized `surface`:
  `control-plane`, `runtime-bridge`, or `cross-surface`
- every provider extension descriptor uses a recognized `surface`
- every provider extension descriptor uses a recognized `access`:
  `unwrap-only` or `extension-object`
- every provider extension descriptor uses a recognized `status`:
  `reference-baseline` or `reserved`
- root docs describe capability negotiation and degradation semantics:
  `supported`, `degraded`, and `unsupported`
- every provider declares the required baseline capability set and a valid optional capability list
- every required provider capability resolves to a `required-baseline` capability descriptor
- every optional provider capability resolves to an `optional-advanced` capability descriptor
- every provider declares `extensionKeys`
- every provider extension key resolves to a provider-owned descriptor in `providerExtensionCatalog`
- every provider declares the TypeScript vendor SDK contract:
  `consumer-supplied`, `native-factory`, `must-not-bundle`
- every provider declares the TypeScript runtime bridge prerequisite contract:
  `reference-baseline`, with the official vendor SDK requirement set to `required`
- every language declares a valid maturity tier
- every language declares the assembly-driven language workspace contract fields:
  `displayName`, `workspaceCatalogRelativePath`, `currentRole`, `workspaceSummary`, `roleHighlights`
- every language workspace ships the declared language workspace catalog file
- every language workspace catalog preserves `defaultProviderContract.providerKey`,
  `defaultProviderContract.pluginId`, and `defaultProviderContract.driverId`
- every language workspace catalog preserves `providerSelectionContract.sourceTerms`,
  `providerSelectionContract.precedence`, and `providerSelectionContract.defaultSource`
- every language workspace catalog preserves `providerSupportContract.statusTerms`
- every language workspace catalog preserves `providerActivationContract.statusTerms`
- every executable reference language declares a machine-readable `runtimeBaseline`
- every executable reference language declares a machine-readable `runtimeDocumentation`
- every executable reference language `runtimeBaseline` preserves `vendorSdkPackage`,
  `vendorSdkImportPath`, `signalingSdkPackage`, `signalingSdkImportPath`,
  `recommendedEntrypoint`, `smokeCommand`, `smokeMode`, and `smokeVariants`
- every executable reference language `runtimeDocumentation` preserves
  `baselineConclusion`, `guideTitle`, `runtimeLabel`, `detailedGuidePath`,
  `detailedGuideLabel`, and `smokeNarrative`
- `docs/usage-guide.md` preserves the default provider constants and executable
  `runtimeBaseline` and `runtimeDocumentation` details for the current runnable baselines
- `docs/typescript-volcengine-signaling-usage.md` preserves the executable TypeScript/web runtime
  baseline details for `vendorSdkPackage`, `vendorSdkImportPath`, `signalingSdkPackage`,
  `signalingSdkImportPath`, `recommendedEntrypoint`, `smokeCommand`, `smokeMode`, and
  `smokeVariants`
- `docs/flutter-volcengine-signaling-usage.md` preserves the executable Flutter/mobile runtime
  baseline details for `vendorSdkPackage`, `vendorSdkImportPath`, `signalingSdkPackage`,
  `signalingSdkImportPath`, `recommendedEntrypoint`, `smokeCommand`, `smokeMode`, and
  `smokeVariants`
- the executable runtime usage guides preserve both current smoke-mode terms:
  `runtime-backed` and `analysis-backed`
- every executable reference language manifest declares the `runtimeBaseline.vendorSdkPackage`
  and `runtimeBaseline.signalingSdkPackage` dependency identities
- every language workspace catalog preserves `providerPackageBoundaryContract.modeTerms`,
  `providerPackageBoundaryContract.rootPublicPolicyTerms`,
  `providerPackageBoundaryContract.lifecycleStatusTerms`, and
  `providerPackageBoundaryContract.runtimeBridgeStatusTerms`
- every language declares the assembly-driven language-provider activation matrix as
  `providerActivations`
- every language declares an assembly-driven `providerPackageBoundary`
- every language preserves `providerPackageBoundary.mode`,
  `providerPackageBoundary.rootPublicPolicy`,
  `providerPackageBoundary.lifecycleStatusTerms`, and
  `providerPackageBoundary.runtimeBridgeStatusTerms`
- TypeScript preserves `providerPackageBoundary.mode` as `catalog-governed-mixed`,
  `providerPackageBoundary.rootPublicPolicy` as `builtin-only`,
  `providerPackageBoundary.lifecycleStatusTerms` as
  `root_public_reference_boundary` and `package_reference_boundary`,
  and `providerPackageBoundary.runtimeBridgeStatusTerms` as `reference-baseline`
- every remaining reserved non-TypeScript language declares an assembly-driven `contractScaffold`
- every remaining reserved non-TypeScript language workspace ships the declared code-level contract scaffold
  file
- every reserved language contract scaffold preserves the standard abstraction names:
  `RtcProviderDriver`, `RtcDriverManager`, `RtcDataSource`, `RtcClient`, `RtcRuntimeController`
- every remaining reserved non-TypeScript language declares an assembly-driven `packageScaffold`
- every remaining reserved non-TypeScript language workspace ships the declared package/build manifest file
- every reserved language package scaffold preserves the build system marker and the public package
  identity declared by the language workspace
- every remaining reserved non-TypeScript language declares an assembly-driven `providerPackageScaffold`
- every remaining reserved non-TypeScript language workspace ships the declared provider package scaffold file
- every reserved language provider package scaffold preserves
  `providerPackageScaffold.relativePath`, `providerPackageScaffold.directoryPattern`,
  `providerPackageScaffold.packagePattern`, `providerPackageScaffold.manifestFileName`, and
  `providerPackageScaffold.readmeFileName`, `providerPackageScaffold.sourceFilePattern`, and
  `providerPackageScaffold.sourceSymbolPattern`
  declared by the language workspace
- every reserved language provider package scaffold preserves the exact
  `providerPackageScaffold.templateTokens` set used by the directory, package, and manifest
  patterns
- every reserved language provider package scaffold preserves the exact
  `providerPackageScaffold.sourceTemplateTokens` set used by the source file and source symbol
  patterns
- every reserved language provider package scaffold preserves the allowed package template tokens:
  `{providerKey}` and `{providerPascal}`
- every reserved language preserves `providerPackageBoundary.mode` as
  `scaffold-per-provider-package` and `providerPackageBoundary.rootPublicPolicy` as `none`
- every reserved language preserves `providerPackageBoundary.lifecycleStatusTerms` as
  `future-runtime-bridge-only`
- every reserved language preserves `providerPackageBoundary.runtimeBridgeStatusTerms` as
  `reserved`
- every reserved language provider package scaffold preserves `providerPackageScaffold.status` as
  `future-runtime-bridge-only`, `providerPackageScaffold.runtimeBridgeStatus` as `reserved`, and
  `providerPackageScaffold.rootPublic` as `false`
- every reserved language provider package scaffold stays exactly aligned with
  `providerPackageBoundary.lifecycleStatusTerms` and
  `providerPackageBoundary.runtimeBridgeStatusTerms`
- every reserved language provider package scaffold preserves the one-provider package boundary rule
  and the provider catalog identity tokens `providerKey`, `pluginId`, and `driverId`
- every reserved language materializes one future provider package manifest and one README per
  official provider under the declared provider package directory pattern
- every reserved language materializes one metadata-only source stub per official provider under the
  declared provider package source file pattern and source symbol contract
- every remaining reserved non-TypeScript language declares an assembly-driven `metadataScaffold`
- every remaining reserved non-TypeScript language workspace ships the declared provider catalog, provider package catalog, provider activation catalog, capability catalog, provider extension catalog, and provider selection scaffold files
- every reserved language metadata scaffold preserves the standard metadata tokens:
  `RtcProviderCatalog`, `DEFAULT_RTC_PROVIDER_KEY`, `providerKey`, `pluginId`, `driverId`,
  `RtcProviderPackageCatalog`, `packageIdentity`, `manifestPath`, `readmePath`, `sourcePath`,
  `sourceSymbol`, `builtin`, `rootPublic`,
  `RtcProviderActivationCatalog`, `activationStatus`, `runtimeBridge`, `packageBoundary`,
  `RtcCapabilityCatalog`, `capabilityKey`, `category`, `surface`,
  `RtcProviderExtensionCatalog`, `extensionKey`, `displayName`, `access`, `status`,
  `RtcProviderSelection`, `providerUrl`, `tenantOverrideProviderKey`,
  `deploymentProfileProviderKey`
- every reserved language metadata scaffold declares the required relative-path fields:
  `providerCatalogRelativePath`, `providerPackageCatalogRelativePath`,
  `providerActivationCatalogRelativePath`, `capabilityCatalogRelativePath`,
  `providerExtensionCatalogRelativePath`, `providerSelectionRelativePath`
- every reserved language resolution scaffold declares the required relative-path fields:
  `driverManagerRelativePath`, `dataSourceRelativePath`, `providerSupportRelativePath`, and
  `providerPackageLoaderRelativePath`
- every remaining reserved non-TypeScript language declares an assembly-driven `resolutionScaffold`
- every remaining reserved non-TypeScript language workspace ships the declared driver manager, data source,
  provider support, and provider package loader scaffold files
- every reserved language resolution scaffold preserves the standard resolution tokens:
  `RtcDriverManager`, `resolveSelection`, `describeProviderSupport`, `listProviderSupport`,
  `RtcDataSource`, `RtcDataSourceOptions`, `describeSelection`, `defaultProviderKey`,
  `RtcProviderSupport`, `builtin`, `official`, `registered`, `official_unregistered`, `unknown`,
  `RtcProviderPackageLoadRequest`, `RtcResolvedProviderPackageLoadTarget`,
  `RtcProviderPackageLoader`, `provider_package_not_found`,
  `provider_package_identity_mismatch`, `provider_package_load_failed`,
  `provider_module_export_missing`
- every reserved language provider-selection scaffold preserves explicit helper coverage for source
  catalogs, precedence catalogs, provider-URL parsing, and selection resolution with
  language-idiomatic naming
- every reserved language helper scaffold stays aligned with the canonical naming profiles
  `lower-camel-rtc`, `upper-camel-rtc`, and `snake-case-rtc`
- every reserved language provider-support scaffold preserves explicit helper coverage for
  support-status catalogs, `RtcProviderSupportStateRequest`, status resolution, and support-state
  construction with language-idiomatic naming
- every reserved language provider-package catalog preserves explicit provider-key and
  package-identity lookup with language-idiomatic naming
- every reserved language provider-package loader scaffold preserves explicit helper coverage for
  package-boundary resolution, provider-module loading, single-package installation, batch package
  installation, and the stable failure codes `provider_package_not_found`,
  `provider_package_identity_mismatch`, `provider_package_load_failed`, and
  `provider_module_export_missing`
- every reserved language driver-manager scaffold delegates selection resolution to the
  provider-selection helper module and support-state construction to the provider-support helper
  module after provider catalog and provider-activation lookup
- every language-provider activation entry uses only the allowed statuses:
  `root-public-builtin`, `package-boundary`, `control-metadata-only`
- the official language list is complete
- root materialization entrypoints exist
- the TypeScript workspace required files exist
- every materialized asset exactly matches the root materializer output
- stale legacy generated assets are absent
- the TypeScript provider package skeletons exist for every official provider
- the TypeScript provider package entrypoints and `exports` contract stay aligned
- the assembly-driven `typescriptAdapterStandard` stays aligned with the canonical TypeScript
  adapter vocabulary and reference baseline contract
- the TypeScript provider package assembly-driven `typescriptPackage` contract stays aligned
- the assembly-driven `typescriptPackageStandard` stays aligned with the canonical TypeScript
  package naming and symbol patterns
- the assembly-driven `typescriptPackage.packageName` stays canonical as
  `@sdkwork/rtc-sdk-provider-<providerKey>`
- the assembly-driven `typescriptPackage.sourceModule` stays canonical as
  `../../src/providers/<providerKey>.ts`
- the assembly-driven `typescriptPackage.driverFactory` stays canonical as
  `create<ProviderPascal>RtcDriver`
- the assembly-driven `typescriptPackage.metadataSymbol` stays canonical as
  `<PROVIDER_UPPER>_RTC_PROVIDER_METADATA`
- the assembly-driven `typescriptPackage.moduleSymbol` stays canonical as
  `<PROVIDER_UPPER>_RTC_PROVIDER_MODULE`
- the TypeScript provider package catalog stays aligned with the assembly-driven package boundary
  snapshot
- the TypeScript provider package status set stays aligned with the standard boundary model:
  `root_public_reference_boundary` for builtin root-public packages and
  `package_reference_boundary` for executable non-builtin package boundaries
- legacy TypeScript package-boundary wording is forbidden in assembly-driven language workspace
  role highlights, materialized language workspace READMEs, and language workspace catalogs:
  `reserved TypeScript provider package boundaries`, `builtin_reference_boundary`, and
  `official_reserved_boundary`
- the TypeScript provider package extension key contract stays aligned
- the TypeScript provider package vendor SDK contract stays aligned
- the TypeScript provider package runtime bridge prerequisite contract stays aligned
- the TypeScript provider selection module exists and preserves the standard selection tokens and
  precedence sources
- the TypeScript capability negotiation module exists and preserves
  `RTC_CAPABILITY_NEGOTIATION_STATUSES`, `RTC_CAPABILITY_NEGOTIATION_RULES`, and
  `resolveRtcCapabilityNegotiationStatus(...)`
- the TypeScript runtime surface module exists and preserves `RTC_RUNTIME_SURFACE_METHODS`,
  `RTC_RUNTIME_SURFACE_FAILURE_CODE`, and `RTC_RUNTIME_SURFACE_STANDARD`
- the TypeScript signaling transport module exists and preserves
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
  `RTC_SIGNALING_TRANSPORT_STANDARD`
- the TypeScript errors module exists and preserves `RTC_SDK_ERROR_CODES`,
  `RTC_SDK_ERROR_FALLBACK_CODE`, `RtcSdkException`, and the canonical fallback `vendor_error`
- the TypeScript provider support module exists and preserves the standard support-status tokens,
  status set, and the public helpers `resolveRtcProviderSupportStatus(...)` and
  `createRtcProviderSupportState(...)`
- the TypeScript provider package catalog preserves explicit provider-key lookup through
  `getRtcProviderPackageByProviderKey(...)`
- the TypeScript provider package catalog preserves explicit package-identity lookup through
  `getRtcProviderPackageByPackageIdentity(...)`
- the TypeScript provider package loader module exists at
  `sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts` and preserves
  `RtcProviderPackageLoadRequest`, `RtcProviderPackageLoader`,
  `createRtcProviderPackageLoader(...)`, `resolveRtcProviderPackageLoadTarget(...)`,
  `loadRtcProviderModule(...)`, `installRtcProviderPackage(...)`, and
  `installRtcProviderPackages(...)`
- the TypeScript provider package loader preserves stable package-boundary failures:
  `provider_package_not_found`, `provider_package_identity_mismatch`,
  `provider_package_load_failed`, and `provider_module_export_missing`
- the TypeScript provider activation catalog preserves explicit provider-key lookup through
  `getRtcProviderActivationByProviderKey(...)`
- the TypeScript capability catalog preserves explicit capability-key lookup through
  `getRtcCapabilityCatalog(...)` and `getRtcCapabilityDescriptor(...)`
- the TypeScript provider extension catalog preserves explicit extension-key and provider-key
  lookup through `getRtcProviderExtensionCatalog(...)`,
  `getRtcProviderExtensionDescriptor(...)`, `getRtcProviderExtensionsForProvider(...)`,
  `getRtcProviderExtensions(...)`, and `hasRtcProviderExtension(...)`
- the TypeScript language workspace catalog preserves explicit language lookup through
  `getRtcLanguageWorkspaceByLanguage(...)`
- the TypeScript provider catalog preserves cross-language provider-key lookup through
  `getRtcProviderByProviderKey(...)`
- the TypeScript provider catalog lookup helpers preserve standard provider-key lookup through
  `getBuiltinRtcProviderMetadataByKey(...)` and `getOfficialRtcProviderMetadataByKey(...)`
- the Flutter root barrel at `sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart` remains aligned
  with the standard root public entrypoint contract
- the Flutter signaling transport module exists at
  `sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart`, preserves the root public
  signaling transport constants, and remains re-exported by `sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart`
- the reserved Python package root at `sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/__init__.py`
  remains aligned with the standard root public entrypoint contract
- reserved root public entrypoints preserve the provider package loader surface without deep
  imports
- reserved Go metadata and resolution DTOs preserve PascalCase public struct fields such as
  `ProviderKey`, `PluginId`, `DriverId`, `PackageIdentity`, `RuntimeBridgeStatus`, and
  `DefaultProviderKey`
- every provider package manifest points at a real TypeScript source module

## TypeScript Checks

The TypeScript workspace must verify:

- the package metadata and exports remain stable
- the materialized capability catalog stays aligned with the assembly snapshot
- the materialized provider extension catalog stays aligned with the assembly snapshot
- the materialized language workspace catalog stays aligned with the assembly snapshot
- the materialized provider package catalog stays aligned with the assembly snapshot
- provider package manifests and READMEs expose the same required and optional capability lists as
  the assembly provider catalog
- the provider selection module keeps the public selection helpers stable
- the provider support module keeps the public support helpers stable
- the provider catalog lookup helpers stay queryable through the root public SDK exports
- capability descriptors stay queryable through the root public SDK exports
- provider extension descriptors stay queryable through the root public SDK exports
- provider package catalog entries stay queryable through the root public SDK exports
- the materialized provider catalog, capability catalog, language workspace catalog, and provider extension catalog remain
  `runtime-frozen`
- the materialized provider package catalog remains `runtime-frozen`
- runtime-created capability sets, provider selections, provider support descriptors, capability
  support descriptors, and capability negotiation results remain immutable snapshots
- `RTC_PROVIDER_SELECTION_SOURCES` and `RTC_PROVIDER_SELECTION_PRECEDENCE` remain `runtime-frozen`
- `RTC_PROVIDER_SUPPORT_STATUSES` remains `runtime-frozen`
- `RTC_RUNTIME_SURFACE_METHODS` remains `runtime-frozen`
- `RTC_SIGNALING_TRANSPORT_STANDARD` remains `runtime-frozen`
- `RTC_SDK_ERROR_CODES` remains `runtime-frozen`
- `parseRtcProviderUrl(...)` and `resolveRtcProviderSelection(...)` remain root-public
- `resolveRtcProviderSupportStatus(...)` and `createRtcProviderSupportState(...)` remain root-public
- `RTC_RUNTIME_SURFACE_METHODS` and `RTC_RUNTIME_SURFACE_FAILURE_CODE` remain root-public
- `RTC_SIGNALING_TRANSPORT_STANDARD` and `RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS` remain root-public
- `RtcSdkException`, `RTC_SDK_ERROR_CODES`, and `RTC_SDK_ERROR_FALLBACK_CODE` remain root-public
- `getRtcProviderByProviderKey(...)` remains root-public
- `getRtcCapabilityCatalog(...)` and `getRtcCapabilityDescriptor(...)` remain root-public
- `getRtcProviderPackageByProviderKey(...)` remains root-public
- `getRtcProviderPackageByPackageIdentity(...)` remains root-public
- `createRtcProviderPackageLoader(...)`, `resolveRtcProviderPackageLoadTarget(...)`,
  `loadRtcProviderModule(...)`, `installRtcProviderPackage(...)`, and
  `installRtcProviderPackages(...)` remain root-public
- `getRtcProviderActivationByProviderKey(...)` remains root-public
- `getRtcProviderExtensionCatalog(...)`, `getRtcProviderExtensionDescriptor(...)`,
  `getRtcProviderExtensionsForProvider(...)`, `getRtcProviderExtensions(...)`, and
  `hasRtcProviderExtension(...)` remain root-public
- `getRtcLanguageWorkspaceByLanguage(...)` remains root-public
- `getBuiltinRtcProviderMetadataByKey(...)` and `getOfficialRtcProviderMetadataByKey(...)` remain
  root-public
- provider drivers snapshot metadata instead of retaining mutable caller-owned metadata references
- capability negotiation stays surface-aware and keeps stable statuses:
  `supported`, `degraded`, `unsupported`
- the client and data-source contracts expose provider extension metadata helpers
- the driver manager contract works
- the provider-module contract keeps builtin package wiring stable
- the provider-module contract keeps the runtime vendor SDK contract stable
- the provider-module contract keeps the TypeScript runtime bridge prerequisite contract stable
- the provider-package loader contract keeps package-boundary load and install semantics stable
- provider-package loading fails with `provider_package_not_found`,
  `provider_package_identity_mismatch`, `provider_package_load_failed`, and
  `provider_module_export_missing`
- batch provider-module registration stays stable through `registerRtcProviderModules(...)`
- provider-module package contract drift fails with `provider_module_contract_mismatch`
- batch provider-module registration is atomic and leaves the target driver manager unchanged when
  any registration fails
- builtin provider module objects and the builtin provider module list remain `runtime-frozen`
- the provider-neutral runtime surface keeps the stable methods `join`, `leave`, `publish`,
  `unpublish`, `muteAudio`, and `muteVideo`
- runtime method delegation reaches the consumer-supplied runtime bridge without provider metadata
  drift
- `RTC_RUNTIME_IMMUTABILITY_STANDARD` remains root-public
- `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`, and
  `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM` remain root-public
- `RTC_ROOT_PUBLIC_SURFACE_STANDARD` remains root-public
- `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`, and
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS` remain root-public
- runtime-controller context wrappers remain `shallow-immutable-context` while preserving
  `mutable-native-client` instances
- runtime methods fail with `native_sdk_not_available` when no runtime bridge is registered
- every official provider source module exports the manifest-declared driver factory, metadata
  symbol, and provider module symbol
- every official provider catalog entry keeps the TypeScript vendor SDK contract aligned with the
  assembly snapshot
- every official provider catalog entry keeps the TypeScript runtime bridge prerequisite contract
  aligned with the assembly snapshot
- provider selection precedence remains stable
- provider support status classification remains stable
- provider catalog lookup by key remains stable
- official-but-unregistered providers are distinguished from unknown providers
- the data source contract works
- the built-in provider adapters stay aligned with the assembly snapshot

## Completion Gate

Do not describe RTC SDK workspace work as complete until:

- `node .\bin\materialize-sdk.mjs` has been run after structure-changing standard updates
- `node .\bin\verify-sdk.mjs` passes
- TypeScript package tests pass
- `node .\bin\smoke-sdk.mjs` passes as the final full regression gate
- workspace artifact ignore rules remain aligned with the actual verification outputs
- docs, language maturity tiers, and assembly remain aligned
