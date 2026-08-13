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
  validFrom?: string | null;
  expiresAt?: string | null;
  rotationDueAt?: string | null;
  rotatedAt?: string | null;
  revokedAt?: string | null;
  lastVerifiedAt?: string | null;
  lastUsedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  version: string;
}
