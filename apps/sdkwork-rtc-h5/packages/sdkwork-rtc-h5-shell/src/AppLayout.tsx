import type { ReactNode } from "react";

import { createRtcAppRoutes } from "./rtcRoutes";

interface AppLayoutProps {
  children: ReactNode;
  activePath: string;
}

export function AppLayout({ children, activePath }: AppLayoutProps) {
  const routes = createRtcAppRoutes();
  const isAdmin = activePath.startsWith("/admin");

  return (
    <div className="rtc-app-layout">
      <header className="rtc-app-header">
        <div className="rtc-app-brand">
          <strong>SDKWork RTC</strong>
        </div>
        <nav className="rtc-app-nav" aria-label="Application surfaces">
          {routes.map((route) => {
            const normalized = route.path.replace(/^#/, "");
            const active = !isAdmin && activePath.startsWith(normalized);
            return (
              <a
                key={route.path}
                href={route.path}
                className={active ? "active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                {route.label}
              </a>
            );
          })}
          <a
            href="#/admin/dashboard"
            className={isAdmin ? "active" : undefined}
            aria-current={isAdmin ? "page" : undefined}
          >
            Admin
          </a>
        </nav>
      </header>
      <main className="rtc-app-content">{children}</main>
    </div>
  );
}
