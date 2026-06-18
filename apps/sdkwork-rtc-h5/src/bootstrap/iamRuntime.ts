import { bootstrapAppAuth, consumeAppbaseCallbackSession } from "./appAuth";

export function createIamRuntime() {
  consumeAppbaseCallbackSession();
  return {
    session: bootstrapAppAuth(),
  };
}
