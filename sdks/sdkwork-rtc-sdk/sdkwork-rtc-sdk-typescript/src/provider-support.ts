import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcProviderSupportState,
  RtcProviderSupportStateRequest,
  RtcProviderSupportStatus,
} from './types.js';

export const RTC_PROVIDER_SUPPORT_STATUSES = freezeRtcRuntimeValue([
  'builtin_registered',
  'official_registered',
  'official_unregistered',
  'unknown',
] as const);

export function resolveRtcProviderSupportStatus(
  request: RtcProviderSupportStateRequest,
): RtcProviderSupportStatus {
  if (request.official && request.registered) {
    return request.builtin ? 'builtin_registered' : 'official_registered';
  }

  if (request.official) {
    return 'official_unregistered';
  }

  return 'unknown';
}

export function createRtcProviderSupportState(
  request: RtcProviderSupportStateRequest,
): RtcProviderSupportState {
  return freezeRtcRuntimeValue({
    providerKey: request.providerKey,
    builtin: request.builtin,
    official: request.official,
    registered: request.registered,
    status: resolveRtcProviderSupportStatus(request),
  });
}
