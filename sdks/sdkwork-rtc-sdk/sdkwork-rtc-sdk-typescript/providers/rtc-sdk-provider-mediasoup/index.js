import {
  MEDIASOUP_RTC_PROVIDER_CATALOG_ENTRY,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const MEDIASOUP_RTC_PROVIDER_METADATA = MEDIASOUP_RTC_PROVIDER_CATALOG_ENTRY;

export function createMediasoupRtcDriver(options = {}) {
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
