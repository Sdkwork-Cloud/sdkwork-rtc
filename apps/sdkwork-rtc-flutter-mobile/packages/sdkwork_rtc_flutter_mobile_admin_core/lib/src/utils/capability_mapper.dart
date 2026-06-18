const _pluginToBackendCapability = <String, String>{
  'media.audio': 'audio',
  'media.video': 'video',
  'live.broadcast': 'live',
  'live.audience': 'live',
  'screen-share': 'screen-share',
  'recording': 'recording',
  'provider.webhook': 'webhook',
  'provider.active-query': 'active-query',
};

String? mapPluginCapabilityToBackend(String pluginCapability) {
  return _pluginToBackendCapability[pluginCapability];
}

List<String> mapPluginCapabilitiesToBackend(List<String> pluginCapabilities) {
  final mapped = <String>{};
  for (final capability in pluginCapabilities) {
    final backendKey = mapPluginCapabilityToBackend(capability);
    if (backendKey != null) {
      mapped.add(backendKey);
    }
  }
  return mapped.toList();
}

Map<String, bool> profileCapabilitiesToBackendKeys(
  Map<String, dynamic> capabilities,
) {
  return {
    'audio': capabilities['audio'] as bool? ?? false,
    'video': capabilities['video'] as bool? ?? false,
    'live': capabilities['live'] as bool? ?? false,
    'screen-share': capabilities['screenShare'] as bool? ?? false,
    'recording': capabilities['recording'] as bool? ?? false,
    'webhook': capabilities['webhook'] as bool? ?? false,
    'active-query': capabilities['activeQuery'] as bool? ?? false,
  };
}
