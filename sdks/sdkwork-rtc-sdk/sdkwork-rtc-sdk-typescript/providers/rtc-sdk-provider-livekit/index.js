import {
  LIVEKIT_RTC_PROVIDER_CATALOG_ENTRY,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const LIVEKIT_RTC_PROVIDER_METADATA = LIVEKIT_RTC_PROVIDER_CATALOG_ENTRY;

export function createLivekitRtcDriver(options = {}) {
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
