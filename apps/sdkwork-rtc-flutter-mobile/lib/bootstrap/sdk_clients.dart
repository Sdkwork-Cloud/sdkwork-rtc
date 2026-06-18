import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

import 'app_auth.dart';
import 'environment.dart';

class RtcSdkClients {
  const RtcSdkClients({
    required this.apiBaseUrl,
    required this.backendApiBaseUrl,
    required this.app,
  });

  final String apiBaseUrl;
  final String backendApiBaseUrl;
  final RtcAppClientBundle app;
}

RtcSdkClients? _activeSdkClients;

RtcSdkClients createSdkClients({RtcAppSession? session}) {
  final env = resolveEnvironment();
  final activeSession = session ?? loadAppSession();
  final bundle = createRtcAppClient(
    apiBaseUrl: env.apiBaseUrl,
    accessToken: activeSession?.accessToken,
    authToken: activeSession?.authToken ?? activeSession?.accessToken,
    tenantId: activeSession?.tenantId ?? defaultAppSession.tenantId,
    organizationId: activeSession?.organizationId ?? defaultAppSession.organizationId,
    userId: activeSession?.userId ?? defaultAppSession.userId,
    permissionScope: defaultAppPermissionScope,
  );

  _activeSdkClients = RtcSdkClients(
    apiBaseUrl: env.apiBaseUrl,
    backendApiBaseUrl: env.backendApiBaseUrl,
    app: bundle,
  );
  return _activeSdkClients!;
}

RtcSdkClients getSdkClients() {
  return _activeSdkClients ?? createSdkClients();
}
