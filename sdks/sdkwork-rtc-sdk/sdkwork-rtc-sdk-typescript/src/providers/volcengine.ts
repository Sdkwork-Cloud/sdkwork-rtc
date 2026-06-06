import {
  createRtcProviderDriver,
  type CreateRtcProviderDriverOptions,
  type RtcProviderDriver,
} from '../driver.js';
import { VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';
import {
  createOfficialVolcengineWebRtcDriver,
  type CreateOfficialVolcengineWebRtcDriverOptions,
  type RtcVolcengineOfficialWebNativeClient,
  type RtcVolcengineWebEngineLike,
  type RtcVolcengineWebNativeConfig,
  type RtcVolcengineWebSdkModule,
} from '../volcengine-official-web.js';

export const VOLCENGINE_RTC_PROVIDER_METADATA = VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY;

export type CreateVolcengineRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
> &
  CreateOfficialVolcengineWebRtcDriverOptions;

export function createVolcengineRtcDriver<TNativeClient = unknown>(
  options: CreateVolcengineRtcDriverOptions<TNativeClient> = {},
): RtcProviderDriver<TNativeClient | RtcVolcengineOfficialWebNativeClient> {
  if (!options.nativeFactory && !options.runtimeController) {
    return createOfficialVolcengineWebRtcDriver({
      loadSdk: options.loadSdk,
    }) as RtcProviderDriver<TNativeClient | RtcVolcengineOfficialWebNativeClient>;
  }

  return createRtcProviderDriver({
    metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const VOLCENGINE_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: VOLCENGINE_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
  builtin: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createVolcengineRtcDriver,
});

export {
  createOfficialVolcengineWebRtcDriver,
  type CreateOfficialVolcengineWebRtcDriverOptions,
  type RtcVolcengineOfficialWebNativeClient,
  type RtcVolcengineWebEngineLike,
  type RtcVolcengineWebNativeConfig,
  type RtcVolcengineWebSdkModule,
};
