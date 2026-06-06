import type {
  RtcCapabilityNegotiationResult,
  RtcCapabilityNegotiationSurfaceMap,
  RtcCapabilitySet,
  RtcCapabilitySupportState,
  RtcProviderMetadata,
  RtcProviderSelection,
} from './types.js';

function cloneReadonlyArray<T>(values: readonly T[]): readonly T[] {
  return [...values];
}

export function freezeRtcRuntimeValue<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      freezeRtcRuntimeValue(nestedValue);
    }

    Object.freeze(value);
  }

  return value;
}

export function shallowFreezeRtcRuntimeValue<T extends object>(value: T): T {
  if (!Object.isFrozen(value)) {
    Object.freeze(value);
  }

  return value;
}

export function cloneRtcCapabilitySet(value: RtcCapabilitySet): RtcCapabilitySet {
  return freezeRtcRuntimeValue({
    required: cloneReadonlyArray(value.required),
    optional: cloneReadonlyArray(value.optional),
  });
}

export function cloneRtcProviderMetadata(value: RtcProviderMetadata): RtcProviderMetadata {
  return freezeRtcRuntimeValue({
    ...value,
    urlSchemes: cloneReadonlyArray(value.urlSchemes),
    requiredCapabilities: cloneReadonlyArray(value.requiredCapabilities),
    optionalCapabilities: cloneReadonlyArray(value.optionalCapabilities),
    extensionKeys: cloneReadonlyArray(value.extensionKeys),
  });
}

export function cloneRtcProviderSelection(value: RtcProviderSelection): RtcProviderSelection {
  return freezeRtcRuntimeValue({
    ...value,
  });
}

export function cloneRtcCapabilitySupportState(
  value: RtcCapabilitySupportState,
): RtcCapabilitySupportState {
  return freezeRtcRuntimeValue({
    ...value,
  });
}

export function cloneRtcCapabilityNegotiationSurfaceMap(
  value: RtcCapabilityNegotiationSurfaceMap,
): RtcCapabilityNegotiationSurfaceMap {
  return freezeRtcRuntimeValue({
    controlPlane: cloneReadonlyArray(value.controlPlane),
    runtimeBridge: cloneReadonlyArray(value.runtimeBridge),
    crossSurface: cloneReadonlyArray(value.crossSurface),
  });
}

export function cloneRtcCapabilityNegotiationResult(
  value: RtcCapabilityNegotiationResult,
): RtcCapabilityNegotiationResult {
  return freezeRtcRuntimeValue({
    ...value,
    supportedRequired: cloneReadonlyArray(value.supportedRequired),
    missingRequired: cloneReadonlyArray(value.missingRequired),
    supportedOptional: cloneReadonlyArray(value.supportedOptional),
    missingOptional: cloneReadonlyArray(value.missingOptional),
    missingBySurface: cloneRtcCapabilityNegotiationSurfaceMap(value.missingBySurface),
  });
}
