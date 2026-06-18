typedef RtcMediaPermissionAdapter = Future<bool> Function();

class RtcDeepLinkAdapter {
  const RtcDeepLinkAdapter({
    required this.currentPath,
    required this.subscribe,
  });

  final String Function() currentPath;
  final void Function(void Function(String path) listener) subscribe;
}

class RtcSecureStorageAdapter {
  const RtcSecureStorageAdapter({
    required this.read,
    required this.write,
    required this.remove,
  });

  final String? Function(String key) read;
  final void Function(String key, String value) write;
  final void Function(String key) remove;
}

class RtcHostAdapters {
  const RtcHostAdapters({
    this.camera,
    this.microphone,
    this.deepLinks,
    this.pushNotifications,
    this.secureStorage,
  });

  final RtcMediaPermissionAdapter? camera;
  final RtcMediaPermissionAdapter? microphone;
  final RtcDeepLinkAdapter? deepLinks;
  final Future<void> Function()? pushNotifications;
  final RtcSecureStorageAdapter? secureStorage;
}

RtcHostAdapters? _activeHostAdapters;

RtcHostAdapters registerHostAdapters() {
  _activeHostAdapters ??= const RtcHostAdapters(
    camera: null,
    microphone: null,
    deepLinks: null,
    pushNotifications: null,
    secureStorage: null,
  );
  return _activeHostAdapters!;
}

RtcHostAdapters getHostAdapters() => registerHostAdapters();
