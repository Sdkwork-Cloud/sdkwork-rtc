import type { RtcMediaArtifact } from './rtc-media-artifact';

export interface RtcMediaArtifactListResponse {
  code: 0;
  data: unknown & { items: RtcMediaArtifact[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
