class RtcConversationSignalMessage {
  const RtcConversationSignalMessage({
    required this.conversationId,
    required this.signalType,
    this.payload,
    required this.rawPayload,
    this.schemaRef,
    this.occurredAt,
  });

  final String conversationId;
  final String signalType;
  final Object? payload;
  final String rawPayload;
  final String? schemaRef;
  final String? occurredAt;
}

typedef RtcConversationSignalHandler = void Function(
  RtcConversationSignalMessage signal,
);
