export interface RtcProviderRouteCommand {
  providerProfileId: string;
  routeType: 'region';
  region?: string | null;
  priority?: number;
  status?: 'active' | 'disabled';
}
