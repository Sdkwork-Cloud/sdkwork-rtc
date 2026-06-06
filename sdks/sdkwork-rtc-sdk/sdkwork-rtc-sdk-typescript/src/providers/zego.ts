import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { ZEGO_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const ZEGO_RTC_PROVIDER_METADATA = ZEGO_RTC_PROVIDER_CATALOG_ENTRY;

export function createZegoRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
  return createRtcProviderDriver({
    metadata: ZEGO_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const ZEGO_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: ZEGO_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: ZEGO_RTC_PROVIDER_METADATA,
  builtin: ZEGO_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createZegoRtcDriver,
});
