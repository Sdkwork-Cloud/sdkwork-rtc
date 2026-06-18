const SESSION_KEY = "sdkwork.rtc.app.session";
const { bootstrapRtcMiniProgram } = require("../../runtime/rtc-app");

App({
  onLaunch(options) {
    const query = options?.query ?? {};
    try {
      bootstrapRtcMiniProgram(query);
    } catch {
      // Runtime bundle may be unavailable before build; pages bootstrap on demand.
    }
    const session = wx.getStorageSync(SESSION_KEY);
    if (!session) {
      wx.reLaunch({ url: "/pages/login/index" });
      return;
    }
    wx.reLaunch({ url: "/pages/media-sessions/index" });
  },
});
