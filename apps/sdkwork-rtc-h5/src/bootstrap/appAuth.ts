import {
  applyRtcIamSessionTokens,
  parseAppbaseCallbackSession,
  stripAppbaseCallbackFromLocation,
  type RtcIamSession,
} from "@sdkwork/rtc-h5-core";

import { getRtcGlobalTokenManager } from "@sdkwork/rtc-h5-core";

export function consumeAppbaseCallbackSession(): RtcIamSession | null {
  const session = parseAppbaseCallbackSession();
  if (!session) {
    return null;
  }

  return applyRtcIamSessionTokens({
    accessToken: session.accessToken,
    authToken: session.authToken,
    context: {
      appId: "sdkwork-rtc-h5",
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
        appId: "sdkwork-rtc-h5",
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

  if (!tokenManager.getAccessToken()) {
    return;
  }
}
