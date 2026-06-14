class ProviderCredential {
  final String id;
  final String tenantId;
  final String organizationId;
  final String providerAccountId;
  final String providerApplicationId;
  final String provider;
  final String credentialRole;
  final String credentialLabel;
  final String credentialRef;
  final String? credentialFingerprint;
  final String? secretVersion;
  final String status;
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
  final String version;

  ProviderCredential({
    required this.id,
    required this.tenantId,
    required this.organizationId,
    required this.providerAccountId,
    required this.providerApplicationId,
    required this.provider,
    required this.credentialRole,
    required this.credentialLabel,
    required this.credentialRef,
    this.credentialFingerprint,
    this.secretVersion,
    required this.status,
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
    required this.version,
  });

  factory ProviderCredential.fromJson(Map<String, dynamic> json) {
    return ProviderCredential(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      organizationId: json['organizationId'] as String,
      providerAccountId: json['providerAccountId'] as String,
      providerApplicationId: json['providerApplicationId'] as String,
      provider: json['provider'] as String,
      credentialRole: json['credentialRole'] as String,
      credentialLabel: json['credentialLabel'] as String,
      credentialRef: json['credentialRef'] as String,
      credentialFingerprint: json['credentialFingerprint'] as String?,
      secretVersion: json['secretVersion'] as String?,
      status: json['status'] as String,
      validFrom: json['validFrom'] as String?,
      expiresAt: json['expiresAt'] as String?,
      rotationDueAt: json['rotationDueAt'] as String?,
      rotatedAt: json['rotatedAt'] as String?,
      revokedAt: json['revokedAt'] as String?,
      lastVerifiedAt: json['lastVerifiedAt'] as String?,
      lastUsedAt: json['lastUsedAt'] as String?,
      createdBy: json['createdBy'] as String?,
      updatedBy: json['updatedBy'] as String?,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      version: json['version'] as String,
    );
  }
}

class ProviderCredentialCommand {
  final String credentialRole;
  final String credentialLabel;
  final String credentialRef;
  final String? credentialFingerprint;
  final String? secretVersion;
  final String? status;
  final String? validFrom;
  final String? expiresAt;
  final String? rotationDueAt;

  ProviderCredentialCommand({
    required this.credentialRole,
    required this.credentialLabel,
    required this.credentialRef,
    this.credentialFingerprint,
    this.secretVersion,
    this.status,
    this.validFrom,
    this.expiresAt,
    this.rotationDueAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'credentialRole': credentialRole,
      'credentialLabel': credentialLabel,
      'credentialRef': credentialRef,
      if (credentialFingerprint != null) 'credentialFingerprint': credentialFingerprint,
      if (secretVersion != null) 'secretVersion': secretVersion,
      if (status != null) 'status': status,
      if (validFrom != null) 'validFrom': validFrom,
      if (expiresAt != null) 'expiresAt': expiresAt,
      if (rotationDueAt != null) 'rotationDueAt': rotationDueAt,
    };
  }
}
