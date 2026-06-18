import 'package:flutter/material.dart';

import '../bootstrap/routes.dart';

class AdminShell extends StatefulWidget {
  final Widget Function(AdminRoute route) builder;

  const AdminShell({super.key, required this.builder});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  AdminRoute _route = AdminRoute.dashboard;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('RTC Admin - ${_route.label}'),
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(color: Colors.blue),
              child: Text(
                'RTC Admin',
                style: TextStyle(color: Colors.white, fontSize: 24),
              ),
            ),
            for (final route in AdminRoute.values)
              ListTile(
                leading: Icon(route.icon),
                title: Text(route.label),
                selected: _route == route,
                onTap: () {
                  setState(() => _route = route);
                  Navigator.pop(context);
                },
              ),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: widget.builder(_route),
      ),
    );
  }
}
