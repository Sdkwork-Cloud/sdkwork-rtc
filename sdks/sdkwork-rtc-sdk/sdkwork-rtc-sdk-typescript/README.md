# SDKWork RTC SDK TypeScript Workspace

Language: `typescript`

Planned public package:

- `@sdkwork/rtc-sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: yes
- maturity tier: reference

Current role:

- Executable reference implementation
- provider-neutral RTC contracts
- JDBC-style driver and data-source model
- assembly-driven provider catalog at src/provider-catalog.ts
- assembly-driven capability catalog at src/capability-catalog.ts with required-baseline and optional-advanced surface descriptors
- assembly-driven provider extension catalog at src/provider-extension-catalog.ts with unwrap-only extension metadata
- surface-aware capability negotiation and degradation helpers with supported, degraded, and unsupported outcomes
- assembly-driven runtimeSurfaceStandard methodTerms join, leave, publish, unpublish, startScreenShare, stopScreenShare, muteAudio, and muteVideo
- assembly-driven runtimeSurfaceStandard failureCode native_sdk_not_available when no runtime bridge is registered
- root public runtime surface constants RTC_RUNTIME_SURFACE_METHODS and RTC_RUNTIME_SURFACE_FAILURE_CODE
- assembly-driven default provider constants DEFAULT_RTC_PROVIDER_KEY, DEFAULT_RTC_PROVIDER_PLUGIN_ID, and DEFAULT_RTC_PROVIDER_DRIVER_ID
- official provider packages for volcengine, aliyun, tencent, agora, zego, livekit, twilio, jitsi, janus, and mediasoup
- TypeScript provider package statuses standardize every executable provider as a package_reference_boundary
- TypeScript runtime bridge baseline loads provider packages through the provider-package loader SPI
- assembly-driven language workspace catalog at src/language-workspace-catalog.ts
- standard provider selection helpers at src/provider-selection.ts
- standard capability negotiation helpers at src/capability-negotiation.ts
- standard provider support helpers at src/provider-support.ts
- standard media runtime helpers for provider-neutral join, publish, mute, and leave flows
- assembly-driven provider package catalog at src/provider-package-catalog.ts
- standard provider package loader and installer SPI at src/provider-package-loader.ts
- assembly-driven provider activation catalog at src/provider-activation-catalog.ts
- TypeScript runtime bridge baseline: reference-baseline
- TypeScript runtime bridge requires an official vendor SDK: required
- TypeScript provider adapters remain consumer-supplied, bind through native-factory, and must-not-bundle vendor SDKs

This workspace is the executable reference implementation for provider-neutral RTC contracts, JDBC-style driver selection, standardized runtime lifecycle delegation, and provider package boundaries in sdkwork-rtc-sdk.
This workspace does not bundle vendor SDK implementations. Provider adapters wrap caller-supplied
native client factories and expose vendor escape hatches through `unwrap()`.
The shared runtime-surface module at `src/runtime-surface.ts` materializes
`runtimeSurfaceStandard` into `RTC_RUNTIME_SURFACE_METHODS`,
`RTC_RUNTIME_SURFACE_FAILURE_CODE`, and `RTC_RUNTIME_SURFACE_STANDARD` so the provider-neutral
runtime method vocabulary and missing-runtime failure semantics stay assembly-governed.
The shared runtime-immutability module at `src/runtime-immutability.ts` materializes
`runtimeImmutabilityStandard` into `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`,
`RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
`RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`,
`RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, and
`RTC_RUNTIME_IMMUTABILITY_STANDARD` so runtime-frozen metadata, immutable snapshot contracts,
shallow-immutable runtime-controller contexts, and mutable native-client preservation stay
assembly-governed.
The shared root-public-surface module at `src/root-public-surface.ts` materializes
`rootPublicSurfaceStandard` into
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`,
`RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`,
`RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, and
`RTC_ROOT_PUBLIC_SURFACE_STANDARD` so the TypeScript root export graph, builtin-provider
root exposure, and reserved single-entrypoint families stay assembly-governed.
The shared lookup-helper-naming module at `src/lookup-helper-naming.ts` materializes
`lookupHelperNamingStandard` into `RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`,
`RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, and `RTC_LOOKUP_HELPER_NAMING_STANDARD` so the
`lower-camel-rtc`, `upper-camel-rtc`, and `snake-case-rtc` helper profiles stay
assembly-governed across the web/browser baseline and the reserved mobile/server language
workspaces.

Default provider contract:

- Web/browser default provider key: `volcengine`
- Web/browser default plugin id: `rtc-volcengine`
- Web/browser default driver id: `sdkwork-rtc-driver-volcengine`
- the TypeScript provider catalog must keep `DEFAULT_RTC_PROVIDER_KEY`,
  `DEFAULT_RTC_PROVIDER_PLUGIN_ID`, and `DEFAULT_RTC_PROVIDER_DRIVER_ID`
  aligned to that assembly default
- `resolveRtcProviderSelection()` falls back to `DEFAULT_RTC_PROVIDER_KEY`
  when web callers do not override providerUrl, providerKey, tenant override, or deployment profile
- `RtcDataSource` and `RtcDriverManager` therefore resolve the web default provider to
  `volcengine` unless the caller explicitly selects a different provider


Language workspace catalog:

- workspace catalog: `src/language-workspace-catalog.ts`
- workspace catalog entries also keep `workspaceCatalogRelativePath`,
  `defaultProviderContract`, `providerSelectionContract`, `providerSupportContract`,
  `providerActivationContract`, any declared `runtimeBaseline`,
  `providerPackageBoundaryContract`, and any declared
  `metadataScaffold`, `resolutionScaffold`, `providerPackageBoundary`, and
  `providerPackageScaffold` boundaries so consumers can inspect official assembly-driven module
  locations, workspace-wide default provider identity, selection precedence, support-status
  vocabulary, activation-status vocabulary, runtime-baseline integration details, and
  package-boundary vocabulary without rereading the
  assembly.


Runtime baseline contract:

- vendor SDK package: `@sdkwork/rtc-sdk-provider-volcengine`
- vendor SDK import path: `@sdkwork/rtc-sdk-provider-volcengine`
- recommended entrypoint: `installRtcProviderPackage`
- smoke command: `npm run smoke`
- smoke mode: `runtime-backed`
- smoke variants: `default`


Provider package boundary:

- mode: `catalog-governed-mixed`
- root public policy: `none`
- lifecycle status terms: `package_reference_boundary`
- runtime bridge status terms: `reference-baseline`, `reserved`


Local runtime verification:

- `npm run smoke`
- `npm run test`
- `npm run build`
- RTC remains a provider/media runtime bridge; IM-owned packages handle business conversation
  delivery, invitations, and lifecycle state

Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
