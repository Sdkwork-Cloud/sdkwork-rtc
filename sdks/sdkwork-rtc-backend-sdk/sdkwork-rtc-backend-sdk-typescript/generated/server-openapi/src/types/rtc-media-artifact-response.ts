import type { RtcMediaArtifact } from './rtc-media-artifact';

export interface RtcMediaArtifactResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
