# sdkwork-rtc-h5-call Specs

Machine authority: `component.spec.json`.

`@sdkwork/rtc-h5-call` is the RTC authority mobile-browser call surface:

- **UI authority**: full-screen voice/video call screens (incoming ringing, outgoing ringing, connected, finished, errored, unavailable).
- **Domain authority**: call state machine pure functions and snapshot types.
- **Media authority**: RTC media runtime wrapper (`@sdkwork/rtc-sdk` join/publish/mute/bind/leave).
- **Signaling boundary**: defines `RtcCallSignalingPort` — a pure TypeScript interface with zero
  `sdkwork-im` dependencies. Call signaling (IM calls API + WebSocket call workflow) stays in
  `sdkwork-im` per `docs/rtc-im-boundary.md` and is injected by the host application.

Canonical standards (do not copy bodies here):

- `../../../sdkwork-specs/CODE_STYLE_SPEC.md`
- `../../../sdkwork-specs/NAMING_SPEC.md`
- `../../../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`
- `../../../sdkwork-specs/FRONTEND_CODE_SPEC.md`
