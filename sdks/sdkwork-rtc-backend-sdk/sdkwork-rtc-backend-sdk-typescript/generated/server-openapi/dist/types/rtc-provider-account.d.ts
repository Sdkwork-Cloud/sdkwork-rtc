export interface RtcProviderAccount {
    id: string;
    tenantId: string;
    organizationId: string;
    provider: string;
    code: string;
    name: string;
    status: 'active' | 'disabled' | 'archived';
    environment: 'production' | 'staging' | 'development' | 'test' | 'sandbox';
    externalTenantId?: string | null;
    cloudAccountId?: string | null;
    projectId?: string | null;
    resourceGroupId?: string | null;
    lastVerifiedAt?: string;
    lastVerificationError?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
    version: string;
    deletedAt?: string;
    deletedBy?: string | null;
}
//# sourceMappingURL=rtc-provider-account.d.ts.map