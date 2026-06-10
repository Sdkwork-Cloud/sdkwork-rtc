import {
  JANUS_RTC_PROVIDER_CATALOG_ENTRY,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const JANUS_RTC_PROVIDER_METADATA = JANUS_RTC_PROVIDER_CATALOG_ENTRY;

export function createJanusRtcDriver(options = {}) {
  return createRtcProviderDriver({
    metadata: JANUS_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const JANUS_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: JANUS_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: JANUS_RTC_PROVIDER_METADATA,
  builtin: JANUS_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createJanusRtcDriver,
});
