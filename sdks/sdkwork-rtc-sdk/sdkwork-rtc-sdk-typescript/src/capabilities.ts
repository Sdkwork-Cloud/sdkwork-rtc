import {
  OPTIONAL_RTC_CAPABILITIES,
  REQUIRED_RTC_CAPABILITIES,
  RTC_CAPABILITY_CATALOG,
  getRtcCapabilityCatalog,
  getRtcCapabilityDescriptor,
  type RtcCapabilityKey,
  type RtcOptionalCapability,
  type RtcRequiredCapability,
} from './capability-catalog.js';
import {
  cloneRtcCapabilityNegotiationResult,
  cloneRtcCapabilitySupportState,
  freezeRtcRuntimeValue,
} from './runtime-freeze.js';
import {
  RTC_CAPABILITY_NEGOTIATION_RULES,
  RTC_CAPABILITY_NEGOTIATION_STATUSES,
  resolveRtcCapabilityNegotiationStatus,
} from './capability-negotiation.js';
import type {
  RtcCapabilityNegotiationRequest,
  RtcCapabilityNegotiationResult,
  RtcCapabilityNegotiationSurfaceMap,
  RtcCapabilitySurface,
  RtcCapabilitySet,
  RtcCapabilitySupportState,
} from './types.js';

function uniqueValues<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}

function createEmptySurfaceMap(): RtcCapabilityNegotiationSurfaceMap {
  return {
    controlPlane: [],
    runtimeBridge: [],
    crossSurface: [],
  };
}

function toSurfaceBucket(surface: RtcCapabilitySurface): keyof RtcCapabilityNegotiationSurfaceMap {
  switch (surface) {
    case 'control-plane':
      return 'controlPlane';
    case 'runtime-bridge':
      return 'runtimeBridge';
    case 'cross-surface':
      return 'crossSurface';
  }

  throw new Error(`RTC capability surface is not recognized: ${surface}`);
}

export function createCapabilitySet(input: Partial<RtcCapabilitySet>): RtcCapabilitySet {
  return freezeRtcRuntimeValue({
    required: uniqueValues(input.required ?? REQUIRED_RTC_CAPABILITIES),
    optional: uniqueValues(input.optional ?? []),
  });
}

export function hasCapability(capabilities: RtcCapabilitySet, capability: RtcCapabilityKey): boolean {
  return capabilities.required.includes(capability as RtcRequiredCapability)
    || capabilities.optional.includes(capability as RtcOptionalCapability);
}

export function describeCapabilitySupport(
  capabilities: RtcCapabilitySet,
  capability: RtcCapabilityKey,
): RtcCapabilitySupportState {
  const descriptor = getRtcCapabilityDescriptor(capability);
  if (!descriptor) {
    throw new Error(`RTC capability descriptor not found: ${capability}`);
  }

  return cloneRtcCapabilitySupportState({
    capabilityKey: capability,
    category: descriptor.category,
    surface: descriptor.surface,
    supported: hasCapability(capabilities, capability),
  });
}

export function negotiateCapabilities(
  capabilities: RtcCapabilitySet,
  request: RtcCapabilityNegotiationRequest,
): RtcCapabilityNegotiationResult {
  const required = uniqueValues(request.required ?? []);
  const optional = uniqueValues((request.optional ?? []).filter((capability) => !required.includes(capability)));
  const supportedRequired: RtcCapabilityKey[] = [];
  const missingRequired: RtcCapabilityKey[] = [];
  const supportedOptional: RtcCapabilityKey[] = [];
  const missingOptional: RtcCapabilityKey[] = [];
  const missingBySurface = createEmptySurfaceMap();

  for (const capability of required) {
    const capabilityState = describeCapabilitySupport(capabilities, capability);
    if (capabilityState.supported) {
      supportedRequired.push(capability);
      continue;
    }

    missingRequired.push(capability);
    missingBySurface[toSurfaceBucket(capabilityState.surface)] = [
      ...missingBySurface[toSurfaceBucket(capabilityState.surface)],
      capability,
    ];
  }

  for (const capability of optional) {
    const capabilityState = describeCapabilitySupport(capabilities, capability);
    if (capabilityState.supported) {
      supportedOptional.push(capability);
      continue;
    }

    missingOptional.push(capability);
    missingBySurface[toSurfaceBucket(capabilityState.surface)] = [
      ...missingBySurface[toSurfaceBucket(capabilityState.surface)],
      capability,
    ];
  }

  return cloneRtcCapabilityNegotiationResult({
    status: resolveRtcCapabilityNegotiationStatus(
      missingRequired.length,
      missingOptional.length,
    ),
    supportedRequired,
    missingRequired,
    supportedOptional,
    missingOptional,
    missingBySurface,
  });
}

export {
  OPTIONAL_RTC_CAPABILITIES,
  REQUIRED_RTC_CAPABILITIES,
  RTC_CAPABILITY_NEGOTIATION_RULES,
  RTC_CAPABILITY_NEGOTIATION_STATUSES,
  RTC_CAPABILITY_CATALOG,
  getRtcCapabilityCatalog,
  getRtcCapabilityDescriptor,
  resolveRtcCapabilityNegotiationStatus,
};
