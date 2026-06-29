export type {
  RtcCreateMediaSessionRequest,
  RtcMediaParticipant,
  RtcMediaSession,
} from "@sdkwork/rtc-pc-core";

export interface RtcActiveProviderProfile {
  id: string;
  provider: string;
  code: string;
  name: string;
  isDefault: boolean;
  priority: number;
  environment: "production" | "staging" | "development" | "test" | "sandbox";
  region?: string | null;
  providerAppId?: string | null;
  endpoint?: string;
  healthStatus: "unknown" | "healthy" | "degraded" | "unhealthy";
}
