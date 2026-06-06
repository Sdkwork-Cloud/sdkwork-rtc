import 'dart:async';

import 'rtc_client.dart';
import 'rtc_provider_selection.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';

typedef RtcNativeFactory<TNativeClient> = FutureOr<TNativeClient> Function(
  RtcResolvedClientConfig config,
);

RtcProviderDriver<TNativeClient> createRtcProviderDriver<TNativeClient>({
  required RtcProviderMetadata metadata,
  RtcNativeFactory<TNativeClient>? nativeFactory,
  RtcRuntimeController<TNativeClient>? runtimeController,
}) {
  return _StandardRtcProviderDriver<TNativeClient>(
    metadata: metadata,
    nativeFactory: nativeFactory,
    runtimeController: runtimeController,
  );
}

final class _StandardRtcProviderDriver<TNativeClient>
    implements RtcProviderDriver<TNativeClient> {
  _StandardRtcProviderDriver({
    required this.metadata,
    this.nativeFactory,
    this.runtimeController,
  });

  @override
  final RtcProviderMetadata metadata;

  final RtcNativeFactory<TNativeClient>? nativeFactory;
  final RtcRuntimeController<TNativeClient>? runtimeController;

  @override
  Future<RtcClient<TNativeClient>> connect(RtcResolvedClientConfig config) async {
    final resolvedNativeClient = await (nativeFactory?.call(config) ??
        ({
          'providerKey': metadata.providerKey,
          'driverId': metadata.driverId,
          'nativeConfig': config.nativeConfig,
        } as Object?) as TNativeClient);

    return StandardRtcClient<TNativeClient>(
      metadata: metadata,
      selection: RtcProviderSelection(
        providerKey: config.providerKey!,
        source: config.selectionSource,
      ),
      nativeClient: resolvedNativeClient,
      runtimeController: runtimeController,
    );
  }
}
