import type { RtcProviderCapabilitySnapshot } from './rtc-provider-capability-snapshot';
export interface RtcProviderProfile {
    id: string;
    tenantId?: string;
    organizationId?: string;
    provider: string;
    code: string;
    name: string;
    status: 'active' | 'disabled' | 'archived';
    isDefault: boolean;
    priority: number;
    environment: 'production' | 'staging' | 'development' | 'test' | 'sandbox';
    region?: string | null;
    providerAppId?: string | null;
    endpoint?: string;
    /** Reference to secret-managed provider credentials. Raw provider secrets are never returned by the RTC API. */
    credentialRef?: string | null;
    credentialFingerprint?: string | null;
    /** Reference to secret-managed webhook verification material. Raw webhook secrets are never returned by the RTC API. */
    webhookSecretRef?: string | null;
    webhookSecretFingerprint?: string | null;
    capabilities: RtcProviderCapabilitySnapshot;
    configSnapshot?: Record<string, unknown>;
    healthStatus: 'unknown' | 'healthy' | 'degraded' | 'unhealthy';
    lastVerifiedAt?: string;
    lastVerificationLatencyMs?: number | null;
    lastVerificationError?: string | null;
    createdAt?: string;
    updatedAt?: string;
    version: string;
}
//# sourceMappingURL=rtc-provider-profile.d.ts.map