export interface RtcProviderCapabilitySnapshot {
  audio: boolean;
  video: boolean;
  live: boolean;
  screenShare: boolean;
  recording: boolean;
  webhook: boolean;
  activeQuery: boolean;
  maxParticipants?: number | null;
  supportedRegions?: string[];
  providerFeatures?: Record<string, unknown>;
}
