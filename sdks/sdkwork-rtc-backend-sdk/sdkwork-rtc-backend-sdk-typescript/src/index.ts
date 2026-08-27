import {
  createClient as createGeneratedRtcBackendClient,
  SdkworkBackendClient,
} from '../generated/server-openapi/dist/index.js';
import type { SdkworkBackendConfig } from '../generated/server-openapi/dist/types/common.js';

export { SdkworkBackendClient, createGeneratedRtcBackendClient };
export type { SdkworkBackendConfig };
// Generated transport only emits runtime for dist/index.{js,cjs}; subpaths are
// declaration-only. Keep type re-exports as `export type *` so Vite never
// resolves missing *.js under dist/{types,api,http,auth}/.
export type * from '../generated/server-openapi/dist/types/index.js';
export type * from '../generated/server-openapi/dist/api/index.js';
export type * from '../generated/server-openapi/dist/http/index.js';
export type * from '../generated/server-openapi/dist/auth/index.js';

export type SdkworkRtcBackendClient = SdkworkBackendClient;

export function createRtcBackendClient(config: SdkworkBackendConfig): SdkworkRtcBackendClient {
  return createGeneratedRtcBackendClient(config);
}

export function createClient(config: SdkworkBackendConfig): SdkworkRtcBackendClient {
  return createRtcBackendClient(config);
}
