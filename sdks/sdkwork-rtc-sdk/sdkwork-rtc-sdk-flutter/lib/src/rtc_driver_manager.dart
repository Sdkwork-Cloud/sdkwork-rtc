import 'rtc_errors.dart';
import 'rtc_provider_activation_catalog.dart';
import 'rtc_provider_catalog.dart';
import 'rtc_provider_metadata.dart';
import 'rtc_provider_selection.dart';
import 'rtc_provider_support.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';
import 'providers/volcengine.dart';

final class RtcDriverManager {
  RtcDriverManager({
    this.defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    Iterable<RtcProviderDriver<dynamic>> drivers =
        const <RtcProviderDriver<dynamic>>[],
    bool registerDefaultDrivers = true,
  }) {
    if (registerDefaultDrivers) {
      register(createVolcengineRtcDriver());
    }

    registerAll(drivers);
  }

  final String defaultProviderKey;
  final Map<String, RtcProviderDriver<dynamic>> _drivers =
      <String, RtcProviderDriver<dynamic>>{};

  RtcProviderSelection resolveSelection(
    RtcProviderSelectionRequest request, {
    String? defaultProviderKey,
  }) {
    return resolveRtcProviderSelection(
      request,
      defaultProviderKey: defaultProviderKey ?? this.defaultProviderKey,
    );
  }

  RtcProviderMetadata getMetadata([
    RtcClientConfig config = const RtcClientConfig(),
  ]) {
    final selection = _resolveClientSelection(config);
    final catalogEntry = getRtcProviderByProviderKey(selection.providerKey);
    final driver = _drivers[selection.providerKey];
    if (driver != null) {
      return driver.metadata;
    }

    final officialMetadata =
        catalogEntry == null
            ? null
            : getOfficialRtcProviderMetadataByKey(catalogEntry.providerKey);
    if (officialMetadata != null) {
      return officialMetadata;
    }

    throw RtcSdkException(
      code: 'driver_not_found',
      message: 'No RTC driver registered for provider: ${selection.providerKey}',
      providerKey: selection.providerKey,
    );
  }

  RtcProviderMetadata getDefaultMetadata() {
    return getMetadata(
      RtcClientConfig(defaultProviderKey: defaultProviderKey),
    );
  }

  void register<TNativeClient>(RtcProviderDriver<TNativeClient> driver) {
    _assertCanRegister(driver);
    _drivers[driver.metadata.providerKey] = driver;
  }

  void registerAll(Iterable<RtcProviderDriver<dynamic>> drivers) {
    final plannedProviderKeys = <String>{};

    for (final driver in drivers) {
      _assertCanRegister(
        driver,
        plannedProviderKeys: plannedProviderKeys,
      );
      plannedProviderKeys.add(driver.metadata.providerKey);
    }

    for (final driver in drivers) {
      _drivers[driver.metadata.providerKey] = driver;
    }
  }

  bool hasDriver(String providerKey) => _drivers.containsKey(providerKey);

  RtcProviderDriver<dynamic> resolveDriver(String providerKey) {
    final driver = _drivers[providerKey];
    if (driver != null) {
      return driver;
    }

    throw RtcSdkException(
      code: 'driver_not_found',
      message: 'No RTC driver registered for provider: $providerKey',
      providerKey: providerKey,
    );
  }

  RtcProviderSupport describeProviderSupport(String providerKey) {
    final catalogEntry = getRtcProviderByProviderKey(providerKey);
    final activationEntry = getRtcProviderActivationByProviderKey(providerKey);
    final registered = _drivers.containsKey(providerKey);

    return createRtcProviderSupportState(
      RtcProviderSupportStateRequest(
        providerKey: providerKey,
        builtin: activationEntry?.builtin ?? false,
        official: catalogEntry != null && activationEntry != null,
        registered: registered,
      ),
    );
  }

  List<RtcProviderSupport> listProviderSupport() {
    return RtcProviderCatalog.entries
        .map((entry) => describeProviderSupport(entry.providerKey))
        .toList(growable: false);
  }

  Future<RtcClient<dynamic>> connect([
    RtcClientConfig config = const RtcClientConfig(),
  ]) async {
    final selection = _resolveClientSelection(config);
    final driver = _drivers[selection.providerKey];

    if (driver == null) {
      final catalogEntry = getRtcProviderByProviderKey(selection.providerKey);
      final activationEntry = getRtcProviderActivationByProviderKey(
        selection.providerKey,
      );

      if (catalogEntry != null && activationEntry != null) {
        throw RtcSdkException(
          code: 'provider_not_supported',
          message: 'RTC provider is officially defined but not registered in this runtime: ${selection.providerKey}',
          providerKey: selection.providerKey,
        );
      }

      throw RtcSdkException(
        code: 'driver_not_found',
        message: 'No RTC driver registered for provider: ${selection.providerKey}',
        providerKey: selection.providerKey,
      );
    }

    return driver.connect(
      RtcResolvedClientConfig(
        providerUrl: config.providerUrl,
        providerKey: selection.providerKey,
        tenantOverrideProviderKey: config.tenantOverrideProviderKey,
        deploymentProfileProviderKey: config.deploymentProfileProviderKey,
        defaultProviderKey: config.defaultProviderKey ?? defaultProviderKey,
        nativeConfig: config.nativeConfig,
        selectionSource: selection.source,
      ),
    );
  }

  RtcProviderSelection _resolveClientSelection(RtcClientConfig config) {
    return resolveSelection(
      RtcProviderSelectionRequest(
        providerUrl: config.providerUrl,
        providerKey: config.providerKey,
        tenantOverrideProviderKey: config.tenantOverrideProviderKey,
        deploymentProfileProviderKey: config.deploymentProfileProviderKey,
      ),
      defaultProviderKey: config.defaultProviderKey,
    );
  }

  void _assertCanRegister(
    RtcProviderDriver<dynamic> driver, {
    Set<String> plannedProviderKeys = const <String>{},
  }) {
    final providerKey = driver.metadata.providerKey;
    final catalogEntry = getRtcProviderByProviderKey(providerKey);
    final activationEntry = getRtcProviderActivationByProviderKey(providerKey);
    final officialMetadata = getOfficialRtcProviderMetadataByKey(providerKey);

    if (
      catalogEntry == null ||
      activationEntry == null ||
      officialMetadata == null
    ) {
      throw RtcSdkException(
        code: 'provider_not_official',
        message: 'RTC driver registration requires an official provider catalog entry: $providerKey',
        providerKey: providerKey,
        pluginId: driver.metadata.pluginId,
      );
    }

    if (!_sameProviderMetadata(driver.metadata, officialMetadata)) {
      throw RtcSdkException(
        code: 'provider_metadata_mismatch',
        message: 'RTC driver metadata must match the official provider catalog: $providerKey',
        providerKey: providerKey,
        pluginId: driver.metadata.pluginId,
        details: <String, Object?>{
          'expectedMetadata': officialMetadata.toDebugMap(),
          'receivedMetadata': driver.metadata.toDebugMap(),
        },
      );
    }

    if (_drivers.containsKey(providerKey) || plannedProviderKeys.contains(providerKey)) {
      throw RtcSdkException(
        code: 'driver_already_registered',
        message: 'RTC driver already registered for provider: $providerKey',
        providerKey: providerKey,
        pluginId: driver.metadata.pluginId,
      );
    }
  }

  bool _sameProviderMetadata(
    RtcProviderMetadata actual,
    RtcProviderMetadata expected,
  ) {
    return actual.providerKey == expected.providerKey &&
        actual.pluginId == expected.pluginId &&
        actual.driverId == expected.driverId &&
        actual.displayName == expected.displayName &&
        actual.defaultSelected == expected.defaultSelected &&
        _sameStringList(actual.requiredCapabilities, expected.requiredCapabilities) &&
        _sameStringList(actual.optionalCapabilities, expected.optionalCapabilities) &&
        _sameStringList(actual.extensionKeys, expected.extensionKeys);
  }

  bool _sameStringList(List<String> actual, List<String> expected) {
    if (actual.length != expected.length) {
      return false;
    }

    for (var index = 0; index < actual.length; index += 1) {
      if (actual[index] != expected[index]) {
        return false;
      }
    }

    return true;
  }
}
