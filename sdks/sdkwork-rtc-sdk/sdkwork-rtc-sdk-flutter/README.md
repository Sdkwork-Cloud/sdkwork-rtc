# SDKWork RTC SDK Flutter Workspace

Language: `flutter`

Planned public package:

- `rtc_sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: yes
- maturity tier: reference

Current role:

- Executable mobile runtime baseline
- provider-neutral RTC contracts
- JDBC-style driver manager and data source model for Flutter/mobile
- official Volcengine Flutter runtime binding through the rtc_sdk_provider_volcengine plugin package
- assembly-driven provider catalog, capability catalog, provider extension catalog, and provider selection helpers
- default mobile provider remains volcengine unless the caller explicitly overrides selection
- mobile runtime bridge remains media/provider focused and leaves call signaling to IM

This workspace is the executable Flutter/mobile runtime baseline for provider-neutral RTC contracts, Volcengine default runtime binding, and JDBC-style driver selection in sdkwork-rtc-sdk.

Default provider contract:

- Flutter/mobile default provider key: `volcengine`
- Flutter/mobile default plugin id: `rtc-volcengine`
- Flutter/mobile default driver id: `sdkwork-rtc-driver-volcengine`
- `RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY` must stay aligned to that assembly default
- `resolveRtcProviderSelection()` in `lib/src/rtc_provider_selection.dart`
  falls back to `RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY` when Flutter callers do not
  provide providerUrl, providerKey, tenant override, or deployment profile values
- `RtcDataSourceOptions.defaultProviderKey` and `RtcDataSource.describeSelection()`
  therefore keep the Flutter/mobile default provider on `volcengine`
  until a caller explicitly overrides it


Language workspace catalog:

- workspace catalog: `lib/src/rtc_language_workspace_catalog.dart`
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

- vendor SDK package: `rtc_sdk_provider_volcengine`
- vendor SDK import path: `package:rtc_sdk_provider_volcengine/rtc_sdk_provider_volcengine.dart`
- recommended entrypoint: `RtcDataSource`
- smoke command: `flutter analyze`
- smoke mode: `analysis-backed`
- smoke variants: `default`


Provider package boundary:

- mode: `scaffold-per-provider-package`
- root public policy: `none`
- lifecycle status terms: `package_reference_boundary`, `future-runtime-bridge-only`
- runtime bridge status terms: `reference-baseline`, `reserved`
- these terms describe future extracted provider packages, not the runnable root workspace baseline


Package scaffold:

- build system: flutter-pub
- manifest: `pubspec.yaml`
- contract scaffold: `lib/src/rtc_standard_contract.dart`


Metadata scaffold:

- provider catalog: `lib/src/rtc_provider_catalog.dart`
- provider package catalog: `lib/src/rtc_provider_package_catalog.dart`
- provider activation catalog: `lib/src/rtc_provider_activation_catalog.dart`
- capability catalog: `lib/src/rtc_capability_catalog.dart`
- provider extension catalog: `lib/src/rtc_provider_extension_catalog.dart`
- provider selection: `lib/src/rtc_provider_selection.dart`
- lookup helper naming contract: `lookupHelperNamingStandard`
- lookup helper naming profiles: `lower-camel-rtc`, `upper-camel-rtc`, `snake-case-rtc`
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, provider URL parsing,
  provider selection resolution, provider support resolution, provider package loading, and
  language workspace by language
- helper naming stays language-idiomatic while preserving the same semantics:
  `getRtc...` for Flutter/Java/Swift/Kotlin, `GetRtc...` for C#/Go, and `get_rtc...` for Rust/Python


Resolution scaffold:

- driver manager: `lib/src/rtc_driver_manager.dart`
- data source: `lib/src/rtc_data_source.dart`
- provider support: `lib/src/rtc_provider_support.dart`
- provider package loader: `lib/src/rtc_provider_package_loader.dart`


Provider package scaffold:

- scaffold: `providers/provider-package-scaffold.md`
- directory pattern: `providers/rtc_sdk_provider_{providerKey}`
- package pattern: `rtc_sdk_provider_{providerKey}`
- manifest file name: `pubspec.yaml`
- readme file name: `README.md`
- source file pattern: `lib/src/rtc_provider_{providerKey}_package_contract.dart`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerKey}`
- source template tokens: `{providerKey}`, `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`
- this scaffold remains reserved for future extracted provider packages; the current executable runtime stays in the root workspace baseline

Provider plugin boundary:

- Flutter/mobile root stays provider-neutral and ships no concrete provider adapter
- provider plugins such as `rtc_sdk_provider_volcengine` are installed only by applications that select them
- `RtcDriverManager` does not auto-register provider drivers from the root package
- `RtcDataSource()` resolves metadata but requires an explicitly registered provider driver before connecting
- business invitations, lifecycle state, and conversation delivery are supplied by IM-owned SDKs

Quick start:

```dart
import 'package:rtc_sdk/rtc_sdk.dart';

void inspectProviderPluginPackage() {
  final target = resolveRtcProviderPackageLoadTarget(
    const RtcProviderPackageLoadRequest(providerKey: 'volcengine'),
  );

  assert(target.packageEntry.packageIdentity == 'rtc_sdk_provider_volcengine');
}
```

Runtime notes:

- provider-specific native config types belong to the selected provider plugin package
- `RtcJoinOptions.token` is supplied by the application or IM layer, not hardcoded in RTC callers
- `RtcPublishOptions` remains provider-neutral and supports standard audio and video publishing
- `RtcDataSource` keeps the provider-neutral runtime boundary stable across native SDK adapters
- IM-owned services decide who should join, which provider room to use, and when the media runtime
  should leave

Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
