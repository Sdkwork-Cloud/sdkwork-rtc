# @sdkwork/rtc-h5-call

RTC authority mobile-browser call surface for `sdkwork-rtc-h5`.

## What this package owns

- Full-screen voice/video call UI: incoming ringing, outgoing ringing, connecting,
  connected (video stage + local PiP), finished, errored, and fail-closed unavailable.
- Call domain state machine (pure functions) and snapshot types.
- Media runtime wrapper over `@sdkwork/rtc-sdk` (join / publish / mute / bind / leave)
  with dynamic provider loading (volcengine default).
- Self-contained i18n dictionaries (`zh-CN` / `en-US`) with no `react-i18next` dependency.

## What this package does NOT own

- Call signaling. Per `docs/rtc-im-boundary.md`, invitation / ringing / accept / reject /
  end and the WebSocket call workflow belong to `sdkwork-im`. This package defines the
  `RtcCallSignalingPort` interface and a fail-closed `createUnavailableRtcCallSignaling`
  default; the host application injects a real implementation (e.g. the IM H5 adapter).

## Usage

```tsx
import { RtcCallPage } from "@sdkwork/rtc-h5-call";
import "@sdkwork/rtc-h5-call/styles";

<RtcCallPage
  type="video"
  conversationId={conversationId}
  targetName={contactName}
  targetAvatar={contactAvatar}
  signaling={imH5CallSignaling}
  onExit={() => navigate(-1)}
/>;
```

Without a `signaling` implementation the page renders the typed unavailable state and
never simulates a connection (fail-closed product requirement).

## Media join inputs

`RtcCallMediaService.join` accepts `appId` (resolved by the host or from
`VITE_SDKWORK_RTC_VOLCENGINE_APP_ID`), `sessionId`, `roomId`, `participantId`, `token`
(issued through the signaling port's `issueParticipantCredential`), and optional
`providerKey` / `accessEndpoint` / `providerRegion` / `rtcMode`.
