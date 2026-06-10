import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const TWILIO_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export type CreateTwilioRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function createTwilioRtcDriver<TNativeClient = unknown>(
  options?: CreateTwilioRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const TWILIO_RTC_PROVIDER_MODULE: RtcProviderModule;
