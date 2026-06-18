export function AdminRoutes() {
  return {
    routes: [
      { path: "#/admin/dashboard", label: "Dashboard" },
      { path: "#/admin/provider-accounts", label: "Provider Accounts" },
      { path: "#/admin/provider-profiles", label: "Provider Profiles" },
      { path: "#/admin/provider-routes", label: "Provider Routes" },
      { path: "#/admin/providers", label: "Providers" },
      { path: "#/admin/wizard", label: "Setup Wizard" },
      { path: "#/admin/media-sessions", label: "Media Sessions" },
      { path: "#/admin/webhook-events", label: "Webhook Events" },
      { path: "#/admin/query-jobs", label: "Query Jobs" },
    ],
  };
}
