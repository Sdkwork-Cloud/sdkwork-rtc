import '../models/provider_plugin.dart';
import 'backend_api_client.dart';

class ProviderPluginService {
  final BackendApiClient _client;

  ProviderPluginService(this._client);

  Future<List<ProviderPluginDescriptor>> list({
    int? page,
    int? limit,
    String? cursor,
    String? search,
    String? sort,
  }) async {
    final query = <String, String>{};
    if (page != null) query['page'] = page.toString();
    if (limit != null) query['pageSize'] = limit.toString();
    if (cursor != null) query['cursor'] = cursor;
    if (search != null) query['q'] = search;
    if (sort != null) query['sort'] = sort;

    final data = await _client.getJson(
      '/rtc/provider_plugins',
      query: query.isEmpty ? null : query,
    );
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderPluginDescriptor.fromJson)
        .toList();
  }

  Future<ProviderPluginDescriptor> get(String provider) async {
    final data = await _client.getJson(
      '/rtc/provider_plugins/${Uri.encodeComponent(provider)}',
    );
    return ProviderPluginDescriptor.fromJson(data);
  }
}
