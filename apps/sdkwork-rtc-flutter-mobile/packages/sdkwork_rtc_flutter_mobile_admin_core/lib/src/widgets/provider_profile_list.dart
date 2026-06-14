import 'package:flutter/material.dart';
import '../models/provider_profile.dart';

class ProviderProfileList extends StatelessWidget {
  final List<ProviderProfile> profiles;
  final ValueChanged<ProviderProfile> onSelect;
  final ValueChanged<ProviderProfile> onDisable;
  final ValueChanged<ProviderProfile> onVerify;

  const ProviderProfileList({
    super.key,
    required this.profiles,
    required this.onSelect,
    required this.onDisable,
    required this.onVerify,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: profiles.length,
      itemBuilder: (context, index) {
        final profile = profiles[index];
        return Card(
          child: ListTile(
            title: Text('${profile.provider} - ${profile.code}'),
            subtitle: Text('${profile.name} (${profile.healthStatus})'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () => onSelect(profile),
                ),
                IconButton(
                  icon: const Icon(Icons.verified),
                  onPressed: () => onVerify(profile),
                ),
                if (profile.status == 'active')
                  IconButton(
                    icon: const Icon(Icons.block),
                    onPressed: () => onDisable(profile),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
