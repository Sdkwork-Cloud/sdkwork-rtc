import {
  applyRtcIamSessionTokens,
  parseAppbaseCallbackSession,
  stripAppbaseCallbackFromLocation,
} from "@sdkwork/rtc-pc-core";

import { createRtcAppAuthRuntime } from "./rtcAppAuthRuntime";
import { resolveEnvironment } from "./environment";

export function createIamRuntime() {
  const environment = resolveEnvironment();
  const composition = createRtcAppAuthRuntime({
    appId: "sdkwork-rtc-pc",
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
        appId: "sdkwork-rtc-pc",
        authLevel: "password",
        dataScope: [],
        deploymentMode: "saas",
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
