import 'package:flutter/material.dart';
import '../models/provider_plugin.dart';

class ProviderPluginList extends StatelessWidget {
  final List<ProviderPluginDescriptor> plugins;
  final ValueChanged<ProviderPluginDescriptor> onSelect;

  const ProviderPluginList({
    super.key,
    required this.plugins,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    if (plugins.isEmpty) {
      return const Center(child: Text('No provider plugins found.'));
    }
    return ListView.builder(
      itemCount: plugins.length,
      itemBuilder: (context, index) {
        final plugin = plugins[index];
        return Card(
          child: ListTile(
            title: Text(plugin.displayName),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Kind: ${plugin.providerKind}'),
                Text('Domain: ${plugin.domain}'),
                if (plugin.requiredCapabilities.isNotEmpty)
                  Text('Required: ${plugin.requiredCapabilities.join(', ')}'),
              ],
            ),
            trailing: plugin.defaultSelected
                ? const Chip(label: Text('Default'))
                : null,
            onTap: () => onSelect(plugin),
          ),
        );
      },
    );
  }
}
