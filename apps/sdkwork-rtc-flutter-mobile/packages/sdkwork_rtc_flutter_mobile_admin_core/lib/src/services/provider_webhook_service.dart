import '../models/provider_webhook_event.dart';
import 'backend_api_client.dart';

class ProviderWebhookService {
  final BackendApiClient _client;

  ProviderWebhookService(this._client);

  Future<List<ProviderWebhookEvent>> listEvents({
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
      '/rtc/provider_webhooks/events',
      query: query.isEmpty ? null : query,
    );
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderWebhookEvent.fromJson)
        .toList();
  }
}
