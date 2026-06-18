class ProviderWebhookEvent {
  final String id;
  final String? tenantId;
  final String? organizationId;
  final String provider;
  final String? providerProfileId;
  final String? externalEventId;
  final String eventType;
  final String eventKind;
  final String? roomId;
  final String? mediaSessionId;
  final String? participantId;
  final String? recordingId;
  final String payloadHash;
  final String status;
  final String receivedAt;
  final String? processedAt;

  ProviderWebhookEvent({
    required this.id,
    this.tenantId,
    this.organizationId,
    required this.provider,
    this.providerProfileId,
    this.externalEventId,
    required this.eventType,
    required this.eventKind,
    this.roomId,
    this.mediaSessionId,
    this.participantId,
    this.recordingId,
    required this.payloadHash,
    required this.status,
    required this.receivedAt,
    this.processedAt,
  });

  factory ProviderWebhookEvent.fromJson(Map<String, dynamic> json) {
    return ProviderWebhookEvent(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String?,
      organizationId: json['organizationId'] as String?,
      provider: json['provider'] as String,
      providerProfileId: json['providerProfileId'] as String?,
      externalEventId: json['externalEventId'] as String?,
      eventType: json['eventType'] as String,
      eventKind: json['eventKind'] as String,
      roomId: json['roomId'] as String?,
      mediaSessionId: json['mediaSessionId'] as String?,
      participantId: json['participantId'] as String?,
      recordingId: json['recordingId'] as String?,
      payloadHash: json['payloadHash'] as String,
      status: json['status'] as String,
      receivedAt: json['receivedAt'] as String,
      processedAt: json['processedAt'] as String?,
    );
  }
}
