import '../models/room.dart';
import 'backend_api_client.dart';

class RoomService {
  final BackendApiClient _client;

  RoomService(this._client);

  Future<List<Room>> list({
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
      '/rtc/rooms',
      query: query.isEmpty ? null : query,
    );
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items.whereType<Map<String, dynamic>>().map(Room.fromJson).toList();
  }

  Future<Room> get(String id) async {
    final data = await _client.getJson('/rtc/rooms/${Uri.encodeComponent(id)}');
    return Room.fromJson(data);
  }
}
