class ProviderQueryJob {
  final String id;
  final String? tenantId;
  final String? organizationId;
  final String provider;
  final String? providerProfileId;
  final String queryKind;
  final String targetKind;
  final String targetId;
  final String? roomId;
  final String? mediaSessionId;
  final String status;
  final String requestedAt;
  final String? completedAt;
  final Map<String, dynamic>? resultSnapshot;

  ProviderQueryJob({
    required this.id,
    this.tenantId,
    this.organizationId,
    required this.provider,
    this.providerProfileId,
    required this.queryKind,
    required this.targetKind,
    required this.targetId,
    this.roomId,
    this.mediaSessionId,
    required this.status,
    required this.requestedAt,
    this.completedAt,
    this.resultSnapshot,
  });

  factory ProviderQueryJob.fromJson(Map<String, dynamic> json) {
    return ProviderQueryJob(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String?,
      organizationId: json['organizationId'] as String?,
      provider: json['provider'] as String,
      providerProfileId: json['providerProfileId'] as String?,
      queryKind: json['queryKind'] as String,
      targetKind: json['targetKind'] as String,
      targetId: json['targetId'] as String,
      roomId: json['roomId'] as String?,
      mediaSessionId: json['mediaSessionId'] as String?,
      status: json['status'] as String,
      requestedAt: json['requestedAt'] as String,
      completedAt: json['completedAt'] as String?,
      resultSnapshot: json['resultSnapshot'] as Map<String, dynamic>?,
    );
  }
}

class ProviderQueryJobCreateCommand {
  final String provider;
  final String? providerProfileId;
  final String queryKind;
  final String? roomId;
  final String? mediaSessionId;
  final String? providerSessionId;
  final String? cursor;

  ProviderQueryJobCreateCommand({
    required this.provider,
    this.providerProfileId,
    required this.queryKind,
    this.roomId,
    this.mediaSessionId,
    this.providerSessionId,
    this.cursor,
  });

  Map<String, dynamic> toJson() {
    return {
      'provider': provider,
      if (providerProfileId != null) 'providerProfileId': providerProfileId,
      'queryKind': queryKind,
      if (roomId != null) 'roomId': roomId,
      if (mediaSessionId != null) 'mediaSessionId': mediaSessionId,
      if (providerSessionId != null) 'providerSessionId': providerSessionId,
      if (cursor != null) 'cursor': cursor,
    };
  }
}

class ProviderQuerySnapshot {
  final String id;
  final String providerQueryJobId;
  final String provider;
  final String queryKind;
  final String targetKind;
  final String targetId;
  final String? providerSessionId;
  final String snapshotKind;
  final Map<String, dynamic> snapshotPayload;
  final String capturedAt;

  ProviderQuerySnapshot({
    required this.id,
    required this.providerQueryJobId,
    required this.provider,
    required this.queryKind,
    required this.targetKind,
    required this.targetId,
    this.providerSessionId,
    required this.snapshotKind,
    required this.snapshotPayload,
    required this.capturedAt,
  });

  factory ProviderQuerySnapshot.fromJson(Map<String, dynamic> json) {
    return ProviderQuerySnapshot(
      id: json['id'] as String,
      providerQueryJobId: json['providerQueryJobId'] as String,
      provider: json['provider'] as String,
      queryKind: json['queryKind'] as String,
      targetKind: json['targetKind'] as String,
      targetId: json['targetId'] as String,
      providerSessionId: json['providerSessionId'] as String?,
      snapshotKind: json['snapshotKind'] as String,
      snapshotPayload: (json['snapshotPayload'] as Map<String, dynamic>?) ?? {},
      capturedAt: json['capturedAt'] as String,
    );
  }
}
