export interface RtcProviderCredentialCommand {
  credentialRole: 'rtc_token_signing' | 'open_api_signing' | 'usersig_signing' | 'cloud_api_signing' | 'webhook_signing';
  credentialLabel: string;
  credentialRef: string;
  credentialFingerprint?: string | null;
  secretVersion?: string | null;
  status?: 'active' | 'pending' | 'disabled' | 'revoked' | 'expired';
  validFrom?: string;
  expiresAt?: string;
  rotationDueAt?: string;
}
