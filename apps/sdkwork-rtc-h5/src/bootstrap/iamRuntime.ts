import {
  applyRtcIamSessionTokens,
  parseAppbaseCallbackSession,
  stripAppbaseCallbackFromLocation,
} from "@sdkwork/rtc-h5-core";

import { createRtcAppAuthRuntime } from "./rtcAppAuthRuntime";
import { resolveEnvironment } from "./environment";

export function createIamRuntime() {
  const environment = resolveEnvironment();
  const composition = createRtcAppAuthRuntime({
    appId: "sdkwork-rtc-h5",
    appbaseAppApiBaseUrl: environment.appbaseAppApiBaseUrl,
    rtcAppApiBaseUrl: environment.apiBaseUrl,
  });

  const callbackSession = parseAppbaseCallbackSession();
  if (callbackSession) {
    stripAppbaseCallbackFromLocation();
    applyRtcIamSessionTokens({
      accessToken: callbackSession.accessToken,
      authToken: callbackSession.authToken,
      context: {
        appId: "sdkwork-rtc-h5",
        authLevel: "password",
        dataScope: [],
        deploymentMode: "local",
        environment: "dev",
        organizationId: callbackSession.organizationId,
        permissionScope: [],
        sessionId: "appbase-callback",
        tenantId: callbackSession.tenantId,
        userId: callbackSession.userId,
      },
    });
  }

  return {
    composition,
    runtime: composition.getRuntime(),
    session: callbackSession,
  };
}
