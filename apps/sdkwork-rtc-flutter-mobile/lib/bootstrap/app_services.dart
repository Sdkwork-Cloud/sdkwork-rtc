import 'package:sdkwork_rtc_flutter_mobile_rtc/sdkwork_rtc_flutter_mobile_rtc.dart';

import 'app_auth.dart';
import 'sdk_clients.dart';

RtcAppServices createAppServices({RtcAppSession? session}) {
  final activeSession = session ?? loadAppSession();
  if (activeSession == null) {
    throw StateError(
      'RTC app services require an authenticated session; sign in before creating services.',
    );
  }
  final clients = createSdkClients(session: activeSession);
  return createRtcAppServices(clients.app.appSdk);
}
