import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { MEDIASOUP_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const MEDIASOUP_RTC_PROVIDER_METADATA = MEDIASOUP_RTC_PROVIDER_CATALOG_ENTRY;

export function createMediasoupRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
  return createRtcProviderDriver({
    metadata: MEDIASOUP_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const MEDIASOUP_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: MEDIASOUP_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: MEDIASOUP_RTC_PROVIDER_METADATA,
  builtin: MEDIASOUP_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createMediasoupRtcDriver,
});
