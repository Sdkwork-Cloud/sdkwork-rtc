import '../models/provider_query_jobs.dart';
import 'backend_api_client.dart';

class ProviderQueryJobService {
  final BackendApiClient _client;

  ProviderQueryJobService(this._client);

  Future<ProviderQueryJob> create(ProviderQueryJobCreateCommand command) async {
    final data = await _client.postJson('/rtc/provider_query_jobs', command.toJson());
    return ProviderQueryJob.fromJson(data);
  }

  Future<ProviderQueryJob> get(String id) async {
    final data = await _client.getJson(
      '/rtc/provider_query_jobs/${Uri.encodeComponent(id)}',
    );
    return ProviderQueryJob.fromJson(data);
  }

  Future<List<ProviderQuerySnapshot>> listSnapshots(
    String providerQueryJobId, {
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
      '/rtc/provider_query_jobs/${Uri.encodeComponent(providerQueryJobId)}/snapshots',
      query: query.isEmpty ? null : query,
    );
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderQuerySnapshot.fromJson)
        .toList();
  }
}
