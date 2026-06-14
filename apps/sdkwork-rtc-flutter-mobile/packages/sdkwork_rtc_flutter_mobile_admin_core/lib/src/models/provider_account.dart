class ProviderAccount {
  final String id;
  final String tenantId;
  final String organizationId;
  final String provider;
  final String code;
  final String name;
  final String status;
  final String environment;
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
  final String version;
  final String? deletedAt;
  final String? deletedBy;

  ProviderAccount({
    required this.id,
    required this.tenantId,
    required this.organizationId,
    required this.provider,
    required this.code,
    required this.name,
    required this.status,
    required this.environment,
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
    required this.version,
    this.deletedAt,
    this.deletedBy,
  });

  factory ProviderAccount.fromJson(Map<String, dynamic> json) {
    return ProviderAccount(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      organizationId: json['organizationId'] as String,
      provider: json['provider'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      status: json['status'] as String,
      environment: json['environment'] as String,
      externalTenantId: json['externalTenantId'] as String?,
      cloudAccountId: json['cloudAccountId'] as String?,
      projectId: json['projectId'] as String?,
      resourceGroupId: json['resourceGroupId'] as String?,
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

class ProviderAccountCommand {
  final String provider;
  final String code;
  final String name;
  final String? status;
  final String environment;
  final String? externalTenantId;
  final String? cloudAccountId;
  final String? projectId;
  final String? resourceGroupId;

  ProviderAccountCommand({
    required this.provider,
    required this.code,
    required this.name,
    this.status,
    required this.environment,
    this.externalTenantId,
    this.cloudAccountId,
    this.projectId,
    this.resourceGroupId,
  });

  Map<String, dynamic> toJson() {
    return {
      'provider': provider,
      'code': code,
      'name': name,
      if (status != null) 'status': status,
      'environment': environment,
      if (externalTenantId != null) 'externalTenantId': externalTenantId,
      if (cloudAccountId != null) 'cloudAccountId': cloudAccountId,
      if (projectId != null) 'projectId': projectId,
      if (resourceGroupId != null) 'resourceGroupId': resourceGroupId,
    };
  }
}
