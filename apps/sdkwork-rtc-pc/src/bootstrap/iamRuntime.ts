import { parseAppbaseCallbackSession, stripAppbaseCallbackFromLocation } from "@sdkwork/rtc-pc-core";

import { bootstrapAppAuth } from "./appAuth";

export function createIamRuntime() {
  const callbackSession = parseAppbaseCallbackSession();
  if (callbackSession) {
    stripAppbaseCallbackFromLocation();
  }
  bootstrapAppAuth();
  return {
    session: callbackSession,
  };
}
