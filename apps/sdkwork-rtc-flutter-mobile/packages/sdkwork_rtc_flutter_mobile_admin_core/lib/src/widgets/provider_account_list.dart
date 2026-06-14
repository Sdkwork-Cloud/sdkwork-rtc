import 'package:flutter/material.dart';
import '../models/provider_account.dart';

class ProviderAccountList extends StatelessWidget {
  final List<ProviderAccount> accounts;
  final ValueChanged<ProviderAccount> onSelect;
  final ValueChanged<ProviderAccount> onDisable;

  const ProviderAccountList({
    super.key,
    required this.accounts,
    required this.onSelect,
    required this.onDisable,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: accounts.length,
      itemBuilder: (context, index) {
        final account = accounts[index];
        return Card(
          child: ListTile(
            title: Text('${account.provider} - ${account.code}'),
            subtitle: Text('${account.name} (${account.status})'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () => onSelect(account),
                ),
                if (account.status == 'active')
                  IconButton(
                    icon: const Icon(Icons.block),
                    onPressed: () => onDisable(account),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
