export interface RtcProviderApplication {
  id: string;
  tenantId: string;
  organizationId: string;
  providerAccountId: string;
  provider: string;
  code: string;
  name: string;
  status: 'active' | 'disabled' | 'archived';
  environment: 'production' | 'staging' | 'development' | 'test' | 'sandbox';
  region?: string | null;
  providerApplicationId: string;
  providerApplicationIdKind: 'volcengine_app_id' | 'tencent_sdk_app_id' | 'provider_application_id';
  accessEndpoint?: string;
  apiEndpoint?: string;
  apiHost?: string | null;
  apiVersion?: string | null;
  webhookCallbackUrl?: string;
  configSnapshot: Record<string, unknown>;
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
