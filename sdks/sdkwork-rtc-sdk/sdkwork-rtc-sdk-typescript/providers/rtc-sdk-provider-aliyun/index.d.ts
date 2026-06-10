import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const ALIYUN_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export type CreateAliyunRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function createAliyunRtcDriver<TNativeClient = unknown>(
  options?: CreateAliyunRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const ALIYUN_RTC_PROVIDER_MODULE: RtcProviderModule;
