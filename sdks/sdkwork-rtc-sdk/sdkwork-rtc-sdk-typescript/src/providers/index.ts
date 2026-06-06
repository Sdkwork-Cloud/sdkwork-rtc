import type { RtcProviderModule } from '../provider-module.js';
import { freezeRtcRuntimeValue } from '../runtime-freeze.js';
import type { RtcProviderMetadata } from '../types.js';
import {
  BUILTIN_RTC_PROVIDER_CATALOG,
  BUILTIN_RTC_PROVIDER_KEYS,
  OFFICIAL_RTC_PROVIDER_CATALOG,
  OFFICIAL_RTC_PROVIDER_KEYS,
} from '../provider-catalog.js';
import { ALIYUN_RTC_PROVIDER_MODULE } from './aliyun.js';
import { AGORA_RTC_PROVIDER_MODULE } from './agora.js';
import { LIVEKIT_RTC_PROVIDER_MODULE } from './livekit.js';
import { TENCENT_RTC_PROVIDER_MODULE } from './tencent.js';
import { VOLCENGINE_RTC_PROVIDER_MODULE } from './volcengine.js';

export {
  BUILTIN_RTC_PROVIDER_KEYS,
  DEFAULT_RTC_PROVIDER_DRIVER_ID,
  DEFAULT_RTC_PROVIDER_KEY,
  DEFAULT_RTC_PROVIDER_PLUGIN_ID,
  OFFICIAL_RTC_PROVIDER_KEYS,
  getBuiltinRtcProviderMetadataByKey,
  getOfficialRtcProviderMetadataByKey,
  getRtcProviderByProviderKey,
} from '../provider-catalog.js';

const BUILTIN_RTC_PROVIDER_MODULES: readonly RtcProviderModule[] = freezeRtcRuntimeValue([
  VOLCENGINE_RTC_PROVIDER_MODULE,
  ALIYUN_RTC_PROVIDER_MODULE,
  TENCENT_RTC_PROVIDER_MODULE,
  AGORA_RTC_PROVIDER_MODULE,
  LIVEKIT_RTC_PROVIDER_MODULE,
]);

export function getBuiltinRtcProviderMetadata(): readonly RtcProviderMetadata[] {
  return BUILTIN_RTC_PROVIDER_CATALOG;
}

export function getBuiltinRtcProviderModules(): readonly RtcProviderModule[] {
  return BUILTIN_RTC_PROVIDER_MODULES;
}

export function getOfficialRtcProviderMetadata(): readonly RtcProviderMetadata[] {
  return OFFICIAL_RTC_PROVIDER_CATALOG;
}
