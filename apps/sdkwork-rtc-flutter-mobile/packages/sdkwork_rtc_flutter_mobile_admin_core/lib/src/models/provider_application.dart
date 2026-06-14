class ProviderApplication {
  final String id;
  final String tenantId;
  final String organizationId;
  final String providerAccountId;
  final String provider;
  final String code;
  final String name;
  final String status;
  final String environment;
  final String? region;
  final String providerApplicationId;
  final String providerApplicationIdKind;
  final String? accessEndpoint;
  final String? apiEndpoint;
  final String? apiHost;
  final String? apiVersion;
  final String? webhookCallbackUrl;
  final Map<String, dynamic> configSnapshot;
  final String? lastVerifiedAt;
  final String? lastVerificationError;
  final String? createdBy;
  final String? updatedBy;
  final String? createdAt;
  final String? updatedAt;
  final String version;
  final String? deletedAt;
  final String? deletedBy;

  ProviderApplication({
    required this.id,
    required this.tenantId,
    required this.organizationId,
    required this.providerAccountId,
    required this.provider,
    required this.code,
    required this.name,
    required this.status,
    required this.environment,
    this.region,
    required this.providerApplicationId,
    required this.providerApplicationIdKind,
    this.accessEndpoint,
    this.apiEndpoint,
    this.apiHost,
    this.apiVersion,
    this.webhookCallbackUrl,
    required this.configSnapshot,
    this.lastVerifiedAt,
    this.lastVerificationError,
    this.createdBy,
    this.updatedBy,
    this.createdAt,
    this.updatedAt,
    required this.version,
    this.deletedAt,
    this.deletedBy,
  });

  factory ProviderApplication.fromJson(Map<String, dynamic> json) {
    return ProviderApplication(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      organizationId: json['organizationId'] as String,
      providerAccountId: json['providerAccountId'] as String,
      provider: json['provider'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      status: json['status'] as String,
      environment: json['environment'] as String,
      region: json['region'] as String?,
      providerApplicationId: json['providerApplicationId'] as String,
      providerApplicationIdKind: json['providerApplicationIdKind'] as String,
      accessEndpoint: json['accessEndpoint'] as String?,
      apiEndpoint: json['apiEndpoint'] as String?,
      apiHost: json['apiHost'] as String?,
      apiVersion: json['apiVersion'] as String?,
      webhookCallbackUrl: json['webhookCallbackUrl'] as String?,
      configSnapshot: (json['configSnapshot'] as Map<String, dynamic>?) ?? {},
      lastVerifiedAt: json['lastVerifiedAt'] as String?,
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

class ProviderApplicationCommand {
  final String code;
  final String name;
  final String? status;
  final String environment;
  final String? region;
  final String providerApplicationId;
  final String providerApplicationIdKind;
  final String? accessEndpoint;
  final String? apiEndpoint;
  final String? apiHost;
  final String? apiVersion;
  final String? webhookCallbackUrl;
  final Map<String, dynamic> configSnapshot;

  ProviderApplicationCommand({
    required this.code,
    required this.name,
    this.status,
    required this.environment,
    this.region,
    required this.providerApplicationId,
    required this.providerApplicationIdKind,
    this.accessEndpoint,
    this.apiEndpoint,
    this.apiHost,
    this.apiVersion,
    this.webhookCallbackUrl,
    required this.configSnapshot,
  });

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'name': name,
      if (status != null) 'status': status,
      'environment': environment,
      if (region != null) 'region': region,
      'providerApplicationId': providerApplicationId,
      'providerApplicationIdKind': providerApplicationIdKind,
      if (accessEndpoint != null) 'accessEndpoint': accessEndpoint,
      if (apiEndpoint != null) 'apiEndpoint': apiEndpoint,
      if (apiHost != null) 'apiHost': apiHost,
      if (apiVersion != null) 'apiVersion': apiVersion,
      if (webhookCallbackUrl != null) 'webhookCallbackUrl': webhookCallbackUrl,
      'configSnapshot': configSnapshot,
    };
  }
}
