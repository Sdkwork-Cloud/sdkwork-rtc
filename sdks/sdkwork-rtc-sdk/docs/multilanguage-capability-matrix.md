# RTC SDK Multilanguage Capability Matrix

This matrix is materialized from `.sdkwork-assembly.json` so the official provider tiers, language
support boundaries, and maturity tiers stay exact and verifiable.

## Provider Tier Semantics

- `tier-a`: Built-in baseline providers
- `tier-b`: Official extension targets with reserved adapter positions
- `tier-c`: Future SPI targets

## Language Maturity Semantics

- `reference`: Executable baseline language workspace
- `reserved`: Official but not yet executable runtime-bridge workspace

## Capability Standard

- `capabilityStandard.categoryTerms`: `required-baseline`, `optional-advanced`
- `capabilityStandard.surfaceTerms`: `control-plane`, `runtime-bridge`, `cross-surface`

## Capability Negotiation Standard

- `capabilityNegotiationStandard.statusTerms`: `supported`, `degraded`, `unsupported`
- `capabilityNegotiationStandard.statusRules.supported`: `all-requested-capabilities-available`
- `capabilityNegotiationStandard.statusRules.degraded`: `all-required-capabilities-available_optional-capabilities-missing`
- `capabilityNegotiationStandard.statusRules.unsupported`: `required-capabilities-missing`

## Runtime Surface Standard

- `runtimeSurfaceStandard.methodTerms`: `join`, `leave`, `publish`, `unpublish`, `startScreenShare`, `stopScreenShare`, `muteAudio`, `muteVideo`
- `runtimeSurfaceStandard.failureCode`: `native_sdk_not_available`
- TypeScript root public constants: `RTC_RUNTIME_SURFACE_METHODS`, `RTC_RUNTIME_SURFACE_FAILURE_CODE`

## Runtime Immutability Standard

- `runtimeImmutabilityStandard.frozenTerm`: `runtime-frozen`
- `runtimeImmutabilityStandard.snapshotTerm`: `immutable-snapshots`
- `runtimeImmutabilityStandard.controllerContextTerm`: `shallow-immutable-context`
- `runtimeImmutabilityStandard.nativeClientTerm`: `mutable-native-client`
- TypeScript root public constants: `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`, `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`, `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`, `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, `RTC_RUNTIME_IMMUTABILITY_STANDARD`

## Root Public Surface Standard

- `rootPublicSurfaceStandard.typescriptProviderNeutralExportPaths`: `./errors.js`, `./runtime-surface.js`, `./runtime-immutability.js`, `./root-public-surface.js`, `./types.js`, `./capability-catalog.js`, `./capability-negotiation.js`, `./provider-catalog.js`, `./language-workspace-catalog.js`, `./provider-selection.js`, `./provider-support.js`, `./provider-extension-catalog.js`, `./provider-package-catalog.js`, `./provider-package-loader.js`, `./provider-activation-catalog.js`, `./capabilities.js`, `./client.js`, `./driver.js`, `./driver-manager.js`, `./data-source.js`, `./provider-module.js`
- `rootPublicSurfaceStandard.typescriptBuiltinProviderExportPaths`: `none`
- `rootPublicSurfaceStandard.typescriptInlineHelperNames`: `none`
- `rootPublicSurfaceStandard.reservedSurfaceFamilies`: `standard-contract`, `provider-catalog`, `provider-package-catalog`, `provider-activation-catalog`, `capability-catalog`, `provider-extension-catalog`, `language-workspace-catalog`, `provider-selection`, `provider-package-loader`, `provider-support`, `driver-manager`, `data-source`
- `rootPublicSurfaceStandard.reservedEntryPointKinds.flutter`: `barrel`
- `rootPublicSurfaceStandard.reservedEntryPointKinds.python`: `package-init`
- `rootPublicSurfaceStandard.builtinProviderExposureTerm`: `provider-plugin-package-only`
- `rootPublicSurfaceStandard.nonBuiltinProviderExposureTerm`: `package-boundary-only`
- TypeScript root public module: `sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`
- TypeScript root public constants: `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`, `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`, `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`, `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`, `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, `RTC_ROOT_PUBLIC_SURFACE_STANDARD`

## Lookup Helper Naming Standard

- `lookupHelperNamingStandard.profileTerms`: `lower-camel-rtc`, `upper-camel-rtc`, `snake-case-rtc`
- `lookupHelperNamingStandard.familyTerms`: `provider-catalog-by-provider-key`, `provider-package-by-provider-key`, `provider-package-by-package-identity`, `provider-activation-by-provider-key`, `capability-catalog`, `capability-descriptor-by-capability-key`, `provider-extension-catalog`, `provider-extension-descriptor-by-extension-key`, `provider-extensions-for-provider`, `provider-extensions-by-extension-keys`, `provider-extension-membership`, `language-workspace-by-language`, `provider-url-parser`, `provider-selection-resolver`, `provider-support-status-resolver`, `provider-support-state-factory`, `provider-package-loader-factory`, `provider-package-load-target-resolver`, `provider-module-loader`, `single-provider-package-installer`, `batch-provider-package-installer`
- TypeScript root public module: `sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts`
- TypeScript root public constants: `RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`, `RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, `RTC_LOOKUP_HELPER_NAMING_STANDARD`

## Error Code Standard

- `errorCodeStandard.codeTerms`: `provider_package_not_found`, `provider_package_identity_mismatch`, `provider_package_load_failed`, `provider_module_export_missing`, `provider_module_contract_mismatch`, `driver_already_registered`, `driver_not_found`, `provider_not_official`, `provider_not_supported`, `provider_metadata_mismatch`, `provider_selection_failed`, `capability_not_supported`, `invalid_provider_url`, `invalid_native_config`, `native_sdk_not_available`, `vendor_error`
- `errorCodeStandard.fallbackCode`: `vendor_error`

## Provider Extension Standard

- `providerExtensionStandard.accessTerms`: `unwrap-only`, `extension-object`
- `providerExtensionStandard.statusTerms`: `reference-baseline`, `reserved`

## TypeScript Adapter Standard

- `typescriptAdapterStandard.sdkProvisioningTerms`: `consumer-supplied`
- `typescriptAdapterStandard.bindingStrategyTerms`: `native-factory`
- `typescriptAdapterStandard.bundlePolicyTerms`: `must-not-bundle`
- `typescriptAdapterStandard.runtimeBridgeStatusTerms`: `reference-baseline`, `reserved`
- `typescriptAdapterStandard.officialVendorSdkRequirementTerms`: `required`, `not-declared-until-bridge`
- `typescriptAdapterStandard.referenceContract.sdkProvisioning`: `consumer-supplied`
- `typescriptAdapterStandard.referenceContract.bindingStrategy`: `native-factory`
- `typescriptAdapterStandard.referenceContract.bundlePolicy`: `must-not-bundle`
- `typescriptAdapterStandard.referenceContract.runtimeBridgeStatus`: `reference-baseline`
- `typescriptAdapterStandard.referenceContract.officialVendorSdkRequirement`: `required`

## TypeScript Package Standard

- `typescriptPackageStandard.packageNamePattern`: `@sdkwork/rtc-sdk-provider-{providerKey}`
- `typescriptPackageStandard.sourceModulePattern`: `./index.js`
- `typescriptPackageStandard.driverFactoryPattern`: `create{providerPascal}RtcDriver`
- `typescriptPackageStandard.metadataSymbolPattern`: `{providerUpperSnake}_RTC_PROVIDER_METADATA`
- `typescriptPackageStandard.moduleSymbolPattern`: `{providerUpperSnake}_RTC_PROVIDER_MODULE`
- `typescriptPackageStandard.rootPublicRule`: `plugin-package-only`

## Capability Catalog

| Capability key | Category | Surface |
| --- | --- | --- |
| `session` | `required-baseline` | `cross-surface` |
| `credential` | `required-baseline` | `control-plane` |
| `provider.webhook` | `required-baseline` | `control-plane` |
| `provider.event-normalization` | `required-baseline` | `control-plane` |
| `health` | `required-baseline` | `control-plane` |
| `media.audio` | `required-baseline` | `runtime-bridge` |
| `media.video` | `required-baseline` | `runtime-bridge` |
| `live.broadcast` | `required-baseline` | `cross-surface` |
| `live.audience` | `required-baseline` | `cross-surface` |
| `screen-share` | `optional-advanced` | `runtime-bridge` |
| `recording` | `optional-advanced` | `control-plane` |
| `artifact` | `optional-advanced` | `control-plane` |
| `cloud-mix` | `optional-advanced` | `control-plane` |
| `cdn-relay` | `optional-advanced` | `control-plane` |
| `data-channel` | `optional-advanced` | `runtime-bridge` |
| `transcription` | `optional-advanced` | `control-plane` |
| `beauty` | `optional-advanced` | `runtime-bridge` |
| `spatial-audio` | `optional-advanced` | `runtime-bridge` |
| `e2ee` | `optional-advanced` | `runtime-bridge` |
| `provider.active-query` | `optional-advanced` | `control-plane` |

## Provider Extension Catalog

| Extension key | Provider key | Display name | Surface | Access | Status |
| --- | --- | --- | --- | --- | --- |
| `volcengine.native-client` | `volcengine` | Volcengine Native Client | `runtime-bridge` | `unwrap-only` | `reference-baseline` |
| `aliyun.native-client` | `aliyun` | Aliyun Native Client | `runtime-bridge` | `unwrap-only` | `reserved` |
| `tencent.native-client` | `tencent` | Tencent Native Client | `runtime-bridge` | `unwrap-only` | `reference-baseline` |
| `agora.native-client` | `agora` | Agora Native Client | `runtime-bridge` | `unwrap-only` | `reserved` |
| `zego.native-client` | `zego` | ZEGO Native Client | `runtime-bridge` | `unwrap-only` | `reserved` |
| `livekit.native-client` | `livekit` | LiveKit Native Client | `runtime-bridge` | `unwrap-only` | `reserved` |
| `twilio.native-client` | `twilio` | Twilio Native Client | `runtime-bridge` | `unwrap-only` | `reserved` |
| `jitsi.native-client` | `jitsi` | Jitsi Native Client | `runtime-bridge` | `unwrap-only` | `reserved` |
| `janus.native-client` | `janus` | Janus Native Client | `runtime-bridge` | `unwrap-only` | `reserved` |
| `mediasoup.native-client` | `mediasoup` | mediasoup Native Client | `runtime-bridge` | `unwrap-only` | `reserved` |

## Provider Matrix

| Provider key | Tier | Builtin | Default selected | Display name |
| --- | --- | --- | --- | --- |
| `volcengine` | `tier-a` | Yes | Yes | Volcengine RTC |
| `aliyun` | `tier-a` | Yes | No | Aliyun RTC |
| `tencent` | `tier-a` | Yes | No | Tencent RTC |
| `agora` | `tier-a` | Yes | No | Agora RTC |
| `zego` | `tier-b` | No | No | ZEGO RTC |
| `livekit` | `tier-a` | Yes | No | LiveKit RTC |
| `twilio` | `tier-b` | No | No | Twilio Video |
| `jitsi` | `tier-b` | No | No | Jitsi Meet |
| `janus` | `tier-c` | No | No | Janus RTC |
| `mediasoup` | `tier-c` | No | No | mediasoup RTC |

## Provider Capability Matrix

| Provider key | Required capabilities | Optional capabilities |
| --- | --- | --- |
| `volcengine` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `screen-share`, `recording`, `artifact`, `cloud-mix`, `provider.active-query` |
| `aliyun` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `screen-share`, `recording`, `artifact`, `cloud-mix`, `provider.active-query` |
| `tencent` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `screen-share`, `recording`, `artifact`, `cdn-relay`, `provider.active-query` |
| `agora` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `screen-share`, `recording`, `artifact`, `cloud-mix`, `data-channel`, `spatial-audio`, `e2ee`, `provider.active-query` |
| `zego` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `screen-share`, `recording`, `artifact`, `cloud-mix`, `beauty`, `provider.active-query` |
| `livekit` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `screen-share`, `recording`, `artifact`, `data-channel`, `transcription`, `e2ee`, `provider.active-query` |
| `twilio` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `screen-share`, `recording`, `artifact`, `data-channel`, `provider.active-query` |
| `jitsi` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `screen-share`, `recording`, `artifact`, `transcription`, `provider.active-query` |
| `janus` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `data-channel`, `provider.active-query` |
| `mediasoup` | `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization` | `data-channel`, `provider.active-query` |

## TypeScript Provider Runtime Baseline

| Provider key | Runtime bridge status | Vendor SDK requirement | SDK provisioning | Binding strategy | Bundle policy |
| --- | --- | --- | --- | --- | --- |
| `volcengine` | `reference-baseline` | `required` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `aliyun` | `reserved` | `not-declared-until-bridge` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `tencent` | `reference-baseline` | `required` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `agora` | `reserved` | `not-declared-until-bridge` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `zego` | `reserved` | `not-declared-until-bridge` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `livekit` | `reserved` | `not-declared-until-bridge` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `twilio` | `reserved` | `not-declared-until-bridge` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `jitsi` | `reserved` | `not-declared-until-bridge` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `janus` | `reserved` | `not-declared-until-bridge` | `consumer-supplied` | `native-factory` | `must-not-bundle` |
| `mediasoup` | `reserved` | `not-declared-until-bridge` | `consumer-supplied` | `native-factory` | `must-not-bundle` |

## Language Matrix

| Language | Public package | Control SDK | Runtime bridge | Maturity tier | Current role |
| --- | --- | --- | --- | --- | --- |
| TypeScript | `@sdkwork/rtc-sdk` | Yes | Yes | `reference` | Executable reference implementation |
| Flutter | `rtc_sdk` | Yes | Yes | `reference` | Executable mobile runtime baseline |
| Rust | `rtc_sdk` | Yes | No | `reserved` | Reserved workspace skeleton |
| Java | `com.sdkwork:rtc-sdk` | Yes | No | `reserved` | Reserved workspace skeleton |
| C# | `Sdkwork.Rtc.Sdk` | Yes | No | `reserved` | Reserved workspace skeleton |
| Swift | `RtcSdk` | Yes | No | `reserved` | Reserved workspace skeleton |
| Kotlin | `com.sdkwork:rtc-sdk` | Yes | No | `reserved` | Reserved workspace skeleton |
| Go | `github.com/sdkwork/rtc-sdk` | Yes | No | `reserved` | Reserved workspace skeleton |
| Python | `sdkwork-rtc-sdk` | Yes | No | `reserved` | Reserved workspace skeleton |

## Language Workspace Catalog Matrix

| Language | Workspace catalog | Public package | Control SDK | Runtime bridge | Maturity tier |
| --- | --- | --- | --- | --- | --- |
| TypeScript | `src/language-workspace-catalog.ts` | `@sdkwork/rtc-sdk` | Yes | Yes | `reference` |
| Flutter | `lib/src/rtc_language_workspace_catalog.dart` | `rtc_sdk` | Yes | Yes | `reference` |
| Rust | `src/language_workspace_catalog.rs` | `rtc_sdk` | Yes | No | `reserved` |
| Java | `src/main/java/com/sdkwork/rtc/metadata/RtcLanguageWorkspaceCatalog.java` | `com.sdkwork:rtc-sdk` | Yes | No | `reserved` |
| C# | `src/SDKWork.Rtc.Sdk/RtcLanguageWorkspaceCatalog.cs` | `Sdkwork.Rtc.Sdk` | Yes | No | `reserved` |
| Swift | `Sources/RtcSdk/RtcLanguageWorkspaceCatalog.swift` | `RtcSdk` | Yes | No | `reserved` |
| Kotlin | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcLanguageWorkspaceCatalog.kt` | `com.sdkwork:rtc-sdk` | Yes | No | `reserved` |
| Go | `rtcstandard/language_workspace_catalog.go` | `github.com/sdkwork/rtc-sdk` | Yes | No | `reserved` |
| Python | `sdkwork_ai_prod_sdk/language_workspace_catalog.py` | `sdkwork-rtc-sdk` | Yes | No | `reserved` |

## Language Provider Package Boundary Matrix

| Language | Mode | Root public policy | Lifecycle status terms | Runtime bridge status terms | Concrete scaffold path |
| --- | --- | --- | --- | --- | --- |
| TypeScript | `catalog-governed-mixed` | `none` | `package_reference_boundary` | `reference-baseline`, `reserved` | `<none>` |
| Flutter | `scaffold-per-provider-package` | `none` | `package_reference_boundary`, `future-runtime-bridge-only` | `reference-baseline`, `reserved` | `providers/provider-package-scaffold.md` |
| Rust | `scaffold-per-provider-package` | `none` | `future-runtime-bridge-only` | `reserved` | `providers/provider-package-scaffold.md` |
| Java | `scaffold-per-provider-package` | `none` | `future-runtime-bridge-only` | `reserved` | `providers/provider-package-scaffold.md` |
| C# | `scaffold-per-provider-package` | `none` | `future-runtime-bridge-only` | `reserved` | `providers/provider-package-scaffold.md` |
| Swift | `scaffold-per-provider-package` | `none` | `future-runtime-bridge-only` | `reserved` | `providers/provider-package-scaffold.md` |
| Kotlin | `scaffold-per-provider-package` | `none` | `future-runtime-bridge-only` | `reserved` | `providers/provider-package-scaffold.md` |
| Go | `scaffold-per-provider-package` | `none` | `future-runtime-bridge-only` | `reserved` | `providers/provider-package-scaffold.md` |
| Python | `scaffold-per-provider-package` | `none` | `future-runtime-bridge-only` | `reserved` | `providers/provider-package-scaffold.md` |

## Reserved Language Package Scaffold Matrix

| Language | Build system | Manifest path | Contract scaffold |
| --- | --- | --- | --- |
| Flutter | `flutter-pub` | `pubspec.yaml` | `lib/src/rtc_standard_contract.dart` |
| Rust | `cargo` | `Cargo.toml` | `src/lib.rs` |
| Java | `maven` | `pom.xml` | `src/main/java/com/sdkwork/rtc/standard/RtcStandardContract.java` |
| C# | `dotnet-sdk` | `src/SDKWork.Rtc.Sdk/SDKWork.Rtc.Sdk.csproj` | `src/SDKWork.Rtc.Sdk/RtcStandardContract.cs` |
| Swift | `swift-package-manager` | `Package.swift` | `Sources/RtcSdk/RtcStandardContract.swift` |
| Kotlin | `gradle-kotlin-dsl` | `build.gradle.kts` | `src/main/kotlin/com/sdkwork/rtc/standard/RtcStandardContract.kt` |
| Go | `go-modules` | `go.mod` | `rtcstandard/contract.go` |
| Python | `pyproject` | `pyproject.toml` | `sdkwork_ai_prod_sdk/standard_contract.py` |

## Reserved Language Metadata Scaffold Matrix

| Language | Provider catalog | Provider package catalog | Provider activation catalog | Capability catalog | Provider extension catalog | Provider selection |
| --- | --- | --- | --- | --- | --- | --- |
| Flutter | `lib/src/rtc_provider_catalog.dart` | `lib/src/rtc_provider_package_catalog.dart` | `lib/src/rtc_provider_activation_catalog.dart` | `lib/src/rtc_capability_catalog.dart` | `lib/src/rtc_provider_extension_catalog.dart` | `lib/src/rtc_provider_selection.dart` |
| Rust | `src/provider_catalog.rs` | `src/provider_package_catalog.rs` | `src/provider_activation_catalog.rs` | `src/capability_catalog.rs` | `src/provider_extension_catalog.rs` | `src/provider_selection.rs` |
| Java | `src/main/java/com/sdkwork/rtc/metadata/RtcProviderCatalog.java` | `src/main/java/com/sdkwork/rtc/metadata/RtcProviderPackageCatalog.java` | `src/main/java/com/sdkwork/rtc/metadata/RtcProviderActivationCatalog.java` | `src/main/java/com/sdkwork/rtc/metadata/RtcCapabilityCatalog.java` | `src/main/java/com/sdkwork/rtc/metadata/RtcProviderExtensionCatalog.java` | `src/main/java/com/sdkwork/rtc/metadata/RtcProviderSelection.java` |
| C# | `src/SDKWork.Rtc.Sdk/RtcProviderCatalog.cs` | `src/SDKWork.Rtc.Sdk/RtcProviderPackageCatalog.cs` | `src/SDKWork.Rtc.Sdk/RtcProviderActivationCatalog.cs` | `src/SDKWork.Rtc.Sdk/RtcCapabilityCatalog.cs` | `src/SDKWork.Rtc.Sdk/RtcProviderExtensionCatalog.cs` | `src/SDKWork.Rtc.Sdk/RtcProviderSelection.cs` |
| Swift | `Sources/RtcSdk/RtcProviderCatalog.swift` | `Sources/RtcSdk/RtcProviderPackageCatalog.swift` | `Sources/RtcSdk/RtcProviderActivationCatalog.swift` | `Sources/RtcSdk/RtcCapabilityCatalog.swift` | `Sources/RtcSdk/RtcProviderExtensionCatalog.swift` | `Sources/RtcSdk/RtcProviderSelection.swift` |
| Kotlin | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderCatalog.kt` | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderPackageCatalog.kt` | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderActivationCatalog.kt` | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcCapabilityCatalog.kt` | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderExtensionCatalog.kt` | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderSelection.kt` |
| Go | `rtcstandard/provider_catalog.go` | `rtcstandard/provider_package_catalog.go` | `rtcstandard/provider_activation_catalog.go` | `rtcstandard/capability_catalog.go` | `rtcstandard/provider_extension_catalog.go` | `rtcstandard/provider_selection.go` |
| Python | `sdkwork_ai_prod_sdk/provider_catalog.py` | `sdkwork_ai_prod_sdk/provider_package_catalog.py` | `sdkwork_ai_prod_sdk/provider_activation_catalog.py` | `sdkwork_ai_prod_sdk/capability_catalog.py` | `sdkwork_ai_prod_sdk/provider_extension_catalog.py` | `sdkwork_ai_prod_sdk/provider_selection.py` |

## Reserved Language Resolution Scaffold Matrix

| Language | Driver manager | Data source | Provider support | Provider package loader |
| --- | --- | --- | --- | --- |
| Flutter | `lib/src/rtc_driver_manager.dart` | `lib/src/rtc_data_source.dart` | `lib/src/rtc_provider_support.dart` | `lib/src/rtc_provider_package_loader.dart` |
| Rust | `src/driver_manager.rs` | `src/data_source.rs` | `src/provider_support.rs` | `src/provider_package_loader.rs` |
| Java | `src/main/java/com/sdkwork/rtc/metadata/RtcDriverManager.java` | `src/main/java/com/sdkwork/rtc/metadata/RtcDataSource.java` | `src/main/java/com/sdkwork/rtc/metadata/RtcProviderSupport.java` | `src/main/java/com/sdkwork/rtc/metadata/RtcProviderPackageLoader.java` |
| C# | `src/SDKWork.Rtc.Sdk/RtcDriverManager.cs` | `src/SDKWork.Rtc.Sdk/RtcDataSource.cs` | `src/SDKWork.Rtc.Sdk/RtcProviderSupport.cs` | `src/SDKWork.Rtc.Sdk/RtcProviderPackageLoader.cs` |
| Swift | `Sources/RtcSdk/RtcDriverManager.swift` | `Sources/RtcSdk/RtcDataSource.swift` | `Sources/RtcSdk/RtcProviderSupport.swift` | `Sources/RtcSdk/RtcProviderPackageLoader.swift` |
| Kotlin | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcDriverManager.kt` | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcDataSource.kt` | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderSupport.kt` | `src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderPackageLoader.kt` |
| Go | `rtcstandard/driver_manager.go` | `rtcstandard/data_source.go` | `rtcstandard/provider_support.go` | `rtcstandard/provider_package_loader.go` |
| Python | `sdkwork_ai_prod_sdk/driver_manager.py` | `sdkwork_ai_prod_sdk/data_source.py` | `sdkwork_ai_prod_sdk/provider_support.py` | `sdkwork_ai_prod_sdk/provider_package_loader.py` |

## Reserved Language Provider Package Scaffold Matrix

| Language | Scaffold path | Directory pattern | Package pattern | Manifest file name | Readme file name | Source file pattern | Source symbol pattern | Template tokens | Source template tokens | Status | Runtime bridge status | Root public | Default provider package identity | Default provider manifest path | Default provider README path | Default provider source path | Default provider source symbol |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Flutter | `providers/provider-package-scaffold.md` | `providers/rtc_sdk_provider_{providerKey}` | `rtc_sdk_provider_{providerKey}` | `pubspec.yaml` | `README.md` | `lib/src/rtc_provider_{providerKey}_package_contract.dart` | `RtcProvider{providerPascal}PackageContract` | `{providerKey}` | `{providerKey}`, `{providerPascal}` | `future-runtime-bridge-only` | `reserved` | `false` | `rtc_sdk_provider_volcengine` | `providers/rtc_sdk_provider_volcengine/pubspec.yaml` | `providers/rtc_sdk_provider_volcengine/README.md` | `providers/rtc_sdk_provider_volcengine/lib/src/rtc_provider_volcengine_package_contract.dart` | `RtcProviderVolcenginePackageContract` |
| Rust | `providers/provider-package-scaffold.md` | `providers/rtc-sdk-provider-{providerKey}` | `rtc-sdk-provider-{providerKey}` | `Cargo.toml` | `README.md` | `src/lib.rs` | `RtcProvider{providerPascal}PackageContract` | `{providerKey}` | `{providerPascal}` | `future-runtime-bridge-only` | `reserved` | `false` | `rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine/Cargo.toml` | `providers/rtc-sdk-provider-volcengine/README.md` | `providers/rtc-sdk-provider-volcengine/src/lib.rs` | `RtcProviderVolcenginePackageContract` |
| Java | `providers/provider-package-scaffold.md` | `providers/rtc-sdk-provider-{providerKey}` | `com.sdkwork:rtc-sdk-provider-{providerKey}` | `pom.xml` | `README.md` | `src/main/java/com/sdkwork/rtc/provider/{providerKey}/RtcProvider{providerPascal}PackageContract.java` | `RtcProvider{providerPascal}PackageContract` | `{providerKey}` | `{providerKey}`, `{providerPascal}` | `future-runtime-bridge-only` | `reserved` | `false` | `com.sdkwork:rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine/pom.xml` | `providers/rtc-sdk-provider-volcengine/README.md` | `providers/rtc-sdk-provider-volcengine/src/main/java/com/sdkwork/rtc/provider/volcengine/RtcProviderVolcenginePackageContract.java` | `RtcProviderVolcenginePackageContract` |
| C# | `providers/provider-package-scaffold.md` | `providers/Sdkwork.Rtc.Sdk.Provider.{providerPascal}` | `Sdkwork.Rtc.Sdk.Provider.{providerPascal}` | `Sdkwork.Rtc.Sdk.Provider.{providerPascal}.csproj` | `README.md` | `src/RtcProvider{providerPascal}PackageContract.cs` | `RtcProvider{providerPascal}PackageContract` | `{providerPascal}` | `{providerPascal}` | `future-runtime-bridge-only` | `reserved` | `false` | `Sdkwork.Rtc.Sdk.Provider.Volcengine` | `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/Sdkwork.Rtc.Sdk.Provider.Volcengine.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/src/RtcProviderVolcenginePackageContract.cs` | `RtcProviderVolcenginePackageContract` |
| Swift | `providers/provider-package-scaffold.md` | `Providers/RtcSdkProvider{providerPascal}` | `RtcSdkProvider{providerPascal}` | `Package.swift` | `README.md` | `Sources/RtcSdkProvider{providerPascal}/RtcProvider{providerPascal}PackageContract.swift` | `RtcProvider{providerPascal}PackageContract` | `{providerPascal}` | `{providerPascal}` | `future-runtime-bridge-only` | `reserved` | `false` | `RtcSdkProviderVolcengine` | `Providers/RtcSdkProviderVolcengine/Package.swift` | `Providers/RtcSdkProviderVolcengine/README.md` | `Providers/RtcSdkProviderVolcengine/Sources/RtcSdkProviderVolcengine/RtcProviderVolcenginePackageContract.swift` | `RtcProviderVolcenginePackageContract` |
| Kotlin | `providers/provider-package-scaffold.md` | `providers/rtc-sdk-provider-{providerKey}` | `com.sdkwork:rtc-sdk-provider-{providerKey}` | `build.gradle.kts` | `README.md` | `src/main/kotlin/com/sdkwork/rtc/provider/{providerKey}/RtcProvider{providerPascal}PackageContract.kt` | `RtcProvider{providerPascal}PackageContract` | `{providerKey}` | `{providerKey}`, `{providerPascal}` | `future-runtime-bridge-only` | `reserved` | `false` | `com.sdkwork:rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine/build.gradle.kts` | `providers/rtc-sdk-provider-volcengine/README.md` | `providers/rtc-sdk-provider-volcengine/src/main/kotlin/com/sdkwork/rtc/provider/volcengine/RtcProviderVolcenginePackageContract.kt` | `RtcProviderVolcenginePackageContract` |
| Go | `providers/provider-package-scaffold.md` | `providers/rtc-sdk-provider-{providerKey}` | `github.com/sdkwork/rtc-sdk-provider-{providerKey}` | `go.mod` | `README.md` | `provider_package_contract.go` | `RtcProvider{providerPascal}PackageContract` | `{providerKey}` | `{providerPascal}` | `future-runtime-bridge-only` | `reserved` | `false` | `github.com/sdkwork/rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine/go.mod` | `providers/rtc-sdk-provider-volcengine/README.md` | `providers/rtc-sdk-provider-volcengine/provider_package_contract.go` | `RtcProviderVolcenginePackageContract` |
| Python | `providers/provider-package-scaffold.md` | `providers/sdkwork_ai_prod_sdk_provider_{providerKey}` | `sdkwork-rtc-sdk-provider-{providerKey}` | `pyproject.toml` | `README.md` | `sdkwork_ai_prod_sdk_provider_{providerKey}/__init__.py` | `RtcProvider{providerPascal}PackageContract` | `{providerKey}` | `{providerKey}`, `{providerPascal}` | `future-runtime-bridge-only` | `reserved` | `false` | `sdkwork-rtc-sdk-provider-volcengine` | `providers/sdkwork_ai_prod_sdk_provider_volcengine/pyproject.toml` | `providers/sdkwork_ai_prod_sdk_provider_volcengine/README.md` | `providers/sdkwork_ai_prod_sdk_provider_volcengine/sdkwork_ai_prod_sdk_provider_volcengine/__init__.py` | `RtcProviderVolcenginePackageContract` |

## Language Provider Activation Matrix

| Language | Provider key | Activation status | Runtime bridge | Root public | Package boundary |
| --- | --- | --- | --- | --- | --- |
| TypeScript | `volcengine` | `package-boundary` | Yes | No | Yes |
| TypeScript | `aliyun` | `package-boundary` | Yes | No | Yes |
| TypeScript | `tencent` | `package-boundary` | Yes | No | Yes |
| TypeScript | `agora` | `package-boundary` | Yes | No | Yes |
| TypeScript | `zego` | `package-boundary` | Yes | No | Yes |
| TypeScript | `livekit` | `package-boundary` | Yes | No | Yes |
| TypeScript | `twilio` | `package-boundary` | Yes | No | Yes |
| TypeScript | `jitsi` | `package-boundary` | Yes | No | Yes |
| TypeScript | `janus` | `package-boundary` | Yes | No | Yes |
| TypeScript | `mediasoup` | `package-boundary` | Yes | No | Yes |
| Flutter | `volcengine` | `package-boundary` | Yes | No | Yes |
| Flutter | `aliyun` | `control-metadata-only` | No | No | No |
| Flutter | `tencent` | `control-metadata-only` | No | No | No |
| Flutter | `agora` | `control-metadata-only` | No | No | No |
| Flutter | `zego` | `control-metadata-only` | No | No | No |
| Flutter | `livekit` | `control-metadata-only` | No | No | No |
| Flutter | `twilio` | `control-metadata-only` | No | No | No |
| Flutter | `jitsi` | `control-metadata-only` | No | No | No |
| Flutter | `janus` | `control-metadata-only` | No | No | No |
| Flutter | `mediasoup` | `control-metadata-only` | No | No | No |
| Rust | `volcengine` | `control-metadata-only` | No | No | No |
| Rust | `aliyun` | `control-metadata-only` | No | No | No |
| Rust | `tencent` | `control-metadata-only` | No | No | No |
| Rust | `agora` | `control-metadata-only` | No | No | No |
| Rust | `zego` | `control-metadata-only` | No | No | No |
| Rust | `livekit` | `control-metadata-only` | No | No | No |
| Rust | `twilio` | `control-metadata-only` | No | No | No |
| Rust | `jitsi` | `control-metadata-only` | No | No | No |
| Rust | `janus` | `control-metadata-only` | No | No | No |
| Rust | `mediasoup` | `control-metadata-only` | No | No | No |
| Java | `volcengine` | `control-metadata-only` | No | No | No |
| Java | `aliyun` | `control-metadata-only` | No | No | No |
| Java | `tencent` | `control-metadata-only` | No | No | No |
| Java | `agora` | `control-metadata-only` | No | No | No |
| Java | `zego` | `control-metadata-only` | No | No | No |
| Java | `livekit` | `control-metadata-only` | No | No | No |
| Java | `twilio` | `control-metadata-only` | No | No | No |
| Java | `jitsi` | `control-metadata-only` | No | No | No |
| Java | `janus` | `control-metadata-only` | No | No | No |
| Java | `mediasoup` | `control-metadata-only` | No | No | No |
| C# | `volcengine` | `control-metadata-only` | No | No | No |
| C# | `aliyun` | `control-metadata-only` | No | No | No |
| C# | `tencent` | `control-metadata-only` | No | No | No |
| C# | `agora` | `control-metadata-only` | No | No | No |
| C# | `zego` | `control-metadata-only` | No | No | No |
| C# | `livekit` | `control-metadata-only` | No | No | No |
| C# | `twilio` | `control-metadata-only` | No | No | No |
| C# | `jitsi` | `control-metadata-only` | No | No | No |
| C# | `janus` | `control-metadata-only` | No | No | No |
| C# | `mediasoup` | `control-metadata-only` | No | No | No |
| Swift | `volcengine` | `control-metadata-only` | No | No | No |
| Swift | `aliyun` | `control-metadata-only` | No | No | No |
| Swift | `tencent` | `control-metadata-only` | No | No | No |
| Swift | `agora` | `control-metadata-only` | No | No | No |
| Swift | `zego` | `control-metadata-only` | No | No | No |
| Swift | `livekit` | `control-metadata-only` | No | No | No |
| Swift | `twilio` | `control-metadata-only` | No | No | No |
| Swift | `jitsi` | `control-metadata-only` | No | No | No |
| Swift | `janus` | `control-metadata-only` | No | No | No |
| Swift | `mediasoup` | `control-metadata-only` | No | No | No |
| Kotlin | `volcengine` | `control-metadata-only` | No | No | No |
| Kotlin | `aliyun` | `control-metadata-only` | No | No | No |
| Kotlin | `tencent` | `control-metadata-only` | No | No | No |
| Kotlin | `agora` | `control-metadata-only` | No | No | No |
| Kotlin | `zego` | `control-metadata-only` | No | No | No |
| Kotlin | `livekit` | `control-metadata-only` | No | No | No |
| Kotlin | `twilio` | `control-metadata-only` | No | No | No |
| Kotlin | `jitsi` | `control-metadata-only` | No | No | No |
| Kotlin | `janus` | `control-metadata-only` | No | No | No |
| Kotlin | `mediasoup` | `control-metadata-only` | No | No | No |
| Go | `volcengine` | `control-metadata-only` | No | No | No |
| Go | `aliyun` | `control-metadata-only` | No | No | No |
| Go | `tencent` | `control-metadata-only` | No | No | No |
| Go | `agora` | `control-metadata-only` | No | No | No |
| Go | `zego` | `control-metadata-only` | No | No | No |
| Go | `livekit` | `control-metadata-only` | No | No | No |
| Go | `twilio` | `control-metadata-only` | No | No | No |
| Go | `jitsi` | `control-metadata-only` | No | No | No |
| Go | `janus` | `control-metadata-only` | No | No | No |
| Go | `mediasoup` | `control-metadata-only` | No | No | No |
| Python | `volcengine` | `control-metadata-only` | No | No | No |
| Python | `aliyun` | `control-metadata-only` | No | No | No |
| Python | `tencent` | `control-metadata-only` | No | No | No |
| Python | `agora` | `control-metadata-only` | No | No | No |
| Python | `zego` | `control-metadata-only` | No | No | No |
| Python | `livekit` | `control-metadata-only` | No | No | No |
| Python | `twilio` | `control-metadata-only` | No | No | No |
| Python | `jitsi` | `control-metadata-only` | No | No | No |
| Python | `janus` | `control-metadata-only` | No | No | No |
| Python | `mediasoup` | `control-metadata-only` | No | No | No |

## Reading Rules

- TypeScript and Flutter are the executable reference baselines in the current landing.
- The remaining official language workspaces are materialized reserved boundaries so the standard stays explicit.
- A provider package boundary may stay reserved even when the root workspace already has a verified runtime bridge.
- A workspace or provider package must not advertise runtime bridge support until it has a verified native bridge.
