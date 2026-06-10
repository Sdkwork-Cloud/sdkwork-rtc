# SDKWork RTC SDK TypeScript Runtime Usage

This guide describes the executable TypeScript/web media runtime baseline of `sdkwork-rtc-sdk`.
IM-owned SDKs and services create business call sessions, deliver invitations, and issue provider
credentials. The RTC SDK consumes media-room inputs and drives provider media behavior.

## Current Runnable Baseline

- Default media provider: `volcengine`
- Default web provider plugin package: `@sdkwork/rtc-sdk-provider-volcengine`
- Default web provider plugin import path: `@sdkwork/rtc-sdk-provider-volcengine`
- Default web vendor SDK package: `@volcengine/rtc`
- Standard media entrypoint: `RtcDataSource`
- Recommended runtime entrypoint: `installRtcProviderPackage`
- Smoke command: `npm run smoke`
- Smoke mode: `runtime-backed`
- Smoke variants: `default`

## Install

```bash
npm install @sdkwork/rtc-sdk @sdkwork/rtc-sdk-provider-volcengine @volcengine/rtc
```

## Fast Runtime Verification

Run the public TypeScript smoke command inside `sdkwork-rtc-sdk-typescript` when you want to validate
the default provider runtime bridge without depending on live credentials:

```bash
npm run smoke
```

The smoke command builds the TypeScript package and verifies the root public API boundary. It guards
against retired call-lifecycle exports reappearing in the RTC SDK surface.

## Media Runtime Flow

```ts
import {
  createRtcProviderPackageLoader,
  installRtcProviderPackage,
  RtcDriverManager,
  RtcDataSource,
} from '@sdkwork/rtc-sdk';
import * as volcengineProvider from '@sdkwork/rtc-sdk-provider-volcengine';

const driverManager = await installRtcProviderPackage(
  new RtcDriverManager(),
  {
    providerKey: 'volcengine',
  },
  createRtcProviderPackageLoader(async () => volcengineProvider),
);

const dataSource = new RtcDataSource({
  driverManager,
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
  sessionId: 'media-session-1',
  roomId: 'provider-room-1',
  participantId: 'user-1',
  token: 'provider-issued-token',
});

await rtcClient.publish({
  trackId: 'media-session-1-audio',
  kind: 'audio',
});

await rtcClient.publish({
  trackId: 'media-session-1-video',
  kind: 'video',
});
```

## Required Native Config

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

## Runtime Guarantees

- `RtcDataSource` is the standard provider-neutral media client factory
- `installRtcProviderPackage(...)` registers provider drivers through explicit plugin packages
- `RtcDriverManager` and `RtcDataSource` default to `volcengine` only after the
  matching provider package is installed into the manager
- official provider plugin packages and vendor SDKs are not bundled into the RTC standard root package
- provider plugin packages own any vendor SDK peer dependencies
- provider credentials are supplied by the application or IM layer before `join()`
- RTC runtime code does not own user invitation, conversation delivery, or business call lifecycle
