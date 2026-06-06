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
- first-class StandardRtcCallController public module at src/call-controller.ts for invite discovery and RTC session orchestration
- JDBC-style driver and data-source model
- assembly-driven provider catalog at src/provider-catalog.ts
- assembly-driven capability catalog at src/capability-catalog.ts with required-baseline and optional-advanced surface descriptors
- assembly-driven provider extension catalog at src/provider-extension-catalog.ts with unwrap-only extension metadata
- surface-aware capability negotiation and degradation helpers with supported, degraded, and unsupported outcomes
- assembly-driven runtimeSurfaceStandard methodTerms join, leave, publish, unpublish, muteAudio, and muteVideo
- assembly-driven runtimeSurfaceStandard failureCode native_sdk_not_available when no runtime bridge is registered
- root public runtime surface constants RTC_RUNTIME_SURFACE_METHODS and RTC_RUNTIME_SURFACE_FAILURE_CODE
- assembly-driven default provider constants DEFAULT_RTC_PROVIDER_KEY, DEFAULT_RTC_PROVIDER_PLUGIN_ID, and DEFAULT_RTC_PROVIDER_DRIVER_ID
- built-in provider adapters for volcengine, aliyun, tencent, agora, and livekit
- TypeScript provider package statuses standardize built-in root-public packages as root_public_reference_boundary and executable non-builtin packages as package_reference_boundary
- TypeScript runtime bridge baseline reference-baseline with official vendor SDK requirement required
- assembly-driven language workspace catalog at src/language-workspace-catalog.ts
- standard provider selection helpers at src/provider-selection.ts
- standard capability negotiation helpers at src/capability-negotiation.ts
- standard provider support helpers at src/provider-support.ts
- standard call-stack composition helper at src/standard-call-stack.ts for default Volcengine plus sdkwork-rtc-sdk signaling
- shared RTC WebSocket realtime dispatcher at src/signaling-adapter.ts for unified RTC session and conversation invite subscriptions
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
The shared signaling-transport module at `src/signaling-transport.ts` materializes
`signalingTransportStandard` into `RTC_SIGNALING_TRANSPORT_TERM`,
`RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH`,
`RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM`,
`RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS`,
`RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE`,
`RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM`,
`RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM`,
`RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM`,
`RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM`,
`RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM`, and
`RTC_SIGNALING_TRANSPORT_STANDARD` so the WebSocket-only signaling contract, auth pass-through
boundary, authoritative `deviceId` rule, shared `liveConnection` reuse, no-polling policy,
and fail-fast auth semantics stay assembly-governed.
The Flutter/mobile counterpart at `../sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart`
keeps `rtcSignalingTransportTerm`, `rtcSignalingTransportAuthConfigPath`,
`rtcSignalingTransportAuthPassThroughTerm`, `rtcSignalingTransportAuthModeTerms`,
`rtcSignalingTransportRecommendedAuthMode`, `rtcSignalingTransportDeviceIdAuthorityTerm`,
`rtcSignalingTransportConnectOptionsDeviceIdRuleTerm`, `rtcSignalingTransportLiveConnectionTerm`,
`rtcSignalingTransportPollingFallbackTerm`, `rtcSignalingTransportAuthFailureTerm`, and
`rtcSignalingTransportStandard` aligned to the same assembly-driven contract so the executable
web/browser and mobile baselines cannot drift.
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

- vendor SDK package: `@volcengine/rtc`
- vendor SDK import path: `@volcengine/rtc`
- signaling SDK package: `@sdkwork/rtc-sdk`
- signaling SDK import path: `@sdkwork/rtc-sdk`
- recommended entrypoint: `createStandardRtcCallControllerStack`
- smoke command: `node ./bin/sdk-call-smoke.mjs --json`
- smoke mode: `runtime-backed`
- smoke variants: `default` and `reuse-live-connection`


Provider package boundary:

- mode: `catalog-governed-mixed`
- root public policy: `builtin-only`
- lifecycle status terms: `root_public_reference_boundary`, `package_reference_boundary`
- runtime bridge status terms: `reference-baseline`


Local smoke CLI:

- `bin/sdk-call-smoke.mjs` verifies the public TypeScript call stack against mocked
  `sdkwork-rtc-sdk` signaling and a mocked official Volcengine Web SDK module
- `npm run smoke`
- `node ./bin/sdk-call-smoke.mjs --json`
- `node ./bin/sdk-call-smoke.mjs --json --reuse-live-connection`
- signaling uses one shared RTC WebSocket realtime dispatcher, and `connectOptions.webSocketAuth`
  remains part of the public TypeScript RTC baseline
- `liveConnection` is also part of the public TypeScript RTC baseline when the application wants
  RTC to reuse an existing shared RTC WebSocket live connection

Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
