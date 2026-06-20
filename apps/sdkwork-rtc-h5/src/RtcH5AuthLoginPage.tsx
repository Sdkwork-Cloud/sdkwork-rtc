import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildAppbaseLoginUrl,
  DEFAULT_APP_SESSION,
  applyRtcIamSessionTokens,
} from "@sdkwork/rtc-h5-core";

import { resolveEnvironment } from "./bootstrap/environment";
import { RTC_APP_HOME_PATH } from "./constants/appRoutes";

interface RtcH5AuthLoginPageProps {
  homePath?: string;
}

export function RtcH5AuthLoginPage({ homePath = RTC_APP_HOME_PATH }: RtcH5AuthLoginPageProps) {
  const navigate = useNavigate();
  const environment = useMemo(() => resolveEnvironment(), []);
  const [form, setForm] = useState(DEFAULT_APP_SESSION);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      applyRtcIamSessionTokens({
        accessToken: form.accessToken.trim(),
        authToken: form.authToken.trim() || form.accessToken.trim(),
        context: {
          appId: "sdkwork-rtc-h5",
          authLevel: "password",
          dataScope: [],
          deploymentMode: "saas",
          environment: "dev",
          organizationId: form.organizationId.trim() || DEFAULT_APP_SESSION.organizationId,
          permissionScope: [],
          sessionId: "dev-session",
          tenantId: form.tenantId.trim() || DEFAULT_APP_SESSION.tenantId,
          userId: form.userId.trim() || DEFAULT_APP_SESSION.userId,
        },
      });
      navigate(homePath, { replace: true });
    },
    [form, homePath, navigate],
  );

  const handleAppbaseLogin = useCallback(() => {
    const returnUrl = `${window.location.origin}${window.location.pathname}#${homePath}`;
    window.location.assign(buildAppbaseLoginUrl(environment.appbaseLoginUrl, returnUrl));
  }, [environment.appbaseLoginUrl, homePath]);

  return (
    <div className="rtc-app-auth-login">
      <div className="rtc-app-auth-form">
        <h2>RTC Sign In</h2>
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
