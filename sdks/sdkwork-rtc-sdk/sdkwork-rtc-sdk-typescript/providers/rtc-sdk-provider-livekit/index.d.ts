import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const LIVEKIT_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export type CreateLivekitRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function createLivekitRtcDriver<TNativeClient = unknown>(
  options?: CreateLivekitRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const LIVEKIT_RTC_PROVIDER_MODULE: RtcProviderModule;
