import { useCallback, useEffect, useState } from "react";

export type AdminSectionKey = "rtc-center" | "provider" | "system";

export interface AdminSectionDefinition {
  key: AdminSectionKey;
  label: string;
  routes: string[];
}

const ADMIN_SECTIONS: AdminSectionDefinition[] = [
  {
    key: "rtc-center",
    label: "实时音视频中心",
    routes: ["/admin/dashboard", "/admin/media-sessions", "/admin/rooms", "/admin/media-artifacts", "/admin/quality-samples"],
  },
  {
    key: "provider",
    label: "Provider 管理",
    routes: ["/admin/provider-accounts", "/admin/provider-applications", "/admin/provider-credentials", "/admin/provider-profiles", "/admin/provider-routes", "/admin/providers", "/admin/wizard"],
  },
  {
    key: "system",
    label: "系统工具",
    routes: ["/admin/webhook-events", "/admin/query-jobs"],
  },
];

export function resolveAdminSection(pathname: string): AdminSectionKey {
  const normalized = pathname.startsWith("#") ? pathname.slice(1) : pathname;
  const match = ADMIN_SECTIONS.find((section) =>
    section.routes.some((route) => normalized.startsWith(route)),
  );
  return match?.key ?? "rtc-center";
}

export function useHashPath(): string {
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash.slice(1) : "",
  );
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  return hash;
}

interface AdminHeaderProps {
  activeSection: AdminSectionKey;
  onSectionChange: (section: AdminSectionKey) => void;
}

/**
 * Admin header — brand "实时音视频中心" with section navigation. The header
 * is the entry point for the RTC administration surfaces (real-time sessions,
 * rooms, recording files, quality monitoring, provider and system tooling).
 */
export function AdminHeader({ activeSection, onSectionChange }: AdminHeaderProps) {
  const hash = useHashPath();

  const handleSectionClick = useCallback(
    (section: AdminSectionKey) => {
      onSectionChange(section);
      const target = ADMIN_SECTIONS.find((item) => item.key === section)?.routes[0];
      if (target && !hash.startsWith(target)) {
        window.location.hash = target;
      }
    },
    [hash, onSectionChange],
  );

  return (
    <header className="admin-header">
      <div className="admin-header-brand">
        <span className="admin-header-logo" aria-hidden="true">
          ▶
        </span>
        <strong>实时音视频中心</strong>
      </div>
      <nav className="admin-header-nav" aria-label="Admin sections">
        {ADMIN_SECTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            className={activeSection === section.key ? "active" : undefined}
            onClick={() => handleSectionClick(section.key)}
          >
            {section.label}
          </button>
        ))}
      </nav>
      <div className="admin-header-actions">
        <a href="#/rtc/media-sessions" className="admin-header-app-link">
          用户端
        </a>
      </div>
    </header>
  );
}

export { ADMIN_SECTIONS };
