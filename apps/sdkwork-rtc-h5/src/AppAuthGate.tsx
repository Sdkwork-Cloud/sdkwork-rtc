import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  isRtcIamSessionAuthenticated,
  readRtcIamSessionTokens,
  RTC_IAM_SESSION_CHANGED_EVENT,
  type RtcIamSession,
} from "@sdkwork/rtc-h5-core";

import { RtcH5AuthLoginPage } from "./RtcH5AuthLoginPage";
import { RTC_APP_HOME_PATH } from "./constants/appRoutes";

export { RTC_APP_HOME_PATH };

const AUTH_BASE_PATH = "/auth";

interface AppAuthGateProps {
  children: ReactNode;
  homePath?: string;
}

function isAuthRoute(pathname: string): boolean {
  return pathname === AUTH_BASE_PATH || pathname.startsWith(`${AUTH_BASE_PATH}/`);
}

function resolveRedirectTarget(pathname: string, search: string, hash: string, homePath: string): string {
  const target = `${pathname}${search}${hash}`;
  if (isAuthRoute(pathname)) {
    return homePath;
  }
  return target || homePath;
}

function buildAuthLoginPath(redirectTarget: string): string {
  const params = new URLSearchParams();
  params.set("redirect", redirectTarget || RTC_APP_HOME_PATH);
  return `${AUTH_BASE_PATH}/login?${params.toString()}`;
}

export function AppAuthGate({ children, homePath = RTC_APP_HOME_PATH }: AppAuthGateProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<RtcIamSession | null>(() => readRtcIamSessionTokens());

  const redirectTarget = useMemo(
    () => resolveRedirectTarget(location.pathname, location.search, location.hash, homePath),
    [homePath, location.hash, location.pathname, location.search],
  );
  const isAuthenticated = isRtcIamSessionAuthenticated(session);
  const isAuthPath = isAuthRoute(location.pathname);

  useEffect(() => {
    setSession(readRtcIamSessionTokens());
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleSessionChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ session?: RtcIamSession | null }>).detail;
      setSession(detail?.session ?? readRtcIamSessionTokens());
    };

    window.addEventListener(RTC_IAM_SESSION_CHANGED_EVENT, handleSessionChanged);
    return () => window.removeEventListener(RTC_IAM_SESSION_CHANGED_EVENT, handleSessionChanged);
  }, []);

  useEffect(() => {
    if (isAuthenticated || isAuthPath) {
      return;
    }
    navigate(buildAuthLoginPath(redirectTarget), { replace: true });
  }, [isAuthPath, isAuthenticated, navigate, redirectTarget]);

  if (isAuthenticated && isAuthPath) {
    return <Navigate replace to={redirectTarget} />;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (isAuthPath) {
    return <RtcH5AuthLoginPage homePath={homePath} />;
  }

  return null;
}
