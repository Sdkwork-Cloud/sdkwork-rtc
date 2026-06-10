import {
  AGORA_RTC_PROVIDER_CATALOG_ENTRY,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const AGORA_RTC_PROVIDER_METADATA = AGORA_RTC_PROVIDER_CATALOG_ENTRY;

export function createAgoraRtcDriver(options = {}) {
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
