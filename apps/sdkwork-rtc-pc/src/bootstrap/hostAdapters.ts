export interface RtcMediaPermissionAdapter {
  requestCamera(): Promise<boolean>;
  requestMicrophone(): Promise<boolean>;
}

export interface RtcDeepLinkAdapter {
  getCurrentPath(): string;
  subscribe(listener: (path: string) => void): () => void;
}

export interface RtcSecureStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RtcHostAdapters {
  camera: RtcMediaPermissionAdapter | null;
  deepLinks: RtcDeepLinkAdapter | null;
  pushNotifications: null;
  secureStorage: RtcSecureStorageAdapter | null;
}

let activeHostAdapters: RtcHostAdapters | null = null;

function createBrowserHostAdapters(): RtcHostAdapters {
  const secureStorage: RtcSecureStorageAdapter | null =
    typeof window === "undefined"
      ? null
      : {
          getItem(key) {
            return window.sessionStorage.getItem(key);
          },
          setItem(key, value) {
            window.sessionStorage.setItem(key, value);
          },
          removeItem(key) {
            window.sessionStorage.removeItem(key);
          },
        };

  const camera: RtcMediaPermissionAdapter | null =
    typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia
      ? null
      : {
          async requestCamera() {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              stream.getTracks().forEach((track) => track.stop());
              return true;
            } catch {
              return false;
            }
          },
          async requestMicrophone() {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((track) => track.stop());
              return true;
            } catch {
              return false;
            }
          },
        };

  const deepLinks: RtcDeepLinkAdapter | null =
    typeof window === "undefined"
      ? null
      : {
          getCurrentPath() {
            return `${window.location.pathname}${window.location.hash}`;
          },
          subscribe(listener) {
            const handleChange = () => listener(`${window.location.pathname}${window.location.hash}`);
            window.addEventListener("hashchange", handleChange);
            window.addEventListener("popstate", handleChange);
            return () => {
              window.removeEventListener("hashchange", handleChange);
              window.removeEventListener("popstate", handleChange);
            };
          },
        };

  return {
    camera,
    deepLinks,
    pushNotifications: null,
    secureStorage,
  };
}

export function registerHostAdapters(): RtcHostAdapters {
  if (!activeHostAdapters) {
    activeHostAdapters = createBrowserHostAdapters();
  }
  return activeHostAdapters;
}

export function getHostAdapters(): RtcHostAdapters {
  return activeHostAdapters ?? registerHostAdapters();
}
