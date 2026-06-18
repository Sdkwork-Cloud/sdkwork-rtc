import '../models/provider_application.dart';
import 'backend_api_client.dart';

class ProviderApplicationService {
  final BackendApiClient _client;

  ProviderApplicationService(this._client);

  Future<List<ProviderApplication>> list(String accountId) async {
    final data = await _client.getJson(
      '/rtc/provider_accounts/$accountId/applications',
    );
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderApplication.fromJson)
        .toList();
  }

  Future<ProviderApplication?> get(String id) async {
    final data = await _client.getJson('/rtc/provider_applications/$id');
    return ProviderApplication.fromJson(data);
  }

  Future<ProviderApplication?> create(
    String accountId,
    ProviderApplicationCommand command,
  ) async {
    final data = await _client.postJson(
      '/rtc/provider_accounts/$accountId/applications',
      command.toJson(),
    );
    return ProviderApplication.fromJson(data);
  }

  Future<ProviderApplication?> update(
    String id,
    ProviderApplicationCommand command,
  ) async {
    final data = await _client.patchJson(
      '/rtc/provider_applications/$id',
      command.toJson(),
    );
    return ProviderApplication.fromJson(data);
  }

  Future<ProviderApplication?> disable(String id, {String? reason}) async {
    final data = await _client.postJson(
      '/rtc/provider_applications/$id/disable',
      {if (reason != null) 'reason': reason},
    );
    return ProviderApplication.fromJson(data);
  }
}
