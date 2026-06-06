import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcCapabilityNegotiationRule,
  RtcCapabilityNegotiationStatus,
} from './types.js';

export const RTC_CAPABILITY_NEGOTIATION_STATUSES = freezeRtcRuntimeValue([
  'supported',
  'degraded',
  'unsupported',
] as const);

export const RTC_CAPABILITY_NEGOTIATION_RULES = freezeRtcRuntimeValue({
  supported: 'all-requested-capabilities-available',
  degraded: 'all-required-capabilities-available_optional-capabilities-missing',
  unsupported: 'required-capabilities-missing',
} as const satisfies Record<RtcCapabilityNegotiationStatus, RtcCapabilityNegotiationRule>);

export function resolveRtcCapabilityNegotiationStatus(
  missingRequiredCount: number,
  missingOptionalCount: number,
): RtcCapabilityNegotiationStatus {
  if (missingRequiredCount > 0) {
    return 'unsupported';
  }

  if (missingOptionalCount > 0) {
    return 'degraded';
  }

  return 'supported';
}
