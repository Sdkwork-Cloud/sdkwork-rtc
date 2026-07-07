const { SESSION_STORAGE_KEY } = require("../../constants/sessionStorageKey");
const {
  bootstrapRtcMiniProgram,
  getMediaSession,
  issueJoinCredential,
  joinMediaSession,
  leaveMediaSession,
  getMediaSessionRoomViewState,
  subscribeMediaSessionRoomViewState,
  reportMediaPusherStateChange,
  reportMediaPusherNetStatusChange,
} = require("../../runtime/rtc-app");

Page({
  data: {
    sessionId: "",
    participantId: "",
    session: null,
    loading: true,
    issuing: false,
    joining: false,
    error: "",
    joinCredential: null,
    joinMessage: "",
    mediaConnected: false,
    pushUrl: "",
    remoteStreams: [],
    mediaMessage: "",
  },
  onLoad(options) {
    const sessionId = String(options.sessionId || "").trim();
    if (!sessionId) {
      this.setData({ loading: false, error: "Missing media session id" });
      return;
    }
    const raw = wx.getStorageSync(SESSION_STORAGE_KEY);
    if (!raw) {
      wx.reLaunch({ url: "/pages/login/index" });
      return;
    }
    try {
      const authSession = JSON.parse(raw);
      const userId = String(authSession.userId || "").trim();
      if (!userId) {
        wx.reLaunch({ url: "/pages/login/index" });
        return;
      }
      bootstrapRtcMiniProgram();
      this.setData({
        sessionId,
        participantId: userId,
      });
      void subscribeMediaSessionRoomViewState((viewState) => {
        this.setData({
          mediaConnected: viewState.connected,
          pushUrl: viewState.pushUrl,
          remoteStreams: viewState.remoteStreams,
          mediaMessage: viewState.message,
        });
      }).then((unsubscribe) => {
        this._unsubscribeMediaViewState = unsubscribe;
      });
      this.loadSession();
    } catch {
      wx.reLaunch({ url: "/pages/login/index" });
    }
  },
  onUnload() {
    if (typeof this._unsubscribeMediaViewState === "function") {
      this._unsubscribeMediaViewState();
      this._unsubscribeMediaViewState = null;
    }
    void leaveMediaSession();
  },
  async loadSession() {
    this.setData({ loading: true, error: "", joinMessage: "" });
    try {
      const session = await getMediaSession(this.data.sessionId);
      this.setData({ session, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load media session";
      this.setData({ loading: false, error: message });
    }
  },
  async applyMediaViewState() {
    const viewState = await getMediaSessionRoomViewState();
    this.setData({
      mediaConnected: viewState.connected,
      pushUrl: viewState.pushUrl,
      remoteStreams: viewState.remoteStreams,
      mediaMessage: viewState.message,
    });
  },
  onCopyCredential() {
    const credential = String(this.data.joinCredential || "").trim();
    if (!credential) {
      wx.showToast({ title: "No credential to copy", icon: "none" });
      return;
    }
    wx.setClipboardData({
      data: credential,
      success: () => wx.showToast({ title: "Credential copied", icon: "success" }),
    });
  },
  async onIssueCredential() {
    const participantId = String(this.data.participantId || "").trim();
    if (!participantId) {
      wx.showToast({ title: "Participant ID required", icon: "none" });
      return;
    }
    this.setData({ issuing: true, joinMessage: "", error: "" });
    try {
      const result = await issueJoinCredential(this.data.sessionId, participantId);
      this.setData({
        issuing: false,
        joinCredential: result.credential,
        joinMessage: `Credential issued for provider ${result.providerAppId}. Room ${result.roomId}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to issue join credential";
      this.setData({ issuing: false, error: message });
      wx.showToast({ title: message, icon: "none" });
    }
  },
  async onJoinRoom() {
    const participantId = String(this.data.participantId || "").trim();
    if (!participantId) {
      wx.showToast({ title: "Participant ID required", icon: "none" });
      return;
    }
    this.setData({ joining: true, error: "", mediaMessage: "" });
    try {
      const result = await joinMediaSession(this.data.sessionId, participantId);
      this.setData({
        joining: false,
        joinCredential: result.credential,
        mediaConnected: result.connected,
        pushUrl: result.pushUrl,
        remoteStreams: result.remoteStreams,
        mediaMessage: result.message,
        joinMessage: result.message,
      });
      if (!result.connected) {
        wx.showToast({ title: result.message, icon: "none" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join media session";
      this.setData({ joining: false, error: message });
      wx.showToast({ title: message, icon: "none" });
    }
  },
  async onLeaveRoom() {
    await leaveMediaSession();
    await this.applyMediaViewState();
    this.setData({ joinMessage: "Left media session." });
  },
  onPusherStateChange(event) {
    const detail = event?.detail?.detail;
    if (!detail) {
      return;
    }
    void reportMediaPusherStateChange(detail.code, detail.message || "");
  },
  onPusherNetStatusChange(event) {
    const info = event?.detail?.detail?.info;
    void reportMediaPusherNetStatusChange(info);
  },
});
