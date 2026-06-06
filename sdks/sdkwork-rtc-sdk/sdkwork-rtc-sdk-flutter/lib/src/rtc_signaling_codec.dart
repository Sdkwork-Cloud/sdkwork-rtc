import 'dart:convert';

import 'rtc_call_types.dart';
import 'rtc_errors.dart';
import 'rtc_signaling_message.dart';
import 'rtc_signaling_protocol.dart';

RtcCallSessionRecord toRtcCallSessionRecord(
  RtcSignalingSessionRecord? session,
) {
  final resolvedSession = _requireValue(
    session,
    message: 'RTC signaling session response is empty.',
  );

  return RtcCallSessionRecord(
    rtcSessionId: _requireString(
      resolvedSession.rtcSessionId,
      message: 'RTC signaling session is missing rtcSessionId.',
    ),
    conversationId: resolvedSession.conversationId,
    rtcMode: resolvedSession.rtcMode,
    state: _toCallState(
      resolvedSession.state,
      message: 'RTC signaling session is missing state.',
    ),
    signalingStreamId: resolvedSession.signalingStreamId,
    initiatorId: resolvedSession.initiatorId,
    providerPluginId: resolvedSession.providerPluginId,
    providerSessionId: resolvedSession.providerSessionId,
    accessEndpoint: resolvedSession.accessEndpoint,
    providerRegion: resolvedSession.providerRegion,
    startedAt: resolvedSession.startedAt,
    endedAt: resolvedSession.endedAt,
  );
}

RtcCallParticipantCredential toRtcCallParticipantCredential(
  RtcSignalingParticipantCredential? credential,
) {
  final resolvedCredential = _requireValue(
    credential,
    message: 'RTC signaling participant credential response is empty.',
  );

  return RtcCallParticipantCredential(
    rtcSessionId: _requireString(
      resolvedCredential.rtcSessionId,
      message: 'RTC signaling participant credential is missing rtcSessionId.',
    ),
    participantId: _requireString(
      resolvedCredential.participantId,
      message: 'RTC signaling participant credential is missing participantId.',
    ),
    credential: _requireString(
      resolvedCredential.credential,
      message: 'RTC signaling participant credential is missing credential.',
    ),
    expiresAt: resolvedCredential.expiresAt,
  );
}

RtcCallSignal toRtcCallSignal(RtcSignalingSignalEvent? signalEvent) {
  final resolvedSignal = _requireValue(
    signalEvent,
    message: 'RTC signaling signal response is empty.',
  );

  final rawPayload = resolvedSignal.rawPayload ?? _stringifyPayload(resolvedSignal.payload);
  return RtcCallSignal(
    rtcSessionId: _requireString(
      resolvedSignal.rtcSessionId,
      message: 'RTC signaling signal is missing rtcSessionId.',
    ),
    conversationId: resolvedSignal.conversationId,
    rtcMode: resolvedSignal.rtcMode,
    signalType: _requireString(
      resolvedSignal.signalType,
      message: 'RTC signaling signal is missing signalType.',
    ),
    payload: _decodePayload(rawPayload, fallback: resolvedSignal.payload),
    rawPayload: rawPayload,
    senderId: resolvedSignal.senderId,
    signalingStreamId: resolvedSignal.signalingStreamId,
    occurredAt: resolvedSignal.occurredAt,
  );
}

RtcCallSignal? toRtcCallSignalFromRealtimeEvent(
  RtcSignalingRealtimeEvent event,
) {
  final signalEvent = event.signal;
  if (signalEvent != null) {
    return toRtcCallSignal(signalEvent);
  }

  final payload = event.payload;
  if (payload == null || payload.isEmpty) {
    return null;
  }

  try {
    final decodedPayload = jsonDecode(payload);
    if (decodedPayload is! Map) {
      return null;
    }

    return toRtcCallSignal(
      RtcSignalingSignalEvent.fromJson(decodedPayload.cast<String, dynamic>()),
    );
  } catch (_) {
    return null;
  }
}

RtcConversationSignalMessage? toRtcConversationSignalMessageFromRealtimeEvent(
  RtcSignalingRealtimeEvent event,
) {
  if (event.scopeType != 'conversation' ||
      event.scopeId == null ||
      !(event.eventType?.startsWith('message.') ?? false)) {
    return null;
  }

  final message = event.conversationMessage;
  if (message != null) {
    return toRtcConversationSignalMessage(
      message,
      conversationId: event.scopeId!,
      occurredAt: event.occurredAt,
    );
  }

  final payload = event.payload;
  if (payload == null || payload.isEmpty) {
    return null;
  }

  try {
    final decodedPayload = jsonDecode(payload);
    if (decodedPayload is! Map) {
      return null;
    }

    return toRtcConversationSignalMessage(
      decodedPayload.cast<String, dynamic>(),
      conversationId: event.scopeId!,
      occurredAt: event.occurredAt,
    );
  } catch (_) {
    return null;
  }
}

RtcConversationSignalMessage? toRtcConversationSignalMessage(
  Object? value, {
  String? conversationId,
  String? occurredAt,
}) {
  final decoded = _asMap(value);
  final type = _stringValue(decoded['type']);
  if (type != null && type != 'signal') {
    return null;
  }

  final content = _asMap(decoded['content']);
  final source = content.isEmpty ? decoded : content;
  final signalType = _stringValue(source['signalType']);
  if (signalType == null || signalType.isEmpty) {
    return null;
  }

  final rawPayload = _stringValue(source['rawPayload']) ??
      _stringValue(source['payload']) ??
      _stringifyPayload(source['payload']);
  return RtcConversationSignalMessage(
    conversationId:
        _stringValue(decoded['conversationId']) ?? conversationId ?? '',
    signalType: signalType,
    payload: _decodePayload(rawPayload, fallback: source['payload']),
    rawPayload: rawPayload,
    schemaRef: _stringValue(source['schemaRef']),
    occurredAt: _stringValue(decoded['occurredAt']) ?? occurredAt,
  );
}

RtcCallState _toCallState(
  String? value, {
  required String message,
}) {
  switch (value) {
    case 'started':
      return RtcCallState.started;
    case 'accepted':
      return RtcCallState.accepted;
    case 'connected':
      return RtcCallState.connected;
    case 'rejected':
      return RtcCallState.rejected;
    case 'ended':
      return RtcCallState.ended;
    case 'idle':
      return RtcCallState.idle;
    default:
      throw RtcSdkException(
        code: 'vendor_error',
        message: message,
        details: <String, Object?>{
          'state': value,
        },
      );
  }
}

T _requireValue<T>(
  T? value, {
  required String message,
}) {
  if (value != null) {
    return value;
  }

  throw RtcSdkException(
    code: 'vendor_error',
    message: message,
  );
}

String _requireString(
  String? value, {
  required String message,
}) {
  if (value != null && value.isNotEmpty) {
    return value;
  }

  throw RtcSdkException(
    code: 'vendor_error',
    message: message,
  );
}

Object? _decodePayload(String rawPayload, {Object? fallback}) {
  if (rawPayload.isEmpty) {
    return fallback;
  }

  try {
    return jsonDecode(rawPayload);
  } catch (_) {
    return fallback ?? rawPayload;
  }
}

String _stringifyPayload(Object? payload) {
  if (payload == null) {
    return '';
  }

  if (payload is String) {
    return payload;
  }

  try {
    return jsonEncode(payload);
  } catch (_) {
    return payload.toString();
  }
}

Map<String, dynamic> _asMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return value.map(
      (key, item) => MapEntry(key.toString(), item),
    );
  }

  return <String, dynamic>{};
}

String? _stringValue(Object? value) {
  if (value == null) {
    return null;
  }

  final resolved = value.toString();
  return resolved.isEmpty ? null : resolved;
}
