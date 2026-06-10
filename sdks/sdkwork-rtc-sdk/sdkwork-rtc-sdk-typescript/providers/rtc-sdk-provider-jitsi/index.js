import {
  JITSI_RTC_PROVIDER_CATALOG_ENTRY,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const JITSI_RTC_PROVIDER_METADATA = JITSI_RTC_PROVIDER_CATALOG_ENTRY;

export function createJitsiRtcDriver(options = {}) {
  return createRtcProviderDriver({
    metadata: JITSI_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const JITSI_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: JITSI_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: JITSI_RTC_PROVIDER_METADATA,
  builtin: JITSI_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createJitsiRtcDriver,
});
