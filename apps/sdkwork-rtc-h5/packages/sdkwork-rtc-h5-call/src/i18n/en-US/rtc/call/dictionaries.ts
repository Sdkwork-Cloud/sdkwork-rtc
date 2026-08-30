/**
 * RTC call surface dictionary (en-US).
 *
 * Authored fragment kept in this package so host applications can embed the
 * call surface without dictionary merge concerns. Every key mirrors
 * `RTC_CALL_ZH_CN` (host merge enforces zh/en key parity).
 */

export interface RtcCallI18nTexts {
  call: {
    video: string;
    voice: string;
  };
  status: {
    connecting: string;
    waitingAnswer: string;
    inviting: string;
    ended: string;
    rejected: string;
    connectionFailed: string;
    unavailableTitle: string;
    unavailableDesc: string;
  };
  media: {
    micOn: string;
    micOff: string;
    cameraOn: string;
    cameraOff: string;
    self: string;
    remoteVideo: string;
  };
  actions: {
    accept: string;
    reject: string;
    cancel: string;
    hangup: string;
    close: string;
    mute: string;
    unmute: string;
    enableVideo: string;
    disableVideo: string;
    shareScreen: string;
    switchSpeaker: string;
  };
  toast: {
    muteFailed: string;
    videoFailed: string;
    acceptFailed: string;
    localVideoBindFailed: string;
    remoteVideoBindFailed: string;
    screenShareStarted: string;
    screenShareEnded: string;
    screenShareDenied: string;
    screenShareCancelled: string;
    screenShareUnsupported: string;
  };
}

export const RTC_CALL_EN_US: RtcCallI18nTexts = {
  call: {
    video: "Video call",
    voice: "Voice call",
  },
  status: {
    connecting: "Connecting…",
    waitingAnswer: "Waiting for the other party to answer…",
    inviting: "Inviting…",
    ended: "Call ended",
    rejected: "Call rejected",
    connectionFailed: "Connection failed",
    unavailableTitle: "Calls are not available yet",
    unavailableDesc: "Call signaling and media are not connected yet; calls cannot be started right now.",
  },
  media: {
    micOn: "Microphone on",
    micOff: "Microphone off",
    cameraOn: "Camera on",
    cameraOff: "Camera off",
    self: "You",
    remoteVideo: "Remote video",
  },
  actions: {
    accept: "Accept",
    reject: "Reject",
    cancel: "Cancel",
    hangup: "Hang up",
    close: "Close",
    mute: "Mute",
    unmute: "Unmute",
    enableVideo: "Turn on camera",
    disableVideo: "Turn off camera",
    shareScreen: "Share screen",
    switchSpeaker: "Switch speaker",
  },
  toast: {
    muteFailed: "Failed to toggle mute",
    videoFailed: "Failed to toggle camera",
    acceptFailed: "Failed to accept call",
    localVideoBindFailed: "Failed to load local video",
    remoteVideoBindFailed: "Failed to load remote video",
    screenShareStarted: "Screen sharing started",
    screenShareEnded: "Screen sharing ended",
    screenShareDenied: "Screen sharing permission denied",
    screenShareCancelled: "Screen sharing cancelled",
    screenShareUnsupported: "Screen sharing is not supported in this browser",
  },
} as const;