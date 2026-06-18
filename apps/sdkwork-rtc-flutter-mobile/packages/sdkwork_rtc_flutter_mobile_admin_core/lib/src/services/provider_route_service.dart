import '../models/provider_route.dart';
import 'backend_api_client.dart';

class ProviderRouteService {
  final BackendApiClient _client;

  ProviderRouteService(this._client);

  Future<List<ProviderRoute>> list() async {
    final data = await _client.getJson('/rtc/provider_routes');
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderRoute.fromJson)
        .toList();
  }

  Future<ProviderRoute?> create(ProviderRouteCommand command) async {
    final data = await _client.postJson(
      '/rtc/provider_routes',
      command.toJson(),
    );
    return ProviderRoute.fromJson(data);
  }

  Future<ProviderRoute?> get(String id) async {
    final data = await _client.getJson('/rtc/provider_routes/$id');
    return ProviderRoute.fromJson(data);
  }

  Future<ProviderRoute?> update(String id, ProviderRouteCommand command) async {
    final data = await _client.patchJson(
      '/rtc/provider_routes/$id',
      command.toJson(),
    );
    return ProviderRoute.fromJson(data);
  }

  Future<ProviderRoute?> disable(String id, {String? reason}) async {
    final data = await _client.postJson(
      '/rtc/provider_routes/$id/disable',
      {if (reason != null) 'reason': reason},
    );
    return ProviderRoute.fromJson(data);
  }
}
