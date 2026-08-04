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
      },
    },
    server: { port: 3001 },
  };
});
