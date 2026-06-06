import { RtcSdkException } from './errors.js';
import { DEFAULT_RTC_PROVIDER_KEY } from './provider-catalog.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcProviderSelection,
  RtcProviderSelectionRequest,
  RtcProviderSelectionSource,
} from './types.js';

const RTC_PROVIDER_URL_PATTERN = /^rtc:([a-z0-9-]+):\/\/.+$/i;

export interface ParsedRtcProviderUrl {
  providerKey: string;
  rawUrl: string;
}

export const RTC_PROVIDER_SELECTION_SOURCES = freezeRtcRuntimeValue([
  'provider_url',
  'provider_key',
  'tenant_override',
  'deployment_profile',
  'default_provider',
] as const);

export const RTC_PROVIDER_SELECTION_PRECEDENCE = freezeRtcRuntimeValue([
  ...RTC_PROVIDER_SELECTION_SOURCES,
]);

export function parseRtcProviderUrl(providerUrl: string): ParsedRtcProviderUrl {
  const match = RTC_PROVIDER_URL_PATTERN.exec(providerUrl.trim());
  if (!match) {
    throw new RtcSdkException({
      code: 'invalid_provider_url',
      message: `Invalid RTC provider URL: ${providerUrl}`,
      details: { providerUrl },
    });
  }
  const providerKey = match[1];
  if (!providerKey) {
    throw new RtcSdkException({
      code: 'invalid_provider_url',
      message: `Invalid RTC provider URL: ${providerUrl}`,
      details: { providerUrl },
    });
  }

  return freezeRtcRuntimeValue({
    providerKey: providerKey.toLowerCase(),
    rawUrl: providerUrl,
  });
}

function createRtcProviderSelection(
  providerKey: string,
  source: RtcProviderSelectionSource,
): RtcProviderSelection {
  return freezeRtcRuntimeValue({
    providerKey,
    source,
  });
}

export function resolveRtcProviderSelection(
  request: RtcProviderSelectionRequest = {},
  defaultProviderKey: string = DEFAULT_RTC_PROVIDER_KEY,
): RtcProviderSelection {
  if (request.providerUrl) {
    return createRtcProviderSelection(
      parseRtcProviderUrl(request.providerUrl).providerKey,
      'provider_url',
    );
  }

  if (request.providerKey) {
    return createRtcProviderSelection(request.providerKey, 'provider_key');
  }

  if (request.tenantOverrideProviderKey) {
    return createRtcProviderSelection(
      request.tenantOverrideProviderKey,
      'tenant_override',
    );
  }

  if (request.deploymentProfileProviderKey) {
    return createRtcProviderSelection(
      request.deploymentProfileProviderKey,
      'deployment_profile',
    );
  }

  return createRtcProviderSelection(defaultProviderKey, 'default_provider');
}
