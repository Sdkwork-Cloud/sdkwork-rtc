import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { TENCENT_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const TENCENT_RTC_PROVIDER_METADATA = TENCENT_RTC_PROVIDER_CATALOG_ENTRY;

export function createTencentRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
  return createRtcProviderDriver({
    metadata: TENCENT_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const TENCENT_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: TENCENT_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: TENCENT_RTC_PROVIDER_METADATA,
  builtin: TENCENT_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createTencentRtcDriver,
});
