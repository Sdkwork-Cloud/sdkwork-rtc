/// <reference types="miniprogram-api-typings" />

export interface RtcSecureStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface WxStorage {
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: unknown): void;
  removeStorageSync(key: string): void;
}

function getWxStorage(): WxStorage | null {
  const candidate = (globalThis as { wx?: WxStorage }).wx;
  return candidate ?? null;
}

export function createWeixinSecureStorage(): RtcSecureStorageAdapter {
  const wxStorage = getWxStorage();
  if (!wxStorage) {
    throw new Error("WeChat mini program storage is unavailable");
  }

  return {
    getItem(key) {
      try {
        const value = wxStorage.getStorageSync(key);
        return typeof value === "string" && value.length > 0 ? value : null;
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      wxStorage.setStorageSync(key, value);
    },
    removeItem(key) {
      wxStorage.removeStorageSync(key);
    },
  };
}
