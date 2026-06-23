import 'package:sdkwork_rtc_backend_sdk_generated_dart/sdkwork_rtc_backend_sdk_generated_dart.dart'
    as generated;

import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_profile.dart';

class ProviderProfileService {
  final SdkworkBackendClient _client;

  ProviderProfileService(this._client);

  Future<List<ProviderProfile>> list({String? provider}) async {
    final response = await _client.rtcProviderProfiles.list(
      null,
      null,
      null,
      null,
      provider,
    );
    return backendResponseItems(response)
        .map(ProviderProfile.fromJson)
        .toList();
  }

  Future<ProviderProfile?> get(String id) async {
    final response = await _client.rtcProviderProfiles.retrieve(id);
    final data = backendResponseData(response);
    return data == null ? null : ProviderProfile.fromJson(data);
  }

  Future<ProviderProfile?> create(ProviderProfileCommand command) async {
    final response = await _client.rtcProviderProfiles.create(
      generated.RtcProviderProfileCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderProfile.fromJson(data);
  }

  Future<ProviderProfile?> update(
    String id,
    ProviderProfileCommand command,
  ) async {
    final response = await _client.rtcProviderProfiles.update(
      id,
      generated.RtcProviderProfileCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderProfile.fromJson(data);
  }

  Future<ProviderProfile?> disable(String id, {String? reason}) async {
    final response = await _client.rtcProviderProfiles.disable(
      id,
      generated.RtcProviderProfileDisableRequest(reason: reason),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderProfile.fromJson(data);
  }

  Future<Map<String, dynamic>?> verify(
    String id,
    String queryKind, {
    int? timeoutMs,
  }) async {
    final response = await _client.rtcProviderProfiles.verify(
      id,
      generated.RtcProviderProfileVerifyRequest(
        queryKind: queryKind,
        timeoutMs: timeoutMs,
      ),
    );
    return backendResponseData(response);
  }

  Future<ProviderProfile?> configureCapabilities(
    String id,
    List<String> enabledCapabilities,
    List<String> disabledCapabilities,
  ) async {
    await _client.rtcProviderProfiles.capabilitiesConfigure(
      id,
      {
        'enabledCapabilities': enabledCapabilities,
        'disabledCapabilities': disabledCapabilities,
      },
    );
    return get(id);
  }
}
