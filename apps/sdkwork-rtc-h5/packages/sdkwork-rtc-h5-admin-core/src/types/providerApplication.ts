export interface ProviderApplication {
  id: string;
  tenantId: string;
  organizationId: string;
  providerAccountId: string;
  provider: string;
  code: string;
  name: string;
  status: "active" | "disabled" | "archived";
  environment: string;
  region?: string;
  providerApplicationId: string;
  providerApplicationIdKind: string;
  accessEndpoint?: string;
  apiEndpoint?: string;
  apiHost?: string;
  apiVersion?: string;
  webhookCallbackUrl?: string;
  configSnapshot: Record<string, unknown>;
  lastVerifiedAt?: string;
  lastVerificationError?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  version: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ProviderApplicationCommand {
  code: string;
  name: string;
  status?: "active" | "disabled" | "archived";
  environment: string;
  region?: string;
  providerApplicationId: string;
  providerApplicationIdKind: string;
  accessEndpoint?: string;
  apiEndpoint?: string;
  apiHost?: string;
  apiVersion?: string;
  webhookCallbackUrl?: string;
  configSnapshot: Record<string, unknown>;
}
