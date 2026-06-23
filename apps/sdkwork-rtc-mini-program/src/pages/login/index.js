const { SESSION_STORAGE_KEY } = require("../../constants/sessionStorageKey");
const {
  buildAppbaseLoginUrl,
  getRtcRuntimeEnvironment,
} = require("../../runtime/rtc-app");

Page({
  data: {
    accessToken: "",
    userId: "",
    tenantId: "",
    organizationId: "",
  },
  onAppbaseLogin() {
    const environment = getRtcRuntimeEnvironment();
    const returnUrl =
      "https://sdkwork.com/apps/sdkwork-rtc-sdkwork-rtc-mini-program/auth/callback";
    const loginUrl = buildAppbaseLoginUrl(environment.appbaseLoginUrl, returnUrl);
    wx.navigateTo({
      url: `/pages/auth-webview/index?loginUrl=${encodeURIComponent(loginUrl)}`,
    });
  },
  onAccessTokenInput(event) {
    this.setData({ accessToken: event.detail.value });
  },
  onUserIdInput(event) {
    this.setData({ userId: event.detail.value });
  },
  onTenantIdInput(event) {
    this.setData({ tenantId: event.detail.value });
  },
  onOrganizationIdInput(event) {
    this.setData({ organizationId: event.detail.value });
  },
  onSubmit() {
    const accessToken = String(this.data.accessToken || "").trim();
    const userId = String(this.data.userId || "").trim();
    const tenantId = String(this.data.tenantId || "").trim();
    const organizationId = String(this.data.organizationId || "").trim();
    if (!accessToken || !userId || !tenantId || !organizationId) {
      wx.showToast({ title: "Complete all credential fields", icon: "none" });
      return;
    }
    wx.setStorageSync(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken,
        authToken: accessToken,
        tenantId,
        organizationId,
        userId,
      }),
    );
    wx.reLaunch({ url: "/pages/media-sessions/index" });
  },
});
