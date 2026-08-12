import type { MediaResource } from './media-resource';
import type { RtcDriveReference } from './rtc-drive-reference';

export interface RtcMediaArtifact {
  id: string;
  tenantId: string;
  organizationId?: string | null;
  mediaSessionId: string;
  ownerUserId: string;
  artifactKind: 'recording' | 'transcript' | 'screen_share' | 'snapshot' | 'other';
  artifactStatus: 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';
  mediaRole: string;
  providerProfileId?: string | null;
  providerArtifactId?: string | null;
  drive: RtcDriveReference;
  resource: MediaResource;
  resourceHash?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMs?: string | null;
  failureReason?: string | null;
  sourceProviderWebhookEventId?: string | null;
  sourceProviderQueryJobId?: string | null;
}
