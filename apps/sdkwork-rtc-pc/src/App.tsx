import { AdminApp } from "./AdminApp";
import { RtcApp } from "./RtcApp";
import { bootstrap } from "./bootstrap/runtime";
import { useHashRoute } from "./hooks/useHashRoute";

import "@sdkwork/rtc-pc-rtc/src/rtc-app-styles.css";
import "@sdkwork/rtc-pc-admin-core/src/admin-styles.css";

bootstrap();

export default function App() {
  const route = useHashRoute("/rtc/media-sessions");

  if (route.startsWith("/admin")) {
    return <AdminApp />;
  }

  return <RtcApp route={route} />;
}
