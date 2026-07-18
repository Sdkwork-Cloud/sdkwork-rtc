import {
  createClient as createGeneratedRtcBackendClient,
  SdkworkBackendClient,
} from '../generated/server-openapi/dist/index.js';
import type { SdkworkBackendConfig } from '../generated/server-openapi/dist/types/common.js';

export { SdkworkBackendClient, createGeneratedRtcBackendClient };
export type { SdkworkBackendConfig };
export * from '../generated/server-openapi/dist/types/index.js';
export * from '../generated/server-openapi/dist/api/index.js';
export * from '../generated/server-openapi/dist/http/index.js';
export * from '../generated/server-openapi/dist/auth/index.js';

export type SdkworkRtcBackendClient = SdkworkBackendClient;

export function createRtcBackendClient(config: SdkworkBackendConfig): SdkworkRtcBackendClient {
  return createGeneratedRtcBackendClient(config);
}

export function createClient(config: SdkworkBackendConfig): SdkworkRtcBackendClient {
  return createRtcBackendClient(config);
}
