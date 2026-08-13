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
  accessEndpoint?: string | null;
  apiEndpoint?: string | null;
  apiHost?: string | null;
  apiVersion?: string | null;
  webhookCallbackUrl?: string | null;
  configSnapshot: Record<string, unknown>;
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
