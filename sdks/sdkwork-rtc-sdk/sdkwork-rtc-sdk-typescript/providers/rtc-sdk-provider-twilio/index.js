import {
  TWILIO_RTC_PROVIDER_CATALOG_ENTRY,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const TWILIO_RTC_PROVIDER_METADATA = TWILIO_RTC_PROVIDER_CATALOG_ENTRY;

export function createTwilioRtcDriver(options = {}) {
  return createRtcProviderDriver({
    metadata: TWILIO_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const TWILIO_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: TWILIO_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: TWILIO_RTC_PROVIDER_METADATA,
  builtin: TWILIO_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createTwilioRtcDriver,
});
