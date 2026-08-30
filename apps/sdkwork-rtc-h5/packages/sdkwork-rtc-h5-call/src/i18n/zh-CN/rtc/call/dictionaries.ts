/**
 * RTC call surface dictionary (zh-CN).
 *
 * Every key mirrors `RTC_CALL_EN_US` (host merge enforces en/zh parity).
 */
import type { RtcCallI18nTexts } from "../../en-US/rtc/call/dictionaries";

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
} as const;