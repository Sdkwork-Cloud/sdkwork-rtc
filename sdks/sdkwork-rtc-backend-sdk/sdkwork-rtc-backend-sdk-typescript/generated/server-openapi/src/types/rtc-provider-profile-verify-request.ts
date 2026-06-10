export interface RtcProviderProfileVerifyRequest {
  queryKind: 'credential' | 'webhook' | 'active_query' | 'recording' | 'full';
  timeoutMs?: number | null;
}
