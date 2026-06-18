import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("sdkwork-rtc uses the SDKWork standard project-root directory dictionary", () => {
  for (const directory of [
    "apis",
    "apps",
    "crates",
    "sdks",
    "jobs",
    "tools",
    "plugins",
    "examples",
    "configs",
    "deployments",
    "scripts",
    "docs",
    "tests",
  ]) {
    assert.ok(exists(`${directory}/README.md`), `${directory}/README.md must exist`);
  }
});

test("sdkwork-rtc keeps app packages under app surface roots", () => {
  assert.equal(
    exists("packages"),
    false,
    "root packages/ must not exist in the RTC authority workspace; app packages belong under apps/<app-root>/packages/",
  );
  for (const packagePath of [
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-core/package.json",
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-shell/package.json",
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/package.json",
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-admin-core/package.json",
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-admin-shell/package.json",
    "apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-core/package.json",
    "apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-shell/package.json",
    "apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-rtc/package.json",
    "apps/sdkwork-rtc-mini-program/packages/sdkwork-rtc-mp-core/package.json",
    "apps/sdkwork-rtc-mini-program/packages/sdkwork-rtc-mp-shell/package.json",
    "apps/sdkwork-rtc-mini-program/packages/sdkwork-rtc-mp-rtc/package.json",
    "apps/sdkwork-rtc-mini-program/packages/sdkwork-rtc-mp-host/package.json",
    "apps/sdkwork-rtc-flutter-mobile/packages/sdkwork_rtc_flutter_mobile_rtc/pubspec.yaml",
  ]) {
    assert.ok(exists(packagePath), `${packagePath} must exist`);
  }
});

test("sdkwork-rtc mini program root exposes user RTC surface packages", () => {
  const appRoot = "apps/sdkwork-rtc-mini-program";
  assert.ok(exists(`${appRoot}/sdkwork.app.config.json`), `${appRoot}/sdkwork.app.config.json must exist`);
  assert.ok(exists(`${appRoot}/src/app.json`), `${appRoot}/src/app.json must exist`);
  const appJson = JSON.parse(read(`${appRoot}/src/app.json`));
  assert.ok(
    appJson.pages?.includes("pages/media-session-room/index"),
    `${appRoot}/src/app.json must include media session room page`,
  );
  const appConfig = JSON.parse(read(`${appRoot}/sdkwork.app.config.json`));
  assert.equal(appConfig.app?.runtime?.family, "mini-program");
  const rtcPackageSource = read(`${appRoot}/packages/sdkwork-rtc-mp-rtc/package.json`);
  assert.match(rtcPackageSource, /sdkwork-rtc-app-sdk-generated-typescript/u, "sdkwork-rtc-mp-rtc must depend on the generated app SDK");
});

test("sdkwork-rtc flutter mobile exposes app auth deep link surfaces", () => {
  const appRoot = "apps/sdkwork-rtc-flutter-mobile";
  assert.ok(exists(`${appRoot}/android/app/src/main/AndroidManifest.xml`), `${appRoot} must include Android platform manifest`);
  assert.ok(exists(`${appRoot}/ios/Runner/Info.plist`), `${appRoot} must include iOS Info.plist`);
  const androidManifest = read(`${appRoot}/android/app/src/main/AndroidManifest.xml`);
  assert.match(androidManifest, /sdkworkrtc/u, "Android manifest must register sdkworkrtc deep link scheme");
  assert.match(androidManifest, /auth/u, "Android manifest must register auth callback host");
  const iosPlist = read(`${appRoot}/ios/Runner/Info.plist`);
  assert.match(iosPlist, /CFBundleURLSchemes/u, "iOS Info.plist must register URL schemes");
  assert.match(iosPlist, /sdkworkrtc/u, "iOS Info.plist must register sdkworkrtc deep link scheme");
  const appAuthGate = read(`${appRoot}/lib/app_auth_gate.dart`);
  assert.match(appAuthGate, /AppLinks/u, "Flutter app auth gate must listen for deep link callbacks");
});

test("sdkwork-rtc app roots expose dual app and admin surfaces", () => {
  for (const [appRoot, rtcPackage] of [
    ["apps/sdkwork-rtc-pc", "sdkwork-rtc-pc-rtc"],
    ["apps/sdkwork-rtc-h5", "sdkwork-rtc-h5-rtc"],
  ]) {
    const appSource = read(`${appRoot}/src/App.tsx`);
    assert.match(appSource, /RtcApp/u, `${appRoot}/src/App.tsx must compose the user RTC surface`);
    assert.match(appSource, /AdminApp/u, `${appRoot}/src/App.tsx must compose the admin surface`);
    assert.match(appSource, /\/rtc\/media-sessions/u, `${appRoot}/src/App.tsx must default to user RTC routes`);
    const rtcPackageSource = read(`${appRoot}/packages/${rtcPackage}/package.json`);
    assert.match(rtcPackageSource, /sdkwork-rtc-app-sdk-generated-typescript/u, `${rtcPackage} must depend on the generated app SDK`);
  }
});

test("sdkwork-rtc keeps API authority inputs under apis", () => {
  for (const apiPath of [
    "apis/app-api/communication/sdkwork-rtc-app-api.openapi.json",
    "apis/backend-api/communication/sdkwork-rtc-backend-api.openapi.json",
  ]) {
    assert.ok(exists(apiPath), `${apiPath} must exist`);
  }

  assert.equal(exists("generated/openapi"), false, "generated/openapi must not remain as an API input root");
});

test("sdkwork-rtc uses responsibility-specific Rust crate names", () => {
  for (const cratePath of [
    "crates/sdkwork-communication-rtc-service/Cargo.toml",
    "crates/sdkwork-communication-rtc-repository-sqlx/Cargo.toml",
    "crates/sdkwork-router-rtc-app-api/Cargo.toml",
    "crates/sdkwork-router-rtc-backend-api/Cargo.toml",
    "crates/sdkwork-rtc-service-host/Cargo.toml",
  ]) {
    assert.ok(exists(cratePath), `${cratePath} must exist`);
  }

  const crateNames = readdirSync(path.join(root, "crates"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  assert.deepEqual(
    crateNames.filter((name) => /^sdkwork-rtc-(core|storage-sqlx)$/u.test(name)),
    [],
    "legacy core/storage crate names must be removed",
  );
  assert.equal(exists("services"), false, "services must not remain as a competing top-level runtime root");
  assert.equal(exists("adapters"), false, "adapters must not remain as a competing top-level plugin root");
});

test("sdkwork-rtc provider plugins live under plugins", () => {
  for (const provider of ["agora", "aliyun", "livekit", "tencent", "volcengine"]) {
    assert.ok(exists(`plugins/rtc-${provider}/Cargo.toml`), `plugins/rtc-${provider}/Cargo.toml must exist`);
    const componentSpecPath = `plugins/rtc-${provider}/specs/component.spec.json`;
    assert.ok(exists(componentSpecPath), `${componentSpecPath} must exist`);
    const componentSpec = JSON.parse(read(componentSpecPath));
    assert.equal(componentSpec.component?.domain, "communication");
    assert.equal(componentSpec.component?.capability, "rtc");
  }
});

test("sdkwork-rtc manifests and tools use standard paths and route crate names", () => {
  for (const filePath of [
    "Cargo.toml",
    "tools/rtc_sdk_generate.mjs",
    "sdks/materialize-rtc-v3-openapi-boundaries.mjs",
    "sdks/sdkwork-rtc-app-sdk/sdk-manifest.json",
    "sdks/sdkwork-rtc-backend-sdk/sdk-manifest.json",
    "sdks/sdkwork-rtc-app-sdk/.sdkwork-assembly.json",
    "sdks/sdkwork-rtc-backend-sdk/.sdkwork-assembly.json",
  ]) {
    const source = read(filePath);
    assert.doesNotMatch(source, /generated[\\/]openapi/u, `${filePath} must not reference generated/openapi`);
    assert.doesNotMatch(source, /sdkwork-rtc-core|sdkwork-rtc-storage-sqlx|sdkwork-rtc-product|sdkwork-routes-rtc-/u, `${filePath} must not reference legacy Rust crate names`);
    assert.match(source, /sdkwork-router-rtc-(app|backend)-api|sdkwork-communication-rtc-(service|repository-sqlx)|apis[\\/](app-api|backend-api)[\\/]communication/u, `${filePath} must reference standard names or API paths`);
  }
});
