#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");

const canonicalSpecs = [
  ["README.md", "SDKWork root standards entrypoint."],
  ["COMPONENT_SPEC.md", "Local component specs directory and manifest rules."],
  ["CODE_STYLE_SPEC.md", "Authored code organization and testing rules."],
  ["NAMING_SPEC.md", "Canonical SDKWork naming."],
  ["RUST_CODE_SPEC.md", "Rust crate shape and verification rules."],
  ["TEST_SPEC.md", "Contract and verification rules."],
  ["API_SPEC.md", "HTTP API contract rules."],
  ["WEB_FRAMEWORK_SPEC.md", "Mandatory web framework integration rules."],
  ["WEB_BACKEND_SPEC.md", "Web backend layering rules."],
  ["DATABASE_SPEC.md", "Database contract rules."],
];

function specPaths() {
  return canonicalSpecs.map(([file, purpose]) => ({
    file,
    path: `../../../../sdkwork-specs/${file}`,
    purpose,
  }));
}

const components = [
  {
    crateDir: "crates/sdkwork-communication-rtc-service",
    name: "sdkwork-communication-rtc-service",
    displayName: "SDKWork Communication RTC Service",
    type: "rust-crate",
    capability: "rtc",
    publicExports: [
      "RtcPersistencePort",
      "RtcMediaSession",
      "RtcProviderWebhookEvent",
      "RTC_APP_API_AUTHORITY",
      "RTC_BACKEND_API_AUTHORITY",
    ],
    verify: "cargo test -p sdkwork-communication-rtc-service",
    routeManifest: null,
    runtimeEntrypoints: ["Cargo.toml"],
  },
  {
    crateDir: "crates/sdkwork-communication-rtc-repository-sqlx",
    name: "sdkwork-communication-rtc-repository-sqlx",
    displayName: "SDKWork Communication RTC Repository SQLx",
    type: "rust-crate",
    capability: "rtc",
    publicExports: [
      "connect_rtc_persistence_bootstrap_from_env",
      "RtcPostgresPersistencePort",
      "RtcSqlitePersistencePort",
      "RTC_TABLES",
    ],
    verify: "cargo test -p sdkwork-communication-rtc-repository-sqlx",
    routeManifest: null,
    runtimeEntrypoints: ["Cargo.toml"],
    databasePrefixRegistries: ["specs/database-prefix-registry.json"],
    databaseTableRegistries: ["specs/database-table-registry.json"],
  },
  {
    crateDir: "crates/sdkwork-routes-rtc-app-api",
    name: "sdkwork-routes-rtc-app-api",
    displayName: "SDKWork Router RTC App API",
    type: "rust-crate",
    capability: "rtc",
    surface: "app",
    publicExports: [
      "build_sdkwork_rtc_app_api_router",
      "wrap_router_with_web_framework_from_env",
    ],
    verify: "cargo test -p sdkwork-routes-rtc-app-api",
    routeManifest:
      "sdks/_route-manifests/app-api/sdkwork-routes-rtc-app-api.route-manifest.json",
    runtimeEntrypoints: ["Cargo.toml"],
  },
  {
    crateDir: "crates/sdkwork-routes-rtc-backend-api",
    name: "sdkwork-routes-rtc-backend-api",
    displayName: "SDKWork Router RTC Backend API",
    type: "rust-crate",
    capability: "rtc",
    surface: "backend-admin",
    publicExports: [
      "build_sdkwork_rtc_backend_api_router",
      "wrap_router_with_web_framework_from_env",
    ],
    verify: "cargo test -p sdkwork-routes-rtc-backend-api",
    routeManifest:
      "sdks/_route-manifests/backend-api/sdkwork-routes-rtc-backend-api.route-manifest.json",
    runtimeEntrypoints: ["Cargo.toml"],
  },
  {
    crateDir: "crates/sdkwork-rtc-service-host",
    name: "sdkwork-rtc-service-host",
    displayName: "SDKWork RTC Service Host",
    type: "rust-crate",
    capability: "rtc",
    publicExports: [
      "RtcProductService",
      "RtcProviderPluginRegistry",
      "RtcDriveRecordingArtifactImporter",
    ],
    verify: "cargo test -p sdkwork-rtc-service-host",
    routeManifest: null,
    runtimeEntrypoints: ["Cargo.toml"],
  },
  {
    crateDir: "crates/sdkwork-communication-rtc-worker",
    name: "sdkwork-communication-rtc-worker",
    displayName: "SDKWork Communication RTC Worker",
    type: "rust-crate",
    capability: "rtc",
    publicExports: ["RtcWorker", "RtcWorkerJob", "RtcSessionReconcileResult"],
    verify: "cargo test -p sdkwork-communication-rtc-worker",
    routeManifest: null,
    runtimeEntrypoints: ["Cargo.toml"],
  },
  {
    crateDir: "crates/sdkwork-api-rtc-standalone-gateway",
    name: "sdkwork-api-rtc-standalone-gateway",
    displayName: "SDKWork RTC API Server",
    type: "rust-crate",
    capability: "rtc",
    publicExports: [],
    verify: "cargo test -p sdkwork-api-rtc-standalone-gateway",
    routeManifest: null,
    runtimeEntrypoints: ["src/main.rs"],
  },
  {
    crateDir: "crates/sdkwork-rtc-app-context",
    name: "sdkwork-rtc-app-context",
    displayName: "SDKWork RTC App Context",
    type: "rust-crate",
    capability: "rtc",
    publicExports: [
      "AppContext",
      "app_context_from_web_request",
      "app_context_from_web_principal",
    ],
    verify: "cargo test -p sdkwork-rtc-app-context",
    routeManifest: null,
    runtimeEntrypoints: ["Cargo.toml"],
  },
  {
    crateDir: "crates/sdkwork-rtc-openapi",
    name: "sdkwork-rtc-openapi",
    displayName: "SDKWork RTC OpenAPI Helpers",
    type: "rust-crate",
    capability: "rtc",
    publicExports: [
      "build_openapi_document",
      "extract_routes_from_function",
      "render_docs_html",
    ],
    verify: "cargo test -p sdkwork-rtc-openapi",
    routeManifest: null,
    runtimeEntrypoints: ["Cargo.toml"],
  },
  {
    crateDir: "crates/sdkwork-rtc-api-registry",
    name: "sdkwork-rtc-api-registry",
    displayName: "SDKWork RTC API Registry",
    type: "rust-crate",
    capability: "rtc",
    publicExports: ["HttpMethod"],
    verify: "cargo test -p sdkwork-rtc-api-registry",
    routeManifest: null,
    runtimeEntrypoints: ["Cargo.toml"],
  },
];

function buildReadme(component) {
  return `# ${component.displayName} Specs

## Purpose

Local component contract for \`${component.name}\`.

## Owner

sdkwork-rtc.

## Verification

\`\`\`powershell
${component.verify}
\`\`\`
`;
}

function buildManifest(component) {
  return {
    schemaVersion: 1,
    kind: "sdkwork.component.spec",
    component: {
      name: component.name,
      displayName: component.displayName,
      version: "0.1.0",
      type: component.type,
      root: `sdkwork-rtc/${component.crateDir.replaceAll("\\", "/")}`,
      domain: "communication",
      declaredDomain: null,
      capability: component.capability,
      ...(component.surface ? { surface: component.surface } : {}),
      status: "standardizing",
      languages: ["rust"],
      generated: false,
      private: false,
      manifests: ["Cargo.toml"],
    },
    canonicalSpecs: specPaths(),
    contracts: {
      publicExports: component.publicExports,
      runtimeEntrypoints: component.runtimeEntrypoints,
      routeManifest: component.routeManifest,
      sdkClients: [],
      sdkDependencies: [],
      dependencyApiExports: [],
      dependencyApiSurfaces: [],
      events: [],
      configKeys: [],
      ...(component.databasePrefixRegistries
        ? { databasePrefixRegistries: component.databasePrefixRegistries }
        : {}),
      ...(component.databaseTableRegistries
        ? { databaseTableRegistries: component.databaseTableRegistries }
        : {}),
    },
    integration: {
      authority:
        "Root SDKWork specs remain authoritative. Local specs may extend but must not contradict them.",
      dependencyPolicy:
        "Consumers integrate through public crate exports, route manifests, and generated SDK clients only.",
      sdkPolicy:
        "Generated SDK clients are the HTTP transport boundary; route crates must not be consumed as app SDKs.",
      languagePolicy:
        "Rust crates follow Cargo workspace dependency rules and SDKWork naming.",
    },
    verification: {
      commands: [component.verify],
    },
    metadata: {
      managedBy: "sdkwork-rtc",
      standardVersion: "2026-06-18",
    },
  };
}

function serializeManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

let driftDetected = false;

for (const component of components) {
  const specsDir = path.join(root, component.crateDir, "specs");
  const readmePath = path.join(specsDir, "README.md");
  const manifestPath = path.join(specsDir, "component.spec.json");
  const readme = buildReadme(component);
  const manifest = serializeManifest(buildManifest(component));

  if (checkOnly) {
    assert.ok(fs.existsSync(readmePath), `${readmePath} must exist`);
    assert.ok(fs.existsSync(manifestPath), `${manifestPath} must exist`);
    const currentReadme = fs.readFileSync(readmePath, "utf8");
    const currentManifest = fs.readFileSync(manifestPath, "utf8");
    if (currentReadme !== readme) {
      console.error(`[rtc-rust-component-specs] drift: ${readmePath}`);
      driftDetected = true;
    }
    if (currentManifest !== manifest) {
      console.error(`[rtc-rust-component-specs] drift: ${manifestPath}`);
      driftDetected = true;
    }
    continue;
  }

  fs.mkdirSync(specsDir, { recursive: true });
  fs.writeFileSync(readmePath, readme);
  fs.writeFileSync(manifestPath, manifest);
}

if (checkOnly) {
  if (driftDetected) {
    console.error(
      "[rtc-rust-component-specs] check failed; run node tools/materialize-rtc-rust-component-specs.mjs",
    );
    process.exit(1);
  }
  console.log(`[rtc-rust-component-specs] check passed (${components.length} components)`);
} else {
  console.log(`[rtc-rust-component-specs] wrote ${components.length} component specs`);
}
