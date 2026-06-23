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

class RtcApiResult {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcApiResult({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcApiResult.fromJson(Map<String, dynamic> json) {
    return RtcApiResult(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
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
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcRoomListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcRoomListResponse.fromJson(Map<String, dynamic> json) {
    return RtcRoomListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcRoomResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcRoom? data;

  RtcRoomResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcRoomResponse.fromJson(Map<String, dynamic> json) {
    return RtcRoomResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcRoom.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcCloseMediaSessionRequest {
  final String? reason;

  RtcCloseMediaSessionRequest({
    this.reason
  });

  factory RtcCloseMediaSessionRequest.fromJson(Map<String, dynamic> json) {
    return RtcCloseMediaSessionRequest(
      reason: json['reason']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'reason': reason,
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
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcMediaSessionListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcMediaSessionListResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcMediaSessionResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcMediaSession? data;

  RtcMediaSessionResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcMediaSessionResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcMediaSession.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
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
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcMediaArtifactListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcMediaArtifactListResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaArtifactListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcMediaArtifactResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcMediaArtifact? data;

  RtcMediaArtifactResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcMediaArtifactResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaArtifactResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcMediaArtifact.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
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
  final String? code;
  final String? message;
  final String? requestId;
  final RtcMediaSessionCompletionRecord? data;

  RtcMediaSessionCompletionRecordResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcMediaSessionCompletionRecordResponse.fromJson(Map<String, dynamic> json) {
    return RtcMediaSessionCompletionRecordResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcMediaSessionCompletionRecord.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcProviderAccount {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? provider;
  final String? code;
  final String? name;
  final String? status;
  final String? environment;
  final String? externalTenantId;
  final String? cloudAccountId;
  final String? projectId;
  final String? resourceGroupId;
  final String? lastVerifiedAt;
  final String? lastVerificationError;
  final String? createdBy;
  final String? updatedBy;
  final String? createdAt;
  final String? updatedAt;
  final String? version;
  final String? deletedAt;
  final String? deletedBy;

  RtcProviderAccount({
    this.id,
    this.tenantId,
    this.organizationId,
    this.provider,
    this.code,
    this.name,
    this.status,
    this.environment,
    this.externalTenantId,
    this.cloudAccountId,
    this.projectId,
    this.resourceGroupId,
    this.lastVerifiedAt,
    this.lastVerificationError,
    this.createdBy,
    this.updatedBy,
    this.createdAt,
    this.updatedAt,
    this.version,
    this.deletedAt,
    this.deletedBy
  });

  factory RtcProviderAccount.fromJson(Map<String, dynamic> json) {
    return RtcProviderAccount(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      provider: json['provider']?.toString(),
      code: json['code']?.toString(),
      name: json['name']?.toString(),
      status: json['status']?.toString(),
      environment: json['environment']?.toString(),
      externalTenantId: json['externalTenantId']?.toString(),
      cloudAccountId: json['cloudAccountId']?.toString(),
      projectId: json['projectId']?.toString(),
      resourceGroupId: json['resourceGroupId']?.toString(),
      lastVerifiedAt: json['lastVerifiedAt']?.toString(),
      lastVerificationError: json['lastVerificationError']?.toString(),
      createdBy: json['createdBy']?.toString(),
      updatedBy: json['updatedBy']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      version: json['version']?.toString(),
      deletedAt: json['deletedAt']?.toString(),
      deletedBy: json['deletedBy']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'provider': provider,
      'code': code,
      'name': name,
      'status': status,
      'environment': environment,
      'externalTenantId': externalTenantId,
      'cloudAccountId': cloudAccountId,
      'projectId': projectId,
      'resourceGroupId': resourceGroupId,
      'lastVerifiedAt': lastVerifiedAt,
      'lastVerificationError': lastVerificationError,
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'version': version,
      'deletedAt': deletedAt,
      'deletedBy': deletedBy,
    };
  }
}

class RtcProviderAccountCommand {
  final String? provider;
  final String? code;
  final String? name;
  final String? status;
  final String? environment;
  final String? externalTenantId;
  final String? cloudAccountId;
  final String? projectId;
  final String? resourceGroupId;

  RtcProviderAccountCommand({
    this.provider,
    this.code,
    this.name,
    this.status,
    this.environment,
    this.externalTenantId,
    this.cloudAccountId,
    this.projectId,
    this.resourceGroupId
  });

  factory RtcProviderAccountCommand.fromJson(Map<String, dynamic> json) {
    return RtcProviderAccountCommand(
      provider: json['provider']?.toString(),
      code: json['code']?.toString(),
      name: json['name']?.toString(),
      status: json['status']?.toString(),
      environment: json['environment']?.toString(),
      externalTenantId: json['externalTenantId']?.toString(),
      cloudAccountId: json['cloudAccountId']?.toString(),
      projectId: json['projectId']?.toString(),
      resourceGroupId: json['resourceGroupId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'provider': provider,
      'code': code,
      'name': name,
      'status': status,
      'environment': environment,
      'externalTenantId': externalTenantId,
      'cloudAccountId': cloudAccountId,
      'projectId': projectId,
      'resourceGroupId': resourceGroupId,
    };
  }
}

class RtcProviderAccountDisableRequest {
  final String? reason;

  RtcProviderAccountDisableRequest({
    this.reason
  });

  factory RtcProviderAccountDisableRequest.fromJson(Map<String, dynamic> json) {
    return RtcProviderAccountDisableRequest(
      reason: json['reason']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'reason': reason,
    };
  }
}

class RtcProviderAccountListResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcProviderAccountListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderAccountListResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderAccountListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcProviderAccountResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcProviderAccount? data;

  RtcProviderAccountResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderAccountResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderAccountResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcProviderAccount.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcProviderApplication {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? providerAccountId;
  final String? provider;
  final String? code;
  final String? name;
  final String? status;
  final String? environment;
  final String? region;
  final String? providerApplicationId;
  final String? providerApplicationIdKind;
  final String? accessEndpoint;
  final String? apiEndpoint;
  final String? apiHost;
  final String? apiVersion;
  final String? webhookCallbackUrl;
  final Map<String, dynamic>? configSnapshot;
  final String? lastVerifiedAt;
  final String? lastVerificationError;
  final String? createdBy;
  final String? updatedBy;
  final String? createdAt;
  final String? updatedAt;
  final String? version;
  final String? deletedAt;
  final String? deletedBy;

  RtcProviderApplication({
    this.id,
    this.tenantId,
    this.organizationId,
    this.providerAccountId,
    this.provider,
    this.code,
    this.name,
    this.status,
    this.environment,
    this.region,
    this.providerApplicationId,
    this.providerApplicationIdKind,
    this.accessEndpoint,
    this.apiEndpoint,
    this.apiHost,
    this.apiVersion,
    this.webhookCallbackUrl,
    this.configSnapshot,
    this.lastVerifiedAt,
    this.lastVerificationError,
    this.createdBy,
    this.updatedBy,
    this.createdAt,
    this.updatedAt,
    this.version,
    this.deletedAt,
    this.deletedBy
  });

  factory RtcProviderApplication.fromJson(Map<String, dynamic> json) {
    return RtcProviderApplication(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      providerAccountId: json['providerAccountId']?.toString(),
      provider: json['provider']?.toString(),
      code: json['code']?.toString(),
      name: json['name']?.toString(),
      status: json['status']?.toString(),
      environment: json['environment']?.toString(),
      region: json['region']?.toString(),
      providerApplicationId: json['providerApplicationId']?.toString(),
      providerApplicationIdKind: json['providerApplicationIdKind']?.toString(),
      accessEndpoint: json['accessEndpoint']?.toString(),
      apiEndpoint: json['apiEndpoint']?.toString(),
      apiHost: json['apiHost']?.toString(),
      apiVersion: json['apiVersion']?.toString(),
      webhookCallbackUrl: json['webhookCallbackUrl']?.toString(),
      configSnapshot: _sdkworkAsMap(json['configSnapshot']),
      lastVerifiedAt: json['lastVerifiedAt']?.toString(),
      lastVerificationError: json['lastVerificationError']?.toString(),
      createdBy: json['createdBy']?.toString(),
      updatedBy: json['updatedBy']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      version: json['version']?.toString(),
      deletedAt: json['deletedAt']?.toString(),
      deletedBy: json['deletedBy']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'providerAccountId': providerAccountId,
      'provider': provider,
      'code': code,
      'name': name,
      'status': status,
      'environment': environment,
      'region': region,
      'providerApplicationId': providerApplicationId,
      'providerApplicationIdKind': providerApplicationIdKind,
      'accessEndpoint': accessEndpoint,
      'apiEndpoint': apiEndpoint,
      'apiHost': apiHost,
      'apiVersion': apiVersion,
      'webhookCallbackUrl': webhookCallbackUrl,
      'configSnapshot': configSnapshot,
      'lastVerifiedAt': lastVerifiedAt,
      'lastVerificationError': lastVerificationError,
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'version': version,
      'deletedAt': deletedAt,
      'deletedBy': deletedBy,
    };
  }
}

class RtcProviderApplicationCommand {
  final String? code;
  final String? name;
  final String? status;
  final String? environment;
  final String? region;
  final String? providerApplicationId;
  final String? providerApplicationIdKind;
  final String? accessEndpoint;
  final String? apiEndpoint;
  final String? apiHost;
  final String? apiVersion;
  final String? webhookCallbackUrl;
  final Map<String, dynamic>? configSnapshot;

  RtcProviderApplicationCommand({
    this.code,
    this.name,
    this.status,
    this.environment,
    this.region,
    this.providerApplicationId,
    this.providerApplicationIdKind,
    this.accessEndpoint,
    this.apiEndpoint,
    this.apiHost,
    this.apiVersion,
    this.webhookCallbackUrl,
    this.configSnapshot
  });

  factory RtcProviderApplicationCommand.fromJson(Map<String, dynamic> json) {
    return RtcProviderApplicationCommand(
      code: json['code']?.toString(),
      name: json['name']?.toString(),
      status: json['status']?.toString(),
      environment: json['environment']?.toString(),
      region: json['region']?.toString(),
      providerApplicationId: json['providerApplicationId']?.toString(),
      providerApplicationIdKind: json['providerApplicationIdKind']?.toString(),
      accessEndpoint: json['accessEndpoint']?.toString(),
      apiEndpoint: json['apiEndpoint']?.toString(),
      apiHost: json['apiHost']?.toString(),
      apiVersion: json['apiVersion']?.toString(),
      webhookCallbackUrl: json['webhookCallbackUrl']?.toString(),
      configSnapshot: _sdkworkAsMap(json['configSnapshot'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'name': name,
      'status': status,
      'environment': environment,
      'region': region,
      'providerApplicationId': providerApplicationId,
      'providerApplicationIdKind': providerApplicationIdKind,
      'accessEndpoint': accessEndpoint,
      'apiEndpoint': apiEndpoint,
      'apiHost': apiHost,
      'apiVersion': apiVersion,
      'webhookCallbackUrl': webhookCallbackUrl,
      'configSnapshot': configSnapshot,
    };
  }
}

class RtcProviderApplicationDisableRequest {
  final String? reason;

  RtcProviderApplicationDisableRequest({
    this.reason
  });

  factory RtcProviderApplicationDisableRequest.fromJson(Map<String, dynamic> json) {
    return RtcProviderApplicationDisableRequest(
      reason: json['reason']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'reason': reason,
    };
  }
}

class RtcProviderApplicationListResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcProviderApplicationListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderApplicationListResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderApplicationListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcProviderApplicationResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcProviderApplication? data;

  RtcProviderApplicationResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderApplicationResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderApplicationResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcProviderApplication.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcProviderCredential {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? providerAccountId;
  final String? providerApplicationId;
  final String? provider;
  final String? credentialRole;
  final String? credentialLabel;
  final String? credentialRef;
  final String? credentialFingerprint;
  final String? secretVersion;
  final String? status;
  final String? validFrom;
  final String? expiresAt;
  final String? rotationDueAt;
  final String? rotatedAt;
  final String? revokedAt;
  final String? lastVerifiedAt;
  final String? lastUsedAt;
  final String? createdBy;
  final String? updatedBy;
  final String? createdAt;
  final String? updatedAt;
  final String? version;

  RtcProviderCredential({
    this.id,
    this.tenantId,
    this.organizationId,
    this.providerAccountId,
    this.providerApplicationId,
    this.provider,
    this.credentialRole,
    this.credentialLabel,
    this.credentialRef,
    this.credentialFingerprint,
    this.secretVersion,
    this.status,
    this.validFrom,
    this.expiresAt,
    this.rotationDueAt,
    this.rotatedAt,
    this.revokedAt,
    this.lastVerifiedAt,
    this.lastUsedAt,
    this.createdBy,
    this.updatedBy,
    this.createdAt,
    this.updatedAt,
    this.version
  });

  factory RtcProviderCredential.fromJson(Map<String, dynamic> json) {
    return RtcProviderCredential(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      providerAccountId: json['providerAccountId']?.toString(),
      providerApplicationId: json['providerApplicationId']?.toString(),
      provider: json['provider']?.toString(),
      credentialRole: json['credentialRole']?.toString(),
      credentialLabel: json['credentialLabel']?.toString(),
      credentialRef: json['credentialRef']?.toString(),
      credentialFingerprint: json['credentialFingerprint']?.toString(),
      secretVersion: json['secretVersion']?.toString(),
      status: json['status']?.toString(),
      validFrom: json['validFrom']?.toString(),
      expiresAt: json['expiresAt']?.toString(),
      rotationDueAt: json['rotationDueAt']?.toString(),
      rotatedAt: json['rotatedAt']?.toString(),
      revokedAt: json['revokedAt']?.toString(),
      lastVerifiedAt: json['lastVerifiedAt']?.toString(),
      lastUsedAt: json['lastUsedAt']?.toString(),
      createdBy: json['createdBy']?.toString(),
      updatedBy: json['updatedBy']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      version: json['version']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'providerAccountId': providerAccountId,
      'providerApplicationId': providerApplicationId,
      'provider': provider,
      'credentialRole': credentialRole,
      'credentialLabel': credentialLabel,
      'credentialRef': credentialRef,
      'credentialFingerprint': credentialFingerprint,
      'secretVersion': secretVersion,
      'status': status,
      'validFrom': validFrom,
      'expiresAt': expiresAt,
      'rotationDueAt': rotationDueAt,
      'rotatedAt': rotatedAt,
      'revokedAt': revokedAt,
      'lastVerifiedAt': lastVerifiedAt,
      'lastUsedAt': lastUsedAt,
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'version': version,
    };
  }
}

class RtcProviderCredentialCommand {
  final String? credentialRole;
  final String? credentialLabel;
  final String? credentialRef;
  final String? credentialFingerprint;
  final String? secretVersion;
  final String? status;
  final String? validFrom;
  final String? expiresAt;
  final String? rotationDueAt;

  RtcProviderCredentialCommand({
    this.credentialRole,
    this.credentialLabel,
    this.credentialRef,
    this.credentialFingerprint,
    this.secretVersion,
    this.status,
    this.validFrom,
    this.expiresAt,
    this.rotationDueAt
  });

  factory RtcProviderCredentialCommand.fromJson(Map<String, dynamic> json) {
    return RtcProviderCredentialCommand(
      credentialRole: json['credentialRole']?.toString(),
      credentialLabel: json['credentialLabel']?.toString(),
      credentialRef: json['credentialRef']?.toString(),
      credentialFingerprint: json['credentialFingerprint']?.toString(),
      secretVersion: json['secretVersion']?.toString(),
      status: json['status']?.toString(),
      validFrom: json['validFrom']?.toString(),
      expiresAt: json['expiresAt']?.toString(),
      rotationDueAt: json['rotationDueAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'credentialRole': credentialRole,
      'credentialLabel': credentialLabel,
      'credentialRef': credentialRef,
      'credentialFingerprint': credentialFingerprint,
      'secretVersion': secretVersion,
      'status': status,
      'validFrom': validFrom,
      'expiresAt': expiresAt,
      'rotationDueAt': rotationDueAt,
    };
  }
}

class RtcProviderCredentialRevokeRequest {
  final String? reason;

  RtcProviderCredentialRevokeRequest({
    this.reason
  });

  factory RtcProviderCredentialRevokeRequest.fromJson(Map<String, dynamic> json) {
    return RtcProviderCredentialRevokeRequest(
      reason: json['reason']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'reason': reason,
    };
  }
}

class RtcProviderCredentialListResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcProviderCredentialListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderCredentialListResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderCredentialListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcProviderCredentialResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcProviderCredential? data;

  RtcProviderCredentialResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderCredentialResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderCredentialResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcProviderCredential.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcProviderProfile {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? provider;
  final String? code;
  final String? name;
  final String? status;
  final bool? isDefault;
  final int? priority;
  final String? environment;
  final String? region;
  final String? providerAppId;
  final String? endpoint;
  final String? credentialRef;
  final String? credentialFingerprint;
  final String? webhookSecretRef;
  final String? webhookSecretFingerprint;
  final RtcProviderCapabilitySnapshot? capabilities;
  final Map<String, dynamic>? configSnapshot;
  final String? healthStatus;
  final String? lastVerifiedAt;
  final int? lastVerificationLatencyMs;
  final String? lastVerificationError;
  final String? createdAt;
  final String? updatedAt;
  final String? version;

  RtcProviderProfile({
    this.id,
    this.tenantId,
    this.organizationId,
    this.provider,
    this.code,
    this.name,
    this.status,
    this.isDefault,
    this.priority,
    this.environment,
    this.region,
    this.providerAppId,
    this.endpoint,
    this.credentialRef,
    this.credentialFingerprint,
    this.webhookSecretRef,
    this.webhookSecretFingerprint,
    this.capabilities,
    this.configSnapshot,
    this.healthStatus,
    this.lastVerifiedAt,
    this.lastVerificationLatencyMs,
    this.lastVerificationError,
    this.createdAt,
    this.updatedAt,
    this.version
  });

  factory RtcProviderProfile.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfile(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      provider: json['provider']?.toString(),
      code: json['code']?.toString(),
      name: json['name']?.toString(),
      status: json['status']?.toString(),
      isDefault: json['isDefault'] is bool ? json['isDefault'] : null,
      priority: json['priority'] is int ? json['priority'] : null,
      environment: json['environment']?.toString(),
      region: json['region']?.toString(),
      providerAppId: json['providerAppId']?.toString(),
      endpoint: json['endpoint']?.toString(),
      credentialRef: json['credentialRef']?.toString(),
      credentialFingerprint: json['credentialFingerprint']?.toString(),
      webhookSecretRef: json['webhookSecretRef']?.toString(),
      webhookSecretFingerprint: json['webhookSecretFingerprint']?.toString(),
      capabilities: (() {
        final map = _sdkworkAsMap(json['capabilities']);
        return map == null ? null : RtcProviderCapabilitySnapshot.fromJson(map);
      })(),
      configSnapshot: _sdkworkAsMap(json['configSnapshot']),
      healthStatus: json['healthStatus']?.toString(),
      lastVerifiedAt: json['lastVerifiedAt']?.toString(),
      lastVerificationLatencyMs: json['lastVerificationLatencyMs'] is int ? json['lastVerificationLatencyMs'] : null,
      lastVerificationError: json['lastVerificationError']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      version: json['version']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'provider': provider,
      'code': code,
      'name': name,
      'status': status,
      'isDefault': isDefault,
      'priority': priority,
      'environment': environment,
      'region': region,
      'providerAppId': providerAppId,
      'endpoint': endpoint,
      'credentialRef': credentialRef,
      'credentialFingerprint': credentialFingerprint,
      'webhookSecretRef': webhookSecretRef,
      'webhookSecretFingerprint': webhookSecretFingerprint,
      'capabilities': capabilities?.toJson(),
      'configSnapshot': configSnapshot,
      'healthStatus': healthStatus,
      'lastVerifiedAt': lastVerifiedAt,
      'lastVerificationLatencyMs': lastVerificationLatencyMs,
      'lastVerificationError': lastVerificationError,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'version': version,
    };
  }
}

class RtcProviderCapabilitySnapshot {
  final bool? audio;
  final bool? video;
  final bool? live;
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

class RtcProviderProfileCommand {
  final String? provider;
  final String? code;
  final String? name;
  final String? status;
  final bool? isDefault;
  final int? priority;
  final String? environment;
  final String? region;
  final String? providerAppId;
  final String? endpoint;
  final String? credentialRef;
  final String? webhookSecretRef;
  final RtcProviderCapabilitySnapshot? capabilities;
  final Map<String, dynamic>? configSnapshot;

  RtcProviderProfileCommand({
    this.provider,
    this.code,
    this.name,
    this.status,
    this.isDefault,
    this.priority,
    this.environment,
    this.region,
    this.providerAppId,
    this.endpoint,
    this.credentialRef,
    this.webhookSecretRef,
    this.capabilities,
    this.configSnapshot
  });

  factory RtcProviderProfileCommand.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfileCommand(
      provider: json['provider']?.toString(),
      code: json['code']?.toString(),
      name: json['name']?.toString(),
      status: json['status']?.toString(),
      isDefault: json['isDefault'] is bool ? json['isDefault'] : null,
      priority: json['priority'] is int ? json['priority'] : null,
      environment: json['environment']?.toString(),
      region: json['region']?.toString(),
      providerAppId: json['providerAppId']?.toString(),
      endpoint: json['endpoint']?.toString(),
      credentialRef: json['credentialRef']?.toString(),
      webhookSecretRef: json['webhookSecretRef']?.toString(),
      capabilities: (() {
        final map = _sdkworkAsMap(json['capabilities']);
        return map == null ? null : RtcProviderCapabilitySnapshot.fromJson(map);
      })(),
      configSnapshot: _sdkworkAsMap(json['configSnapshot'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'provider': provider,
      'code': code,
      'name': name,
      'status': status,
      'isDefault': isDefault,
      'priority': priority,
      'environment': environment,
      'region': region,
      'providerAppId': providerAppId,
      'endpoint': endpoint,
      'credentialRef': credentialRef,
      'webhookSecretRef': webhookSecretRef,
      'capabilities': capabilities?.toJson(),
      'configSnapshot': configSnapshot,
    };
  }
}

class RtcProviderProfileDisableRequest {
  final String? reason;

  RtcProviderProfileDisableRequest({
    this.reason
  });

  factory RtcProviderProfileDisableRequest.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfileDisableRequest(
      reason: json['reason']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'reason': reason,
    };
  }
}

class RtcProviderProfileVerifyRequest {
  final String? queryKind;
  final int? timeoutMs;

  RtcProviderProfileVerifyRequest({
    this.queryKind,
    this.timeoutMs
  });

  factory RtcProviderProfileVerifyRequest.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfileVerifyRequest(
      queryKind: json['queryKind']?.toString(),
      timeoutMs: json['timeoutMs'] is int ? json['timeoutMs'] : null
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'queryKind': queryKind,
      'timeoutMs': timeoutMs,
    };
  }
}

class RtcProviderProfileVerifyResult {
  final String? providerProfileId;
  final String? provider;
  final String? status;
  final String? verifiedAt;
  final int? latencyMs;
  final List<RtcProviderProfileVerifyCheck>? checks;

  RtcProviderProfileVerifyResult({
    this.providerProfileId,
    this.provider,
    this.status,
    this.verifiedAt,
    this.latencyMs,
    this.checks
  });

  factory RtcProviderProfileVerifyResult.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfileVerifyResult(
      providerProfileId: json['providerProfileId']?.toString(),
      provider: json['provider']?.toString(),
      status: json['status']?.toString(),
      verifiedAt: json['verifiedAt']?.toString(),
      latencyMs: json['latencyMs'] is int ? json['latencyMs'] : null,
      checks: (() {
        final list = _sdkworkAsList(json['checks']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => (() {
        final map = _sdkworkAsMap(item);
        return map == null ? null : RtcProviderProfileVerifyCheck.fromJson(map);
      })())
            .whereType<RtcProviderProfileVerifyCheck>()
            .toList();
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'providerProfileId': providerProfileId,
      'provider': provider,
      'status': status,
      'verifiedAt': verifiedAt,
      'latencyMs': latencyMs,
      'checks': checks?.map((item) => item.toJson()).toList(),
    };
  }
}

class RtcProviderProfileVerifyCheck {
  final String? name;
  final String? status;
  final String? detail;

  RtcProviderProfileVerifyCheck({
    this.name,
    this.status,
    this.detail
  });

  factory RtcProviderProfileVerifyCheck.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfileVerifyCheck(
      name: json['name']?.toString(),
      status: json['status']?.toString(),
      detail: json['detail']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'name': name,
      'status': status,
      'detail': detail,
    };
  }
}

class RtcProviderProfileListResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcProviderProfileListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderProfileListResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfileListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcProviderProfileResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcProviderProfile? data;

  RtcProviderProfileResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderProfileResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfileResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcProviderProfile.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcProviderProfileVerifyResultResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcProviderProfileVerifyResult? data;

  RtcProviderProfileVerifyResultResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderProfileVerifyResultResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderProfileVerifyResultResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcProviderProfileVerifyResult.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcProviderRoute {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? providerProfileId;
  final String? routeType;
  final String? region;
  final int? priority;
  final String? status;

  RtcProviderRoute({
    this.id,
    this.tenantId,
    this.organizationId,
    this.providerProfileId,
    this.routeType,
    this.region,
    this.priority,
    this.status
  });

  factory RtcProviderRoute.fromJson(Map<String, dynamic> json) {
    return RtcProviderRoute(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      providerProfileId: json['providerProfileId']?.toString(),
      routeType: json['routeType']?.toString(),
      region: json['region']?.toString(),
      priority: json['priority'] is int ? json['priority'] : null,
      status: json['status']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'providerProfileId': providerProfileId,
      'routeType': routeType,
      'region': region,
      'priority': priority,
      'status': status,
    };
  }
}

class RtcProviderRouteCommand {
  final String? providerProfileId;
  final String? routeType;
  final String? region;
  final int? priority;
  final String? status;

  RtcProviderRouteCommand({
    this.providerProfileId,
    this.routeType,
    this.region,
    this.priority,
    this.status
  });

  factory RtcProviderRouteCommand.fromJson(Map<String, dynamic> json) {
    return RtcProviderRouteCommand(
      providerProfileId: json['providerProfileId']?.toString(),
      routeType: json['routeType']?.toString(),
      region: json['region']?.toString(),
      priority: json['priority'] is int ? json['priority'] : null,
      status: json['status']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'providerProfileId': providerProfileId,
      'routeType': routeType,
      'region': region,
      'priority': priority,
      'status': status,
    };
  }
}

class RtcProviderRouteDisableRequest {
  final String? reason;

  RtcProviderRouteDisableRequest({
    this.reason
  });

  factory RtcProviderRouteDisableRequest.fromJson(Map<String, dynamic> json) {
    return RtcProviderRouteDisableRequest(
      reason: json['reason']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'reason': reason,
    };
  }
}

class RtcProviderRouteListResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcProviderRouteListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderRouteListResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderRouteListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcProviderRouteResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcProviderRoute? data;

  RtcProviderRouteResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderRouteResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderRouteResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcProviderRoute.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcQualitySample {
  final String? id;
  final String? mediaSessionId;
  final String? participantId;
  final int? latencyMs;
  final String? packetLossRate;
  final int? jitterMs;
  final int? bitrateKbps;
  final String? sampledAt;

  RtcQualitySample({
    this.id,
    this.mediaSessionId,
    this.participantId,
    this.latencyMs,
    this.packetLossRate,
    this.jitterMs,
    this.bitrateKbps,
    this.sampledAt
  });

  factory RtcQualitySample.fromJson(Map<String, dynamic> json) {
    return RtcQualitySample(
      id: json['id']?.toString(),
      mediaSessionId: json['mediaSessionId']?.toString(),
      participantId: json['participantId']?.toString(),
      latencyMs: json['latencyMs'] is int ? json['latencyMs'] : null,
      packetLossRate: json['packetLossRate']?.toString(),
      jitterMs: json['jitterMs'] is int ? json['jitterMs'] : null,
      bitrateKbps: json['bitrateKbps'] is int ? json['bitrateKbps'] : null,
      sampledAt: json['sampledAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'mediaSessionId': mediaSessionId,
      'participantId': participantId,
      'latencyMs': latencyMs,
      'packetLossRate': packetLossRate,
      'jitterMs': jitterMs,
      'bitrateKbps': bitrateKbps,
      'sampledAt': sampledAt,
    };
  }
}

class RtcQualitySampleListResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcQualitySampleListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcQualitySampleListResponse.fromJson(Map<String, dynamic> json) {
    return RtcQualitySampleListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcProviderWebhookEvent {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? provider;
  final String? providerProfileId;
  final String? externalEventId;
  final String? eventType;
  final String? eventKind;
  final String? roomId;
  final String? mediaSessionId;
  final String? participantId;
  final String? recordingId;
  final String? payloadHash;
  final Map<String, dynamic>? rawPayload;
  final Map<String, dynamic>? normalizedEvent;
  final String? signatureHeader;
  final String? receivedAt;
  final String? processedAt;
  final String? status;

  RtcProviderWebhookEvent({
    this.id,
    this.tenantId,
    this.organizationId,
    this.provider,
    this.providerProfileId,
    this.externalEventId,
    this.eventType,
    this.eventKind,
    this.roomId,
    this.mediaSessionId,
    this.participantId,
    this.recordingId,
    this.payloadHash,
    this.rawPayload,
    this.normalizedEvent,
    this.signatureHeader,
    this.receivedAt,
    this.processedAt,
    this.status
  });

  factory RtcProviderWebhookEvent.fromJson(Map<String, dynamic> json) {
    return RtcProviderWebhookEvent(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      provider: json['provider']?.toString(),
      providerProfileId: json['providerProfileId']?.toString(),
      externalEventId: json['externalEventId']?.toString(),
      eventType: json['eventType']?.toString(),
      eventKind: json['eventKind']?.toString(),
      roomId: json['roomId']?.toString(),
      mediaSessionId: json['mediaSessionId']?.toString(),
      participantId: json['participantId']?.toString(),
      recordingId: json['recordingId']?.toString(),
      payloadHash: json['payloadHash']?.toString(),
      rawPayload: _sdkworkAsMap(json['rawPayload']),
      normalizedEvent: _sdkworkAsMap(json['normalizedEvent']),
      signatureHeader: json['signatureHeader']?.toString(),
      receivedAt: json['receivedAt']?.toString(),
      processedAt: json['processedAt']?.toString(),
      status: json['status']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'provider': provider,
      'providerProfileId': providerProfileId,
      'externalEventId': externalEventId,
      'eventType': eventType,
      'eventKind': eventKind,
      'roomId': roomId,
      'mediaSessionId': mediaSessionId,
      'participantId': participantId,
      'recordingId': recordingId,
      'payloadHash': payloadHash,
      'rawPayload': rawPayload,
      'normalizedEvent': normalizedEvent,
      'signatureHeader': signatureHeader,
      'receivedAt': receivedAt,
      'processedAt': processedAt,
      'status': status,
    };
  }
}

class RtcProviderWebhookReceiveRequest {
  final String? providerProfileId;
  final String? externalEventId;
  final String? signatureHeader;
  final Map<String, String>? headers;
  final Map<String, dynamic>? rawPayload;
  final String? receivedAt;

  RtcProviderWebhookReceiveRequest({
    this.providerProfileId,
    this.externalEventId,
    this.signatureHeader,
    this.headers,
    this.rawPayload,
    this.receivedAt
  });

  factory RtcProviderWebhookReceiveRequest.fromJson(Map<String, dynamic> json) {
    return RtcProviderWebhookReceiveRequest(
      providerProfileId: json['providerProfileId']?.toString(),
      externalEventId: json['externalEventId']?.toString(),
      signatureHeader: json['signatureHeader']?.toString(),
      headers: (() {
        final map = _sdkworkAsMap(json['headers']);
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
      })(),
      rawPayload: _sdkworkAsMap(json['rawPayload']),
      receivedAt: json['receivedAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'providerProfileId': providerProfileId,
      'externalEventId': externalEventId,
      'signatureHeader': signatureHeader,
      'headers': headers?.map((key, item) => MapEntry(key, item)),
      'rawPayload': rawPayload,
      'receivedAt': receivedAt,
    };
  }
}

class RtcProviderWebhookEventListResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcProviderWebhookEventListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderWebhookEventListResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderWebhookEventListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class RtcProviderWebhookEventResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcProviderWebhookEvent? data;

  RtcProviderWebhookEventResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderWebhookEventResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderWebhookEventResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcProviderWebhookEvent.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcProviderQueryJob {
  final String? id;
  final String? tenantId;
  final String? organizationId;
  final String? provider;
  final String? providerProfileId;
  final String? queryKind;
  final String? targetKind;
  final String? targetId;
  final String? roomId;
  final String? mediaSessionId;
  final String? providerSessionId;
  final String? providerRequestId;
  final String? status;
  final String? requestedAt;
  final String? completedAt;
  final Map<String, dynamic>? resultSnapshot;

  RtcProviderQueryJob({
    this.id,
    this.tenantId,
    this.organizationId,
    this.provider,
    this.providerProfileId,
    this.queryKind,
    this.targetKind,
    this.targetId,
    this.roomId,
    this.mediaSessionId,
    this.providerSessionId,
    this.providerRequestId,
    this.status,
    this.requestedAt,
    this.completedAt,
    this.resultSnapshot
  });

  factory RtcProviderQueryJob.fromJson(Map<String, dynamic> json) {
    return RtcProviderQueryJob(
      id: json['id']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString(),
      provider: json['provider']?.toString(),
      providerProfileId: json['providerProfileId']?.toString(),
      queryKind: json['queryKind']?.toString(),
      targetKind: json['targetKind']?.toString(),
      targetId: json['targetId']?.toString(),
      roomId: json['roomId']?.toString(),
      mediaSessionId: json['mediaSessionId']?.toString(),
      providerSessionId: json['providerSessionId']?.toString(),
      providerRequestId: json['providerRequestId']?.toString(),
      status: json['status']?.toString(),
      requestedAt: json['requestedAt']?.toString(),
      completedAt: json['completedAt']?.toString(),
      resultSnapshot: _sdkworkAsMap(json['resultSnapshot'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'provider': provider,
      'providerProfileId': providerProfileId,
      'queryKind': queryKind,
      'targetKind': targetKind,
      'targetId': targetId,
      'roomId': roomId,
      'mediaSessionId': mediaSessionId,
      'providerSessionId': providerSessionId,
      'providerRequestId': providerRequestId,
      'status': status,
      'requestedAt': requestedAt,
      'completedAt': completedAt,
      'resultSnapshot': resultSnapshot,
    };
  }
}

class RtcProviderQueryJobCreateRequest {
  final String? provider;
  final String? providerProfileId;
  final String? queryKind;
  final String? roomId;
  final String? mediaSessionId;
  final String? providerSessionId;
  final String? cursor;

  RtcProviderQueryJobCreateRequest({
    this.provider,
    this.providerProfileId,
    this.queryKind,
    this.roomId,
    this.mediaSessionId,
    this.providerSessionId,
    this.cursor
  });

  factory RtcProviderQueryJobCreateRequest.fromJson(Map<String, dynamic> json) {
    return RtcProviderQueryJobCreateRequest(
      provider: json['provider']?.toString(),
      providerProfileId: json['providerProfileId']?.toString(),
      queryKind: json['queryKind']?.toString(),
      roomId: json['roomId']?.toString(),
      mediaSessionId: json['mediaSessionId']?.toString(),
      providerSessionId: json['providerSessionId']?.toString(),
      cursor: json['cursor']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'provider': provider,
      'providerProfileId': providerProfileId,
      'queryKind': queryKind,
      'roomId': roomId,
      'mediaSessionId': mediaSessionId,
      'providerSessionId': providerSessionId,
      'cursor': cursor,
    };
  }
}

class RtcProviderQueryJobResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final RtcProviderQueryJob? data;

  RtcProviderQueryJobResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderQueryJobResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderQueryJobResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        return map == null ? null : RtcProviderQueryJob.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data?.toJson(),
    };
  }
}

class RtcProviderQuerySnapshot {
  final String? id;
  final String? providerQueryJobId;
  final String? provider;
  final String? queryKind;
  final String? targetKind;
  final String? targetId;
  final String? providerSessionId;
  final String? snapshotKind;
  final Map<String, dynamic>? snapshotPayload;
  final String? capturedAt;

  RtcProviderQuerySnapshot({
    this.id,
    this.providerQueryJobId,
    this.provider,
    this.queryKind,
    this.targetKind,
    this.targetId,
    this.providerSessionId,
    this.snapshotKind,
    this.snapshotPayload,
    this.capturedAt
  });

  factory RtcProviderQuerySnapshot.fromJson(Map<String, dynamic> json) {
    return RtcProviderQuerySnapshot(
      id: json['id']?.toString(),
      providerQueryJobId: json['providerQueryJobId']?.toString(),
      provider: json['provider']?.toString(),
      queryKind: json['queryKind']?.toString(),
      targetKind: json['targetKind']?.toString(),
      targetId: json['targetId']?.toString(),
      providerSessionId: json['providerSessionId']?.toString(),
      snapshotKind: json['snapshotKind']?.toString(),
      snapshotPayload: _sdkworkAsMap(json['snapshotPayload']),
      capturedAt: json['capturedAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'providerQueryJobId': providerQueryJobId,
      'provider': provider,
      'queryKind': queryKind,
      'targetKind': targetKind,
      'targetId': targetId,
      'providerSessionId': providerSessionId,
      'snapshotKind': snapshotKind,
      'snapshotPayload': snapshotPayload,
      'capturedAt': capturedAt,
    };
  }
}

class RtcProviderQuerySnapshotListResponse {
  final String? code;
  final String? message;
  final String? requestId;
  final Map<String, dynamic>? data;

  RtcProviderQuerySnapshotListResponse({
    this.code,
    this.message,
    this.requestId,
    this.data
  });

  factory RtcProviderQuerySnapshotListResponse.fromJson(Map<String, dynamic> json) {
    return RtcProviderQuerySnapshotListResponse(
      code: json['code']?.toString(),
      message: json['message']?.toString(),
      requestId: json['requestId']?.toString(),
      data: _sdkworkAsMap(json['data'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
    };
  }
}

class ProblemDetail {
  final String? type;
  final String? title;
  final int? status;
  final String? detail;
  final String? instance;
  final String? code;
  final String? traceId;
  final String? requestId;
  final List<FieldError>? errors;

  ProblemDetail({
    this.type,
    this.title,
    this.status,
    this.detail,
    this.instance,
    this.code,
    this.traceId,
    this.requestId,
    this.errors
  });

  factory ProblemDetail.fromJson(Map<String, dynamic> json) {
    return ProblemDetail(
      type: json['type']?.toString(),
      title: json['title']?.toString(),
      status: json['status'] is int ? json['status'] : null,
      detail: json['detail']?.toString(),
      instance: json['instance']?.toString(),
      code: json['code']?.toString(),
      traceId: json['traceId']?.toString(),
      requestId: json['requestId']?.toString(),
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
      'requestId': requestId,
      'errors': errors?.map((item) => item.toJson()).toList(),
    };
  }
}

class FieldError {
  final String? field;
  final String? message;
  final String? code;

  FieldError({
    this.field,
    this.message,
    this.code
  });

  factory FieldError.fromJson(Map<String, dynamic> json) {
    return FieldError(
      field: json['field']?.toString(),
      message: json['message']?.toString(),
      code: json['code']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'field': field,
      'message': message,
      'code': code,
    };
  }
}
