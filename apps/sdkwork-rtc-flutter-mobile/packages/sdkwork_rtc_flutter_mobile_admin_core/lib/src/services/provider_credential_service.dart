import '../models/provider_credential.dart';
import 'backend_api_client.dart';

class ProviderCredentialService {
  final BackendApiClient _client;

  ProviderCredentialService(this._client);

  Future<List<ProviderCredential>> list(String applicationId) async {
    final data = await _client.getJson(
      '/rtc/provider_applications/$applicationId/credentials',
    );
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderCredential.fromJson)
        .toList();
  }

  Future<ProviderCredential?> get(String id) async {
    final data = await _client.getJson('/rtc/provider_credentials/$id');
    return ProviderCredential.fromJson(data);
  }

  Future<ProviderCredential?> create(
    String applicationId,
    ProviderCredentialCommand command,
  ) async {
    final data = await _client.postJson(
      '/rtc/provider_applications/$applicationId/credentials',
      command.toJson(),
    );
    return ProviderCredential.fromJson(data);
  }

  Future<ProviderCredential?> update(
    String id,
    ProviderCredentialCommand command,
  ) async {
    final data = await _client.patchJson(
      '/rtc/provider_credentials/$id',
      command.toJson(),
    );
    return ProviderCredential.fromJson(data);
  }

  Future<ProviderCredential?> revoke(String id, {String? reason}) async {
    final data = await _client.postJson(
      '/rtc/provider_credentials/$id/revoke',
      {if (reason != null) 'reason': reason},
    );
    return ProviderCredential.fromJson(data);
  }
}
