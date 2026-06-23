import 'package:sdkwork_rtc_flutter_mobile_admin_core/sdkwork_rtc_flutter_mobile_admin_core.dart';

import 'admin_auth.dart';
import 'environment.dart';

class RtcAdminServices {
  final ProviderAccountService accounts;
  final ProviderApplicationService applications;
  final ProviderCredentialService credentials;
  final ProviderProfileService profiles;
  final ProviderRouteService routes;
  final ProviderSchemaService schemas;
  final RoomService rooms;
  final ProviderPluginService plugins;
  final ProviderWebhookService webhooks;
  final ProviderQueryJobService queryJobs;

  const RtcAdminServices({
    required this.accounts,
    required this.applications,
    required this.credentials,
    required this.profiles,
    required this.routes,
    required this.schemas,
    required this.rooms,
    required this.plugins,
    required this.webhooks,
    required this.queryJobs,
  });
}

RtcAdminServices createAdminServices({required RtcAdminSession session}) {
  final env = resolveEnvironment();
  final bundle = createRtcBackendClient(
    backendApiBaseUrl: env.backendApiBaseUrl,
    accessToken: session.accessToken,
    authToken: session.authToken,
    tenantId: session.tenantId,
    organizationId: session.organizationId,
    userId: session.userId,
    permissionScope: defaultAdminPermissionScope,
  );
  final client = bundle.backendSdk;

  return RtcAdminServices(
    accounts: ProviderAccountService(client),
    applications: ProviderApplicationService(client),
    credentials: ProviderCredentialService(client),
    profiles: ProviderProfileService(client),
    routes: ProviderRouteService(client),
    schemas: ProviderSchemaService(client),
    rooms: RoomService(client),
    plugins: ProviderPluginService(client),
    webhooks: ProviderWebhookService(client),
    queryJobs: ProviderQueryJobService(client),
  );
}

PersistProviderWizardServices toWizardServices(RtcAdminServices services) {
  return (
    accounts: services.accounts,
    applications: services.applications,
    credentials: services.credentials,
    profiles: services.profiles,
  );
}
