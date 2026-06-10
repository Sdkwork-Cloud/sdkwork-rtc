# SDKWork RTC SDK Flutter Runtime Usage

This guide describes the executable Flutter/mobile media runtime baseline of `sdkwork-rtc-sdk`.
IM-owned SDKs and services create business call sessions, deliver invitations, and issue provider
credentials. The RTC SDK consumes media-room inputs and drives provider media behavior.

## Current Runnable Baseline

- Default media provider: `volcengine`
- Default mobile provider plugin package: `rtc_sdk_provider_volcengine`
- Default mobile provider plugin import path: `package:rtc_sdk_provider_volcengine/rtc_sdk_provider_volcengine.dart`
- Standard media entrypoint: `RtcDataSource`
- Recommended runtime entrypoint: `RtcDataSource`
- Smoke command: `flutter analyze`
- Smoke mode: `analysis-backed`
- Smoke variants: `default`

## Install

Add the standard RTC package. Provider plugin packages such as
`rtc_sdk_provider_volcengine` are installed by the application only when that provider is
selected. The root package has no provider or vendor SDK dependency.

```yaml
dependencies:
  flutter:
    sdk: flutter
  rtc_sdk:
    path: ../sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter
```

## Fast Runtime Verification

Run the public Flutter analysis command inside `sdkwork-rtc-sdk-flutter` when you need to verify
the provider-neutral media runtime contracts:

```powershell
flutter analyze
```

## Media Runtime Flow

```dart
import 'package:rtc_sdk/rtc_sdk.dart';

void inspectRtcProviderBoundary() {
  final packageEntry = getRtcProviderPackageByProviderKey('volcengine');
  final target = resolveRtcProviderPackageLoadTarget(
    const RtcProviderPackageLoadRequest(providerKey: 'volcengine'),
  );

  assert(packageEntry?.packageIdentity == 'rtc_sdk_provider_volcengine');
  assert(target.packageEntry.packageIdentity == 'rtc_sdk_provider_volcengine');
}
```

## Provider Native Config

The Flutter root package is provider-neutral. Provider-specific native config types belong to the
selected provider plugin package and are imported only by applications that install that plugin.

## Runtime Guarantees

- `RtcDataSource` is the standard provider-neutral media client factory
- `RtcDriverManager` accepts provider drivers registered by explicit provider plugin packages
- `RtcDataSource` defaults to `volcengine` only after the matching provider driver is
  registered
- provider plugin packages own concrete native bridge implementations and vendor dependencies
- provider credentials are supplied by the application or IM layer before `join()`
- RTC runtime code does not own user invitation, conversation delivery, or business call lifecycle
- audio and video publish operations stay standardized through `RtcPublishOptions`
