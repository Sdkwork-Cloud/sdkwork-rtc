import type { MediaAccess } from './media-access';
import type { MediaChecksum } from './media-checksum';
import type { MediaKind } from './media-kind';
import type { MediaSource } from './media-source';

export interface MediaResource {
  id?: string | null;
  kind: MediaKind;
  source: MediaSource;
  /** Delivery URL. It is optional and may be temporary. */
  url?: string;
  publicUrl?: string;
  uri?: string | null;
  objectBlobId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: string | null;
  checksum?: MediaChecksum;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  altText?: string | null;
  title?: string | null;
  access?: MediaAccess;
  /** Extension metadata. Drive-backed RTC recordings include metadata.drive.spaceType = rtc. */
  metadata?: Record<string, unknown>;
}
