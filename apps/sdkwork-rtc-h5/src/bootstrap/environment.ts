export interface RtcEnvironment {
  apiBaseUrl: string;
  backendApiBaseUrl: string;
  defaultMediaMode: "audio" | "video" | "live";
  providerSelection: string;
  mobile: {
    maxParticipants: number;
    audioOnlyFallback: boolean;
  };
}

export function resolveEnvironment(): RtcEnvironment {
  return {
    apiBaseUrl: import.meta.env.VITE_RTC_API_BASE_URL ?? "http://127.0.0.1:18080/app/v3/api",
    backendApiBaseUrl: import.meta.env.VITE_RTC_BACKEND_API_BASE_URL ?? "http://127.0.0.1:18080/backend/v3/api",
    defaultMediaMode: "video",
    providerSelection: "auto",
    mobile: {
      maxParticipants: 9,
      audioOnlyFallback: true,
    },
  };
}
