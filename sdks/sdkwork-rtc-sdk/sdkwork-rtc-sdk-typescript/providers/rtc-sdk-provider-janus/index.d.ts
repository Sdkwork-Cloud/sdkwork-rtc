import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const JANUS_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export type CreateJanusRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function createJanusRtcDriver<TNativeClient = unknown>(
  options?: CreateJanusRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const JANUS_RTC_PROVIDER_MODULE: RtcProviderModule;
