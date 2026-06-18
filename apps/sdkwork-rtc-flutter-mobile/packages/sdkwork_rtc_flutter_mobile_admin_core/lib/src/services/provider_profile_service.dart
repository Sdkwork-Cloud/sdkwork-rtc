import '../models/provider_profile.dart';
import 'backend_api_client.dart';

class ProviderProfileService {
  final BackendApiClient _client;

  ProviderProfileService(this._client);

  Future<List<ProviderProfile>> list({String? provider}) async {
    final query = <String, String>{};
    if (provider != null) query['provider'] = provider;
    final data = await _client.getJson(
      '/rtc/provider_profiles',
      query: query.isEmpty ? null : query,
    );
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderProfile.fromJson)
        .toList();
  }

  Future<ProviderProfile?> get(String id) async {
    final data = await _client.getJson('/rtc/provider_profiles/$id');
    return ProviderProfile.fromJson(data);
  }

  Future<ProviderProfile?> create(ProviderProfileCommand command) async {
    final data = await _client.postJson(
      '/rtc/provider_profiles',
      command.toJson(),
    );
    return ProviderProfile.fromJson(data);
  }

  Future<ProviderProfile?> update(String id, ProviderProfileCommand command) async {
    final data = await _client.patchJson(
      '/rtc/provider_profiles/$id',
      command.toJson(),
    );
    return ProviderProfile.fromJson(data);
  }

  Future<ProviderProfile?> disable(String id, {String? reason}) async {
    final data = await _client.postJson(
      '/rtc/provider_profiles/$id/disable',
      {if (reason != null) 'reason': reason},
    );
    return ProviderProfile.fromJson(data);
  }

  Future<Map<String, dynamic>?> verify(
    String id,
    String queryKind, {
    int? timeoutMs,
  }) async {
    return _client.postJson(
      '/rtc/provider_profiles/$id/verify',
      {
        'queryKind': queryKind,
        if (timeoutMs != null) 'timeoutMs': timeoutMs,
      },
    );
  }

  Future<ProviderProfile?> configureCapabilities(
    String id,
    List<String> enabledCapabilities,
    List<String> disabledCapabilities,
  ) async {
    final data = await _client.postJson(
      '/rtc/provider_profiles/$id/capabilities',
      {
        'enabledCapabilities': enabledCapabilities,
        'disabledCapabilities': disabledCapabilities,
      },
    );
    return ProviderProfile.fromJson(data);
  }
}
