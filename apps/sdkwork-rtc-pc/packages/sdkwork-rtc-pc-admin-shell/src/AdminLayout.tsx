import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: ReactNode;
}

export function AdminLayout({ children }: Props) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">{children}</main>
    </div>
  );
}
