const { SESSION_STORAGE_KEY } = require("../../constants/sessionStorageKey");
const {
  bootstrapRtcMiniProgram,
  createMediaSession,
  listMediaSessions,
} = require("../../runtime/rtc-app");

Page({
  data: {
    userId: "",
    sessions: [],
    nextCursor: "",
    loading: false,
    loadingMore: false,
    creating: false,
    error: "",
    roomId: "",
    mediaMode: "video",
    mediaModes: ["audio", "video", "live"],
  },
  onShow() {
    const raw = wx.getStorageSync(SESSION_STORAGE_KEY);
    if (!raw) {
      wx.reLaunch({ url: "/pages/login/index" });
      return;
    }
    try {
      const session = JSON.parse(raw);
      if (!session.userId) {
        wx.reLaunch({ url: "/pages/login/index" });
        return;
      }
      this.setData({ userId: session.userId });
      bootstrapRtcMiniProgram();
      this.loadSessions();
    } catch {
      wx.reLaunch({ url: "/pages/login/index" });
    }
  },
  onSignOut() {
    wx.removeStorageSync(SESSION_STORAGE_KEY);
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
    this.setData({ loading: true, error: "", nextCursor: "" });
    try {
      const result = await listMediaSessions();
      this.setData({
        sessions: result.items,
        nextCursor: result.nextCursor || "",
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load media sessions";
      this.setData({ loading: false, error: message });
      wx.showToast({ title: message, icon: "none" });
    }
  },
  async loadMoreSessions() {
    const cursor = String(this.data.nextCursor || "").trim();
    if (!cursor || this.data.loading || this.data.loadingMore) {
      return;
    }
    this.setData({ loadingMore: true, error: "" });
    try {
      const result = await listMediaSessions({ cursor });
      this.setData({
        sessions: [...this.data.sessions, ...result.items],
        nextCursor: result.nextCursor || "",
        loadingMore: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load more media sessions";
      this.setData({ loadingMore: false, error: message });
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
