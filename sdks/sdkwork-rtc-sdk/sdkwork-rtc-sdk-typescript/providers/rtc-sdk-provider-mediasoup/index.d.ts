import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const MEDIASOUP_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export type CreateMediasoupRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function createMediasoupRtcDriver<TNativeClient = unknown>(
  options?: CreateMediasoupRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const MEDIASOUP_RTC_PROVIDER_MODULE: RtcProviderModule;
