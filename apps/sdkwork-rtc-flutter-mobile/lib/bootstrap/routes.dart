import 'package:flutter/material.dart';

enum AppRoute {
  mediaSessions,
  mediaSessionRoom,
  admin,
}

extension AppRouteLabel on AppRoute {
  String get label {
    switch (this) {
      case AppRoute.mediaSessions:
        return 'Media Sessions';
      case AppRoute.mediaSessionRoom:
        return 'Media Session Room';
      case AppRoute.admin:
        return 'Admin';
    }
  }

  String get path {
    switch (this) {
      case AppRoute.mediaSessions:
        return '#/rtc/media-sessions';
      case AppRoute.mediaSessionRoom:
        return '#/rtc/media-sessions/:sessionId';
      case AppRoute.admin:
        return '#/admin';
    }
  }

  IconData get icon {
    switch (this) {
      case AppRoute.mediaSessions:
        return Icons.meeting_room;
      case AppRoute.mediaSessionRoom:
        return Icons.videocam;
      case AppRoute.admin:
        return Icons.admin_panel_settings;
    }
  }
}

enum AdminRoute {
  dashboard,
  accounts,
  profiles,
  routes,
  providers,
  wizard,
  rooms,
  webhooks,
  queryJobs,
}

extension AdminRouteLabel on AdminRoute {
  String get label {
    switch (this) {
      case AdminRoute.dashboard:
        return 'Dashboard';
      case AdminRoute.accounts:
        return 'Provider Accounts';
      case AdminRoute.profiles:
        return 'Provider Profiles';
      case AdminRoute.routes:
        return 'Provider Routes';
      case AdminRoute.providers:
        return 'Providers';
      case AdminRoute.wizard:
        return 'Setup Wizard';
      case AdminRoute.rooms:
        return 'Media Sessions';
      case AdminRoute.webhooks:
        return 'Webhook Events';
      case AdminRoute.queryJobs:
        return 'Query Jobs';
    }
  }

  String get path => '#/admin/${name.replaceAll('_', '-')}';

  IconData get icon {
    switch (this) {
      case AdminRoute.dashboard:
        return Icons.dashboard;
      case AdminRoute.accounts:
        return Icons.account_circle;
      case AdminRoute.profiles:
        return Icons.settings;
      case AdminRoute.routes:
        return Icons.alt_route;
      case AdminRoute.providers:
        return Icons.extension;
      case AdminRoute.wizard:
        return Icons.auto_fix_high;
      case AdminRoute.rooms:
        return Icons.meeting_room;
      case AdminRoute.webhooks:
        return Icons.webhook;
      case AdminRoute.queryJobs:
        return Icons.query_stats;
    }
  }
}

List<String> createRoutes() {
  return [
    ...AppRoute.values.map((route) => route.path),
    ...AdminRoute.values.map((route) => route.path),
  ];
}
