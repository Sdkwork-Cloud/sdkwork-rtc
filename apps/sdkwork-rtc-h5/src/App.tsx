import { HashRouter, Navigate, useLocation } from "react-router-dom";

import { AdminApp } from "./AdminApp";
import { AppAuthGate } from "./AppAuthGate";
import { RTC_APP_HOME_PATH } from "./constants/appRoutes";
import { RtcApp } from "./RtcApp";
import { bootstrap } from "./bootstrap/runtime";

import "@sdkwork/rtc-h5-rtc/src/rtc-app-styles.css";
import "@sdkwork/rtc-h5-admin-core/src/admin-styles.css";

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
