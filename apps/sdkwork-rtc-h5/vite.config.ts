import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const rtcH5Root = path.dirname(fileURLToPath(import.meta.url));
const rtcRoot = path.resolve(rtcH5Root, "../..");
const appbaseRoot = path.resolve(rtcRoot, "../sdkwork-appbase");
const iamRoot = path.resolve(rtcRoot, "../sdkwork-iam");
const uiRoot = path.resolve(rtcRoot, "../sdkwork-ui/sdkwork-ui-pc-react");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rtcH5Root, "");
  return {
    define: {
      "process.env.SDKWORK_ACCESS_TOKEN": JSON.stringify(env.SDKWORK_ACCESS_TOKEN ?? ""),
    },
    plugins: [react()],
    resolve: {
      alias: {
        // The RTC app/backend SDK sources re-export from their generated
        // bundle (dist/index.js) while keeping type-only re-exports against
        // the generated declarations. Bundling through the source entry would
        // resolve `dist/types/*.js` which is declarations-only, so resolve the
        // runtime bundles directly here (types still come from the SDK types
        // field through tsc).
        "@sdkwork/rtc-app-sdk": path.resolve(
          rtcRoot,
          "sdks/sdkwork-rtc-app-sdk/sdkwork-rtc-app-sdk-typescript/src/index.ts",
        ),
        "@sdkwork/rtc-backend-sdk": path.resolve(
          rtcRoot,
          "sdks/sdkwork-rtc-backend-sdk/sdkwork-rtc-backend-sdk-typescript/src/index.ts",
        ),
      },
    },
    server: { port: 3001 },
  };
});
