import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@sdkwork/rtc-sdk": path.resolve(
        workspaceRoot,
        "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/index.ts",
      ),
      "@sdkwork/rtc-sdk-provider-volcengine": path.resolve(
        workspaceRoot,
        "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-volcengine/index.js",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
