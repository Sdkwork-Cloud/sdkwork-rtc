const PLUGIN_TO_BACKEND_CAPABILITY: Record<string, string> = {
  "media.audio": "audio",
  "media.video": "video",
  "live.broadcast": "live",
  "live.audience": "live",
  "screen-share": "screen-share",
  recording: "recording",
  "provider.webhook": "webhook",
  "provider.active-query": "active-query",
};

export function mapPluginCapabilityToBackend(pluginCapability: string): string | null {
  return PLUGIN_TO_BACKEND_CAPABILITY[pluginCapability] ?? null;
}

export function mapPluginCapabilitiesToBackend(pluginCapabilities: string[]): string[] {
  const mapped = new Set<string>();
  for (const capability of pluginCapabilities) {
    const backendKey = mapPluginCapabilityToBackend(capability);
    if (backendKey) {
      mapped.add(backendKey);
    }
  }
  return Array.from(mapped);
}

export function profileCapabilitiesToBackendKeys(capabilities: {
  audio: boolean;
  video: boolean;
  live: boolean;
  screenShare: boolean;
  recording: boolean;
  webhook: boolean;
  activeQuery: boolean;
}): Record<string, boolean> {
  return {
    audio: capabilities.audio,
    video: capabilities.video,
    live: capabilities.live,
    "screen-share": capabilities.screenShare,
    recording: capabilities.recording,
    webhook: capabilities.webhook,
    "active-query": capabilities.activeQuery,
  };
}
