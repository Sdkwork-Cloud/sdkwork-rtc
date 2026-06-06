import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { TWILIO_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const TWILIO_RTC_PROVIDER_METADATA = TWILIO_RTC_PROVIDER_CATALOG_ENTRY;

export function createTwilioRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
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
