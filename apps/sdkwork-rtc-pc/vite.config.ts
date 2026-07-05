import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const rtcPcRoot = path.dirname(fileURLToPath(import.meta.url));
const rtcRoot = path.resolve(rtcPcRoot, "../..");
const appbaseRoot = path.resolve(rtcRoot, "../sdkwork-appbase");
const iamRoot = path.resolve(rtcRoot, "../sdkwork-iam");
const uiRoot = path.resolve(rtcRoot, "../sdkwork-ui/sdkwork-ui-pc-react");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rtcPcRoot, "");
  return {
    define: {
      "process.env.SDKWORK_ACCESS_TOKEN": JSON.stringify(env.SDKWORK_ACCESS_TOKEN ?? ""),
    },
            plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@sdkwork/auth-pc-react": path.resolve(iamRoot, "apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/src/index.ts",
        ),
        "@sdkwork/appbase-pc-react": path.resolve(
          appbaseRoot,
          "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/index.ts",
        ),
        "@sdkwork/core-pc-react": path.resolve(
          rtcRoot,
          "../sdkwork-core/sdkwork-core-pc-react/src/index.ts",
        ),
        "@sdkwork/auth-runtime-pc-react": path.resolve(iamRoot, "apps/sdkwork-iam-pc/packages/sdkwork-auth-runtime-pc-react/src/index.ts",
        ),
        "@sdkwork/iam-app-sdk": path.resolve(iamRoot, "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-typescript/src/index.ts",
        ),
        "@sdkwork/iam-backend-sdk": path.resolve(iamRoot, "sdks/sdkwork-iam-backend-sdk/sdkwork-iam-backend-sdk-typescript/src/index.ts",
        ),
        "@sdkwork/i18n-pc-react": path.resolve(
          appbaseRoot,
          "packages/pc-react/foundation/sdkwork-i18n-pc-react/src/index.ts",
        ),
        "@sdkwork/ui-pc-react": path.resolve(uiRoot, "src/index.ts"),
        "@sdkwork/iam-contracts": path.resolve(iamRoot, "apps/sdkwork-iam-common/packages/sdkwork-iam-contracts/src/index.ts",
        ),
        "@sdkwork/iam-runtime": path.resolve(iamRoot, "apps/sdkwork-iam-common/packages/sdkwork-iam-runtime/src/index.ts",
        ),
        "@sdkwork/iam-sdk-ports": path.resolve(iamRoot, "apps/sdkwork-iam-common/packages/sdkwork-iam-sdk-ports/src/index.ts",
        ),
        "@sdkwork/iam-service": path.resolve(iamRoot, "apps/sdkwork-iam-common/packages/sdkwork-iam-service/src/index.ts",
        ),
        "@sdkwork/runtime-bootstrap": path.resolve(
          appbaseRoot,
          "packages/common/foundation/sdkwork-runtime-bootstrap/src/index.ts",
        ),
      },
    },
    server: { port: 3000 },
  };
});
