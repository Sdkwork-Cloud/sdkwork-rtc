import {
  ZEGO_RTC_PROVIDER_CATALOG_ENTRY,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const ZEGO_RTC_PROVIDER_METADATA = ZEGO_RTC_PROVIDER_CATALOG_ENTRY;

export function createZegoRtcDriver(options = {}) {
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
