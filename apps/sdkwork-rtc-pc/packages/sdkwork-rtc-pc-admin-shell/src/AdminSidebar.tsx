import { useHashPath, type AdminSectionKey } from "./AdminHeader";

interface AdminMenuItem {
  path: string;
  label: string;
}

interface AdminMenuGroup {
  key: AdminSectionKey;
  label: string;
  items: AdminMenuItem[];
}

const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    key: "rtc-center",
    label: "实时音视频中心",
    items: [
      { path: "/admin/dashboard", label: "综合总览" },
      { path: "/admin/media-sessions", label: "实时会话" },
      { path: "/admin/rooms", label: "通话房间" },
      { path: "/admin/media-artifacts", label: "通话记录文件" },
      { path: "/admin/quality-samples", label: "质量监控" },
    ],
  },
  {
    key: "provider",
    label: "Provider 管理",
    items: [
      { path: "/admin/provider-accounts", label: "账户" },
      { path: "/admin/provider-applications", label: "应用" },
      { path: "/admin/provider-credentials", label: "凭据" },
      { path: "/admin/provider-profiles", label: "配置" },
      { path: "/admin/provider-routes", label: "路由" },
      { path: "/admin/providers", label: "插件" },
      { path: "/admin/wizard", label: "配置向导" },
    ],
  },
  {
    key: "system",
    label: "系统工具",
    items: [
      { path: "/admin/webhook-events", label: "Webhook 事件" },
      { path: "/admin/query-jobs", label: "Query Jobs" },
    ],
  },
];

/**
 * Grouped admin sidebar driven by the section navigation. Active item is
 * derived from the current hash route so deep links highlight correctly.
 */
export function AdminSidebar({ activeSection }: { activeSection: AdminSectionKey }) {
  const hash = useHashPath();
  const activePath = hash.startsWith("/admin") ? hash : "";

  const isItemActive = (path: string): boolean => {
    if (!activePath) {
      return false;
    }
    return activePath === path || activePath.startsWith(`${path}/`);
  };

  return (
    <nav className="admin-sidebar" aria-label="Admin menu">
      <div className="admin-sidebar-title">RTC Admin</div>
      {ADMIN_MENU_GROUPS.map((group) => (
        <div
          key={group.key}
          className={`admin-sidebar-group ${activeSection === group.key ? "active" : ""}`}
        >
          <div className="admin-sidebar-group-label">{group.label}</div>
          <ul className="admin-sidebar-items">
            {group.items.map((item) => (
              <li key={item.path}>
                <a
                  href={`#${item.path}`}
                  className={isItemActive(item.path) ? "active" : undefined}
                  aria-current={isItemActive(item.path) ? "page" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="admin-sidebar-footer">
        <a href="#/rtc/media-sessions">App: Media Sessions</a>
      </div>
    </nav>
  );
}
