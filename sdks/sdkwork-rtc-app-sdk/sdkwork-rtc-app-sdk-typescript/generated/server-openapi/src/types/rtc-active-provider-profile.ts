import type { RtcProviderCapabilitySnapshot } from './rtc-provider-capability-snapshot';

export interface RtcActiveProviderProfile {
  id: string;
  provider: string;
  code: string;
  name: string;
  isDefault: boolean;
  priority: number;
  environment: 'production' | 'staging' | 'development' | 'test' | 'sandbox';
  region?: string | null;
  providerAppId?: string | null;
  endpoint?: string | null;
  capabilities: RtcProviderCapabilitySnapshot;
  healthStatus: 'unknown' | 'healthy' | 'degraded' | 'unhealthy';
}
