import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const AGORA_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export type CreateAgoraRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function createAgoraRtcDriver<TNativeClient = unknown>(
  options?: CreateAgoraRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const AGORA_RTC_PROVIDER_MODULE: RtcProviderModule;
