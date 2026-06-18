import {
  applyRtcIamSessionTokens,
  parseAppbaseCallbackSession,
  stripAppbaseCallbackFromLocation,
  type RtcIamSession,
} from "@sdkwork/rtc-pc-core";

import { getRtcGlobalTokenManager } from "@sdkwork/rtc-pc-core";

export function consumeAppbaseCallbackSession(): RtcIamSession | null {
  const session = parseAppbaseCallbackSession();
  if (!session) {
    return null;
  }

  return applyRtcIamSessionTokens({
    accessToken: session.accessToken,
    authToken: session.authToken,
    context: {
      appId: "sdkwork-rtc-pc",
      authLevel: "password",
      dataScope: [],
      deploymentMode: "local",
      environment: "dev",
      organizationId: session.organizationId,
      permissionScope: [],
      sessionId: "appbase-callback",
      tenantId: session.tenantId,
      userId: session.userId,
    },
  });
}

export function bootstrapAppAuth(): void {
  const tokenManager = getRtcGlobalTokenManager();
  const session = parseAppbaseCallbackSession();
  if (session) {
    applyRtcIamSessionTokens({
      accessToken: session.accessToken,
      authToken: session.authToken,
      context: {
        appId: "sdkwork-rtc-pc",
        authLevel: "password",
        dataScope: [],
        deploymentMode: "local",
        environment: "dev",
        organizationId: session.organizationId,
        permissionScope: [],
        sessionId: "appbase-callback",
        tenantId: session.tenantId,
        userId: session.userId,
      },
    });
    stripAppbaseCallbackFromLocation();
    return;
  }

  const stored = tokenManager.getAccessToken();
  if (!stored) {
    return;
  }
}
