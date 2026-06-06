import 'providers/volcengine.dart';
import 'rtc_driver_manager.dart';
import 'rtc_provider_catalog.dart';

RtcDriverManager createBuiltinRtcDriverManager() {
  final driverManager = RtcDriverManager(
    defaultProviderKey: RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    registerDefaultDrivers: false,
  );
  driverManager.register(createVolcengineRtcDriver());
  return driverManager;
}
