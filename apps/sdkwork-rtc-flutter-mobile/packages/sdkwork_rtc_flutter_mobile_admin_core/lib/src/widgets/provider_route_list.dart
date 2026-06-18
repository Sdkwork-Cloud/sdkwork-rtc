import 'package:flutter/material.dart';
import '../models/provider_route.dart';

class ProviderRouteList extends StatelessWidget {
  final List<ProviderRoute> routes;
  final ValueChanged<ProviderRoute>? onSelect;
  final ValueChanged<ProviderRoute>? onDisable;

  const ProviderRouteList({
    super.key,
    required this.routes,
    this.onSelect,
    this.onDisable,
  });

  @override
  Widget build(BuildContext context) {
    if (routes.isEmpty) {
      return const Center(child: Text('No provider routes found.'));
    }
    return ListView.builder(
      itemCount: routes.length,
      itemBuilder: (context, index) {
        final route = routes[index];
        return Card(
          child: ListTile(
            title: Text('${route.routeType} (priority ${route.priority})'),
            subtitle: Text(
              'Profile: ${route.providerProfileId}\nStatus: ${route.status}',
            ),
            trailing: route.status == 'active' && onDisable != null
                ? IconButton(
                    icon: const Icon(Icons.block),
                    onPressed: () => onDisable!(route),
                  )
                : null,
            onTap: onSelect != null ? () => onSelect!(route) : null,
          ),
        );
      },
    );
  }
}
