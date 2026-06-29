import type { RtcMediaSessionCompletionRecord } from './rtc-media-session-completion-record';

export interface RtcMediaSessionCompletionRecordResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
