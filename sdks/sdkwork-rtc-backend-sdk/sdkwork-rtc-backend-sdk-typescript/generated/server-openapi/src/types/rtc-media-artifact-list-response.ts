import type { RtcMediaArtifact } from './rtc-media-artifact';

export interface RtcMediaArtifactListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
