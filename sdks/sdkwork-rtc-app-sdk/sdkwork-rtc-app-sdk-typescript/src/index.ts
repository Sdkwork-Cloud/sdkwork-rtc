import {
  createClient as createGeneratedRtcAppClient,
  SdkworkAppClient,
} from '../generated/server-openapi/src/index';
import type { SdkworkAppConfig } from '../generated/server-openapi/src/types/common';

export { SdkworkAppClient, createGeneratedRtcAppClient };
export type { SdkworkAppConfig };
export * from '../generated/server-openapi/src/types';
export * from '../generated/server-openapi/src/api';
export * from '../generated/server-openapi/src/http';
export * from '../generated/server-openapi/src/auth';

export type SdkworkRtcAppClient = SdkworkAppClient;

export function createRtcAppClient(config: SdkworkAppConfig): SdkworkRtcAppClient {
  return createGeneratedRtcAppClient(config);
}

export function createClient(config: SdkworkAppConfig): SdkworkRtcAppClient {
  return createRtcAppClient(config);
}
