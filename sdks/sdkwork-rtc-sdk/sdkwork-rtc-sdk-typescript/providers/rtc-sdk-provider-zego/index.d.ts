import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const ZEGO_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export type CreateZegoRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function createZegoRtcDriver<TNativeClient = unknown>(
  options?: CreateZegoRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const ZEGO_RTC_PROVIDER_MODULE: RtcProviderModule;
