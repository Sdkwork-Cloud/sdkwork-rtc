import type { IamDeploymentMode, IamEnvironment } from "@sdkwork/iam-contracts";
import {
  createSdkworkAppbasePcAuthRuntime,
  type SdkworkAppbasePcAuthRuntimeComposition,
} from "@sdkwork/auth-runtime-pc-react";
import {
  applyRtcIamSessionTokens,
  clearRtcIamSessionTokens,
  getRtcGlobalTokenManager,
  readRtcIamSessionTokens,
  resetRtcAppSdkClient,
  resolveAppSdkBaseUrl,
  type RtcIamSession,
} from "@sdkwork/rtc-h5-core";

import { getAppSdkClient } from "./appClient";

export interface CreateRtcAppAuthRuntimeOptions {
  appId: string;
  appbaseAppApiBaseUrl: string;
  rtcAppApiBaseUrl: string;
  deploymentMode?: IamDeploymentMode;
  environment?: IamEnvironment;
}

let rtcAppAuthRuntimeComposition: SdkworkAppbasePcAuthRuntimeComposition | null = null;

export function resetRtcAuthenticatedSdkClients(): void {
  resetRtcAppSdkClient();
}

export function createRtcAppAuthRuntime(
  options: CreateRtcAppAuthRuntimeOptions,
): SdkworkAppbasePcAuthRuntimeComposition {
  const composition = createSdkworkAppbasePcAuthRuntime({
    app: {
      appId: options.appId,
      deploymentMode: options.deploymentMode ?? "local",
      environment: options.environment ?? "dev",
      platform: "h5",
    },
    baseUrls: {
      appbaseAppApiBaseUrl: resolveAppSdkBaseUrl(options.appbaseAppApiBaseUrl),
    },
    hooks: {
      onSessionChanged: () => {
        resetRtcAuthenticatedSdkClients();
      },
    },
    sdkClients: [getAppSdkClient()],
    sessionBridge: {
      clearSession: clearRtcIamSessionTokens,
      commitSession: (session) => applyRtcIamSessionTokens(session as RtcIamSession),
      readSession: readRtcIamSessionTokens,
    },
    tokenManager: getRtcGlobalTokenManager(),
  });

  rtcAppAuthRuntimeComposition = composition;
  return composition;
}

export function getRtcAppAuthRuntime(): SdkworkAppbasePcAuthRuntimeComposition | null {
  return rtcAppAuthRuntimeComposition;
}

export function getRtcIamRuntimeForAuth() {
  const composition = getRtcAppAuthRuntime();
  if (!composition) {
    throw new Error("RTC IAM runtime is not configured.");
  }
  return composition.getRuntime();
}
