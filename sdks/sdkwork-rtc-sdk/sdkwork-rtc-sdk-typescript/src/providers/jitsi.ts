import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { JITSI_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const JITSI_RTC_PROVIDER_METADATA = JITSI_RTC_PROVIDER_CATALOG_ENTRY;

export function createJitsiRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
  return createRtcProviderDriver({
    metadata: JITSI_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const JITSI_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: JITSI_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: JITSI_RTC_PROVIDER_METADATA,
  builtin: JITSI_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createJitsiRtcDriver,
});
