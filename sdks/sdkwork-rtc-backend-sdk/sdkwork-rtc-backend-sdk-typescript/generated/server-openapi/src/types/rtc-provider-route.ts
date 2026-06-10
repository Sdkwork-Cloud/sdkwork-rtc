export interface RtcProviderRoute {
  id: string;
  tenantId: string;
  organizationId: string;
  providerProfileId: string;
  routeType: 'region';
  region?: string | null;
  priority: number;
  status: 'active' | 'disabled';
}
