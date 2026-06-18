import { createWeixinSecureStorage } from "@sdkwork/rtc-mp-host";

export interface RtcHostAdapters {
  secureStorage: ReturnType<typeof createWeixinSecureStorage> | null;
}

let activeHostAdapters: RtcHostAdapters | null = null;

export function registerHostAdapters(): RtcHostAdapters {
  if (!activeHostAdapters) {
    const hasWx = typeof (globalThis as { wx?: unknown }).wx !== "undefined";
    activeHostAdapters = {
      secureStorage: hasWx ? createWeixinSecureStorage() : null,
    };
  }
  return activeHostAdapters;
}

export function getHostAdapters(): RtcHostAdapters {
  return activeHostAdapters ?? registerHostAdapters();
}
