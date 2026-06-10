import type { RtcMediaSessionCompletionRecord } from './rtc-media-session-completion-record';

export interface RtcMediaSessionCompletionRecordResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: RtcMediaSessionCompletionRecord;
}
