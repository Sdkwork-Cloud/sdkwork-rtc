import { HashRouter, Navigate, useLocation } from "react-router-dom";

import { AdminApp } from "./AdminApp";
import { AppAuthGate, RTC_APP_HOME_PATH } from "./AppAuthGate";
import { RtcApp } from "./RtcApp";
import { bootstrap } from "./bootstrap/runtime";

import "@sdkwork/rtc-pc-rtc/src/rtc-app-styles.css";
import "@sdkwork/rtc-pc-admin-core/src/admin-styles.css";

bootstrap();

function AppShell() {
  const location = useLocation();
  const route = location.pathname;

  if (route === "/" || route === "") {
    return <Navigate replace to={RTC_APP_HOME_PATH} />;
  }

  if (route.startsWith("/admin")) {
    return <AdminApp route={route} />;
  }

  return (
    <AppAuthGate>
      <RtcApp route={route} />
    </AppAuthGate>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
