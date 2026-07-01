export interface RtcProviderCapabilitySnapshot {
  audio: boolean;
  video: boolean;
  live: boolean;
  liveBroadcast?: boolean;
  liveAudience?: boolean;
  cdnRelay?: boolean;
  screenShare: boolean;
  recording: boolean;
  webhook: boolean;
  activeQuery: boolean;
  maxParticipants?: number | null;
  supportedRegions?: string[];
  providerFeatures?: Record<string, unknown>;
}
