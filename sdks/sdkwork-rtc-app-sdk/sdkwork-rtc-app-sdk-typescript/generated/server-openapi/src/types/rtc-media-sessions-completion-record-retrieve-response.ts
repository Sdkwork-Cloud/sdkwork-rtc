import type { RtcMediaSessionCompletionRecordResponse } from './rtc-media-session-completion-record-response';

export interface RtcMediaSessionsCompletionRecordRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
