class RtcActiveProviderProfile {
  final String id;
  final String provider;
  final String code;
  final String name;
  final bool isDefault;
  final int priority;
  final String environment;
  final String? providerAppId;
  final String healthStatus;

  const RtcActiveProviderProfile({
    required this.id,
    required this.provider,
    required this.code,
    required this.name,
    required this.isDefault,
    required this.priority,
    required this.environment,
    this.providerAppId,
    required this.healthStatus,
  });

  factory RtcActiveProviderProfile.fromJson(Map<String, dynamic> json) {
    return RtcActiveProviderProfile(
      id: json['id'] as String,
      provider: json['provider'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      isDefault: json['isDefault'] as bool,
      priority: json['priority'] as int,
      environment: json['environment'] as String,
      providerAppId: json['providerAppId'] as String?,
      healthStatus: json['healthStatus'] as String,
    );
  }
}
