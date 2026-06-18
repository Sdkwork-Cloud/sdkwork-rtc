import {
  ProviderAccountService,
  ProviderApplicationService,
  ProviderCredentialService,
  ProviderPluginService,
  ProviderProfileService,
  ProviderQueryJobService,
  ProviderRouteService,
  ProviderSchemaService,
  ProviderWebhookService,
  RoomService,
} from "@sdkwork/rtc-h5-admin-core";

import {
  bootstrapAdminAuth,
  buildAdminSdkHeaders,
  loadAdminSession,
} from "./adminAuth";
import { resolveEnvironment } from "./environment";
import { getTokenManager } from "./tokenManager";

export interface RtcAdminServices {
  accounts: ProviderAccountService;
  applications: ProviderApplicationService;
  credentials: ProviderCredentialService;
  profiles: ProviderProfileService;
  routes: ProviderRouteService;
  schemas: ProviderSchemaService;
  rooms: RoomService;
  plugins: ProviderPluginService;
  webhooks: ProviderWebhookService;
  queryJobs: ProviderQueryJobService;
}

export function createAdminServices(): RtcAdminServices {
  const { backendApiBaseUrl } = resolveEnvironment();
  const session = bootstrapAdminAuth() ?? loadAdminSession();
  const tokenManager = getTokenManager();
  const clientOptions = session
    ? {
        tokenManager,
        authToken: session.authToken,
        accessToken: session.accessToken,
        tenantId: session.tenantId,
        organizationId: session.organizationId,
        headers: buildAdminSdkHeaders(session),
      }
    : { tokenManager };

  return {
    accounts: new ProviderAccountService(backendApiBaseUrl, clientOptions),
    applications: new ProviderApplicationService(backendApiBaseUrl, clientOptions),
    credentials: new ProviderCredentialService(backendApiBaseUrl, clientOptions),
    profiles: new ProviderProfileService(backendApiBaseUrl, clientOptions),
    routes: new ProviderRouteService(backendApiBaseUrl, clientOptions),
    schemas: new ProviderSchemaService(backendApiBaseUrl, clientOptions),
    rooms: new RoomService(backendApiBaseUrl, clientOptions),
    plugins: new ProviderPluginService(backendApiBaseUrl, clientOptions),
    webhooks: new ProviderWebhookService(backendApiBaseUrl, clientOptions),
    queryJobs: new ProviderQueryJobService(backendApiBaseUrl, clientOptions),
  };
}
