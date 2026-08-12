/**
 * @sdkwork/rtc-h5-call — RTC authority mobile-browser call surface.
 *
 * Exposes the full-screen voice/video call UI, the pure domain state machine,
 * the media runtime wrapper, and the signaling port the host application
 * implements (IM call signaling stays in `sdkwork-im` per the RTC↔IM boundary).
 */

// Domain
export {
  canApplyRtcCallState,
  createIdleRtcCallSnapshot,
  createRtcRuntimeId,
  formatRtcCallDuration,
  isRtcCallActive,
  isTerminalRtcCallState,
  normalizeRtcIdSegment,
  resolveRtcCallPeerUserId,
  resolveRtcCallType,
  toRtcCallControllerState,
  toRtcCallErrorMessage,
  toRtcCallMode,
  toRecoveredRtcCallState,
  type RtcCallControllerState,
  type RtcCallDirection,
  type RtcCallSnapshot,
  type RtcCallState,
  type RtcCallTerminalState,
  type RtcCallType,
} from "./domain/callTypes";

// Signaling boundary (pure port; implemented by the host)
export {
  isRtcCallSessionNotFound,
  type RtcCallParticipantCredential,
  type RtcCallSessionInfo,
  type RtcCallSessionState,
  type RtcCallSignalingPort,
  type RtcCallStartOptions,
  type RtcCallWatchOptions,
} from "./signaling/rtcCallSignalingPort";
export {
  createUnavailableRtcCallSignaling,
  RtcCallUnavailableError,
} from "./signaling/unavailableCallSignaling";

// Media runtime
export {
  createRtcCallMediaService,
  resolveRtcCallMediaPublishKinds,
  type RtcCallMediaJoinOptions,
  type RtcCallMediaPublishOptions,
  type RtcCallMediaService,
  type RtcCallMediaServiceDependencies,
  type RtcCallMediaStatus,
} from "./media/rtcCallMediaService";

// i18n
export {
  RTC_CALL_EN_US,
  RTC_CALL_ZH_CN,
  resolveRtcCallLocale,
  type RtcCallI18nTexts,
} from "./i18n/dictionaries";
export {
  RtcCallI18nProvider,
  useRtcCallI18n,
  type RtcCallLocale,
} from "./i18n/rtcCallI18n";

// Session hook
export {
  useRtcCallSession,
  type UseRtcCallSessionOptions,
  type UseRtcCallSessionResult,
} from "./hooks/useRtcCallSession";

// UI components
export {
  RtcCallControlButton,
  type RtcCallControlButtonProps,
  type RtcCallControlButtonVariant,
} from "./components/CallControlButton";
export { RtcCallAvatar, type RtcCallAvatarProps } from "./components/CallAvatar";
export {
  RtcCallVideoStage,
  type RtcCallVideoStageProps,
} from "./components/CallVideoStage";
export {
  RtcCallControlsBar,
  type RtcCallControlsBarProps,
} from "./components/CallControlsBar";
export {
  RtcCallScreen,
  resolveRtcCallScreenPhase,
  type RtcCallScreenPhase,
  type RtcCallScreenProps,
  type RtcCallScreenTexts,
} from "./components/CallScreen";

// Page surface
export { RtcCallPage, type RtcCallPageProps } from "./pages/RtcCallPage";
