import type { RtcAppSdkClient } from "@sdkwork/rtc-pc-core/sdk";

type MediaSessionRetrieveResponse = Awaited<
  ReturnType<RtcAppSdkClient["rtcMediaSessions"]["rtc"]["mediaSessions"]["retrieve"]>
>;

export type RtcMediaSession = NonNullable<MediaSessionRetrieveResponse["data"]>;

export type RtcCreateMediaSessionRequest = Parameters<
  RtcAppSdkClient["rtcMediaSessions"]["rtc"]["mediaSessions"]["create"]
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
