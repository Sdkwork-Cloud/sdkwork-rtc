export interface ProviderCredential {
  id: string;
  tenantId: string;
  organizationId: string;
  providerAccountId: string;
  providerApplicationId: string;
  provider: string;
  credentialRole: string;
  credentialLabel: string;
  credentialRef: string;
  credentialFingerprint?: string;
  secretVersion?: string;
  status: "active" | "pending" | "disabled" | "revoked" | "expired";
  validFrom?: string;
  expiresAt?: string;
  rotationDueAt?: string;
  rotatedAt?: string;
  revokedAt?: string;
  lastVerifiedAt?: string;
  lastUsedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  version: string;
}

export interface ProviderCredentialCommand {
  credentialRole: string;
  credentialLabel: string;
  credentialRef: string;
  credentialFingerprint?: string;
  secretVersion?: string;
  status?: "active" | "pending" | "disabled";
  validFrom?: string;
  expiresAt?: string;
  rotationDueAt?: string;
}
