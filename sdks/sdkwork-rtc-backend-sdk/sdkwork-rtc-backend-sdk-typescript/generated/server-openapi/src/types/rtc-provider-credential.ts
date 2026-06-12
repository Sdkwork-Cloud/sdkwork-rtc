export interface RtcProviderCredential {
  id: string;
  tenantId: string;
  organizationId: string;
  providerAccountId: string;
  providerApplicationId: string;
  provider: string;
  credentialRole: 'rtc_token_signing' | 'open_api_signing' | 'usersig_signing' | 'cloud_api_signing' | 'webhook_signing';
  credentialLabel: string;
  /** Reference to secret-managed provider credential material. Raw provider secrets are never returned by the RTC API. */
  credentialRef: string;
  credentialFingerprint?: string | null;
  secretVersion?: string | null;
  status: 'active' | 'pending' | 'disabled' | 'revoked' | 'expired';
  validFrom?: string;
  expiresAt?: string;
  rotationDueAt?: string;
  rotatedAt?: string;
  revokedAt?: string;
  lastVerifiedAt?: string;
  lastUsedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  version: string;
}
