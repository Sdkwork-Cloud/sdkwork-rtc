import {
  createClient as createGeneratedRtcAppClient,
  SdkworkAppClient,
} from '../generated/server-openapi/dist/index.js';
import type { SdkworkAppConfig } from '../generated/server-openapi/dist/types/common.js';

export { SdkworkAppClient, createGeneratedRtcAppClient };
export type { SdkworkAppConfig };
export * from '../generated/server-openapi/dist/types/index.js';
export * from '../generated/server-openapi/dist/api/index.js';
export * from '../generated/server-openapi/dist/http/index.js';
export * from '../generated/server-openapi/dist/auth/index.js';

export type SdkworkRtcAppClient = SdkworkAppClient;

export function createRtcAppClient(config: SdkworkAppConfig): SdkworkRtcAppClient {
  return createGeneratedRtcAppClient(config);
}

export function createClient(config: SdkworkAppConfig): SdkworkRtcAppClient {
  return createRtcAppClient(config);
}
