import type { RtcProviderCapabilitySnapshot } from './rtc-provider-capability-snapshot';
export interface RtcProviderProfileCommand {
    provider: string;
    code: string;
    name: string;
    status?: 'active' | 'disabled' | 'archived';
    isDefault?: boolean;
    priority?: number;
    environment: 'production' | 'staging' | 'development' | 'test' | 'sandbox';
    region?: string | null;
    providerAppId?: string | null;
    endpoint?: string;
    credentialRef?: string | null;
    webhookSecretRef?: string | null;
    capabilities: RtcProviderCapabilitySnapshot;
    configSnapshot: Record<string, unknown>;
}
//# sourceMappingURL=rtc-provider-profile-command.d.ts.map