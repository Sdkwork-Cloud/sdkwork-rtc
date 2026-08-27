import {
  createClient as createGeneratedRtcAppClient,
  SdkworkAppClient,
} from '../generated/server-openapi/dist/index.js';
import type { SdkworkAppConfig } from '../generated/server-openapi/dist/types/common.js';

export { SdkworkAppClient, createGeneratedRtcAppClient };
export type { SdkworkAppConfig };
// Generated transport only emits runtime for dist/index.{js,cjs}; subpaths are
// declaration-only. Keep type re-exports as `export type *` so Vite never
// resolves missing *.js under dist/{types,api,http,auth}/.
export type * from '../generated/server-openapi/dist/types/index.js';
export type * from '../generated/server-openapi/dist/api/index.js';
export type * from '../generated/server-openapi/dist/http/index.js';
export type * from '../generated/server-openapi/dist/auth/index.js';

export type SdkworkRtcAppClient = SdkworkAppClient;

export function createRtcAppClient(config: SdkworkAppConfig): SdkworkRtcAppClient {
  return createGeneratedRtcAppClient(config);
}

export function createClient(config: SdkworkAppConfig): SdkworkRtcAppClient {
  return createRtcAppClient(config);
}
