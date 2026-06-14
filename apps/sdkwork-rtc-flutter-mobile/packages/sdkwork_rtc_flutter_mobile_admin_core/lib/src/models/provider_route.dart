class ProviderRoute {
  final String id;
  final String tenantId;
  final String organizationId;
  final String providerProfileId;
  final String routeType;
  final String? region;
  final int priority;
  final String status;

  ProviderRoute({
    required this.id,
    required this.tenantId,
    required this.organizationId,
    required this.providerProfileId,
    required this.routeType,
    this.region,
    required this.priority,
    required this.status,
  });

  factory ProviderRoute.fromJson(Map<String, dynamic> json) {
    return ProviderRoute(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      organizationId: json['organizationId'] as String,
      providerProfileId: json['providerProfileId'] as String,
      routeType: json['routeType'] as String,
      region: json['region'] as String?,
      priority: json['priority'] as int,
      status: json['status'] as String,
    );
  }
}

class ProviderRouteCommand {
  final String providerProfileId;
  final String routeType;
  final String? region;
  final int priority;
  final String? status;

  ProviderRouteCommand({
    required this.providerProfileId,
    required this.routeType,
    this.region,
    required this.priority,
    this.status,
  });

  Map<String, dynamic> toJson() {
    return {
      'providerProfileId': providerProfileId,
      'routeType': routeType,
      if (region != null) 'region': region,
      'priority': priority,
      if (status != null) 'status': status,
    };
  }
}
