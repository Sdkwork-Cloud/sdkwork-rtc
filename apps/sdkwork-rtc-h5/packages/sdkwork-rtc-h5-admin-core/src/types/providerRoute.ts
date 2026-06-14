export interface ProviderRoute {
  id: string;
  tenantId: string;
  organizationId: string;
  providerProfileId: string;
  routeType: string;
  region?: string;
  priority: number;
  status: "active" | "disabled";
}

export interface ProviderRouteCommand {
  providerProfileId: string;
  routeType: string;
  region?: string;
  priority: number;
  status?: "active" | "disabled";
}
