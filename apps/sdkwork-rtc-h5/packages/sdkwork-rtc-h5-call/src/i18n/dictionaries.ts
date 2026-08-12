/**
 * RTC call surface dictionaries (zh-CN / en-US).
 *
 * Self-contained by design: this package does not depend on `react-i18next`
 * so host applications (including the IM H5 app with its own i18n stack) can
 * embed the call surface without dictionary merge concerns.
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

export const RTC_CALL_ZH_CN: RtcCallI18nTexts = {
  call: {
    video: "视频通话",
    voice: "语音通话",
  },
  status: {
    connecting: "连接中…",
    waitingAnswer: "等待对方接听…",
    inviting: "邀请中…",
    ended: "通话已结束",
    rejected: "对方已拒绝",
    connectionFailed: "连接失败",
    unavailableTitle: "通话功能暂不可用",
    unavailableDesc: "通话信令与媒体暂未接通，当前无法发起通话。",
  },
  media: {
    micOn: "麦克风已开",
    micOff: "麦克风已关",
    cameraOn: "摄像头已开",
    cameraOff: "摄像头已关",
    self: "自己",
    remoteVideo: "对方视频",
  },
  actions: {
    accept: "接听",
    reject: "拒绝",
    cancel: "取消",
    hangup: "挂断",
    close: "关闭",
    mute: "静音",
    unmute: "取消静音",
    enableVideo: "打开摄像头",
    disableVideo: "关闭摄像头",
    shareScreen: "屏幕共享",
    switchSpeaker: "切换扬声器",
  },
  toast: {
    muteFailed: "静音操作失败",
    videoFailed: "摄像头操作失败",
    acceptFailed: "接听失败",
    localVideoBindFailed: "本地画面加载失败",
    remoteVideoBindFailed: "对方画面加载失败",
    screenShareStarted: "屏幕共享已开始",
    screenShareEnded: "屏幕共享已结束",
    screenShareDenied: "屏幕共享权限被拒绝",
    screenShareCancelled: "屏幕共享已取消",
    screenShareUnsupported: "当前浏览器不支持屏幕共享",
  },
};

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
};

export function resolveRtcCallLocale(language: string | undefined): "zh-CN" | "en-US" {
  return language?.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}
