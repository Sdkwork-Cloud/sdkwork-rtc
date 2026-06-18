import 'package:flutter/material.dart';
import '../models/provider_profile.dart';
import '../models/provider_schema.dart';

class ProviderHealthDashboard extends StatelessWidget {
  final List<ProviderProfile> profiles;
  final List<ProviderConfigSchema> schemas;
  final ValueChanged<ProviderProfile> onVerify;
  final VoidCallback onRefresh;

  const ProviderHealthDashboard({
    super.key,
    required this.profiles,
    required this.schemas,
    required this.onVerify,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final statuses = _buildProviderStatuses(profiles, schemas);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Provider Health', style: Theme.of(context).textTheme.titleLarge),
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: onRefresh,
              tooltip: 'Refresh',
            ),
          ],
        ),
        const SizedBox(height: 16),
        Expanded(
          child: statuses.isEmpty
              ? const Center(child: Text('No provider profiles configured.'))
              : ListView.builder(
                  itemCount: statuses.length,
                  itemBuilder: (context, index) {
                    final status = statuses[index];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  status.displayName,
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                Chip(label: Text(status.overallHealth)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Profiles: ${status.totalProfiles} (${status.activeProfiles} active)'),
                            Text('Healthy: ${status.healthyProfiles}'),
                            if (status.defaultProfile != null) ...[
                              const SizedBox(height: 8),
                              Text('Default: ${status.defaultProfile!.name}'),
                              Text('Health: ${status.defaultProfile!.healthStatus}'),
                              TextButton(
                                onPressed: () => onVerify(status.defaultProfile!),
                                child: const Text('Verify Now'),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _ProviderStatus {
  final String provider;
  final String displayName;
  final int totalProfiles;
  final int activeProfiles;
  final int healthyProfiles;
  final ProviderProfile? defaultProfile;

  _ProviderStatus({
    required this.provider,
    required this.displayName,
    required this.totalProfiles,
    required this.activeProfiles,
    required this.healthyProfiles,
    this.defaultProfile,
  });

  String get overallHealth {
    if (healthyProfiles == totalProfiles && totalProfiles > 0) return 'healthy';
    if (healthyProfiles > 0) return 'degraded';
    return 'unhealthy';
  }
}

List<_ProviderStatus> _buildProviderStatuses(
  List<ProviderProfile> profiles,
  List<ProviderConfigSchema> schemas,
) {
  final schemaByProvider = {
    for (final schema in schemas) schema.provider: schema,
  };
  final providers = {
    ...profiles.map((p) => p.provider),
    ...schemas.map((s) => s.provider),
  };

  return providers.map((provider) {
    final providerProfiles = profiles.where((p) => p.provider == provider).toList();
    final activeProfiles = providerProfiles.where((p) => p.status == 'active').length;
    final healthyProfiles =
        providerProfiles.where((p) => p.healthStatus == 'healthy').length;
    final defaultProfile = providerProfiles.cast<ProviderProfile?>().firstWhere(
          (p) => p?.isDefault == true,
          orElse: () => providerProfiles.isNotEmpty ? providerProfiles.first : null,
        );

    return _ProviderStatus(
      provider: provider,
      displayName: schemaByProvider[provider]?.displayName ?? provider,
      totalProfiles: providerProfiles.length,
      activeProfiles: activeProfiles,
      healthyProfiles: healthyProfiles,
      defaultProfile: defaultProfile,
    );
  }).toList();
}
