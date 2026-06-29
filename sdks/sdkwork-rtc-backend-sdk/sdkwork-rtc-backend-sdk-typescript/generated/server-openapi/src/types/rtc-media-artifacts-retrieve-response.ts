import type { RtcMediaArtifactResponse } from './rtc-media-artifact-response';

export interface RtcMediaArtifactsRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
