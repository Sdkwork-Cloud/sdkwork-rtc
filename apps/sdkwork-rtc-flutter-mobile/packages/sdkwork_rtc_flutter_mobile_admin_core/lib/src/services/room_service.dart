import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/room.dart';

class RoomService {
  final SdkworkBackendClient _client;

  RoomService(this._client);

  Future<List<Room>> list({
    int? page,
    int? limit,
    String? cursor,
    String? search,
    String? sort,
  }) async {
    final response = await _client.rtcRooms.list(
      page,
      limit,
      cursor,
      sort,
      search,
    );
    return backendResponseItems(response).map(Room.fromJson).toList();
  }

  Future<Room> get(String id) async {
    final response = await _client.rtcRooms.retrieve(id);
    return Room.fromJson(
      backendResponseEntity(response, 'Room $id was not found'),
    );
  }
}
