import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { JANUS_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const JANUS_RTC_PROVIDER_METADATA = JANUS_RTC_PROVIDER_CATALOG_ENTRY;

export function createJanusRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
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
