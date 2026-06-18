const SESSION_KEY = "sdkwork.rtc.app.session";
const {
  bootstrapRtcMiniProgram,
  createMediaSession,
  listMediaSessions,
} = require("../../runtime/rtc-app");

Page({
  data: {
    userId: "user",
    sessions: [],
    loading: false,
    creating: false,
    error: "",
    roomId: "",
    mediaMode: "video",
    mediaModes: ["audio", "video", "live"],
  },
  onShow() {
    const raw = wx.getStorageSync(SESSION_KEY);
    if (!raw) {
      wx.reLaunch({ url: "/pages/login/index" });
      return;
    }
    try {
      const session = JSON.parse(raw);
      this.setData({ userId: session.userId || "user" });
      bootstrapRtcMiniProgram();
      this.loadSessions();
    } catch {
      wx.reLaunch({ url: "/pages/login/index" });
    }
  },
  onSignOut() {
    wx.removeStorageSync(SESSION_KEY);
    wx.reLaunch({ url: "/pages/login/index" });
  },
  onRoomIdInput(event) {
    this.setData({ roomId: event.detail.value });
  },
  onMediaModeChange(event) {
    const index = Number(event.detail.value);
    this.setData({ mediaMode: this.data.mediaModes[index] || "video" });
  },
  async loadSessions() {
    this.setData({ loading: true, error: "" });
    try {
      const sessions = await listMediaSessions();
      this.setData({ sessions, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load media sessions";
      this.setData({ loading: false, error: message });
      wx.showToast({ title: message, icon: "none" });
    }
  },
  onRefresh() {
    this.loadSessions();
  },
  async onCreateSession() {
    const roomId = String(this.data.roomId || "").trim();
    if (!roomId) {
      wx.showToast({ title: "Room ID required", icon: "none" });
      return;
    }
    this.setData({ creating: true, error: "" });
    try {
      const created = await createMediaSession({
        roomId,
        mediaMode: this.data.mediaMode,
      });
      await this.loadSessions();
      this.setData({ creating: false, roomId: "" });
      wx.navigateTo({
        url: `/pages/media-session-room/index?sessionId=${encodeURIComponent(created.id)}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create media session";
      this.setData({ creating: false, error: message });
      wx.showToast({ title: message, icon: "none" });
    }
  },
  onOpenSession(event) {
    const sessionId = event.currentTarget.dataset.id;
    if (!sessionId) {
      return;
    }
    wx.navigateTo({
      url: `/pages/media-session-room/index?sessionId=${encodeURIComponent(sessionId)}`,
    });
  },
});
