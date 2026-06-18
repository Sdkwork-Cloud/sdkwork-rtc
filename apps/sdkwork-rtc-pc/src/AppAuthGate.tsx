import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  buildAppbaseLoginUrl,
  DEFAULT_APP_SESSION,
  applyRtcIamSessionTokens,
  clearRtcIamSessionTokens,
  isRtcIamSessionAuthenticated,
  readRtcIamSessionTokens,
  toRtcAppSession,
  type RtcIamSession,
} from "@sdkwork/rtc-pc-core";

import {
  bootstrapAppAuth,
  consumeAppbaseCallbackSession,
} from "./bootstrap/appAuth";
import { resolveEnvironment } from "./bootstrap/environment";

interface AppAuthGateProps {
  children: ReactNode;
}

export function AppAuthGate({ children }: AppAuthGateProps) {
  const environment = useMemo(() => resolveEnvironment(), []);
  const [session, setSession] = useState<RtcIamSession | null>(() => {
    const callbackSession = consumeAppbaseCallbackSession();
    if (callbackSession) {
      return callbackSession;
    }
    return readRtcIamSessionTokens();
  });
  const [form, setForm] = useState(DEFAULT_APP_SESSION);

  useEffect(() => {
    if (isRtcIamSessionAuthenticated(session)) {
      bootstrapAppAuth();
    }
  }, [session]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextSession = applyRtcIamSessionTokens({
        accessToken: form.accessToken.trim(),
        authToken: form.authToken.trim() || form.accessToken.trim(),
        context: {
          appId: "sdkwork-rtc-pc",
          authLevel: "password",
          dataScope: [],
          deploymentMode: "local",
          environment: "dev",
          organizationId: form.organizationId.trim() || DEFAULT_APP_SESSION.organizationId,
          permissionScope: [],
          sessionId: "dev-session",
          tenantId: form.tenantId.trim() || DEFAULT_APP_SESSION.tenantId,
          userId: form.userId.trim() || DEFAULT_APP_SESSION.userId,
        },
      });
      bootstrapAppAuth();
      setSession(nextSession);
    },
    [form],
  );

  const handleAppbaseLogin = useCallback(() => {
    const returnUrl = `${window.location.origin}${window.location.pathname}#/rtc/media-sessions`;
    window.location.assign(buildAppbaseLoginUrl(environment.appbaseLoginUrl, returnUrl));
  }, [environment.appbaseLoginUrl]);

  const handleSignOut = useCallback(() => {
    clearRtcIamSessionTokens();
    setSession(null);
    setForm(DEFAULT_APP_SESSION);
  }, []);

  const appSession = toRtcAppSession(session);

  if (appSession) {
    return (
      <div className="rtc-app-auth-shell">
        <div className="rtc-app-auth-toolbar">
          <span>Signed in as {appSession.userId}</span>
          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="rtc-app-auth-login">
      <div className="rtc-app-auth-form">
        <h2>RTC App Sign In</h2>
        <p>Sign in through appbase IAM or provide local app-api credentials for development.</p>
        <button type="button" className="primary" onClick={handleAppbaseLogin}>
          Continue with Appbase
        </button>
        <div className="rtc-app-auth-divider">or use development credentials</div>
      </div>
      <form className="rtc-app-auth-form" onSubmit={handleSubmit}>
        <label>
          Access Token
          <input
            required
            value={form.accessToken}
            onChange={(event) => setForm((current) => ({ ...current, accessToken: event.target.value }))}
          />
        </label>
        <label>
          Auth Token
          <input
            value={form.authToken}
            onChange={(event) => setForm((current) => ({ ...current, authToken: event.target.value }))}
          />
        </label>
        <label>
          Tenant ID
          <input
            value={form.tenantId}
            onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))}
          />
        </label>
        <label>
          Organization ID
          <input
            value={form.organizationId}
            onChange={(event) =>
              setForm((current) => ({ ...current, organizationId: event.target.value }))
            }
          />
        </label>
        <label>
          User ID
          <input
            value={form.userId}
            onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
          />
        </label>
        <button type="submit" className="primary">
          Continue with Dev Credentials
        </button>
      </form>
    </div>
  );
}
