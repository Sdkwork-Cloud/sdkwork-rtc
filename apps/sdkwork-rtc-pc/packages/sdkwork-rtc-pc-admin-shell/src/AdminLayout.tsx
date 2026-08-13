import { useCallback, useState, type ReactNode } from "react";
import { AdminHeader, resolveAdminSection, useHashPath, type AdminSectionKey } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: ReactNode;
}

/**
 * Admin layout — header (实时音视频中心 section navigation) + grouped
 * sidebar + content. The active section follows the current route and stays
 * in sync across hash navigation.
 */
export function AdminLayout({ children }: Props) {
  const hash = useHashPath();
  const [section, setSection] = useState<AdminSectionKey>(() => resolveAdminSection(hash));

  const handleSectionChange = useCallback((next: AdminSectionKey) => {
    setSection(next);
  }, []);

  return (
    <div className="admin-layout">
      <AdminHeader activeSection={section} onSectionChange={handleSectionChange} />
      <div className="admin-body">
        <AdminSidebar activeSection={section} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
