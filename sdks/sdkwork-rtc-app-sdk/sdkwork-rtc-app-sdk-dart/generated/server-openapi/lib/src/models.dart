Map<String, dynamic>? _sdkworkAsMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return null;
}

List<dynamic>? _sdkworkAsList(dynamic value) {
  return value is List ? value : null;
}

class SdkWorkApiResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  SdkWorkApiResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory SdkWorkApiResponse.fromJson(Map<String, dynamic> json) {
    return SdkWorkApiResponse(
      code: json['code'] is int ? json['code'] : null,
      data: json['data'],
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class ProblemDetail {
  final String? type;
  final String? title;
  final int? status;
  final String? detail;
  final String? instance;
  final int? code;
  final String? traceId;
  final String? i18nKey;
  final String? locale;
  final List<FieldError>? errors;

  ProblemDetail({
    this.type,
    this.title,
    this.status,
    this.detail,
    this.instance,
    this.code,
    this.traceId,
    this.i18nKey,
    this.locale,
    this.errors
  });

  factory ProblemDetail.fromJson(Map<String, dynamic> json) {
    return ProblemDetail(
      type: json['type']?.toString(),
      title: json['title']?.toString(),
      status: json['status'] is int ? json['status'] : null,
      detail: json['detail']?.toString(),
      instance: json['instance']?.toString(),
      code: json['code'] is int ? json['code'] : null,
      traceId: json['traceId']?.toString(),
      i18nKey: json['i18nKey']?.toString(),
      locale: json['locale']?.toString(),
      errors: (() {
        final list = _sdkworkAsList(json['errors']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => (() {
        final map = _sdkworkAsMap(item);
        return map == null ? null : FieldError.fromJson(map);
      })())
            .whereType<FieldError>()
            .toList();
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'type': type,
      'title': title,
      'status': status,
      'detail': detail,
      'instance': instance,
      'code': code,
      'traceId': traceId,
      'i18nKey': i18nKey,
      'locale': locale,
      'errors': errors?.map((item) => item.toJson()).toList(),
    };
  }
}

class FieldError {
  final String? field;
  final String? message;
  final int? code;
  final String? i18nKey;
  final Map<String, dynamic>? params;

  FieldError({
    this.field,
    this.message,
    this.code,
    this.i18nKey,
    this.params
  });

  factory FieldError.fromJson(Map<String, dynamic> json) {
    return FieldError(
      field: json['field']?.toString(),
      message: json['message']?.toString(),
      code: json['code'] is int ? json['code'] : null,
      i18nKey: json['i18nKey']?.toString(),
      params: (() {
        final map = _sdkworkAsMap(json['params']);
        if (map == null) {
          return null;
        }
        final result = <String, String>{};
        map.forEach((key, item) {
          final deserialized = item?.toString();
          if (deserialized is String) {
            result[key] = deserialized;
          }
        });
        return result;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'field': field,
      'message': message,
      'code': code,
      'i18nKey': i18nKey,
      'params': params?.map((key, item) => MapEntry(key, item)),
    };
  }
}

class MediaChecksum {
  final String? algorithm;
  final String? value;

  MediaChecksum({
    this.algorithm,
    this.value
  });

  factory MediaChecksum.fromJson(Map<String, dynamic> json) {
    return MediaChecksum(
      algorithm: json['algorithm']?.toString(),
      value: json['value']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'algorithm': algorithm,
      'value': value,
    };
  }
}

class MediaAccess {
  final String? visibility;
  final String? expiresAt;

  MediaAccess({
    this.visibility,
    this.expiresAt
  });

  factory MediaAccess.fromJson(Map<String, dynamic> json) {
    return MediaAccess(
      visibility: json['visibility']?.toString(),
      expiresAt: json['expiresAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'visibility': visibility,
      'expiresAt': expiresAt,
    };
  }
}

class MediaResource {
  final String? id;
  final String? kind;
  final String? source;
  final String? url;
  final String? publicUrl;
  final String? uri;
  final String? objectBlobId;
  final String? fileName;
  final String? mimeType;
  final String? sizeBytes;
  final MediaChecksum? checksum;
  final int? width;
  final int? height;
  final double? durationSeconds;
  final String? altText;
  final String? title;
  final MediaAccess? access;
  final Map<String, dynamic>? metadata;

  MediaResource({
    this.id,
    this.kind,
    this.source,
    this.url,
    this.publicUrl,
    this.uri,
    this.objectBlobId,
    this.fileName,
    this.mimeType,
    this.sizeBytes,
    this.checksum,
    this.width,
    this.height,
    this.durationSeconds,
    this.altText,
    this.title,
    this.access,
    this.metadata
  });

  factory MediaResource.fromJson(Map<String, dynamic> json) {
    return MediaResource(
      id: json['id']?.toString(),
      kind: json['kind']?.toString(),
      source: json['source']?.toString(),
      url: json['url']?.toString(),
      publicUrl: json['publicUrl']?.toString(),
      uri: json['uri']?.toString(),
      objectBlobId: json['objectBlobId']?.toString(),
      fileName: json['fileName']?.toString(),
      mimeType: json['mimeType']?.toString(),
      sizeBytes: json['sizeBytes']?.toString(),
      checksum: (() {
        final map = _sdkworkAsMap(json['checksum']);
        return map == null ? null : MediaChecksum.fromJson(map);
      })(),
      width: json['width'] is int ? json['width'] : null,
      height: json['height'] is int ? json['height'] : null,
      durationSeconds: json['durationSeconds'] is num ? json['durationSeconds'].toDouble() : null,
      altText: json['altText']?.toString(),
      title: json['title']?.toString(),
      access: (() {
        final map = _sdkworkAsMap(json['access']);
        return map == null ? null : MediaAccess.fromJson(map);
      })(),
      metadata: _sdkworkAsMap(json['metadata'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'kind': kind,
      'source': source,
      'url': url,
      'publicUrl': publicUrl,
      'uri': uri,
      'objectBlobId': objectBlobId,
      'fileName': fileName,
      'mimeType': mimeType,
      'sizeBytes': sizeBytes,
      'checksum': checksum?.toJson(),
      'width': width,
      'height': height,
      'durationSeconds': durationSeconds,
      'altText': altText,
      'title': title,
      'access': access?.toJson(),
      'metadata': metadata,
    };
  }
}

class RtcDriveReference {
  final String? driveUri;
  final String? spaceId;
  final String? spaceType;
  final String? nodeId;
  final String? nodeVersion;

  RtcDriveReference({
    this.driveUri,
    this.spaceId,
    this.spaceType,
    this.nodeId,
    this.nodeVersion
  });

  factory RtcDriveReference.fromJson(Map<String, dynamic> json) {
    return RtcDriveReference(
      driveUri: json['driveUri']?.toString(),
      spaceId: json['spaceId']?.toString(),
      spaceType: json['spaceType']?.toString(),
      nodeId: json['nodeId']?.toString(),
      nodeVersion: json['nodeVersion']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'driveUri': driveUri,
      'spaceId': spaceId,
      'spaceType': spaceType,
      'nodeId': nodeId,
      'nodeVersion': nodeVersion,
    };
  }
}

class RtcRoom {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? ownerUserId;
  final String? title;
  final String? status;

  RtcRoom({
    this.id,
    this.tenantId,
    this.organizationId,
    this.ownerUserId,
    this.title,
    this.status
  });

  factory RtcRoom.fromJson(Map<String, dynamic> json) {
    return RtcRoom(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      ownerUserId: json['ownerUserId']?.toString(),
      title: json['title']?.toString(),
      status: json['status']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'ownerUserId': ownerUserId,
      'title': title,
      'status': status,
    };
  }
}

class RtcRoomListResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  RtcRoomListResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory RtcRoomListResponse.fromJson(Map<String, dynamic> json) {
    return RtcRoomListResponse(
      code: json['code'] is int ? json['code'] : null,
      data: _sdkworkAsMap(json['data']),
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class RtcRoomResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  RtcRoomResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory RtcRoomResponse.fromJson(Map<String, dynamic> json) {
    return RtcRoomResponse(
      code: json['code'] is int ? json['code'] : null,
      data: _sdkworkAsMap(json['data']),
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class RtcCreateMediaSessionRequest {
  final String? roomId;
  final String? mediaMode;
  final String? providerProfileId;
  final String? provider;
  final String? region;
  final bool? recordingRequested;
  final Map<String, dynamic>? metadata;

  RtcCreateMediaSessionRequest({
    this.roomId,
    this.mediaMode,
    this.providerProfileId,
    this.provider,
    this.region,
    this.recordingRequested,
    this.metadata
  });

  factory RtcCreateMediaSessionRequest.fromJson(Map<String, dynamic> json) {
    return RtcCreateMediaSessionRequest(
      roomId: json['roomId']?.toString(),
      mediaMode: json['mediaMode']?.toString(),
      providerProfileId: json['providerProfileId']?.toString(),
      provider: json['provider']?.toString(),
      region: json['region']?.toString(),
      recordingRequested: json['recordingRequested'] is bool ? json['recordingRequested'] : null,
      metadata: _sdkworkAsMap(json['metadata'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'roomId': roomId,
      'mediaMode': mediaMode,
      'providerProfileId': providerProfileId,
      'provider': provider,
      'region': region,
      'recordingRequested': recordingRequested,
      'metadata': metadata,
    };
  }
}

class RtcMediaSession {
  final String? id;
  final String? roomId;
  final String? tenantId;
  final String? organizationId;
  final String? ownerUserId;
  final String? mediaMode;
  final String? status;
  final String? providerProfileId;
  final String? providerSessionId;
  final String? startedAt;
  final String? connectedAt;
  final String? endedAt;
  final String? durationMs;
  final String? endReason;
  final String? endSource;
  final int? participantCount;
  final int? maxConcurrentParticipants;
  final RtcMediaSessionCompletionQualitySummary? qualitySummary;
  final RtcMediaSessionCompletionRecordingSummary? recordingSummary;
  final String? completionRecordedAt;
  final String? lastProviderWebhookEventId;
  final String? lastProviderQueryJobId;
  final List<RtcMediaParticipant>? participants;

  RtcMediaSession({
    this.id,
    this.roomId,
    this.tenantId,
    this.organizationId,
    this.ownerUserId,
    this.mediaMode,
    this.status,
    this.providerProfileId,
    this.providerSessionId,
    this.startedAt,
    this.connectedAt,
    this.endedAt,
    this.durationMs,
    this.endReason,
    this.endSource,
    this.participantCount,
    this.maxConcurrentParticipants,
    this.qualitySummary,
    this.recordingSummary,
    this.completionRecordedAt,
    this.lastProviderWebhookEventId,
    this.lastProviderQueryJobId,
    this.participants
  });

  factory RtcMediaSession.fromJson(Map<String, dynamic> json) {
    return RtcMediaSession(
      id: json['id']?.toString(),
      roomId: json['roomId']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      ownerUserId: json['ownerUserId']?.toString(),
      mediaMode: json['mediaMode']?.toString(),
      status: json['status']?.toString(),
      providerProfileId: json['providerProfileId']?.toString(),
      providerSessionId: json['providerSessionId']?.toString(),
      startedAt: json['startedAt']?.toString(),
      connectedAt: json['connectedAt']?.toString(),
      endedAt: json['endedAt']?.toString(),
      durationMs: json['durationMs']?.toString(),
      endReason: json['endReason']?.toString(),
      endSource: json['endSource']?.toString(),
      participantCount: json['participantCount'] is int ? json['participantCount'] : null,
      maxConcurrentParticipants: json['maxConcurrentParticipants'] is int ? json['maxConcurrentParticipants'] : null,
      qualitySummary: (() {
        final map = _sdkworkAsMap(json['qualitySummary']);
        return map == null ? null : RtcMediaSessionCompletionQualitySummary.fromJson(map);
      })(),
      recordingSummary: (() {
        final map = _sdkworkAsMap(json['recordingSummary']);
        return map == null ? null : RtcMediaSessionCompletionRecordingSummary.fromJson(map);
      })(),
      completionRecordedAt: json['completionRecordedAt']?.toString(),
      lastProviderWebhookEventId: json['lastProviderWebhookEventId']?.toString(),
      lastProviderQueryJobId: json['lastProviderQueryJobId']?.toString(),
      participants: (() {
        final list = _sdkworkAsList(json['participants']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => (() {
        final map = _sdkworkAsMap(item);
        return map == null ? null : RtcMediaParticipant.fromJson(map);
      })())
            .whereType<RtcMediaParticipant>()
            .toList();
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'roomId': roomId,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'ownerUserId': ownerUserId,
      'mediaMode': mediaMode,
      'status': status,
      'providerProfileId': providerProfileId,
      'providerSessionId': providerSessionId,
      'startedAt': startedAt,
      'connectedAt': connectedAt,
      'endedAt': endedAt,
      'durationMs': durationMs,
      'endReason': endReason,
      'endSource': endSource,
      'participantCount': participantCount,
      'maxConcurrentParticipants': maxConcurrentParticipants,
      'qualitySummary': qualitySummary?.toJson(),
      'recordingSummary': recordingSummary?.toJson(),
      'completionRecordedAt': completionRecordedAt,
      'lastProviderWebhookEventId': lastProviderWebhookEventId,
      'lastProviderQueryJobId': lastProviderQueryJobId,
      'participants': participants?.map((item) => item.toJson()).toList(),
    };
  }
}

class RtcMediaSessionListResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  RtcMediaSessionListResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory RtcMediaSessionListResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionListResponse(
      code: json['code'] is int ? json['code'] : null,
      data: _sdkworkAsMap(json['data']),
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class RtcMediaSessionResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  RtcMediaSessionResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory RtcMediaSessionResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionResponse(
      code: json['code'] is int ? json['code'] : null,
      data: _sdkworkAsMap(json['data']),
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class RtcMediaParticipant {
  final String? id;
  final String? mediaSessionId;
  final String? userId;
  final String? displayName;
  final String? role;
  final String? state;
  final bool? audioMuted;
  final bool? videoMuted;
  final bool? screenShareActive;
  final String? providerParticipantId;
  final String? joinedAt;
  final String? leftAt;
  final String? durationMs;
  final String? leaveReason;
  final String? lastSeenAt;

  RtcMediaParticipant({
    this.id,
    this.mediaSessionId,
    this.userId,
    this.displayName,
    this.role,
    this.state,
    this.audioMuted,
    this.videoMuted,
    this.screenShareActive,
    this.providerParticipantId,
    this.joinedAt,
    this.leftAt,
    this.durationMs,
    this.leaveReason,
    this.lastSeenAt
  });

  factory RtcMediaParticipant.fromJson(Map<String, dynamic> json) {
    return RtcMediaParticipant(
      id: json['id']?.toString(),
      mediaSessionId: json['mediaSessionId']?.toString(),
      userId: json['userId']?.toString(),
      displayName: json['displayName']?.toString(),
      role: json['role']?.toString(),
      state: json['state']?.toString(),
      audioMuted: json['audioMuted'] is bool ? json['audioMuted'] : null,
      videoMuted: json['videoMuted'] is bool ? json['videoMuted'] : null,
      screenShareActive: json['screenShareActive'] is bool ? json['screenShareActive'] : null,
      providerParticipantId: json['providerParticipantId']?.toString(),
      joinedAt: json['joinedAt']?.toString(),
      leftAt: json['leftAt']?.toString(),
      durationMs: json['durationMs']?.toString(),
      leaveReason: json['leaveReason']?.toString(),
      lastSeenAt: json['lastSeenAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'mediaSessionId': mediaSessionId,
      'userId': userId,
      'displayName': displayName,
      'role': role,
      'state': state,
      'audioMuted': audioMuted,
      'videoMuted': videoMuted,
      'screenShareActive': screenShareActive,
      'providerParticipantId': providerParticipantId,
      'joinedAt': joinedAt,
      'leftAt': leftAt,
      'durationMs': durationMs,
      'leaveReason': leaveReason,
      'lastSeenAt': lastSeenAt,
    };
  }
}

class RtcParticipantCredential {
  final String? tenantId;
  final String? mediaSessionId;
  final String? participantId;
  final String? credential;
  final String? expiresAt;

  RtcParticipantCredential({
    this.tenantId,
    this.mediaSessionId,
    this.participantId,
    this.credential,
    this.expiresAt
  });

  factory RtcParticipantCredential.fromJson(Map<String, dynamic> json) {
    return RtcParticipantCredential(
      tenantId: json['tenantId']?.toString(),
      mediaSessionId: json['mediaSessionId']?.toString(),
      participantId: json['participantId']?.toString(),
      credential: json['credential']?.toString(),
      expiresAt: json['expiresAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'tenantId': tenantId,
      'mediaSessionId': mediaSessionId,
      'participantId': participantId,
      'credential': credential,
      'expiresAt': expiresAt,
    };
  }
}

class RtcParticipantCredentialResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  RtcParticipantCredentialResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory RtcParticipantCredentialResponse.fromJson(Map<String, dynamic> json) {
    return RtcParticipantCredentialResponse(
      code: json['code'] is int ? json['code'] : null,
      data: _sdkworkAsMap(json['data']),
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class RtcMediaArtifact {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? mediaSessionId;
  final String? ownerUserId;
  final String? artifactKind;
  final String? artifactStatus;
  final String? mediaRole;
  final String? providerProfileId;
  final String? providerArtifactId;
  final RtcDriveReference? drive;
  final MediaResource? resource;
  final String? resourceHash;
  final String? startedAt;
  final String? endedAt;
  final String? durationMs;
  final String? failureReason;
  final String? sourceProviderWebhookEventId;
  final String? sourceProviderQueryJobId;

  RtcMediaArtifact({
    this.id,
    this.tenantId,
    this.organizationId,
    this.mediaSessionId,
    this.ownerUserId,
    this.artifactKind,
    this.artifactStatus,
    this.mediaRole,
    this.providerProfileId,
    this.providerArtifactId,
    this.drive,
    this.resource,
    this.resourceHash,
    this.startedAt,
    this.endedAt,
    this.durationMs,
    this.failureReason,
    this.sourceProviderWebhookEventId,
    this.sourceProviderQueryJobId
  });

  factory RtcMediaArtifact.fromJson(Map<String, dynamic> json) {
    return RtcMediaArtifact(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      mediaSessionId: json['mediaSessionId']?.toString(),
      ownerUserId: json['ownerUserId']?.toString(),
      artifactKind: json['artifactKind']?.toString(),
      artifactStatus: json['artifactStatus']?.toString(),
      mediaRole: json['mediaRole']?.toString(),
      providerProfileId: json['providerProfileId']?.toString(),
      providerArtifactId: json['providerArtifactId']?.toString(),
      drive: (() {
        final map = _sdkworkAsMap(json['drive']);
        return map == null ? null : RtcDriveReference.fromJson(map);
      })(),
      resource: (() {
        final map = _sdkworkAsMap(json['resource']);
        return map == null ? null : MediaResource.fromJson(map);
      })(),
      resourceHash: json['resourceHash']?.toString(),
      startedAt: json['startedAt']?.toString(),
      endedAt: json['endedAt']?.toString(),
      durationMs: json['durationMs']?.toString(),
      failureReason: json['failureReason']?.toString(),
      sourceProviderWebhookEventId: json['sourceProviderWebhookEventId']?.toString(),
      sourceProviderQueryJobId: json['sourceProviderQueryJobId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'mediaSessionId': mediaSessionId,
      'ownerUserId': ownerUserId,
      'artifactKind': artifactKind,
      'artifactStatus': artifactStatus,
      'mediaRole': mediaRole,
      'providerProfileId': providerProfileId,
      'providerArtifactId': providerArtifactId,
      'drive': drive?.toJson(),
      'resource': resource?.toJson(),
      'resourceHash': resourceHash,
      'startedAt': startedAt,
      'endedAt': endedAt,
      'durationMs': durationMs,
      'failureReason': failureReason,
      'sourceProviderWebhookEventId': sourceProviderWebhookEventId,
      'sourceProviderQueryJobId': sourceProviderQueryJobId,
    };
  }
}

class RtcMediaArtifactListResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  RtcMediaArtifactListResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory RtcMediaArtifactListResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaArtifactListResponse(
      code: json['code'] is int ? json['code'] : null,
      data: _sdkworkAsMap(json['data']),
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class RtcMediaSessionCompletionQualitySummary {
  final int? sampleCount;
  final int? participantSampleCount;
  final int? avgLatencyMs;
  final int? maxLatencyMs;
  final int? avgJitterMs;
  final int? maxJitterMs;
  final String? maxPacketLossRate;
  final int? minBitrateKbps;
  final int? avgBitrateKbps;
  final String? firstSampledAt;
  final String? lastSampledAt;

  RtcMediaSessionCompletionQualitySummary({
    this.sampleCount,
    this.participantSampleCount,
    this.avgLatencyMs,
    this.maxLatencyMs,
    this.avgJitterMs,
    this.maxJitterMs,
    this.maxPacketLossRate,
    this.minBitrateKbps,
    this.avgBitrateKbps,
    this.firstSampledAt,
    this.lastSampledAt
  });

  factory RtcMediaSessionCompletionQualitySummary.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionCompletionQualitySummary(
      sampleCount: json['sampleCount'] is int ? json['sampleCount'] : null,
      participantSampleCount: json['participantSampleCount'] is int ? json['participantSampleCount'] : null,
      avgLatencyMs: json['avgLatencyMs'] is int ? json['avgLatencyMs'] : null,
      maxLatencyMs: json['maxLatencyMs'] is int ? json['maxLatencyMs'] : null,
      avgJitterMs: json['avgJitterMs'] is int ? json['avgJitterMs'] : null,
      maxJitterMs: json['maxJitterMs'] is int ? json['maxJitterMs'] : null,
      maxPacketLossRate: json['maxPacketLossRate']?.toString(),
      minBitrateKbps: json['minBitrateKbps'] is int ? json['minBitrateKbps'] : null,
      avgBitrateKbps: json['avgBitrateKbps'] is int ? json['avgBitrateKbps'] : null,
      firstSampledAt: json['firstSampledAt']?.toString(),
      lastSampledAt: json['lastSampledAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'sampleCount': sampleCount,
      'participantSampleCount': participantSampleCount,
      'avgLatencyMs': avgLatencyMs,
      'maxLatencyMs': maxLatencyMs,
      'avgJitterMs': avgJitterMs,
      'maxJitterMs': maxJitterMs,
      'maxPacketLossRate': maxPacketLossRate,
      'minBitrateKbps': minBitrateKbps,
      'avgBitrateKbps': avgBitrateKbps,
      'firstSampledAt': firstSampledAt,
      'lastSampledAt': lastSampledAt,
    };
  }
}

class RtcMediaSessionCompletionRecordingSummary {
  final int? artifactCount;
  final int? recordingArtifactCount;
  final int? readyArtifactCount;
  final int? failedArtifactCount;
  final int? processingArtifactCount;
  final String? totalDurationMs;
  final int? driveResourceCount;

  RtcMediaSessionCompletionRecordingSummary({
    this.artifactCount,
    this.recordingArtifactCount,
    this.readyArtifactCount,
    this.failedArtifactCount,
    this.processingArtifactCount,
    this.totalDurationMs,
    this.driveResourceCount
  });

  factory RtcMediaSessionCompletionRecordingSummary.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionCompletionRecordingSummary(
      artifactCount: json['artifactCount'] is int ? json['artifactCount'] : null,
      recordingArtifactCount: json['recordingArtifactCount'] is int ? json['recordingArtifactCount'] : null,
      readyArtifactCount: json['readyArtifactCount'] is int ? json['readyArtifactCount'] : null,
      failedArtifactCount: json['failedArtifactCount'] is int ? json['failedArtifactCount'] : null,
      processingArtifactCount: json['processingArtifactCount'] is int ? json['processingArtifactCount'] : null,
      totalDurationMs: json['totalDurationMs']?.toString(),
      driveResourceCount: json['driveResourceCount'] is int ? json['driveResourceCount'] : null
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'artifactCount': artifactCount,
      'recordingArtifactCount': recordingArtifactCount,
      'readyArtifactCount': readyArtifactCount,
      'failedArtifactCount': failedArtifactCount,
      'processingArtifactCount': processingArtifactCount,
      'totalDurationMs': totalDurationMs,
      'driveResourceCount': driveResourceCount,
    };
  }
}

class RtcMediaSessionCompletionParticipantSummary {
  final String? participantId;
  final String? userId;
  final String? displayName;
  final String? role;
  final String? state;
  final String? joinedAt;
  final String? leftAt;
  final String? durationMs;
  final String? leaveReason;
  final String? providerParticipantId;

  RtcMediaSessionCompletionParticipantSummary({
    this.participantId,
    this.userId,
    this.displayName,
    this.role,
    this.state,
    this.joinedAt,
    this.leftAt,
    this.durationMs,
    this.leaveReason,
    this.providerParticipantId
  });

  factory RtcMediaSessionCompletionParticipantSummary.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionCompletionParticipantSummary(
      participantId: json['participantId']?.toString(),
      userId: json['userId']?.toString(),
      displayName: json['displayName']?.toString(),
      role: json['role']?.toString(),
      state: json['state']?.toString(),
      joinedAt: json['joinedAt']?.toString(),
      leftAt: json['leftAt']?.toString(),
      durationMs: json['durationMs']?.toString(),
      leaveReason: json['leaveReason']?.toString(),
      providerParticipantId: json['providerParticipantId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'participantId': participantId,
      'userId': userId,
      'displayName': displayName,
      'role': role,
      'state': state,
      'joinedAt': joinedAt,
      'leftAt': leftAt,
      'durationMs': durationMs,
      'leaveReason': leaveReason,
      'providerParticipantId': providerParticipantId,
    };
  }
}

class RtcMediaSessionCompletionTrackSummary {
  final String? trackId;
  final String? participantId;
  final String? trackKind;
  final String? trackSource;
  final String? status;
  final String? startedAt;
  final String? endedAt;
  final String? durationMs;
  final String? mutedDurationMs;
  final String? endReason;

  RtcMediaSessionCompletionTrackSummary({
    this.trackId,
    this.participantId,
    this.trackKind,
    this.trackSource,
    this.status,
    this.startedAt,
    this.endedAt,
    this.durationMs,
    this.mutedDurationMs,
    this.endReason
  });

  factory RtcMediaSessionCompletionTrackSummary.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionCompletionTrackSummary(
      trackId: json['trackId']?.toString(),
      participantId: json['participantId']?.toString(),
      trackKind: json['trackKind']?.toString(),
      trackSource: json['trackSource']?.toString(),
      status: json['status']?.toString(),
      startedAt: json['startedAt']?.toString(),
      endedAt: json['endedAt']?.toString(),
      durationMs: json['durationMs']?.toString(),
      mutedDurationMs: json['mutedDurationMs']?.toString(),
      endReason: json['endReason']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'trackId': trackId,
      'participantId': participantId,
      'trackKind': trackKind,
      'trackSource': trackSource,
      'status': status,
      'startedAt': startedAt,
      'endedAt': endedAt,
      'durationMs': durationMs,
      'mutedDurationMs': mutedDurationMs,
      'endReason': endReason,
    };
  }
}

class RtcMediaSessionCompletionArtifactSummary {
  final String? artifactId;
  final String? artifactKind;
  final String? artifactStatus;
  final String? mediaRole;
  final String? driveUri;
  final String? driveSpaceId;
  final String? driveSpaceType;
  final String? driveNodeId;
  final String? driveNodeVersion;
  final String? providerArtifactId;
  final String? startedAt;
  final String? endedAt;
  final String? durationMs;
  final String? failureReason;

  RtcMediaSessionCompletionArtifactSummary({
    this.artifactId,
    this.artifactKind,
    this.artifactStatus,
    this.mediaRole,
    this.driveUri,
    this.driveSpaceId,
    this.driveSpaceType,
    this.driveNodeId,
    this.driveNodeVersion,
    this.providerArtifactId,
    this.startedAt,
    this.endedAt,
    this.durationMs,
    this.failureReason
  });

  factory RtcMediaSessionCompletionArtifactSummary.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionCompletionArtifactSummary(
      artifactId: json['artifactId']?.toString(),
      artifactKind: json['artifactKind']?.toString(),
      artifactStatus: json['artifactStatus']?.toString(),
      mediaRole: json['mediaRole']?.toString(),
      driveUri: json['driveUri']?.toString(),
      driveSpaceId: json['driveSpaceId']?.toString(),
      driveSpaceType: json['driveSpaceType']?.toString(),
      driveNodeId: json['driveNodeId']?.toString(),
      driveNodeVersion: json['driveNodeVersion']?.toString(),
      providerArtifactId: json['providerArtifactId']?.toString(),
      startedAt: json['startedAt']?.toString(),
      endedAt: json['endedAt']?.toString(),
      durationMs: json['durationMs']?.toString(),
      failureReason: json['failureReason']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'artifactId': artifactId,
      'artifactKind': artifactKind,
      'artifactStatus': artifactStatus,
      'mediaRole': mediaRole,
      'driveUri': driveUri,
      'driveSpaceId': driveSpaceId,
      'driveSpaceType': driveSpaceType,
      'driveNodeId': driveNodeId,
      'driveNodeVersion': driveNodeVersion,
      'providerArtifactId': providerArtifactId,
      'startedAt': startedAt,
      'endedAt': endedAt,
      'durationMs': durationMs,
      'failureReason': failureReason,
    };
  }
}

class RtcMediaSessionCompletionRecord {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? mediaSessionId;
  final String? roomId;
  final String? ownerUserId;
  final String? providerProfileId;
  final String? providerSessionId;
  final String? mediaMode;
  final String? sessionStatus;
  final String? startedAt;
  final String? connectedAt;
  final String? endedAt;
  final String? durationMs;
  final String? endReason;
  final String? endSource;
  final int? participantCount;
  final int? maxConcurrentParticipants;
  final RtcMediaSessionCompletionQualitySummary? qualitySummary;
  final RtcMediaSessionCompletionRecordingSummary? recordingSummary;
  final List<RtcMediaSessionCompletionParticipantSummary>? participants;
  final List<RtcMediaSessionCompletionTrackSummary>? tracks;
  final List<RtcMediaSessionCompletionArtifactSummary>? artifacts;
  final String? sourceWebhookEventId;
  final String? sourceProviderQueryJobId;
  final Map<String, dynamic>? completionSnapshot;
  final String? completionSnapshotHash;
  final String? recordedAt;

  RtcMediaSessionCompletionRecord({
    this.id,
    this.tenantId,
    this.organizationId,
    this.mediaSessionId,
    this.roomId,
    this.ownerUserId,
    this.providerProfileId,
    this.providerSessionId,
    this.mediaMode,
    this.sessionStatus,
    this.startedAt,
    this.connectedAt,
    this.endedAt,
    this.durationMs,
    this.endReason,
    this.endSource,
    this.participantCount,
    this.maxConcurrentParticipants,
    this.qualitySummary,
    this.recordingSummary,
    this.participants,
    this.tracks,
    this.artifacts,
    this.sourceWebhookEventId,
    this.sourceProviderQueryJobId,
    this.completionSnapshot,
    this.completionSnapshotHash,
    this.recordedAt
  });

  factory RtcMediaSessionCompletionRecord.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionCompletionRecord(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      mediaSessionId: json['mediaSessionId']?.toString(),
      roomId: json['roomId']?.toString(),
      ownerUserId: json['ownerUserId']?.toString(),
      providerProfileId: json['providerProfileId']?.toString(),
      providerSessionId: json['providerSessionId']?.toString(),
      mediaMode: json['mediaMode']?.toString(),
      sessionStatus: json['sessionStatus']?.toString(),
      startedAt: json['startedAt']?.toString(),
      connectedAt: json['connectedAt']?.toString(),
      endedAt: json['endedAt']?.toString(),
      durationMs: json['durationMs']?.toString(),
      endReason: json['endReason']?.toString(),
      endSource: json['endSource']?.toString(),
      participantCount: json['participantCount'] is int ? json['participantCount'] : null,
      maxConcurrentParticipants: json['maxConcurrentParticipants'] is int ? json['maxConcurrentParticipants'] : null,
      qualitySummary: (() {
        final map = _sdkworkAsMap(json['qualitySummary']);
        return map == null ? null : RtcMediaSessionCompletionQualitySummary.fromJson(map);
      })(),
      recordingSummary: (() {
        final map = _sdkworkAsMap(json['recordingSummary']);
        return map == null ? null : RtcMediaSessionCompletionRecordingSummary.fromJson(map);
      })(),
      participants: (() {
        final list = _sdkworkAsList(json['participants']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => (() {
        final map = _sdkworkAsMap(item);
        return map == null ? null : RtcMediaSessionCompletionParticipantSummary.fromJson(map);
      })())
            .whereType<RtcMediaSessionCompletionParticipantSummary>()
            .toList();
      })(),
      tracks: (() {
        final list = _sdkworkAsList(json['tracks']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => (() {
        final map = _sdkworkAsMap(item);
        return map == null ? null : RtcMediaSessionCompletionTrackSummary.fromJson(map);
      })())
            .whereType<RtcMediaSessionCompletionTrackSummary>()
            .toList();
      })(),
      artifacts: (() {
        final list = _sdkworkAsList(json['artifacts']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => (() {
        final map = _sdkworkAsMap(item);
        return map == null ? null : RtcMediaSessionCompletionArtifactSummary.fromJson(map);
      })())
            .whereType<RtcMediaSessionCompletionArtifactSummary>()
            .toList();
      })(),
      sourceWebhookEventId: json['sourceWebhookEventId']?.toString(),
      sourceProviderQueryJobId: json['sourceProviderQueryJobId']?.toString(),
      completionSnapshot: _sdkworkAsMap(json['completionSnapshot']),
      completionSnapshotHash: json['completionSnapshotHash']?.toString(),
      recordedAt: json['recordedAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'mediaSessionId': mediaSessionId,
      'roomId': roomId,
      'ownerUserId': ownerUserId,
      'providerProfileId': providerProfileId,
      'providerSessionId': providerSessionId,
      'mediaMode': mediaMode,
      'sessionStatus': sessionStatus,
      'startedAt': startedAt,
      'connectedAt': connectedAt,
      'endedAt': endedAt,
      'durationMs': durationMs,
      'endReason': endReason,
      'endSource': endSource,
      'participantCount': participantCount,
      'maxConcurrentParticipants': maxConcurrentParticipants,
      'qualitySummary': qualitySummary?.toJson(),
      'recordingSummary': recordingSummary?.toJson(),
      'participants': participants?.map((item) => item.toJson()).toList(),
      'tracks': tracks?.map((item) => item.toJson()).toList(),
      'artifacts': artifacts?.map((item) => item.toJson()).toList(),
      'sourceWebhookEventId': sourceWebhookEventId,
      'sourceProviderQueryJobId': sourceProviderQueryJobId,
      'completionSnapshot': completionSnapshot,
      'completionSnapshotHash': completionSnapshotHash,
      'recordedAt': recordedAt,
    };
  }
}

class RtcMediaSessionCompletionRecordResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  RtcMediaSessionCompletionRecordResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory RtcMediaSessionCompletionRecordResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionCompletionRecordResponse(
      code: json['code'] is int ? json['code'] : null,
      data: _sdkworkAsMap(json['data']),
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class RtcActiveProviderProfile {
  final String? id;
  final String? provider;
  final String? code;
  final String? name;
  final bool? isDefault;
  final int? priority;
  final String? environment;
  final String? region;
  final String? providerAppId;
  final String? endpoint;
  final RtcProviderCapabilitySnapshot? capabilities;
  final String? healthStatus;

  RtcActiveProviderProfile({
    this.id,
    this.provider,
    this.code,
    this.name,
    this.isDefault,
    this.priority,
    this.environment,
    this.region,
    this.providerAppId,
    this.endpoint,
    this.capabilities,
    this.healthStatus
  });

  factory RtcActiveProviderProfile.fromJson(Map<String, dynamic> json) {
    return RtcActiveProviderProfile(
      id: json['id']?.toString(),
      provider: json['provider']?.toString(),
      code: json['code']?.toString(),
      name: json['name']?.toString(),
      isDefault: json['isDefault'] is bool ? json['isDefault'] : null,
      priority: json['priority'] is int ? json['priority'] : null,
      environment: json['environment']?.toString(),
      region: json['region']?.toString(),
      providerAppId: json['providerAppId']?.toString(),
      endpoint: json['endpoint']?.toString(),
      capabilities: (() {
        final map = _sdkworkAsMap(json['capabilities']);
        return map == null ? null : RtcProviderCapabilitySnapshot.fromJson(map);
      })(),
      healthStatus: json['healthStatus']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'provider': provider,
      'code': code,
      'name': name,
      'isDefault': isDefault,
      'priority': priority,
      'environment': environment,
      'region': region,
      'providerAppId': providerAppId,
      'endpoint': endpoint,
      'capabilities': capabilities?.toJson(),
      'healthStatus': healthStatus,
    };
  }
}

class RtcProviderCapabilitySnapshot {
  final bool? audio;
  final bool? video;
  final bool? live;
  final bool? liveBroadcast;
  final bool? liveAudience;
  final bool? cdnRelay;
  final bool? screenShare;
  final bool? recording;
  final bool? webhook;
  final bool? activeQuery;
  final int? maxParticipants;
  final List<String>? supportedRegions;
  final Map<String, dynamic>? providerFeatures;

  RtcProviderCapabilitySnapshot({
    this.audio,
    this.video,
    this.live,
    this.liveBroadcast,
    this.liveAudience,
    this.cdnRelay,
    this.screenShare,
    this.recording,
    this.webhook,
    this.activeQuery,
    this.maxParticipants,
    this.supportedRegions,
    this.providerFeatures
  });

  factory RtcProviderCapabilitySnapshot.fromJson(Map<String, dynamic> json) {
    return RtcProviderCapabilitySnapshot(
      audio: json['audio'] is bool ? json['audio'] : null,
      video: json['video'] is bool ? json['video'] : null,
      live: json['live'] is bool ? json['live'] : null,
      liveBroadcast: json['liveBroadcast'] is bool ? json['liveBroadcast'] : null,
      liveAudience: json['liveAudience'] is bool ? json['liveAudience'] : null,
      cdnRelay: json['cdnRelay'] is bool ? json['cdnRelay'] : null,
      screenShare: json['screenShare'] is bool ? json['screenShare'] : null,
      recording: json['recording'] is bool ? json['recording'] : null,
      webhook: json['webhook'] is bool ? json['webhook'] : null,
      activeQuery: json['activeQuery'] is bool ? json['activeQuery'] : null,
      maxParticipants: json['maxParticipants'] is int ? json['maxParticipants'] : null,
      supportedRegions: (() {
        final list = _sdkworkAsList(json['supportedRegions']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => item?.toString())
            .whereType<String>()
            .toList();
      })(),
      providerFeatures: _sdkworkAsMap(json['providerFeatures'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'audio': audio,
      'video': video,
      'live': live,
      'liveBroadcast': liveBroadcast,
      'liveAudience': liveAudience,
      'cdnRelay': cdnRelay,
      'screenShare': screenShare,
      'recording': recording,
      'webhook': webhook,
      'activeQuery': activeQuery,
      'maxParticipants': maxParticipants,
      'supportedRegions': supportedRegions?.map((item) => item).toList(),
      'providerFeatures': providerFeatures,
    };
  }
}

class RtcActiveProviderProfileListResponse {
  final int? code;
  final dynamic data;
  final String? traceId;

  RtcActiveProviderProfileListResponse({
    this.code,
    this.data,
    this.traceId
  });

  factory RtcActiveProviderProfileListResponse.fromJson(Map<String, dynamic> json) {
    return RtcActiveProviderProfileListResponse(
      code: json['code'] is int ? json['code'] : null,
      data: _sdkworkAsMap(json['data']),
      traceId: json['traceId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}
