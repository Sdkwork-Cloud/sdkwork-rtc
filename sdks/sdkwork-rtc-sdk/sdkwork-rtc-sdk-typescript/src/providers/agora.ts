import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { AGORA_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const AGORA_RTC_PROVIDER_METADATA = AGORA_RTC_PROVIDER_CATALOG_ENTRY;

export function createAgoraRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
  return createRtcProviderDriver({
    metadata: AGORA_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const AGORA_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: AGORA_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: AGORA_RTC_PROVIDER_METADATA,
  builtin: AGORA_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createAgoraRtcDriver,
});
