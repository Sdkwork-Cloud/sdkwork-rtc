import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

import '../models/media_session.dart';

class MediaSessionListParams {
  final int? page;
  final int? pageSize;
  final String? cursor;
  final String? search;
  final String? sort;

  const MediaSessionListParams({
    this.page,
    this.pageSize,
    this.cursor,
    this.search,
    this.sort,
  });
}

class MediaSessionListResult {
  final List<RtcMediaSession> items;
  final String? nextCursor;

  const MediaSessionListResult({
    required this.items,
    this.nextCursor,
  });
}

class MediaSessionService {
  final AppApiClient _client;

  MediaSessionService(this._client);

  Future<MediaSessionListResult> list([MediaSessionListParams? params]) async {
    final query = <String, String>{};
    if (params?.page != null) query['page'] = params!.page.toString();
    if (params?.pageSize != null) query['pageSize'] = params!.pageSize.toString();
    if (params?.cursor != null) query['cursor'] = params!.cursor!;
    if (params?.search != null) query['q'] = params!.search!;
    if (params?.sort != null) query['sort'] = params!.sort!;

    final data = await _client.getJson(
      '/rtc/media_sessions',
      query: query.isEmpty ? null : query,
    );
    final items = data['items'];
    final sessions = items is List<dynamic>
        ? items
            .whereType<Map<String, dynamic>>()
            .map(RtcMediaSession.fromJson)
            .toList()
        : <RtcMediaSession>[];
    final nextCursor = data['nextCursor'] as String?;
    return MediaSessionListResult(
      items: sessions,
      nextCursor: nextCursor != null && nextCursor.isNotEmpty ? nextCursor : null,
    );
  }

  Future<RtcMediaSession> get(String mediaSessionId) async {
    final data = await _client.getJson(
      '/rtc/media_sessions/${Uri.encodeComponent(mediaSessionId)}',
    );
    return RtcMediaSession.fromJson(data);
  }

  Future<RtcMediaSession> create(RtcCreateMediaSessionRequest body) async {
    final data = await _client.postJson('/rtc/media_sessions', body.toJson());
    return RtcMediaSession.fromJson(data);
  }
}
