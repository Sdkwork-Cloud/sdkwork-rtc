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
  lastVerifiedAt?: string | null;
  lastVerificationError?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  version: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}
