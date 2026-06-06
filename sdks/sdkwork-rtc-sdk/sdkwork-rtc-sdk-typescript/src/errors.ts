import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_SDK_ERROR_CODES = freezeRtcRuntimeValue([
  'provider_package_not_found',
  'provider_package_identity_mismatch',
  'provider_package_load_failed',
  'provider_module_export_missing',
  'provider_module_contract_mismatch',
  'driver_already_registered',
  'driver_not_found',
  'provider_not_official',
  'provider_not_supported',
  'provider_metadata_mismatch',
  'provider_selection_failed',
  'capability_not_supported',
  'invalid_provider_url',
  'invalid_native_config',
  'native_sdk_not_available',
  'signaling_not_available',
  'call_state_invalid',
  'vendor_error',
] as const);

export type RtcSdkErrorCode = (typeof RTC_SDK_ERROR_CODES)[number];

export const RTC_SDK_ERROR_FALLBACK_CODE: RtcSdkErrorCode = 'vendor_error';

export interface RtcSdkExceptionOptions {
  code: RtcSdkErrorCode;
  message: string;
  providerKey?: string;
  pluginId?: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class RtcSdkException extends Error {
  readonly code: RtcSdkErrorCode;
  readonly providerKey?: string;
  readonly pluginId?: string;
  readonly details?: Record<string, unknown>;

  constructor(options: RtcSdkExceptionOptions) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'RtcSdkException';
    this.code = options.code;
    this.providerKey = options.providerKey;
    this.pluginId = options.pluginId;
    this.details = options.details;
  }
}
