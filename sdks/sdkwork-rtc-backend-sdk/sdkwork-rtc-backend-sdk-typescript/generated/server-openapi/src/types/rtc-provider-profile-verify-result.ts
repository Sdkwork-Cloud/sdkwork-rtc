import type { RtcProviderProfileVerifyCheck } from './rtc-provider-profile-verify-check';

export interface RtcProviderProfileVerifyResult {
  providerProfileId: string;
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  verifiedAt: string;
  latencyMs?: number | null;
  checks?: RtcProviderProfileVerifyCheck[];
}
