export function AdminSidebar() {
  return (
    <nav className="admin-sidebar admin-sidebar-mobile">
      <h2>RTC Admin</h2>
      <ul>
        <li><a href="#/admin/dashboard">Dashboard</a></li>
        <li><a href="#/admin/provider-accounts">Provider Accounts</a></li>
        <li><a href="#/admin/provider-profiles">Provider Profiles</a></li>
        <li><a href="#/admin/provider-routes">Provider Routes</a></li>
        <li><a href="#/admin/providers">Providers</a></li>
        <li><a href="#/admin/wizard">Setup Wizard</a></li>
        <li><a href="#/admin/rooms">Rooms</a></li>
        <li><a href="#/admin/webhook-events">Webhook Events</a></li>
        <li><a href="#/admin/query-jobs">Query Jobs</a></li>
        <li><a href="#/rtc/media-sessions">App: Media Sessions</a></li>
      </ul>
    </nav>
  );
}
