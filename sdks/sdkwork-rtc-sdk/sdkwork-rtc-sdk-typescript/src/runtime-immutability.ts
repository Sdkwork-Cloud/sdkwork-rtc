import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM = 'runtime-frozen';

export const RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM = 'immutable-snapshots';

export const RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM = 'shallow-immutable-context';

export const RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM = 'mutable-native-client';

export const RTC_RUNTIME_IMMUTABILITY_STANDARD = freezeRtcRuntimeValue({
  frozenTerm: RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM,
  snapshotTerm: RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM,
  controllerContextTerm: RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM,
  nativeClientTerm: RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM,
} as const);
