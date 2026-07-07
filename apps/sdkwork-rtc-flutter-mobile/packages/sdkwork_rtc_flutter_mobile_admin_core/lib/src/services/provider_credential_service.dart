import 'package:sdkwork_rtc_backend_sdk/sdkwork_rtc_backend_sdk.dart'
    as generated;

import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_credential.dart';

class ProviderCredentialService {
  final SdkworkBackendClient _client;

  ProviderCredentialService(this._client);

  Future<List<ProviderCredential>> list(String applicationId) async {
    final response = await _client.rtcProviderCredentials
        .rtcProviderApplicationsCredentialsList(applicationId);
    return backendResponseItems(response)
        .map(ProviderCredential.fromJson)
        .toList();
  }

  Future<ProviderCredential?> get(String id) async {
    final response = await _client.rtcProviderCredentials.retrieve(id);
    final data = backendResponseData(response);
    return data == null ? null : ProviderCredential.fromJson(data);
  }

  Future<ProviderCredential?> create(
    String applicationId,
    ProviderCredentialCommand command,
  ) async {
    final response = await _client.rtcProviderCredentials
        .rtcProviderApplicationsCredentialsCreate(
      applicationId,
      generated.RtcProviderCredentialCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderCredential.fromJson(data);
  }

  Future<ProviderCredential?> update(
    String id,
    ProviderCredentialCommand command,
  ) async {
    final response = await _client.rtcProviderCredentials.update(
      id,
      generated.RtcProviderCredentialCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderCredential.fromJson(data);
  }

  Future<ProviderCredential?> revoke(String id, {String? reason}) async {
    final response = await _client.rtcProviderCredentials.revoke(
      id,
      generated.RtcProviderCredentialRevokeRequest(reason: reason),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderCredential.fromJson(data);
  }
}
