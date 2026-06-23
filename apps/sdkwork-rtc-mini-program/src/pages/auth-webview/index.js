Page({
  data: {
    loginUrl: "",
  },
  onLoad(options) {
    const loginUrl = decodeURIComponent(String(options.loginUrl || ""));
    this.setData({ loginUrl });
  },
});
