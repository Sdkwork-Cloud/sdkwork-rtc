import '../rtc_driver.dart';
import '../rtc_errors.dart';
import '../rtc_provider_metadata.dart';
import '../rtc_standard_contract.dart';
import '../rtc_types.dart';
import '../volcengine_official_flutter.dart';

RtcProviderMetadata get volcengineRtcProviderMetadata {
  final metadata = getOfficialRtcProviderMetadataByKey('volcengine');
  if (metadata != null) {
    return metadata;
  }

  throw const RtcSdkException(
    code: 'vendor_error',
    message: 'Volcengine provider metadata is missing from the official RTC catalog.',
  );
}

RtcProviderDriver<TNativeClient> createVolcengineRtcDriver<TNativeClient>({
  RtcNativeFactory<TNativeClient>? nativeFactory,
  RtcRuntimeController<TNativeClient>? runtimeController,
  RtcVolcengineFlutterEngineFactory? engineFactory,
}) {
  if (nativeFactory == null && runtimeController == null) {
    return createOfficialVolcengineFlutterRtcDriver(
      engineFactory: engineFactory,
    ) as RtcProviderDriver<TNativeClient>;
  }

  return createRtcProviderDriver<TNativeClient>(
    metadata: volcengineRtcProviderMetadata,
    nativeFactory: nativeFactory,
    runtimeController: runtimeController,
  );
}
