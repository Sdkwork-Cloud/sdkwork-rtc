export interface AppRouteDefinition {
  path: string;
  label: string;
}

export function createRtcAppRoutes(): AppRouteDefinition[] {
  return [
    { path: "#/rtc/media-sessions", label: "Media Sessions" },
    { path: "#/rtc/calls/video", label: "Call" },
  ];
}
