import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..", "..");
const coreRoot = path.join(appRoot, "packages", "sdkwork-rtc-pc-core");
const adminCoreRoot = path.join(appRoot, "packages", "sdkwork-rtc-pc-admin-core");

function read(relativePath: string): string {
  return readFileSync(path.join(appRoot, relativePath), "utf8");
}

function readJson(relativePath: string): unknown {
  return JSON.parse(read(relativePath));
}

function listFiles(root: string, extensions = [".ts", ".tsx"]): string[] {
  if (!existsSync(root)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const absolute = path.join(root, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      if (["node_modules", "dist", "target", "__tests__"].includes(entry)) {
        continue;
      }
      files.push(...listFiles(absolute, extensions));
      continue;
    }

    if (extensions.includes(path.extname(entry))) {
      files.push(absolute);
    }
  }
  return files;
}

function readAll(root: string): string {
  return listFiles(root)
    .map((file) => `\n// ${path.relative(appRoot, file)}\n${readFileSync(file, "utf8")}`)
    .join("\n");
}

function forbiddenRawHttpPattern(): RegExp {
  return /\bfetch\s*\(/;
}

describe("rtc pc architecture contract", () => {
  it("keeps the root PC app as a thin bootstrap shell", () => {
    const app = read("src/App.tsx");
    const main = read("src/main.tsx");
    const runtime = read("src/bootstrap/runtime.ts");

    expect(app).toContain("HashRouter");
    expect(app).toContain("RtcApp");
    expect(app).toContain("AdminApp");
    expect(app).toContain("AppAuthGate");
    expect(app).toContain("RTC_APP_HOME_PATH");
    expect(app).not.toMatch(forbiddenRawHttpPattern());
    expect(main).toContain("./index.css");
    expect(runtime).toContain("createIamRuntime");
    expect(runtime).toContain("bootstrapSdkClients");
  });

  it("provides core packages for session, SDK, and admin boundaries", () => {
    for (const relativePath of [
      "packages/sdkwork-rtc-pc-core/package.json",
      "packages/sdkwork-rtc-pc-core/src/index.ts",
      "packages/sdkwork-rtc-pc-core/src/session/iamSession.ts",
      "packages/sdkwork-rtc-pc-core/src/sdk/appSdkClient.ts",
      "packages/sdkwork-rtc-pc-admin-core/package.json",
      "packages/sdkwork-rtc-pc-admin-core/src/index.ts",
    ]) {
      expect(existsSync(path.join(appRoot, relativePath)), `${relativePath} should exist`).toBe(true);
    }

    const coreSource = readAll(coreRoot);
    const adminCoreSource = readAll(adminCoreRoot);

    expect(coreSource).toContain("sdkwork-rtc-app-sdk-generated-typescript");
    expect(coreSource).toContain("readRtcIamSessionTokens");
    expect(coreSource).toContain("getRtcAppSdkClient");
    expect(coreSource).not.toContain("@sdkwork/auth-pc-react");
    expect(coreSource).not.toContain("@sdkwork/auth-runtime-pc-react");
    expect(adminCoreSource).toContain("sdkwork-rtc-backend-sdk-generated-typescript");
    expect(coreSource).not.toMatch(forbiddenRawHttpPattern());
    expect(adminCoreSource).not.toMatch(forbiddenRawHttpPattern());
  });

  it("protects user RTC routes through AppAuthGate and canonical IAM auth routes", () => {
    const app = read("src/App.tsx");
    const authGate = read("src/AppAuthGate.tsx");
    const iamRuntime = read("src/bootstrap/iamRuntime.ts");
    const authRuntime = read("src/bootstrap/rtcAppAuthRuntime.ts");

    expect(app).toContain("AppAuthGate");
    expect(authGate).toContain("SdkworkIamAuthRoutes");
    expect(authGate).toContain("getRtcIamRuntimeForAuth");
    expect(authGate).toContain("routerContextMode=\"external\"");
    expect(authGate).not.toContain("DEFAULT_APP_SESSION");
    expect(authGate).not.toContain("buildAppbaseLoginUrl");
    expect(authGate).not.toMatch(/\/app\/v3\/api\/auth/u);
    expect(iamRuntime).toContain("createRtcAppAuthRuntime");
    expect(authRuntime).toContain("createSdkworkAppbasePcAuthRuntime");
    expect(authRuntime).not.toMatch(/@sdkwork\/iam-sdk-adapter|createIamSdkAdapters/u);
  });

  it("keeps appbase auth runtime wiring at the app bootstrap layer", () => {
    const appPackageJson = JSON.parse(readFileSync(path.join(appRoot, "package.json"), "utf8"));
    const corePackageJson = JSON.parse(readFileSync(path.join(coreRoot, "package.json"), "utf8"));
    const viteConfig = read("vite.config.ts");
    const packageJsonPaths = listFiles(path.join(appRoot, "packages"), [".json"]).filter((file) =>
      file.endsWith("package.json"),
    );

    expect(appPackageJson.dependencies).toMatchObject({
      "@sdkwork/auth-pc-react": expect.any(String),
      "@sdkwork/auth-runtime-pc-react": expect.any(String),
      "react-router-dom": expect.any(String),
    });
    expect(corePackageJson.dependencies).not.toHaveProperty("@sdkwork/auth-pc-react");
    expect(corePackageJson.dependencies).not.toHaveProperty("@sdkwork/auth-runtime-pc-react");

    for (const file of packageJsonPaths) {
      const manifest = JSON.parse(readFileSync(file, "utf8"));
      const deps = {
        ...(manifest.dependencies ?? {}),
        ...(manifest.peerDependencies ?? {}),
      };
      expect(deps, path.relative(appRoot, file)).not.toHaveProperty("@sdkwork/auth-pc-react");
      expect(deps, path.relative(appRoot, file)).not.toHaveProperty("@sdkwork/auth-runtime-pc-react");
    }

    expect(viteConfig).toContain("@sdkwork/auth-pc-react");
    expect(viteConfig).toContain("@sdkwork/auth-runtime-pc-react");
    expect(viteConfig).toContain("tailwindcss");
  });

  it("defers admin auth to backend dual-token bootstrap until admin IAM surface exists", () => {
    const adminAuthGate = read("src/AuthGate.tsx");
    const adminAuth = read("src/bootstrap/adminAuth.ts");

    expect(adminAuthGate).toContain("DEFAULT_ADMIN_SESSION");
    expect(adminAuthGate).not.toContain("SdkworkIamAuthRoutes");
    expect(adminAuth).toContain("sdkwork-rtc-pc:admin-session:v1");
    expect(adminAuth).not.toMatch(/\/backend\/v3\/api\/auth/u);
  });

  it("declares RTC SDK dependencies in the app component spec", () => {
    const appSpec = readJson("specs/component.spec.json") as {
      component: { domain: string; type: string };
      contracts: { sdkDependencies: string[] };
    };

    expect(appSpec.component.domain).toBe("rtc");
    expect(appSpec.component.type).toBe("pc-app-root");
    expect(appSpec.contracts.sdkDependencies).toContain("sdkwork-rtc-app-sdk");
  });
});
