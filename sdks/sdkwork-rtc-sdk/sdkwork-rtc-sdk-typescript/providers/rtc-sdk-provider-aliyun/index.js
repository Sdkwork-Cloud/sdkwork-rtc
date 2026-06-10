import {
  ALIYUN_RTC_PROVIDER_CATALOG_ENTRY,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const ALIYUN_RTC_PROVIDER_METADATA = ALIYUN_RTC_PROVIDER_CATALOG_ENTRY;

export function createAliyunRtcDriver(options = {}) {
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
