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

test("sdkwork-rtc authority workspace does not require sdkwork-discovery without RPC services", () => {
  const cargoToml = read("Cargo.toml");
  assert.doesNotMatch(cargoToml, /sdkwork-discovery/u, "RTC has no RPC services yet; discovery is deferred");
  assert.doesNotMatch(cargoToml, /tonic|prost/u, "RTC authority workspace must not declare RPC crates before RPC services exist");
});

test("sdkwork-rtc declares GitHub packaging workflow manifest", () => {
  assert.ok(exists("sdkwork.workflow.json"), "sdkwork.workflow.json must exist");
  assert.ok(exists(".github/workflows/package.yml"), ".github/workflows/package.yml must exist");
  assert.ok(exists(".github/workflows/rtc-governance.yml"), ".github/workflows/rtc-governance.yml must exist");
  assert.ok(exists("scripts/prepare-ci-dependencies.mjs"), "scripts/prepare-ci-dependencies.mjs must exist");
  const workflow = JSON.parse(read("sdkwork.workflow.json"));
  assert.equal(workflow.app?.id, "sdkwork-rtc");
  const dependencyIds = (workflow.dependencies ?? []).map((dependency) => dependency.id);
  const verificationDependencyIds = (workflow.verificationDependencies ?? []).map((dependency) => dependency.id);
  const packageYml = read(".github/workflows/package.yml");
  const governanceYml = read(".github/workflows/rtc-governance.yml");
  assert.match(packageYml, /SDKWORK_DRIVE_REF/u, ".github/workflows/package.yml must pass SDKWORK_DRIVE_REF");
  assert.match(governanceYml, /prepare-ci-dependencies/u, ".github/workflows/rtc-governance.yml must prepare sibling dependencies");
  assert.match(governanceYml, /pnpm run verify/u, ".github/workflows/rtc-governance.yml must run pnpm run verify");
  assert.ok(dependencyIds.includes("sdkwork-drive"), "sdkwork.workflow.json must declare sdkwork-drive for Drive-backed recording import");
  assert.ok(dependencyIds.includes("sdkwork-web-framework"), "sdkwork.workflow.json must declare sdkwork-web-framework");
  assert.ok(dependencyIds.includes("sdkwork-database"), "sdkwork.workflow.json must declare sdkwork-database");
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
