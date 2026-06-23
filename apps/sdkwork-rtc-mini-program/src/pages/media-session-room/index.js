const { SESSION_STORAGE_KEY } = require("../../constants/sessionStorageKey");
const {
  bootstrapRtcMiniProgram,
  getMediaSession,
  issueJoinCredential,
} = require("../../runtime/rtc-app");

Page({
  data: {
    sessionId: "",
    participantId: "user",
    session: null,
    loading: true,
    issuing: false,
    error: "",
    joinCredential: null,
    joinMessage: "",
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
      bootstrapRtcMiniProgram();
      this.setData({
        sessionId,
        participantId: authSession.userId || "user",
      });
      this.loadSession();
    } catch {
      wx.reLaunch({ url: "/pages/login/index" });
    }
  },
  onParticipantInput(event) {
    this.setData({ participantId: event.detail.value });
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
});
