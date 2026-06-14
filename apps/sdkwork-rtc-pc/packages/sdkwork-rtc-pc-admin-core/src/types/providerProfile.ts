export interface ProviderProfile {
  id: string;
  tenantId: string;
  organizationId: string;
  provider: string;
  code: string;
  name: string;
  status: "active" | "disabled" | "archived";
  isDefault: boolean;
  priority: number;
  environment: string;
  region?: string;
  providerAppId?: string;
  endpoint?: string;
  credentialRef?: string;
  credentialFingerprint?: string;
  webhookSecretRef?: string;
  webhookSecretFingerprint?: string;
  capabilities: {
    audio: boolean;
    video: boolean;
    live: boolean;
    screenShare: boolean;
    recording: boolean;
    webhook: boolean;
    activeQuery: boolean;
    maxParticipants?: number;
    supportedRegions: string[];
    providerFeatures: Record<string, unknown>;
  };
  configSnapshot: Record<string, unknown>;
  healthStatus: "unknown" | "healthy" | "degraded" | "unhealthy";
  lastVerifiedAt?: string;
  lastVerificationLatencyMs?: number;
  lastVerificationError?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  version: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ProviderProfileCommand {
  provider: string;
  code: string;
  name: string;
  status?: "active" | "disabled" | "archived";
  isDefault: boolean;
  priority: number;
  environment: string;
  region?: string;
  providerAppId?: string;
  endpoint?: string;
  credentialRef?: string;
  webhookSecretRef?: string;
  capabilities: {
    audio: boolean;
    video: boolean;
    live: boolean;
    screenShare: boolean;
    recording: boolean;
    webhook: boolean;
    activeQuery: boolean;
    maxParticipants?: number;
    supportedRegions: string[];
    providerFeatures: Record<string, unknown>;
  };
  configSnapshot: Record<string, unknown>;
}
