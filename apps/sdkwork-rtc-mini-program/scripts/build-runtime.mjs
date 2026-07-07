import * as esbuild from "esbuild";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

function readRuntimeDefaults() {
  const configPath =
    process.env.SDKWORK_RTC_MP_RUNTIME_CONFIG ??
    path.join(root, "../config/mini-program/runtime-env.json");
  const examplePath = path.join(root, "../config/mini-program/runtime-env.development.example.json");

  let rawConfig = {};
  if (existsSync(configPath)) {
    rawConfig = JSON.parse(readFileSync(configPath, "utf8"));
  } else if (existsSync(examplePath)) {
    rawConfig = JSON.parse(readFileSync(examplePath, "utf8"));
  }

  const rtc = rawConfig.rtc ?? {};
  const appbase = rawConfig.appbase ?? {};

  return {
    apiBaseUrl:
      process.env.SDKWORK_RTC_MP_API_BASE_URL ??
      rtc.apiBaseUrl ??
      "http://127.0.0.1:18088/app/v3/api",
    appbaseLoginUrl:
      process.env.SDKWORK_RTC_MP_APPBASE_LOGIN_URL ??
      appbase.loginUrl ??
      "http://127.0.0.1:3900",
  };
}

const runtimeDefaults = readRuntimeDefaults();

await esbuild.build({
  entryPoints: [path.join(root, "../src/bootstrap/runtimeBundle.ts")],
  bundle: true,
  outfile: path.join(root, "../src/runtime/rtc-app.js"),
  platform: "browser",
  format: "cjs",
  target: "es2019",
  logLevel: "info",
  define: {
    __SDKWORK_RTC_DEFAULT_API_BASE_URL__: JSON.stringify(runtimeDefaults.apiBaseUrl),
    __SDKWORK_RTC_DEFAULT_APPBASE_LOGIN_URL__: JSON.stringify(runtimeDefaults.appbaseLoginUrl),
  },
});
