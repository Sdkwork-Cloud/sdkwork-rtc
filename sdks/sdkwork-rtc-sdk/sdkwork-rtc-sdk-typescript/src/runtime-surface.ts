import type { RtcSdkErrorCode } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_RUNTIME_SURFACE_METHODS = freezeRtcRuntimeValue(['join', 'leave', 'publish', 'unpublish', 'muteAudio', 'muteVideo'] as const);

export type RtcRuntimeSurfaceMethodName = (typeof RTC_RUNTIME_SURFACE_METHODS)[number];

export type RtcRuntimeSurfaceFailureCode = Extract<RtcSdkErrorCode, 'native_sdk_not_available'>;

export const RTC_RUNTIME_SURFACE_FAILURE_CODE: RtcRuntimeSurfaceFailureCode = 'native_sdk_not_available';

export const RTC_RUNTIME_SURFACE_STANDARD = freezeRtcRuntimeValue({
  methodTerms: RTC_RUNTIME_SURFACE_METHODS,
  failureCode: RTC_RUNTIME_SURFACE_FAILURE_CODE,
} as const);
