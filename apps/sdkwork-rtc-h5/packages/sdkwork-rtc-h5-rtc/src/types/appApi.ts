import type { SdkworkAppClient } from "sdkwork-rtc-app-sdk-generated-typescript";

type MediaSessionRetrieveResponse = Awaited<
  ReturnType<SdkworkAppClient["rtcMediaSessions"]["rtc"]["mediaSessions"]["retrieve"]>
>;

export type RtcMediaSession = NonNullable<MediaSessionRetrieveResponse["data"]>;

export type RtcCreateMediaSessionRequest = Parameters<
  SdkworkAppClient["rtcMediaSessions"]["rtc"]["mediaSessions"]["create"]
>[0];

export type RtcMediaParticipant = RtcMediaSession["participants"][number];

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
