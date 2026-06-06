class RtcSdkException implements Exception {
  const RtcSdkException({
    required this.code,
    required this.message,
    this.providerKey,
    this.pluginId,
    this.details,
    this.cause,
  });

  final String code;
  final String message;
  final String? providerKey;
  final String? pluginId;
  final Map<String, Object?>? details;
  final Object? cause;

  Map<String, Object?> toDebugMap() {
    return <String, Object?>{
      'code': code,
      'message': message,
      'providerKey': providerKey,
      'pluginId': pluginId,
      'details': details,
      'cause': cause?.toString(),
    };
  }

  @override
  String toString() => 'RtcSdkException($code): $message';
}
