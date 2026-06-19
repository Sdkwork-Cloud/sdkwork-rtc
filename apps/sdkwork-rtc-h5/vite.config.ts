import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rtcH5Root = path.dirname(fileURLToPath(import.meta.url));
const rtcRoot = path.resolve(rtcH5Root, "../..");
const appbaseRoot = path.resolve(rtcRoot, "../sdkwork-appbase");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@sdkwork/auth-runtime-pc-react": path.resolve(
        appbaseRoot,
        "packages/pc-react/iam/sdkwork-auth-runtime-pc-react/src/index.ts",
      ),
      "@sdkwork/appbase-app-sdk": path.resolve(
        appbaseRoot,
        "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-typescript/generated/server-openapi/src/index.ts",
      ),
      "@sdkwork/iam-contracts": path.resolve(
        appbaseRoot,
        "packages/common/iam/sdkwork-iam-contracts/src/index.ts",
      ),
      "@sdkwork/iam-runtime": path.resolve(
        appbaseRoot,
        "packages/common/iam/sdkwork-iam-runtime/src/index.ts",
      ),
      "@sdkwork/iam-sdk-ports": path.resolve(
        appbaseRoot,
        "packages/common/iam/sdkwork-iam-sdk-ports/src/index.ts",
      ),
      "@sdkwork/iam-service": path.resolve(
        appbaseRoot,
        "packages/common/iam/sdkwork-iam-service/src/index.ts",
      ),
      "@sdkwork/runtime-bootstrap": path.resolve(
        appbaseRoot,
        "packages/common/foundation/sdkwork-runtime-bootstrap/src/index.ts",
      ),
    },
  },
  server: { port: 3001 },
});
