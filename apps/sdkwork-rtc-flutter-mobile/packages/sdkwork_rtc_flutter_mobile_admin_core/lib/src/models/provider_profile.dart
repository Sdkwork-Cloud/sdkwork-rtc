class ProviderProfile {
  final String id;
  final String tenantId;
  final String organizationId;
  final String provider;
  final String code;
  final String name;
  final String status;
  final bool isDefault;
  final int priority;
  final String environment;
  final String? region;
  final String? providerAppId;
  final String? endpoint;
  final String? credentialRef;
  final String? credentialFingerprint;
  final String? webhookSecretRef;
  final String? webhookSecretFingerprint;
  final Map<String, dynamic> capabilities;
  final Map<String, dynamic> configSnapshot;
  final String healthStatus;
  final String? lastVerifiedAt;
  final int? lastVerificationLatencyMs;
  final String? lastVerificationError;
  final String? createdBy;
  final String? updatedBy;
  final String? createdAt;
  final String? updatedAt;
  final String version;
  final String? deletedAt;
  final String? deletedBy;

  ProviderProfile({
    required this.id,
    required this.tenantId,
    required this.organizationId,
    required this.provider,
    required this.code,
    required this.name,
    required this.status,
    required this.isDefault,
    required this.priority,
    required this.environment,
    this.region,
    this.providerAppId,
    this.endpoint,
    this.credentialRef,
    this.credentialFingerprint,
    this.webhookSecretRef,
    this.webhookSecretFingerprint,
    required this.capabilities,
    required this.configSnapshot,
    required this.healthStatus,
    this.lastVerifiedAt,
    this.lastVerificationLatencyMs,
    this.lastVerificationError,
    this.createdBy,
    this.updatedBy,
    this.createdAt,
    this.updatedAt,
    required this.version,
    this.deletedAt,
    this.deletedBy,
  });

  factory ProviderProfile.fromJson(Map<String, dynamic> json) {
    return ProviderProfile(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      organizationId: json['organizationId'] as String,
      provider: json['provider'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      status: json['status'] as String,
      isDefault: json['isDefault'] as bool,
      priority: json['priority'] as int,
      environment: json['environment'] as String,
      region: json['region'] as String?,
      providerAppId: json['providerAppId'] as String?,
      endpoint: json['endpoint'] as String?,
      credentialRef: json['credentialRef'] as String?,
      credentialFingerprint: json['credentialFingerprint'] as String?,
      webhookSecretRef: json['webhookSecretRef'] as String?,
      webhookSecretFingerprint: json['webhookSecretFingerprint'] as String?,
      capabilities: (json['capabilities'] as Map<String, dynamic>?) ?? {},
      configSnapshot: (json['configSnapshot'] as Map<String, dynamic>?) ?? {},
      healthStatus: json['healthStatus'] as String,
      lastVerifiedAt: json['lastVerifiedAt'] as String?,
      lastVerificationLatencyMs: json['lastVerificationLatencyMs'] as int?,
      lastVerificationError: json['lastVerificationError'] as String?,
      createdBy: json['createdBy'] as String?,
      updatedBy: json['updatedBy'] as String?,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      version: json['version'] as String,
      deletedAt: json['deletedAt'] as String?,
      deletedBy: json['deletedBy'] as String?,
    );
  }
}

class ProviderProfileCommand {
  final String provider;
  final String code;
  final String name;
  final String? status;
  final bool isDefault;
  final int priority;
  final String environment;
  final String? region;
  final String? providerAppId;
  final String? endpoint;
  final String? credentialRef;
  final String? webhookSecretRef;
  final Map<String, dynamic> capabilities;
  final Map<String, dynamic> configSnapshot;

  ProviderProfileCommand({
    required this.provider,
    required this.code,
    required this.name,
    this.status,
    required this.isDefault,
    required this.priority,
    required this.environment,
    this.region,
    this.providerAppId,
    this.endpoint,
    this.credentialRef,
    this.webhookSecretRef,
    required this.capabilities,
    required this.configSnapshot,
  });

  Map<String, dynamic> toJson() {
    return {
      'provider': provider,
      'code': code,
      'name': name,
      if (status != null) 'status': status,
      'isDefault': isDefault,
      'priority': priority,
      'environment': environment,
      if (region != null) 'region': region,
      if (providerAppId != null) 'providerAppId': providerAppId,
      if (endpoint != null) 'endpoint': endpoint,
      if (credentialRef != null) 'credentialRef': credentialRef,
      if (webhookSecretRef != null) 'webhookSecretRef': webhookSecretRef,
      'capabilities': capabilities,
      'configSnapshot': configSnapshot,
    };
  }
}
