import React from "react";
import ReactDOM from "react-dom/client";
import { initRtcAdminI18n } from "@sdkwork/rtc-pc-admin-core";
import App from "./App";
import "./index.css";

// Standalone host: bootstrap the RTC admin i18n instance (portal hosts own
// the i18next instance through the SDKWork provider and must not call this).
initRtcAdminI18n();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
