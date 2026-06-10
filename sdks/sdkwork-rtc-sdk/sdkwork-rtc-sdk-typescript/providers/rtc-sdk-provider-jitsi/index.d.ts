import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const JITSI_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export type CreateJitsiRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function createJitsiRtcDriver<TNativeClient = unknown>(
  options?: CreateJitsiRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const JITSI_RTC_PROVIDER_MODULE: RtcProviderModule;
