# SDKWork RTC SDK Flutter Usage

This document describes the current executable Flutter/mobile baseline of `sdkwork-rtc-sdk`.

## Current Runnable Baseline

- Default media provider: `volcengine`
- Default mobile runtime package: official `volc_engine_rtc`
- Default mobile runtime import path: `package:volc_engine_rtc/volc_engine_rtc.dart`
- Default signaling package: `rtc_sdk`
- Default signaling import path: `package:rtc_sdk/rtc_sdk.dart`
- Standard media entrypoint: `RtcDataSource`
- Standard call/session entrypoint: `StandardRtcCallController`
- Recommended quick-start entrypoint: `createStandardRtcCallControllerStack`
- Smoke command: `node ./bin/sdk-call-smoke.mjs --json`
- Smoke mode: `analysis-backed`

## Install

Add the standard RTC package, the official Volcengine Flutter SDK, and the RTC SDK:

```yaml
dependencies:
  flutter:
    sdk: flutter
  rtc_sdk:
    path: ../sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter
  volc_engine_rtc: ^3.60.3
```

Recommended RTC realtime rule:

- keep `rtc_sdk` on the delivered RTC WebSocket
  live path
- keep `RtcSignalingWebSocketAuthOptions.automatic()` as the default and prefer
  `credentialProvider` with a short-lived realtime ticket for browser-facing gateways
- when HTTP and realtime origins are split, set `websocketBaseUrl` on `RtcSignalingClient implementation`
- when RTC needs a live-auth override, pass `connectOptions.webSocketAuth` on
  `createStandardRtcCallControllerStack(...)`
- when the app already owns one shared RTC live connection, pass `liveConnection` on the RTC
  standard stack so RTC reuses that WebSocket instead of opening another one

## WebSocket Auth Standard

RTC delegates live signaling auth directly to `rtc_sdk` and stays
WebSocket-first.

- `RtcSignalingWebSocketAuthOptions.automatic()` is the recommended default
- `RtcSignalingWebSocketAuthOptions.queryBearer()` is the explicit override for gateways that only accept
  query-parameter auth
- `RtcSignalingWebSocketAuthOptions.headerBearer()` is the explicit override for custom native socket
  bridges that can attach headers
- `RtcSignalingWebSocketAuthOptions.none()` is reserved for trusted internal sockets or pre-signed WebSocket
  URLs
- prefer `credentialProvider` with short-lived realtime tickets instead of long-lived access
  tokens
- keep `deviceId` on the RTC stack top level; `connectOptions.deviceId` is optional and must
  match when supplied
- if the application already owns one shared RTC live connection, pass `liveConnection`; RTC
  keeps subscription sync on that same socket and does not open another one
- WebSocket auth failure should fail fast; the Flutter RTC standard does not downgrade to polling
- call `describeRtcSignalingTransport(...)` when the host needs one immutable runtime snapshot of
  the resolved auth mode, authoritative `deviceId`, shared-`liveConnection` reuse flag, and
  fail-fast/no-polling guarantees before opening the RTC signaling path

```dart
import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> connectRtcLive(RtcSignalingClient rtcSignalingClient) async {
  final rtc = await createStandardRtcCallControllerStack<
      RtcVolcengineFlutterNativeClient>(
    CreateStandardRtcCallControllerStackOptions(
      sdk: rtcSignalingClient,
      deviceId: 'device-1',
      connectOptions: const RtcSignalingConnectOptions(
        webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
      ),
      dataSourceOptions: const RtcDataSourceOptions(
        nativeConfig: RtcVolcengineFlutterNativeConfig(
          appId: 'volc-app-id',
        ),
      ),
    ),
  );

  final signalingTransport = describeRtcSignalingTransport(
    deviceId: 'device-1',
    connectOptions: const RtcSignalingConnectOptions(
      webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
    ),
  );

  print(signalingTransport.authMode);
  print(signalingTransport.usesSharedLiveConnection);

  await rtc.close();
}
```

## Fast Smoke Verification

Run the public Flutter smoke command inside `sdkwork-rtc-sdk-flutter` when you need to verify the default
`volcengine + rtc_sdk` path without live services:

```powershell
node ./bin/sdk-call-smoke.mjs --json
```

Add `--reuse-live-connection` when you want the analyze-backed Flutter smoke to validate the
shared RTC WebSocket ownership path as part of the public RTC baseline.

The executable wrapper is currently analyze-backed because the official
`volc_engine_rtc` package crashes under Dart VM CLI compilation in the current toolchain.
It still gives one stable command for maintainers to verify the standard smoke scenario source.
Its JSON summary also includes a `signalingTransport` descriptor aligned with the Dart smoke
source so maintainers can verify the resolved auth mode, authoritative `deviceId`, shared
`liveConnection` reuse flag, and no-polling contract at the public command boundary.

The verified smoke surface is:

- `createStandardRtcCallControllerStack(...)`
- the default `volcengine` provider selection path
- `rtc_sdk` client composition through `RtcSignalingClient implementation`
- authoritative top-level `deviceId` plus the optional shared `liveConnection` stack variant
- the official Volcengine Flutter bridge smoke scenario source in `bin/sdk-call-smoke.dart`
- the future runtime-backed path that will be used once the vendor package is CLI-runnable in the
  active toolchain

## Media Runtime Only

Use this path when the application already owns its own session orchestration and only needs the
standard media runtime.

```dart
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcMediaOnly() async {
  final dataSource = RtcDataSource(
    options: const RtcDataSourceOptions(
      nativeConfig: RtcVolcengineFlutterNativeConfig(
        appId: 'volc-app-id',
        room: RtcVolcengineFlutterRoomConfig(
          userId: 'user-1',
          profile: 'communication',
          scenario: 'general',
        ),
      ),
    ),
  );

  final rtcClient = await dataSource.createClient<RtcVolcengineFlutterNativeClient>();

  await rtcClient.join(
    const RtcJoinOptions(
      sessionId: 'rtc-session-1',
      roomId: 'room-1',
      participantId: 'user-1',
      token: 'provider-issued-token',
    ),
  );

  await rtcClient.publish(
    RtcPublishOptions(
      trackId: createRtcCallTrackId('rtc-session-1', RtcTrackKind.audio),
      kind: RtcTrackKind.audio,
    ),
  );

  await rtcClient.publish(
    RtcPublishOptions(
      trackId: createRtcCallTrackId('rtc-session-1', RtcTrackKind.video),
      kind: RtcTrackKind.video,
    ),
  );
}
```

## Required Native Config

For the default Volcengine Flutter runtime, `RtcVolcengineFlutterNativeConfig.appId` is mandatory.
The driver fails fast before `join()` if it is missing.

The standard native config shape is:

```dart
const RtcVolcengineFlutterNativeConfig(
  appId: 'volc-app-id',
  room: RtcVolcengineFlutterRoomConfig(
    userId: 'user-1',
    profile: 'communication',
    scenario: 'general',
    token: 'optional-direct-room-token',
  ),
);
```

## Complete Call Flow With RTC Signaling

Use this path when the app wants one standard session that combines:

- RTC-side RTC session creation, invite, accept, reject, and end
- conversation-scoped incoming call discovery through `rtc_sdk`
- realtime session signal delivery through `rtc_sdk`
- provider participant credential issuance
- Volcengine media join and auto publish
- typed offer/answer/ice signaling over the RTC session stream

```dart
import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcCall({
  required RtcSignalingClient rtcSignalingClient,
  required String currentUserId,
}) async {
  final rtc = await createStandardRtcCallControllerStack<
      RtcVolcengineFlutterNativeClient>(
    CreateStandardRtcCallControllerStackOptions(
      sdk: rtcSignalingClient,
      deviceId: 'device-1',
      watchConversationIds: const <String>['conversation-1'],
      connectOptions: const RtcSignalingConnectOptions(
        webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
      ),
      dataSourceOptions: const RtcDataSourceOptions(
        nativeConfig: RtcVolcengineFlutterNativeConfig(
          appId: 'volc-app-id',
        ),
      ),
    ),
  );

  rtc.callController.onEvent((event) {
    if (event.type == RtcCallControllerEventType.incomingInvitation) {
      unawaited(
        rtc.callController.acceptIncoming(
          RtcCallControllerAcceptOptions(
            rtcSessionId: event.invitation!.rtcSessionId,
            participantId: currentUserId,
            autoPublish: const RtcCallAutoPublishOptions(
              audio: true,
              video: true,
            ),
          ),
        ),
      );
    }
  });

  await rtc.callController.startOutgoing(
    RtcCallControllerOutgoingOptions(
      rtcSessionId: 'rtc-session-1',
      conversationId: 'conversation-1',
      rtcMode: 'video_call',
      roomId: 'room-1',
      participantId: currentUserId,
      signalingStreamId: 'rtc-signal-1',
      autoPublish: const RtcCallAutoPublishOptions(
        audio: true,
        video: true,
      ),
    ),
  );

  await rtc.callController.sendOffer(
    const RtcCallSessionDescriptionPayload(
      sdp: 'offer-sdp',
    ),
  );

  await rtc.callController.sendIceCandidate(
    const RtcCallIceCandidatePayload(
      candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
    ),
  );

await rtc.callController.end();
}
```

## Reuse Existing RTC WebSocket

When the application already owns one shared RTC live connection, pass that connection into the RTC
stack so signaling stays on the same WebSocket:

```dart
final liveConnection = await rtcSignalingClient.connect(
  const RtcSignalingConnectOptions(
    deviceId: 'device-1',
    subscriptions: RtcSignalingRealtimeSubscriptionGroups(
      conversations: <String>['conversation-1'],
    ),
    webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
  ),
);

final rtc = await createStandardRtcCallControllerStack<
    RtcVolcengineFlutterNativeClient>(
  CreateStandardRtcCallControllerStackOptions(
    sdk: rtcSignalingClient,
    deviceId: 'device-1',
    liveConnection: liveConnection,
    watchConversationIds: const <String>['conversation-1'],
    connectOptions: const RtcSignalingConnectOptions(
      webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
    ),
    dataSourceOptions: const RtcDataSourceOptions(
      nativeConfig: RtcVolcengineFlutterNativeConfig(
        appId: 'volc-app-id',
      ),
    ),
  ),
);
```

## Signaling Contract Mapping

`createRtcSignalingAdapter(...)` maps the `rtc_sdk` composed RTC surface to the RTC
standard call/signaling contract:

- `RtcSignalingClient.rtc.create(...)` -> `createSession(...)`
- `RtcSignalingClient.rtc.invite(...)` -> `inviteSession(...)`
- `RtcSignalingClient.rtc.accept(...)` -> `acceptSession(...)`
- `RtcSignalingClient.rtc.reject(...)` -> `rejectSession(...)`
- `RtcSignalingClient.rtc.end(...)` -> `endSession(...)`
- `RtcSignalingClient.rtc.postJsonSignal(...)` -> `sendSignal(...)`
- `RtcSignalingClient.rtc.issueParticipantCredential(...)` -> `issueParticipantCredential(...)`
- `RtcSignalingClient.connect(...)` -> internal shared RTC realtime dispatcher live stream
- `RtcSignalingClient.realtime.replaceSubscriptions(...)` -> live subscription sync without opening a second
  RTC-specific socket
- `RtcSignalingClient.conversations.postSignalMessage(...)` -> conversation-scoped invite publication

## Runtime Guarantees

- `createStandardRtcCallControllerStack(...)` returns `driverManager`, `dataSource`,
  `mediaClient`, `signaling`, `callSession`, `realtimeDispatcher`, and `callController`
  in one explicit standard bundle
- `createRtcCallTrackId(rtcSessionId, kind)` is the standard cross-language track id helper and
  yields canonical ids such as `rtc-session-1-audio`
- `RtcDriverManager()` auto-registers the default Volcengine Flutter driver
- `RtcDataSource()` defaults to `volcengine`
- the call/session layer does not leak RTC transport DTOs into the RTC public standard
- `StandardRtcCallController` is the default orchestration layer for invite discovery, remote
  lifecycle reconciliation, and typed offer/answer/ice signaling
- `StandardRtcCallSession` remains the focused single-session executor under the controller
- `RtcJoinOptions.token` is sourced from RTC-issued participant credentials in the standard call
  flow instead of hardcoding vendor tokens in the caller
- audio and video auto-publish are standardized through `RtcCallAutoPublishOptions`
- `connectOptions.webSocketAuth` is passed through to `rtc_sdk`
  when the RTC stack establishes its shared RTC WebSocket live connection
- `liveConnection` lets the RTC standard reuse an app-owned `RtcSignalingClient.connect(...)` live connection
  instead of opening a second RTC-specific socket
- `deviceId` remains the authoritative RTC realtime identity; when
  `connectOptions.deviceId` is provided it must match the RTC stack `deviceId`
- `reconnectInterval` is the standard Flutter RTC reconnect-backoff option for RTC live signaling;
  the public Flutter RTC standard does not expose polling controls
