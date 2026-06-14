class ConfigFieldSchema {
  final String key;
  final String label;
  final String type;
  final bool required;
  final dynamic defaultValue;
  final String? placeholder;
  final List<String>? values;
  final int? min;
  final int? max;
  final bool hidden;

  ConfigFieldSchema({
    required this.key,
    required this.label,
    required this.type,
    this.required = false,
    this.defaultValue,
    this.placeholder,
    this.values,
    this.min,
    this.max,
    this.hidden = false,
  });

  factory ConfigFieldSchema.fromJson(Map<String, dynamic> json) {
    return ConfigFieldSchema(
      key: json['key'] as String,
      label: json['label'] as String,
      type: json['type'] as String,
      required: json['required'] as bool? ?? false,
      defaultValue: json['default'],
      placeholder: json['placeholder'] as String?,
      values: (json['values'] as List<dynamic>?)?.cast<String>(),
      min: json['min'] as int?,
      max: json['max'] as int?,
      hidden: json['hidden'] as bool? ?? false,
    );
  }
}

class CredentialRoleSchema {
  final String role;
  final String label;
  final String description;
  final List<ConfigFieldSchema> fields;

  CredentialRoleSchema({
    required this.role,
    required this.label,
    required this.description,
    required this.fields,
  });

  factory CredentialRoleSchema.fromJson(Map<String, dynamic> json) {
    return CredentialRoleSchema(
      role: json['role'] as String,
      label: json['label'] as String,
      description: json['description'] as String,
      fields: (json['fields'] as List<dynamic>)
          .map((f) => ConfigFieldSchema.fromJson(f as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ProviderConfigSchema {
  final String provider;
  final String displayName;
  final String description;
  final List<ConfigFieldSchema> accountFields;
  final List<ConfigFieldSchema> applicationFields;
  final List<CredentialRoleSchema> credentialRoles;
  final List<ConfigFieldSchema> profileFields;
  final List<String> optionalCapabilities;
  final List<String> requiredCapabilities;

  ProviderConfigSchema({
    required this.provider,
    required this.displayName,
    required this.description,
    required this.accountFields,
    required this.applicationFields,
    required this.credentialRoles,
    required this.profileFields,
    required this.optionalCapabilities,
    required this.requiredCapabilities,
  });

  factory ProviderConfigSchema.fromJson(Map<String, dynamic> json) {
    return ProviderConfigSchema(
      provider: json['provider'] as String,
      displayName: json['displayName'] as String,
      description: json['description'] as String,
      accountFields: (json['accountFields'] as List<dynamic>)
          .map((f) => ConfigFieldSchema.fromJson(f as Map<String, dynamic>))
          .toList(),
      applicationFields: (json['applicationFields'] as List<dynamic>)
          .map((f) => ConfigFieldSchema.fromJson(f as Map<String, dynamic>))
          .toList(),
      credentialRoles: (json['credentialRoles'] as List<dynamic>)
          .map((r) => CredentialRoleSchema.fromJson(r as Map<String, dynamic>))
          .toList(),
      profileFields: (json['profileFields'] as List<dynamic>)
          .map((f) => ConfigFieldSchema.fromJson(f as Map<String, dynamic>))
          .toList(),
      optionalCapabilities: (json['optionalCapabilities'] as List<dynamic>).cast<String>(),
      requiredCapabilities: (json['requiredCapabilities'] as List<dynamic>).cast<String>(),
    );
  }
}
