import 'package:sdkwork_rtc_app_sdk_generated_dart/sdkwork_rtc_app_sdk_generated_dart.dart'
    as generated;
import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

import '../models/media_session.dart';
import 'rtc_command_idempotency.dart';

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
  final SdkworkAppClient _client;

  MediaSessionService(this._client);

  Future<MediaSessionListResult> list([MediaSessionListParams? params]) async {
    final response = await _client.rtcMediaSessions.list(
      params?.page,
      params?.pageSize,
      params?.cursor,
      params?.sort,
      params?.search,
    );
    final data = response?.data;
    final rawItems = data is Map<String, dynamic> ? data['items'] : null;
    final sessions = rawItems is List<dynamic>
        ? rawItems
            .whereType<Map<String, dynamic>>()
            .map(_mapGeneratedMediaSession)
            .toList()
        : <RtcMediaSession>[];
    final nextCursor = data is Map<String, dynamic> ? data['nextCursor'] as String? : null;
    return MediaSessionListResult(
      items: sessions,
      nextCursor: nextCursor != null && nextCursor.isNotEmpty ? nextCursor : null,
    );
  }

  Future<RtcMediaSession> get(String mediaSessionId) async {
    final response = await _client.rtcMediaSessions.retrieve(mediaSessionId);
    final session = response?.data;
    if (session == null) {
      throw StateError('RTC media session not found: $mediaSessionId');
    }
    return _mapGeneratedMediaSession(session.toJson());
  }

  Future<RtcMediaSession> create(
    RtcCreateMediaSessionRequest body, {
    String? idempotencyKey,
  }) async {
    final response = await _client.rtcMediaSessions.create(
      generated.RtcCreateMediaSessionRequest(
        roomId: body.roomId,
        mediaMode: body.mediaMode,
        providerProfileId: body.providerProfileId,
        provider: body.provider,
      ),
      idempotencyKey ??
          createRtcCommandIdempotencyKey('media-session-create'),
    );
    final session = response?.data;
    if (session == null) {
      throw StateError('RTC media session was not created');
    }
    return _mapGeneratedMediaSession(session.toJson());
  }

  RtcMediaSession _mapGeneratedMediaSession(Map<String, dynamic> json) {
    return RtcMediaSession.fromJson(json);
  }
}
