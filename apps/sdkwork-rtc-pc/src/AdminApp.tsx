import { useMemo } from "react";
import { AdminLayout } from "@sdkwork/rtc-pc-admin-shell";
import { RtcAdminCenterWorkspace } from "@sdkwork/rtc-pc-admin-core";

import { AuthGate } from "./AuthGate";
import { createAdminServices } from "./bootstrap/adminServices";

interface AdminAppProps {
  route: string;
}

/**
 * RTC admin entry — auth gate + admin layout around the shared
 * RtcAdminCenterWorkspace (all page orchestration lives in the capability
 * package so the PC app and the Cloud Router admin share one authority).
 */
export function AdminApp({ route }: AdminAppProps) {
  const services = useMemo(() => createAdminServices(), []);
  return (
    <AuthGate>
      <AdminLayout>
        <RtcAdminCenterWorkspace services={services} route={route} />
      </AdminLayout>
    </AuthGate>
  );
}
