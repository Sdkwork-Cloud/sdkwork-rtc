class ProviderPluginDescriptor {
  final String pluginId;
  final String domain;
  final String providerKind;
  final String displayName;
  final String interfaceVersion;
  final String configSchemaRef;
  final bool defaultSelected;
  final bool tenantOverrideAllowed;
  final List<String> requiredCapabilities;
  final List<String> optionalCapabilities;
  final List<String> unsupportedFeatures;
  final List<String> degradedBehaviors;

  ProviderPluginDescriptor({
    required this.pluginId,
    required this.domain,
    required this.providerKind,
    required this.displayName,
    required this.interfaceVersion,
    required this.configSchemaRef,
    required this.defaultSelected,
    required this.tenantOverrideAllowed,
    required this.requiredCapabilities,
    required this.optionalCapabilities,
    required this.unsupportedFeatures,
    required this.degradedBehaviors,
  });

  factory ProviderPluginDescriptor.fromJson(Map<String, dynamic> json) {
    return ProviderPluginDescriptor(
      pluginId: json['pluginId'] as String,
      domain: json['domain'] as String,
      providerKind: json['providerKind'] as String,
      displayName: json['displayName'] as String,
      interfaceVersion: json['interfaceVersion'] as String,
      configSchemaRef: json['configSchemaRef'] as String,
      defaultSelected: json['defaultSelected'] as bool? ?? false,
      tenantOverrideAllowed: json['tenantOverrideAllowed'] as bool? ?? false,
      requiredCapabilities:
          (json['requiredCapabilities'] as List<dynamic>?)?.cast<String>() ?? [],
      optionalCapabilities:
          (json['optionalCapabilities'] as List<dynamic>?)?.cast<String>() ?? [],
      unsupportedFeatures:
          (json['unsupportedFeatures'] as List<dynamic>?)?.cast<String>() ?? [],
      degradedBehaviors:
          (json['degradedBehaviors'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }
}
