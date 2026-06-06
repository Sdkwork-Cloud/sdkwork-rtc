import 'rtc_driver_manager.dart';
import 'rtc_provider_catalog.dart';
import 'rtc_provider_selection.dart';
import 'rtc_provider_support.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';

final class RtcDataSourceOptions extends RtcClientConfig {
  const RtcDataSourceOptions({
    super.providerUrl,
    super.providerKey,
    super.tenantOverrideProviderKey,
    super.deploymentProfileProviderKey,
    super.defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    super.nativeConfig,
  });
}

RtcDataSourceOptions _mergeOptions(
  RtcDataSourceOptions base,
  RtcDataSourceOptions? overrides,
) {
  if (overrides == null) {
    return base;
  }

  return RtcDataSourceOptions(
    providerUrl: overrides.providerUrl ?? base.providerUrl,
    providerKey: overrides.providerKey ?? base.providerKey,
    tenantOverrideProviderKey:
        overrides.tenantOverrideProviderKey ?? base.tenantOverrideProviderKey,
    deploymentProfileProviderKey:
        overrides.deploymentProfileProviderKey ?? base.deploymentProfileProviderKey,
    defaultProviderKey: overrides.defaultProviderKey ?? base.defaultProviderKey,
    nativeConfig: overrides.nativeConfig ?? base.nativeConfig,
  );
}

final class RtcDataSource {
  RtcDataSource({
    RtcDataSourceOptions? options,
    RtcDriverManager? driverManager,
  })  : options = options ?? const RtcDataSourceOptions(),
        driverManager = driverManager ?? RtcDriverManager();

  final RtcDataSourceOptions options;
  final RtcDriverManager driverManager;

  RtcProviderMetadata describe([RtcDataSourceOptions? overrides]) {
    return driverManager.getMetadata(
      _mergeOptions(options, overrides),
    );
  }

  RtcProviderSelection describeSelection([RtcDataSourceOptions? overrides]) {
    final merged = _mergeOptions(options, overrides);
    return driverManager.resolveSelection(
      RtcProviderSelectionRequest(
        providerUrl: merged.providerUrl,
        providerKey: merged.providerKey,
        tenantOverrideProviderKey: merged.tenantOverrideProviderKey,
        deploymentProfileProviderKey: merged.deploymentProfileProviderKey,
      ),
      defaultProviderKey: merged.defaultProviderKey,
    );
  }

  RtcProviderSupport describeProviderSupport([RtcDataSourceOptions? overrides]) {
    final selection = describeSelection(overrides);
    return driverManager.describeProviderSupport(selection.providerKey);
  }

  List<RtcProviderSupport> listProviderSupport() {
    return driverManager.listProviderSupport();
  }

  bool supportsCapability(
    String capability, [
    RtcDataSourceOptions? overrides,
  ]) {
    final metadata = describe(overrides);
    return metadata.requiredCapabilities.contains(capability) ||
        metadata.optionalCapabilities.contains(capability);
  }

  bool supportsProviderExtension(
    String extensionKey, [
    RtcDataSourceOptions? overrides,
  ]) {
    return describe(overrides).extensionKeys.contains(extensionKey);
  }

  Future<RtcClient<TNativeClient>> createClient<TNativeClient>([
    RtcDataSourceOptions? overrides,
  ]) async {
    return await driverManager.connect(
          _mergeOptions(options, overrides),
        )
        as RtcClient<TNativeClient>;
  }
}
