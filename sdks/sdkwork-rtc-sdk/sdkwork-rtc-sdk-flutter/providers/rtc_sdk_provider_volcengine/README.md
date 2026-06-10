# Flutter Volcengine RTC Provider Package

Reference Flutter provider package boundary for Volcengine RTC.

- provider key: `volcengine`
- plugin id: `rtc-volcengine`
- driver id: `sdkwork-rtc-driver-volcengine`
- package identity: `rtc_sdk_provider_volcengine`
- directory path: `providers/rtc_sdk_provider_volcengine`
- manifest path: `providers/rtc_sdk_provider_volcengine/pubspec.yaml`
- readme path: `providers/rtc_sdk_provider_volcengine/README.md`
- source path: `providers/rtc_sdk_provider_volcengine/lib/src/rtc_provider_volcengine_package_contract.dart`
- source symbol: `RtcProviderVolcenginePackageContract`
- vendor SDK package: `volc_engine_rtc@^3.60.4`
- status: `package_reference_boundary`
- runtime bridge status: `reference-baseline`
- root public exposure: `false`

Rules:

- this package is the executable Flutter reference bridge for the official Volcengine RTC SDK
- the root `rtc_sdk` package remains provider-neutral and does not depend on `volc_engine_rtc`
- install this provider package only when a Flutter application selects Volcengine as its RTC media provider
- wrap the official vendor SDK; do not re-implement RTC media runtime, signaling, invitation, or call lifecycle behavior
- expose only provider-neutral RTC media operations: `join`, `leave`, `publish`, `unpublish`, `muteAudio`, and `muteVideo`
- use Craw Chat or another owning IM/signaling runtime for business messages, room invitations, and call state orchestration
