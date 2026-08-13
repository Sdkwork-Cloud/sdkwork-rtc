import {
  MediaArtifactService,
  MediaSessionService,
  ProviderAccountService,
  ProviderApplicationService,
  ProviderCredentialService,
  ProviderPluginService,
  ProviderProfileService,
  ProviderQueryJobService,
  ProviderRouteService,
  ProviderSchemaService,
  ProviderWebhookService,
  QualitySampleService,
  RoomService,
  createBackendRtcClient,
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
  mediaSessions: MediaSessionService;
  mediaArtifacts: MediaArtifactService;
  qualitySamples: QualitySampleService;
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

  const client = createBackendRtcClient(backendApiBaseUrl, clientOptions);

  return {
    accounts: new ProviderAccountService(client),
    applications: new ProviderApplicationService(client),
    credentials: new ProviderCredentialService(client),
    profiles: new ProviderProfileService(client),
    routes: new ProviderRouteService(client),
    schemas: new ProviderSchemaService(client),
    rooms: new RoomService(client),
    mediaSessions: new MediaSessionService(client),
    mediaArtifacts: new MediaArtifactService(client),
    qualitySamples: new QualitySampleService(client),
    plugins: new ProviderPluginService(client),
    webhooks: new ProviderWebhookService(client),
    queryJobs: new ProviderQueryJobService(client),
  };
}
