export interface RtcProviderAccountCommand {
  provider: string;
  code: string;
  name: string;
  status?: 'active' | 'disabled' | 'archived';
  environment: 'production' | 'staging' | 'development' | 'test' | 'sandbox';
  externalTenantId?: string | null;
  cloudAccountId?: string | null;
  projectId?: string | null;
  resourceGroupId?: string | null;
}
