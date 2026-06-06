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
- official Volcengine Flutter runtime binding through package:volc_engine_rtc
- RTC-owned signaling adapter integration through package:rtc_sdk/rtc_sdk.dart
- assembly-driven provider catalog, capability catalog, provider extension catalog, and provider selection helpers
- default mobile provider remains volcengine unless the caller explicitly overrides selection
- StandardRtcCallController quick-start stack for default Volcengine plus RTC signaling

This workspace is the executable Flutter/mobile runtime baseline for provider-neutral RTC contracts, Volcengine default runtime binding, RTC signaling call orchestration, and JDBC-style driver selection in sdkwork-rtc-sdk.

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

- vendor SDK package: `volc_engine_rtc`
- vendor SDK import path: `package:volc_engine_rtc/volc_engine_rtc.dart`
- signaling SDK package: `rtc_sdk`
- signaling SDK import path: `package:rtc_sdk/rtc_sdk.dart`
- recommended entrypoint: `createStandardRtcCallControllerStack`
- smoke command: `node ./bin/sdk-call-smoke.mjs --json`
- smoke mode: `analysis-backed`
- smoke variants: `default` and `reuse-live-connection`


Provider package boundary:

- mode: `scaffold-per-provider-package`
- root public policy: `none`
- lifecycle status terms: `future-runtime-bridge-only`
- runtime bridge status terms: `reserved`
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

Executable baseline:

- Flutter/mobile now ships a runnable default adapter for `volcengine`
- media runtime delegates to the official `volc_engine_rtc` package
- signaling delegates to `sdkwork-rtc-sdk` through `package:rtc_sdk/rtc_sdk.dart`
- `RtcDriverManager` auto-registers `createVolcengineRtcDriver()`
- `RtcDataSource()` therefore resolves to `volcengine` by default with no extra provider selection
- `createStandardRtcCallControllerStack(...)` is the recommended quick-start entrypoint for the
  default Volcengine plus `sdkwork-rtc-sdk` call flow
- `StandardRtcCallController` is the default orchestration layer for invite discovery, RTC
  lifecycle reconciliation, and typed offer/answer/ice signaling
- `StandardRtcCallSession` remains the focused single-session executor under the controller

Quick start:

```dart
import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcCall({
  required RtcSignalingClient rtcSignalingClient,
  required String currentUserId,
}) async {
  final rtc =
      await createStandardRtcCallControllerStack<RtcVolcengineFlutterNativeClient>(
    CreateStandardRtcCallControllerStackOptions(
      sdk: rtcSignalingClient,
      deviceId: 'current-device-id',
      connectOptions: const RtcSignalingConnectOptions(
        webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
      ),
      dataSourceOptions: const RtcDataSourceOptions(
        nativeConfig: RtcVolcengineFlutterNativeConfig(
          appId: 'your-volcengine-app-id',
        ),
      ),
    ),
  );

  await rtc.callController.startOutgoing(
    RtcCallControllerOutgoingOptions(
      rtcSessionId: 'rtc-session-001',
      conversationId: 'conversation-001',
      rtcMode: 'video_call',
      participantId: currentUserId,
      autoPublish: const RtcCallAutoPublishOptions(
        audio: true,
        video: true,
      ),
    ),
  );
}
```

Runtime notes:

- `createStandardRtcCallControllerStack(...)` returns `driverManager`, `dataSource`,
  `mediaClient`, `signaling`, `callSession`, `realtimeDispatcher`, and `callController`
  so callers can keep the standard pieces explicit
- `RtcVolcengineFlutterNativeConfig.appId` is mandatory; join will fail fast without it
- `RtcJoinOptions.token` is filled from `sdkwork-rtc-sdk` issued participant credentials, not by
  hardcoding vendor tokens in the caller
- `RtcPublishOptions` supports standard audio and video publishing through the Volcengine adapter
- signaling subscriptions are multiplexed through one shared RTC realtime dispatcher backed by
  `rtc_sdk.connect(...)` WebSocket live receive, so multiple RTC sessions do not overwrite each
  other at the subscription layer
- `connectOptions.webSocketAuth` is forwarded to the shared RTC live connection when the RTC stack
  establishes its own WebSocket
- `liveConnection` lets the Flutter RTC standard reuse an app-owned shared RTC WebSocket live
  connection instead of creating another one
- `deviceId` remains the authoritative RTC realtime identity; if `connectOptions.deviceId` is
  provided it must match the RTC stack `deviceId`
- `reconnectInterval` is the standard RTC live signaling reconnect-backoff option for the shared
  WebSocket live connection; the Flutter RTC standard does not expose polling controls

Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
