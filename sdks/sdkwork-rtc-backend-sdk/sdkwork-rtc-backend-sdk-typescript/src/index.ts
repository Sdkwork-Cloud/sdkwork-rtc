import {
  createClient as createGeneratedRtcBackendClient,
  SdkworkBackendClient,
} from '../generated/server-openapi/src/index';
import type { SdkworkBackendConfig } from '../generated/server-openapi/src/types/common';

export { SdkworkBackendClient, createGeneratedRtcBackendClient };
export type { SdkworkBackendConfig };
export * from '../generated/server-openapi/src/types';
export * from '../generated/server-openapi/src/api';
export * from '../generated/server-openapi/src/http';
export * from '../generated/server-openapi/src/auth';

export type SdkworkRtcBackendClient = SdkworkBackendClient;

export function createRtcBackendClient(config: SdkworkBackendConfig): SdkworkRtcBackendClient {
  return createGeneratedRtcBackendClient(config);
}

export function createClient(config: SdkworkBackendConfig): SdkworkRtcBackendClient {
  return createRtcBackendClient(config);
}
