import 'package:sdkwork_rtc_app_sdk/sdkwork_rtc_app_sdk.dart'
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
    final envelope = _typedResponseEnvelope(response);
    final page = appSdkEnvelopeListPageFromMap(
      envelope,
      'RTC media session list response missing items',
    );
    return MediaSessionListResult(
      items: page.items.map(RtcMediaSession.fromJson).toList(),
      nextCursor: page.nextCursor,
    );
  }

  Future<RtcMediaSession> get(String mediaSessionId) async {
    final response = await _client.rtcMediaSessions.retrieve(mediaSessionId);
    final envelope = _typedResponseEnvelope(response);
    final entity = appSdkEnvelopeEntityFromMap(
      envelope,
      'RTC media session not found: $mediaSessionId',
    );
    return RtcMediaSession.fromJson(entity);
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
    final envelope = _typedResponseEnvelope(response);
    final entity = appSdkEnvelopeEntityFromMap(
      envelope,
      'RTC media session was not created',
    );
    return RtcMediaSession.fromJson(entity);
  }

  Map<String, dynamic>? _typedResponseEnvelope(dynamic response) {
    if (response == null) {
      return null;
    }
    final dynamic value = response;
    final data = value.data;
    if (data == null) {
      return <String, dynamic>{
        if (value.code != null) 'code': value.code,
        if (value.requestId != null) 'requestId': value.requestId,
      };
    }
    final dataJson = data is Map<String, dynamic>
        ? data
        : data is Map
            ? Map<String, dynamic>.from(data)
            : (data.toJson is Map<String, dynamic> Function()
                ? (data.toJson as Map<String, dynamic> Function())()
                : null);
    if (dataJson == null) {
      return null;
    }
    if (dataJson.containsKey('item') || dataJson.containsKey('items')) {
      return <String, dynamic>{'code': 0, 'data': dataJson};
    }
    return <String, dynamic>{'code': 0, 'data': <String, dynamic>{'item': dataJson}};
  }
}