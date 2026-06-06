import { RtcDriverManager } from './driver-manager.js';
import { DEFAULT_RTC_PROVIDER_KEY } from './provider-catalog.js';
import { registerRtcProviderModules } from './provider-module.js';
import { getBuiltinRtcProviderModules } from './providers/index.js';

export function createBuiltinRtcDriverManagerInternal(): RtcDriverManager {
  return registerRtcProviderModules(
    new RtcDriverManager({
      defaultProviderKey: DEFAULT_RTC_PROVIDER_KEY,
    }),
    getBuiltinRtcProviderModules().map((providerModule) => ({
      providerModule,
    })),
  );
}
