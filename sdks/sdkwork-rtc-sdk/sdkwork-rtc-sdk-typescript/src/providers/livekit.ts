import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { LIVEKIT_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const LIVEKIT_RTC_PROVIDER_METADATA = LIVEKIT_RTC_PROVIDER_CATALOG_ENTRY;

export function createLivekitRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
  return createRtcProviderDriver({
    metadata: LIVEKIT_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const LIVEKIT_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: LIVEKIT_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: LIVEKIT_RTC_PROVIDER_METADATA,
  builtin: LIVEKIT_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createLivekitRtcDriver,
});
