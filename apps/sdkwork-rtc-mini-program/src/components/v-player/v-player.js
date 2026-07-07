Component({
  properties: {
    url: {
      type: String,
      value: "",
    },
  },
  methods: {
    onStateChange(event) {
      this.triggerEvent("playerstatechange", event);
    },
    onNetStatus(event) {
      this.triggerEvent("playernetstatuschange", event);
    },
  },
});
