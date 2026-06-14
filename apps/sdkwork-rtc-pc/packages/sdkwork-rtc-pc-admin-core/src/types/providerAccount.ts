export interface ProviderAccount {
  id: string;
  tenantId: string;
  organizationId: string;
  provider: string;
  code: string;
  name: string;
  status: "active" | "disabled" | "archived";
  environment: string;
  externalTenantId?: string;
  cloudAccountId?: string;
  projectId?: string;
  resourceGroupId?: string;
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

export interface ProviderAccountCommand {
  provider: string;
  code: string;
  name: string;
  status?: "active" | "disabled" | "archived";
  environment: string;
  externalTenantId?: string;
  cloudAccountId?: string;
  projectId?: string;
  resourceGroupId?: string;
}
