Component({
  properties: {
    url: {
      type: String,
      value: "",
    },
    enableCamera: {
      type: Boolean,
      value: true,
    },
    enableMic: {
      type: Boolean,
      value: true,
    },
    beauty: {
      type: Number,
      value: 0,
    },
  },
  methods: {
    onStateChange(event) {
      this.triggerEvent("pusherstatechange", event);
    },
    onNetStatus(event) {
      this.triggerEvent("pushernetstatuschange", event);
    },
  },
});
