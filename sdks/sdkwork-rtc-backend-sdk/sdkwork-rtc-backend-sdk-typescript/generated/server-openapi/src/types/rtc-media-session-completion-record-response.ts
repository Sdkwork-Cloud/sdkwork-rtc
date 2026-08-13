import type { RtcMediaSessionCompletionRecord } from './rtc-media-session-completion-record';

export interface RtcMediaSessionCompletionRecordResponse {
  code: 0;
  data: unknown & { item: RtcMediaSessionCompletionRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
