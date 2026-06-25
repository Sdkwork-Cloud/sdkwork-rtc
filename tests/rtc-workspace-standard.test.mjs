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
  assert.equal(appConfig.schemaVersion, 3, `${appRoot} must use App Manifest Standard v3`);
  assert.equal(appConfig.kind, "sdkwork.app");
  assert.equal(appConfig.runtime?.family, "mini-program");
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
    assert.match(
      appSource,
      /\/rtc\/media-sessions|RTC_APP_HOME_PATH/u,
      `${appRoot}/src/App.tsx must default to user RTC routes`,
    );
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

test("sdkwork-rtc authority workspace does not require sdkwork-discovery without RPC services", () => {
  const cargoToml = read("Cargo.toml");
  assert.doesNotMatch(cargoToml, /sdkwork-discovery/u, "RTC has no RPC services yet; discovery is deferred");
  assert.doesNotMatch(cargoToml, /tonic|prost/u, "RTC authority workspace must not declare RPC crates before RPC services exist");
});

test("sdkwork-rtc declares GitHub packaging workflow manifest", () => {
  assert.ok(exists("sdkwork.workflow.json"), "sdkwork.workflow.json must exist");
  assert.ok(exists(".github/workflows/package.yml"), ".github/workflows/package.yml must exist");
  assert.ok(exists(".github/workflows/rtc-governance.yml"), ".github/workflows/rtc-governance.yml must exist");
  assert.ok(exists(".github/workflows/rtc-server-image.yml"), ".github/workflows/rtc-server-image.yml must exist");
  assert.ok(exists("scripts/prepare-ci-dependencies.mjs"), "scripts/prepare-ci-dependencies.mjs must exist");
  const workflow = JSON.parse(read("sdkwork.workflow.json"));
  assert.equal(workflow.app?.id, "sdkwork-rtc");
  const dependencyIds = (workflow.dependencies ?? []).map((dependency) => dependency.id);
  const verificationDependencyIds = (workflow.verificationDependencies ?? []).map((dependency) => dependency.id);
  const packageYml = read(".github/workflows/package.yml");
  const governanceYml = read(".github/workflows/rtc-governance.yml");
  assert.match(packageYml, /SDKWORK_WEB_FRAMEWORK_REF/u, ".github/workflows/package.yml must pass SDKWORK_WEB_FRAMEWORK_REF");
  assert.match(packageYml, /SDKWORK_DATABASE_REF/u, ".github/workflows/package.yml must pass SDKWORK_DATABASE_REF");
  assert.match(packageYml, /SDKWORK_UTILS_REF/u, ".github/workflows/package.yml must pass SDKWORK_UTILS_REF");
  assert.match(packageYml, /SDKWORK_DRIVE_REF/u, ".github/workflows/package.yml must pass SDKWORK_DRIVE_REF");
  assert.match(governanceYml, /workflow:prepare-ci-dependencies/u, ".github/workflows/rtc-governance.yml must prepare sibling dependencies");
  assert.match(governanceYml, /pnpm run verify/u, ".github/workflows/rtc-governance.yml must run pnpm run verify");
  assert.ok(dependencyIds.includes("sdkwork-drive"), "sdkwork.workflow.json must declare sdkwork-drive for Drive-backed recording import");
  assert.ok(dependencyIds.includes("sdkwork-web-framework"), "sdkwork.workflow.json must declare sdkwork-web-framework");
  assert.ok(dependencyIds.includes("sdkwork-database"), "sdkwork.workflow.json must declare sdkwork-database");
  assert.ok(dependencyIds.includes("sdkwork-utils"), "sdkwork.workflow.json must declare sdkwork-utils");
  assert.ok(dependencyIds.includes("sdkwork-id"), "sdkwork.workflow.json must declare sdkwork-id for database and container builds");
  assert.ok(verificationDependencyIds.includes("sdkwork-im"), "sdkwork.workflow.json must declare sdkwork-im for migration boundary verification");
  assert.ok(verificationDependencyIds.includes("sdkwork-core"), "sdkwork.workflow.json must declare sdkwork-core for migration boundary verification");
  assert.equal(workflow.toolchains?.flutter, "stable", "sdkwork.workflow.json must declare flutter toolchain for mobile verification");
});

test("sdkwork-rtc authority workspace declares root component spec", () => {
  const specPath = "specs/component.spec.json";
  assert.ok(exists(specPath), `${specPath} must exist`);
  const spec = JSON.parse(read(specPath));
  assert.equal(spec.kind, "sdkwork.component.spec");
  assert.equal(spec.component?.name, "sdkwork-rtc-workspace");
  assert.equal(spec.component?.domain, "communication");
  assert.equal(spec.component?.capability, "rtc");
  assert.ok(Array.isArray(spec.verification?.commands) && spec.verification.commands.includes("pnpm run verify"));
  assert.ok(spec.contracts?.topologySpec, "root component spec must reference topology authority");
  assert.deepEqual(spec.contracts?.databasePrefixRegistries, ["specs/database-prefix-registry.json"]);
  assert.deepEqual(spec.contracts?.databaseTableRegistries, ["specs/database-table-registry.json"]);
});

test("sdkwork-rtc runnable app roots use App Manifest Standard v3", () => {
  for (const appRoot of [
    "apps/sdkwork-rtc-pc",
    "apps/sdkwork-rtc-h5",
    "apps/sdkwork-rtc-flutter-mobile",
    "apps/sdkwork-rtc-mini-program",
  ]) {
    const appConfig = JSON.parse(read(`${appRoot}/sdkwork.app.config.json`));
    assert.equal(appConfig.schemaVersion, 3, `${appRoot}/sdkwork.app.config.json must use schemaVersion 3`);
    assert.equal(appConfig.kind, "sdkwork.app", `${appRoot}/sdkwork.app.config.json must use kind sdkwork.app`);
    assert.ok(appConfig.app?.key, `${appRoot} manifest must declare app.key`);
    assert.ok(appConfig.publish?.platforms?.length, `${appRoot} manifest must declare publish.platforms`);
    assert.ok(appConfig.environments?.production, `${appRoot} manifest must declare production environment`);
  }
});

test("sdkwork-rtc runnable app roots declare component specs", () => {
  for (const [appRoot, expectation] of [
    ["apps/sdkwork-rtc-pc", { name: "sdkwork-rtc-pc", type: "pc-app-root" }],
    ["apps/sdkwork-rtc-h5", { name: "sdkwork-rtc-h5", type: "h5-app-root" }],
    ["apps/sdkwork-rtc-flutter-mobile", { name: "sdkwork-rtc-flutter-mobile", type: "flutter-app-root" }],
    ["apps/sdkwork-rtc-mini-program", { name: "sdkwork-rtc-mini-program", type: "mini-program-app-root" }],
  ]) {
    const specPath = `${appRoot}/specs/component.spec.json`;
    assert.ok(exists(specPath), `${specPath} must exist`);
    const spec = JSON.parse(read(specPath));
    assert.equal(spec.kind, "sdkwork.component.spec");
    assert.equal(spec.component?.name, expectation.name);
    assert.equal(spec.component?.type, expectation.type);
    assert.equal(spec.component?.domain, "rtc", `${specPath} must declare rtc domain`);
    assert.ok(spec.component?.manifests?.includes("sdkwork.app.config.json"), `${specPath} must declare sdkwork.app.config.json`);
  }
});

test("sdkwork-rtc flutter mobile packages declare component specs", () => {
  for (const [packageDir, capability] of [
    ["apps/sdkwork-rtc-flutter-mobile/packages/sdkwork_rtc_flutter_mobile_core", "core"],
    ["apps/sdkwork-rtc-flutter-mobile/packages/sdkwork_rtc_flutter_mobile_shell", "shell"],
    ["apps/sdkwork-rtc-flutter-mobile/packages/sdkwork_rtc_flutter_mobile_commons", "commons"],
    ["apps/sdkwork-rtc-flutter-mobile/packages/sdkwork_rtc_flutter_mobile_admin_core", "admin-core"],
    ["apps/sdkwork-rtc-flutter-mobile/packages/sdkwork_rtc_flutter_mobile_rtc", "rtc"],
  ]) {
    const specPath = `${packageDir}/specs/component.spec.json`;
    assert.ok(exists(specPath), `${specPath} must exist`);
    const spec = JSON.parse(read(specPath));
    assert.equal(spec.component?.type, "flutter-package");
    assert.equal(spec.component?.capability, capability);
    assert.equal(spec.component?.domain, "communication");
  }
});

test("sdkwork-rtc database registries align with repository table contracts", () => {
  assert.ok(exists("specs/database-prefix-registry.json"), "specs/database-prefix-registry.json must exist");
  assert.ok(exists("specs/database-table-registry.json"), "specs/database-table-registry.json must exist");

  const prefixRegistry = JSON.parse(read("specs/database-prefix-registry.json"));
  const tableRegistry = JSON.parse(read("specs/database-table-registry.json"));
  const repositoryLib = read("crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs");
  const contractTableNames = [...repositoryLib.matchAll(/table_name:\s*"([^"]+)"/gu)].map((match) => match[1]).sort();
  const registryTableNames = tableRegistry.tables.map((entry) => entry.tableName).sort();

  assert.equal(prefixRegistry.kind, "sdkwork.database.prefixRegistry");
  assert.equal(prefixRegistry.prefixes?.[0]?.prefix, "rtc");
  assert.equal(tableRegistry.kind, "sdkwork.database.tableRegistry");
  assert.equal(tableRegistry.prefixRegistry, "./database-prefix-registry.json");
  assert.deepEqual(registryTableNames, contractTableNames);
  for (const entry of tableRegistry.tables) {
    assert.equal(entry.modulePrefix, "rtc", `${entry.tableName} must use rtc module prefix`);
    assert.match(entry.migration, /postgres_rtc\.sql/u, `${entry.tableName} must reference postgres_rtc.sql authority`);
  }
});

test("sdkwork-rtc .sdkwork workspace metadata is materialized without template placeholders", () => {
  for (const filePath of [
    ".sdkwork/README.md",
    ".sdkwork/skills/README.md",
    ".sdkwork/plugins/README.md",
  ]) {
    const source = read(filePath);
    assert.doesNotMatch(source, /\$name|\$specPath/u, `${filePath} must not keep SDKWork template placeholders`);
    assert.match(source, /sdkwork-rtc/u, `${filePath} must identify sdkwork-rtc`);
    assert.match(source, /\.\.\/sdkwork-specs\//u, `${filePath} must link to ../sdkwork-specs`);
  }
});

test("sdkwork-rtc core Rust runtime crates declare component specs", () => {
  for (const crateDir of [
    "crates/sdkwork-communication-rtc-service",
    "crates/sdkwork-communication-rtc-repository-sqlx",
    "crates/sdkwork-router-rtc-app-api",
    "crates/sdkwork-router-rtc-backend-api",
    "crates/sdkwork-rtc-service-host",
    "crates/sdkwork-rtc-api-server",
    "crates/sdkwork-rtc-app-context",
    "crates/sdkwork-rtc-openapi",
    "crates/sdkwork-rtc-api-registry",
  ]) {
    const specPath = `${crateDir}/specs/component.spec.json`;
    assert.ok(exists(specPath), `${specPath} must exist`);
    const spec = JSON.parse(read(specPath));
    assert.equal(spec.kind, "sdkwork.component.spec");
    assert.equal(spec.component?.domain, "communication");
    assert.equal(spec.component?.capability, "rtc");
    assert.ok(Array.isArray(spec.verification?.commands) && spec.verification.commands.length > 0);
  }
});

test("sdkwork-rtc integrates sdkwork-database framework for persistence bootstrap", () => {
  const repositoryCargo = read("crates/sdkwork-communication-rtc-repository-sqlx/Cargo.toml");
  const databaseModule = read("crates/sdkwork-communication-rtc-repository-sqlx/src/database.rs");
  const apiBootstrap = read("crates/sdkwork-rtc-api-server/src/bootstrap.rs");

  for (const dependency of [
    "sdkwork-database-config",
    "sdkwork-database-sqlx",
    "sdkwork-database-repository",
  ]) {
    assert.match(repositoryCargo, new RegExp(dependency, "u"), `repository crate must declare ${dependency}`);
  }

  assert.match(databaseModule, /connect_rtc_persistence_from_env/u, "repository must expose sdkwork-database bootstrap");
  assert.match(databaseModule, /HealthChecker/u, "repository must expose sdkwork-database health checks");
  assert.match(databaseModule, /rtc_database_env_values_explicitly_configured/u, "repository must keep pure RTC database env detection");
  assert.doesNotMatch(databaseModule, /persistence_from_legacy_database_url/u, "repository must not keep legacy direct sqlx pool bootstrap");
  assert.match(apiBootstrap, /connect_rtc_persistence_bootstrap_from_env/u, "api-server must bootstrap persistence through repository database module");
  assert.doesNotMatch(apiBootstrap, /create_pool_from_env/u, "api-server must not duplicate sdkwork-database pool bootstrap");
});

test("sdkwork-rtc route crates do not keep legacy auth middleware modules", () => {
  assert.equal(exists("crates/sdkwork-router-rtc-app-api/src/middleware.rs"), false);
  assert.equal(exists("crates/sdkwork-router-rtc-backend-api/src/middleware.rs"), false);
  for (const filePath of [
    "crates/sdkwork-router-rtc-app-api/src/web_bootstrap.rs",
    "crates/sdkwork-router-rtc-backend-api/src/web_bootstrap.rs",
  ]) {
    const source = read(filePath);
    assert.doesNotMatch(source, /resolve_app_context/u, `${filePath} must inject AppContext from WebRequestContext`);
  }
});

test("sdkwork-rtc client surfaces use app-scoped IAM session storage keys", () => {
  const pcIamSession = read("apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-core/src/session/iamSession.ts");
  const h5IamSession = read("apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-core/src/session/iamSession.ts");
  const mpSessionKey = read("apps/sdkwork-rtc-mini-program/packages/sdkwork-rtc-mp-core/src/session/sessionStorageKey.ts");
  const flutterSession = read("apps/sdkwork-rtc-flutter-mobile/packages/sdkwork_rtc_flutter_mobile_core/lib/src/session/app_session.dart");

  assert.match(pcIamSession, /sdkwork-rtc-pc:session:v1/u);
  assert.match(h5IamSession, /sdkwork-rtc-h5:session:v1/u);
  assert.match(mpSessionKey, /sdkwork-rtc-mini-program:session:v1/u);
  assert.match(flutterSession, /sdkwork-rtc-flutter-mobile:session:v1/u);
  assert.match(read("apps/sdkwork-rtc-pc/src/bootstrap/adminAuth.ts"), /sdkwork-rtc-pc:admin-session:v1/u);
  assert.match(read("apps/sdkwork-rtc-h5/src/bootstrap/adminAuth.ts"), /sdkwork-rtc-h5:admin-session:v1/u);

  for (const source of [pcIamSession, h5IamSession]) {
    assert.doesNotMatch(source, /RTC_LEGACY_SESSION_STORAGE_KEY/u);
    assert.doesNotMatch(source, /legacy-session/u);
  }

  for (const filePath of [
    "apps/sdkwork-rtc-mini-program/src/pages/login/index.js",
    "apps/sdkwork-rtc-mini-program/src/pages/media-sessions/index.js",
    "apps/sdkwork-rtc-mini-program/src/pages/media-session-room/index.js",
  ]) {
    const source = read(filePath);
    assert.doesNotMatch(source, /["']sdkwork\.rtc\.app\.session["']/u, `${filePath} must not hardcode legacy session storage key`);
    assert.doesNotMatch(source, /dev-access-token/u, `${filePath} must not default to development access tokens`);
    assert.match(source, /constants\/sessionStorageKey/u, `${filePath} must import canonical session storage key`);
  }
  assert.match(read("apps/sdkwork-rtc-mini-program/src/pages/login/index.js"), /onAppbaseLogin/u);
  assert.match(
    read("apps/sdkwork-rtc-mini-program/src/app.js"),
    /constants\/sessionStorageKey/u,
    "mini program app entry must import canonical session storage key",
  );
  assert.match(
    read("apps/sdkwork-rtc-mini-program/src/constants/sessionStorageKey.js"),
    /LEGACY_SESSION_STORAGE_KEYS/u,
    "mini program constants must declare legacy migration keys centrally",
  );
});

test("sdkwork-rtc PC app integrates appbase auth runtime factory", () => {
  const appPackage = JSON.parse(read("apps/sdkwork-rtc-pc/package.json"));
  const corePackage = JSON.parse(read("apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-core/package.json"));
  assert.equal(appPackage.dependencies?.["@sdkwork/auth-runtime-pc-react"], "workspace:*");
  assert.equal(appPackage.dependencies?.["@sdkwork/auth-pc-react"], "workspace:*");
  assert.equal(appPackage.dependencies?.["react-router-dom"], "^7.17.0");
  assert.equal(
    corePackage.dependencies?.["@sdkwork/auth-runtime-pc-react"],
    undefined,
    "auth runtime factory must stay at app bootstrap layer, not rtc-pc-core",
  );
  assert.match(read("apps/sdkwork-rtc-pc/src/bootstrap/rtcAppAuthRuntime.ts"), /createSdkworkAppbasePcAuthRuntime/u);
  assert.match(read("apps/sdkwork-rtc-pc/src/bootstrap/iamRuntime.ts"), /createRtcAppAuthRuntime/u);
  assert.match(read("apps/sdkwork-rtc-pc/src/bootstrap/environment.ts"), /VITE_SDKWORK_RTC_PC_APPBASE_APP_API_BASE_URL/u);
  assert.match(read("apps/sdkwork-rtc-pc/src/AppAuthGate.tsx"), /SdkworkIamAuthRoutes/u);
  assert.match(read("apps/sdkwork-rtc-pc/src/App.tsx"), /HashRouter/u);
  assert.match(read("apps/sdkwork-rtc-pc/vite.config.ts"), /@sdkwork\/auth-pc-react/u);
  assert.ok(
    exists("apps/sdkwork-rtc-pc/src/__tests__/pc-architecture.contract.test.ts"),
    "rtc pc app must declare architecture contract tests",
  );
  assert.match(read("pnpm-workspace.yaml"), /sdkwork-auth-runtime-pc-react/u);
  assert.match(read("pnpm-workspace.yaml"), /sdkwork-auth-pc-react/u);
});

test("sdkwork-rtc H5 app integrates appbase auth runtime and shared IAM auth routes", () => {
  const h5Package = JSON.parse(read("apps/sdkwork-rtc-h5/package.json"));
  const corePackage = JSON.parse(read("apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-core/package.json"));
  assert.equal(h5Package.dependencies?.["@sdkwork/auth-runtime-pc-react"], "workspace:*");
  assert.equal(h5Package.dependencies?.["@sdkwork/auth-pc-react"], "workspace:*");
  assert.equal(h5Package.dependencies?.["react-router-dom"], "^7.17.0");
  assert.equal(
    corePackage.dependencies?.["@sdkwork/auth-runtime-pc-react"],
    undefined,
    "auth runtime factory must stay at app bootstrap layer, not rtc-h5-core",
  );
  assert.match(read("apps/sdkwork-rtc-h5/src/bootstrap/rtcAppAuthRuntime.ts"), /platform:\s*"h5"/u);
  assert.match(read("apps/sdkwork-rtc-h5/src/bootstrap/iamRuntime.ts"), /createRtcAppAuthRuntime/u);
  assert.match(read("apps/sdkwork-rtc-h5/src/bootstrap/environment.ts"), /VITE_SDKWORK_RTC_H5_APPBASE_APP_API_BASE_URL/u);
  assert.match(read("apps/sdkwork-rtc-h5/src/AppAuthGate.tsx"), /SdkworkIamAuthRoutes/u);
  assert.match(read("apps/sdkwork-rtc-h5/src/App.tsx"), /HashRouter/u);
  assert.doesNotMatch(read("apps/sdkwork-rtc-h5/src/AppAuthGate.tsx"), /RtcH5AuthLoginPage/u);
  assert.match(read("apps/sdkwork-rtc-h5/vite.config.ts"), /@sdkwork\/auth-pc-react/u);
  assert.ok(
    exists("apps/sdkwork-rtc-h5/src/__tests__/h5-architecture.contract.test.ts"),
    "rtc h5 app must declare architecture contract tests",
  );
  assert.doesNotMatch(read("pnpm-workspace.yaml"), /sdkwork-auth-runtime-h5/u);
});

test("sdkwork-rtc client cores declare IAM contract dependency", () => {
  for (const packagePath of [
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-core/package.json",
    "apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-core/package.json",
  ]) {
    const packageJson = JSON.parse(read(packagePath));
    assert.equal(
      packageJson.dependencies?.["@sdkwork/iam-contracts"],
      "workspace:*",
      `${packagePath} must depend on @sdkwork/iam-contracts`,
    );
  }
  assert.match(read("pnpm-workspace.yaml"), /@sdkwork\/iam-contracts|sdkwork-iam-contracts/u);
});

test("sdkwork-rtc integrates sdkwork-web-framework for HTTP route crates", () => {
  const cargoToml = read("Cargo.toml");
  for (const dependency of [
    "sdkwork-web-axum",
    "sdkwork-web-bootstrap",
    "sdkwork-web-contract",
    "sdkwork-web-core",
    "sdkwork-iam-web-adapter",
    "sdkwork-database-sqlx",
  ]) {
    assert.match(cargoToml, new RegExp(dependency, "u"), `Cargo.toml must declare ${dependency}`);
  }

  for (const filePath of [
    "crates/sdkwork-router-rtc-app-api/src/web_bootstrap.rs",
    "crates/sdkwork-router-rtc-backend-api/src/web_bootstrap.rs",
    "crates/sdkwork-router-rtc-app-api/build.rs",
    "crates/sdkwork-router-rtc-backend-api/build.rs",
  ]) {
    assert.ok(exists(filePath), `${filePath} must exist`);
  }

  const appRoutes = read("crates/sdkwork-router-rtc-app-api/src/routes.rs");
  const backendRoutes = read("crates/sdkwork-router-rtc-backend-api/src/routes.rs");
  assert.doesNotMatch(appRoutes, /enforce_app_route_auth/u, "app-api routes must not keep custom auth middleware");
  assert.doesNotMatch(backendRoutes, /enforce_backend_route_auth/u, "backend-api routes must not keep custom auth middleware");
});

test("sdkwork-rtc integrates sdkwork-utils for shared Rust and TypeScript helpers", () => {
  const cargoToml = read("Cargo.toml");
  const workflow = JSON.parse(read("sdkwork.workflow.json"));
  const dependencyIds = (workflow.dependencies ?? []).map((dependency) => dependency.id);
  const serviceLib = read("crates/sdkwork-communication-rtc-service/src/lib.rs");
  const aliyunCredential = read("plugins/rtc-aliyun/src/credential.rs");

  assert.match(cargoToml, /sdkwork-utils-rust/u, "Cargo.toml must declare sdkwork-utils-rust");
  assert.ok(dependencyIds.includes("sdkwork-utils"), "sdkwork.workflow.json must declare sdkwork-utils");
  assert.match(serviceLib, /sdkwork_utils_rust::format_datetime/u, "service crate must use sdkwork-utils datetime helpers");
  assert.match(serviceLib, /sdkwork_utils_rust::sha256_hash/u, "service crate must use sdkwork-utils crypto helpers");
  assert.match(aliyunCredential, /sdkwork_utils_rust::/u, "provider plugins must use sdkwork-utils instead of local crypto helpers");
  assert.doesNotMatch(aliyunCredential, /fn sha256_hex/u, "provider plugins must not keep local sha256 helpers");
  assert.match(read("pnpm-workspace.yaml"), /sdkwork-utils-typescript/u);
  assert.match(read("apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-commons/package.json"), /@sdkwork\/utils/u);
  assert.match(read("apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-commons/package.json"), /@sdkwork\/utils/u);
});

test("sdkwork-rtc route manifests declare WebRequestContext and apiSurface", () => {
  for (const manifestPath of [
    "sdks/_route-manifests/app-api/sdkwork-router-rtc-app-api.route-manifest.json",
    "sdks/_route-manifests/backend-api/sdkwork-router-rtc-backend-api.route-manifest.json",
  ]) {
    const manifest = JSON.parse(read(manifestPath));
    assert.ok(Array.isArray(manifest.routes) && manifest.routes.length > 0, `${manifestPath} must declare routes`);
    for (const route of manifest.routes) {
      assert.equal(route.requestContext, "WebRequestContext", `${manifestPath} route ${route.operationId} must declare requestContext`);
      assert.ok(route.apiSurface, `${manifestPath} route ${route.operationId} must declare apiSurface`);
    }
  }
});

test("sdkwork-rtc api-server wires database readiness when persistence pool is configured", () => {
  const mainSource = read("crates/sdkwork-rtc-api-server/src/main.rs");
  const bootstrapSource = read("crates/sdkwork-rtc-api-server/src/bootstrap.rs");
  const readinessSource = read("crates/sdkwork-rtc-api-server/src/readiness.rs");
  const databaseModule = read("crates/sdkwork-communication-rtc-repository-sqlx/src/database.rs");

  assert.match(databaseModule, /connect_rtc_persistence_bootstrap_from_env/u);
  assert.match(databaseModule, /rtc_database_env_explicitly_configured/u, "repository must opt in to persistence only when RTC database env is configured");
  assert.match(databaseModule, /rtc_database_env_values_explicitly_configured/u, "repository must keep pure env detection helper for verification");
  assert.match(read("crates/sdkwork-communication-rtc-repository-sqlx/specs/component.spec.json"), /database-prefix-registry\.json/u);
  assert.match(read("crates/sdkwork-communication-rtc-repository-sqlx/specs/component.spec.json"), /database-table-registry\.json/u);
  assert.doesNotMatch(databaseModule, /persistence_from_legacy_database_url/u, "repository must not keep legacy direct sqlx pool bootstrap");
  assert.match(bootstrapSource, /RtcApiBootstrap/u);
  assert.match(bootstrapSource, /database_pool/u);
  assert.match(readinessSource, /RtcDatabaseReadinessCheck/u);
  assert.match(readinessSource, /check_rtc_database_health/u);
  assert.match(mainSource, /RtcDatabaseReadinessCheck/u);
  assert.match(mainSource, /database_pool/u);
});

test("sdkwork-rtc provider webhook ingress declares framework rate-limit tier", () => {
  const backendManifest = JSON.parse(
    read("sdks/_route-manifests/backend-api/sdkwork-router-rtc-backend-api.route-manifest.json"),
  );
  const webhookRoute = backendManifest.routes.find(
    (route) => route.operationId === "rtc.providerWebhooks.events.receive",
  );
  assert.ok(webhookRoute, "backend manifest must declare provider webhook receive route");
  assert.equal(webhookRoute.rateLimitTier, "openApiDefault");

  const backendWebBootstrap = read("crates/sdkwork-router-rtc-backend-api/src/web_bootstrap.rs");
  assert.match(backendWebBootstrap, /RateLimitPolicy/u);
  assert.match(backendWebBootstrap, /enabled: true/u);

  const backendBuild = read("crates/sdkwork-router-rtc-backend-api/build.rs");
  assert.match(backendBuild, /rateLimitTier/u);
  assert.match(backendBuild, /with_rate_limit_tier/u);
});

test("sdkwork-rtc mutation routes declare framework rate-limit tiers and idempotency", () => {
  for (const manifestPath of [
    "sdks/_route-manifests/app-api/sdkwork-router-rtc-app-api.route-manifest.json",
    "sdks/_route-manifests/backend-api/sdkwork-router-rtc-backend-api.route-manifest.json",
  ]) {
    const manifest = JSON.parse(read(manifestPath));
    const mutationRoutes = manifest.routes.filter((route) =>
      ["POST", "PUT", "PATCH", "DELETE"].includes(route.method),
    );
    assert.ok(mutationRoutes.length > 0, `${manifestPath} must declare mutation routes`);
    for (const route of mutationRoutes) {
      assert.ok(
        route.rateLimitTier,
        `${route.operationId} must declare rateLimitTier`,
      );
    }
    const credentialRoute = manifest.routes.find(
      (route) => route.operationId === "rtc.mediaSessions.participantCredentials.issue",
    );
    if (credentialRoute) {
      assert.equal(credentialRoute.rateLimitTier, "authCritical");
      assert.equal(credentialRoute.idempotent, true);
    }
    const createRoute = manifest.routes.find(
      (route) => route.operationId === "rtc.mediaSessions.create",
    );
    if (createRoute) {
      assert.equal(createRoute.idempotent, true);
    }
  }

  const appWebBootstrap = read("crates/sdkwork-router-rtc-app-api/src/web_bootstrap.rs");
  assert.match(appWebBootstrap, /RateLimitPolicy/u);
  assert.match(appWebBootstrap, /enabled: true/u);
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

test("sdkwork-rtc ships production deployment manifests and reconcile binary", () => {
  for (const filePath of [
    "deployments/kubernetes/README.md",
    "deployments/kubernetes/cloud-split-services/namespace.yaml",
    "deployments/kubernetes/cloud-split-services/rtc-api-server/deployment.yaml",
    "deployments/kubernetes/cloud-split-services/rtc-api-server/service.yaml",
    "deployments/kubernetes/cloud-split-services/rtc-reconcile/cronjob.yaml",
    "deployments/templates/server.env.example",
    "deployments/docker/Dockerfile",
    "deployments/docker/README.md",
    "deployments/docker/docker-compose.standalone.example.yaml",
    "deployments/systemd/sdkwork-rtc-api-server.service",
    "docs/guides/operator/deployment.md",
    "scripts/package-server.mjs",
    "crates/sdkwork-rtc-api-server/src/bin/reconcile.rs",
  ]) {
    assert.ok(exists(filePath), `${filePath} must exist`);
  }

  const apiServerCargo = read("crates/sdkwork-rtc-api-server/Cargo.toml");
  assert.match(apiServerCargo, /name = "sdkwork-rtc-reconcile"/u);
  assert.match(
    read("jobs/schedules/rtc-session-reconciliation.yaml"),
    /binding: sdkwork-rtc-reconcile/u,
  );

  const packageJson = JSON.parse(read("package.json"));
  assert.match(packageJson.scripts["package:server"], /package-server\.mjs package/u);

  const packageServer = read("scripts/package-server.mjs");
  assert.match(packageServer, /sdkwork-rtc-api-server/u);
  assert.match(packageServer, /sdkwork-rtc-reconcile/u);
  assert.match(read("deployments/docker/Dockerfile"), /sdkwork-rtc-reconcile/u);
  assert.match(read(".github/workflows/rtc-server-image.yml"), /ghcr\.io\/sdkwork\/rtc-api-server/u);
});
