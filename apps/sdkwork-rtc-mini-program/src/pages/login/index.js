const { SESSION_STORAGE_KEY } = require("../../constants/sessionStorageKey");

Page({
  data: {
    accessToken: "dev-access-token",
    userId: "user",
  },
  onAccessTokenInput(event) {
    this.setData({ accessToken: event.detail.value });
  },
  onUserIdInput(event) {
    this.setData({ userId: event.detail.value });
  },
  onSubmit() {
    const accessToken = String(this.data.accessToken || "").trim();
    const userId = String(this.data.userId || "user").trim();
    if (!accessToken) {
      wx.showToast({ title: "Access token required", icon: "none" });
      return;
    }
    wx.setStorageSync(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken,
        authToken: accessToken,
        tenantId: "default",
        organizationId: "default",
        userId,
      }),
    );
    wx.reLaunch({ url: "/pages/media-sessions/index" });
  },
});
