import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { ALIYUN_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const ALIYUN_RTC_PROVIDER_METADATA = ALIYUN_RTC_PROVIDER_CATALOG_ENTRY;

export function createAliyunRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
  return createRtcProviderDriver({
    metadata: ALIYUN_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const ALIYUN_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: ALIYUN_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: ALIYUN_RTC_PROVIDER_METADATA,
  builtin: ALIYUN_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createAliyunRtcDriver,
});
