# SDKWork RTC SDK TypeScript Usage

This document describes the current executable TypeScript baseline of `sdkwork-rtc-sdk`.

## Current Runnable Baseline

- Default media provider: `volcengine`
- Default web runtime package: official `@volcengine/rtc`
- Default web runtime import path: `@volcengine/rtc`
- Default signaling adapter package: `@sdkwork/rtc-sdk`
- Default signaling adapter import path: `@sdkwork/rtc-sdk`
- Standard media entrypoint: `RtcDataSource`
- Standard call/session entrypoint: `StandardRtcCallController`
- Recommended quick-start entrypoint: `createStandardRtcCallControllerStack`
- Smoke command: `node ./bin/sdk-call-smoke.mjs --json`
- Smoke mode: `runtime-backed`
- Smoke variants: `default` and `reuse-live-connection`

## Install

```bash
npm install @sdkwork/rtc-sdk @volcengine/rtc
```

## Fast Smoke Verification

Run the public TypeScript smoke command inside `sdkwork-rtc-sdk-typescript` when you want to validate the
default provider entrypoint without depending on a live signaling service or a real vendor credential:

```bash
node ./bin/sdk-call-smoke.mjs --json
```

The smoke CLI runs the public `@sdkwork/rtc-sdk` surface against a mocked RTC signaling
adapter and a mocked official `@volcengine/rtc` module, then prints the resolved provider,
runtime calls, signaling calls, and final controller states.
The JSON summary also includes a `signalingTransport` descriptor so maintainers can verify the
resolved auth mode, authoritative `deviceId`, matching `connectOptions.deviceId`, shared
`liveConnection` reuse flag, and no-polling contract at the CLI boundary.
Add `--reuse-live-connection` when you want the smoke to verify RTC reuses an app-owned RTC
WebSocket live connection instead of opening another one.

## WebSocket Auth Standard

RTC delegates live signaling auth to the caller-supplied RTC signaling transport or shared
live connection. Prefer typed transport options instead of provider-specific auth shims.

- `{ mode: 'automatic' }` is the recommended default; on the standard browser
  `WebSocket` path it resolves to query-bearer auth
- `{ mode: 'queryBearer' }` is the explicit browser/gateway override when the upstream
  only accepts query-parameter auth
- `{ mode: 'headerBearer' }` is the explicit Node or custom-socket override when
  headers are available
- `{ mode: 'none' }` is reserved for trusted internal links or pre-signed socket
  URLs
- prefer `credentialProvider` with a short-lived realtime ticket; avoid putting long-lived access
  tokens on the WebSocket URL
- keep `deviceId` at the RTC stack top level; `connectOptions.deviceId` is optional and must
  match when supplied
- when the application already owns a shared RTC socket, pass `liveConnection` so RTC syncs
  subscriptions on that same WebSocket instead of opening another one
- call `describeRtcSignalingTransport(...)` when the host needs one immutable runtime snapshot of
  the resolved auth mode, authoritative `deviceId`, shared-`liveConnection` reuse flag, and
  fail-fast/no-polling guarantees before opening the RTC signaling path

```ts
import {
  createRtcAppHttpClient,
  describeRtcSignalingTransport,
  createStandardRtcCallControllerStack,
} from '@sdkwork/rtc-sdk';

const transport = createRtcAppHttpClient({
  baseUrl: 'https://rtc.example.com',
  authToken: 'app-token',
});

const rtc = await createStandardRtcCallControllerStack({
  transport,
  deviceId: 'device-1',
  connectOptions: {
    webSocketAuth: { mode: 'automatic' },
  },
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});

const signalingTransport = describeRtcSignalingTransport({
  deviceId: 'device-1',
  connectOptions: {
    webSocketAuth: { mode: 'automatic' },
  },
});

console.log(signalingTransport.authMode);
console.log(signalingTransport.usesSharedLiveConnection);
```

## Media Runtime Only

Use this path when the app already has its own session/token orchestration and only needs the RTC
media runtime.

```ts
import {
  createRtcCallTrackId,
  RtcDataSource,
  createBuiltinRtcDriverManager,
} from '@sdkwork/rtc-sdk';

const dataSource = new RtcDataSource({
  driverManager: createBuiltinRtcDriverManager(),
  nativeConfig: {
    appId: 'volc-app-id',
    engineConfig: {
      env: 'production',
    },
    roomConfig: {
      profile: 'communication',
    },
    userExtraInfo: {
      displayName: 'Alice',
    },
    capture: {
      audioDeviceId: 'default-mic',
      videoDeviceId: 'default-camera',
    },
  },
});

const rtcClient = await dataSource.createClient();

await rtcClient.join({
  sessionId: 'rtc-session-1',
  roomId: 'room-1',
  participantId: 'user-1',
  token: 'provider-issued-token',
});

await rtcClient.publish({
  trackId: createRtcCallTrackId('rtc-session-1', 'audio'),
  kind: 'audio',
});

await rtcClient.publish({
  trackId: createRtcCallTrackId('rtc-session-1', 'video'),
  kind: 'video',
});
```

### Required Native Config

For the default Volcengine Web runtime, `nativeConfig.appId` is mandatory before `join()`.

Supported Volcengine Web native config shape:

```ts
type RtcVolcengineWebNativeConfig = {
  appId?: string;
  engineConfig?: Record<string, unknown>;
  roomConfig?: Record<string, unknown>;
  userExtraInfo?: Record<string, unknown>;
  capture?: {
    audioDeviceId?: string;
    videoDeviceId?: string;
  };
};
```

## Complete Call Flow With RTC Signaling

Use this path when the app wants one standard session that combines:

- RTC session creation/invite/accept/reject/end through the signaling adapter
- conversation-scoped incoming call discovery through `@sdkwork/rtc-sdk`
- realtime session signal delivery through `@sdkwork/rtc-sdk`
- provider participant credential issuance
- Volcengine media join and auto publish
- typed offer/answer/ice signaling over the RTC session stream

```ts
import {
  createRtcAppHttpClient,
  createStandardRtcCallControllerStack,
  RTC_CALL_OFFER_SIGNAL_TYPE,
} from '@sdkwork/rtc-sdk';

const transport = createRtcAppHttpClient({
  baseUrl: 'https://rtc.example.com',
  authToken: 'app-token',
});

const liveConnection = await transport.connect?.({
  deviceId: 'device-1',
  subscriptions: {
    conversations: ['conversation-1'],
  },
  webSocketAuth: { mode: 'automatic' },
});
if (!liveConnection) {
  throw new Error('Provide transport.connect() or a shared liveConnection when watching incoming RTC calls.');
}

const rtc = await createStandardRtcCallControllerStack({
  transport,
  deviceId: 'device-1',
  liveConnection,
  connectOptions: {
    webSocketAuth: { mode: 'automatic' },
  },
  watchConversationIds: ['conversation-1'],
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});

rtc.callController.onEvent((event) => {
  if (event.type === 'incoming_invitation') {
    void rtc.callController.acceptIncoming({
      rtcSessionId: event.invitation.rtcSessionId,
      participantId: 'user-1',
      autoPublish: {
        audio: true,
        video: true,
      },
    });
  }

  if (event.type === 'signal' && event.signal.signalType === RTC_CALL_OFFER_SIGNAL_TYPE) {
    console.log('remote offer', event.signal.payload);
  }
});

await rtc.callController.startOutgoing({
  rtcSessionId: 'rtc-session-1',
  conversationId: 'conversation-1',
  rtcMode: 'video_call',
  roomId: 'room-1',
  participantId: 'user-1',
  signalingStreamId: 'rtc-signal-1',
  autoPublish: {
    audio: true,
    video: true,
  },
});

await rtc.callController.sendOffer({
  sdp: 'offer-sdp',
});

await rtc.callController.sendIceCandidate({
  candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
});

await rtc.callController.end();
```

## Reuse Existing RTC WebSocket

When the application already owns one shared RTC live connection, reuse it so RTC does not open a
second WebSocket:

```ts
const liveConnection = await transport.connect({
  deviceId: 'device-1',
  subscriptions: {
    conversations: ['conversation-1'],
  },
  webSocketAuth: { mode: 'automatic' },
});

const rtc = await createStandardRtcCallControllerStack({
  transport,
  deviceId: 'device-1',
  liveConnection,
  watchConversationIds: ['conversation-1'],
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});
```

## Signaling Contract Mapping

`createRtcSignalingAdapter(...)` maps the caller-supplied RTC signaling transport to the RTC
standard call/signaling contract:

- `transport.createSession(...)` -> `createSession(...)`
- `transport.inviteSession(...)` -> `inviteSession(...)`
- `transport.acceptSession(...)` -> `acceptSession(...)`
- `transport.rejectSession(...)` -> `rejectSession(...)`
- `transport.endSession(...)` -> `endSession(...)`
- `transport.postJsonSignal(...)` -> `sendSignal(...)`
- `transport.issueParticipantCredential(...)` -> `issueParticipantCredential(...)`
- shared `RtcSignalingRealtimeDispatcher` -> one RTC WebSocket connection for both
  `liveConnection.signals.onRtcSession(...)` and
  `liveConnection.messages.onConversation(...)`
- optional `transport.createSignalMessage(...)` + `transport.send(...)` or
  `transport.messages.createSignal(...)` + `transport.messages.send(...)` ->
  conversation-scoped invite publication
- optional `transport.realtime.replaceSubscriptions(...)` -> live subscription sync without
  opening a second realtime connection

## Runtime Guarantees

- `createStandardRtcCallControllerStack(...)` returns `driverManager`, `dataSource`,
  `mediaClient`, `signaling`, `callSession`, `realtimeDispatcher`, and `callController`
  as one explicit standard bundle
- `createRtcCallTrackId(rtcSessionId, kind)` is the standard cross-language track id helper and
  yields canonical ids such as `rtc-session-1-audio`
- TypeScript now defaults `subscribeSignals` to `true`, aligned with Flutter/mobile
- `createBuiltinRtcDriverManager()` defaults to `volcengine`
- Volcengine Web runtime loading is lazy
- official vendor SDKs are not bundled into the RTC standard package
- RTC signaling is WebSocket-first; the TypeScript RTC standard does not expose polling controls
- `connectOptions.webSocketAuth` is passed through to `@sdkwork/rtc-sdk`
  so browser gateways can prefer query-bearer WebSocket auth while non-browser callers can keep
  header-bearer mode
- `liveConnection` lets the TypeScript RTC standard reuse an app-owned shared RTC WebSocket live
  connection instead of opening a second RTC-specific socket
- `deviceId` remains the authoritative RTC realtime identity; when
  `connectOptions.deviceId` is provided it must match the RTC stack `deviceId`
- signal payloads are exposed as parsed JSON when possible and as raw strings otherwise
- the call/session layer does not leak application transport DTOs into the RTC public standard
- `StandardRtcCallController` is the default orchestration layer for invite discovery, remote
  lifecycle reconciliation, and typed offer/answer/ice signaling
