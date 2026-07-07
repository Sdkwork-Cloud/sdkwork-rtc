import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/room.dart';

class RoomListResult {
  final List<Room> items;
  final String? nextCursor;

  const RoomListResult({
    required this.items,
    this.nextCursor,
  });
}

class RoomService {
  final SdkworkBackendClient _client;

  RoomService(this._client);

  Future<RoomListResult> list({
    int? page,
    int? limit,
    String? cursor,
    String? search,
    String? sort,
    String? status,
    String? ownerUserId,
    String? createdAfter,
  }) async {
    final response = await _client.rtcRooms.list(
      page,
      limit,
      cursor,
      sort,
      search,
      status,
      ownerUserId,
      createdAfter,
    );
    return RoomListResult(
      items: backendResponseItems(response).map(Room.fromJson).toList(),
      nextCursor: backendResponseNextCursor(response),
    );
  }

  Future<Room> get(String id) async {
    final response = await _client.rtcRooms.retrieve(id);
    return Room.fromJson(
      backendResponseEntity(response, 'Room $id was not found'),
    );
  }
}
