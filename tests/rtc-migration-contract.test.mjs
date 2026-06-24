import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rtcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appbaseRoot = path.resolve(rtcRoot, "..", "sdkwork-appbase");
const SdkworkImRoot = path.resolve(rtcRoot, "..", "sdkwork-im");
const sdkworkCoreRoot = path.resolve(rtcRoot, "..", "sdkwork-core");

function workspacePath(root, relativePath) {
  return path.join(root, ...relativePath.split("/"));
}

function resolveImRelativePath(candidates) {
  for (const relativePath of candidates) {
    if (existsSync(workspacePath(SdkworkImRoot, relativePath))) {
      return relativePath;
    }
  }
  return null;
}

const sdkworkImPcAppRoot = resolveImRelativePath([
  "apps/sdkwork-im-pc",
  "apps/sdkwork-chat-pc",
]);
const sdkworkImPcChatPackage = resolveImRelativePath([
  "apps/sdkwork-im-pc/packages/sdkwork-im-pc-chat",
  "apps/sdkwork-chat-pc/packages/sdkwork-clawchat-pc-chat",
]);
const sdkworkImGatewayPath = resolveImRelativePath([
  "services/sdkwork-im-cloud-gateway/src/lib.rs",
  "services/web-gateway/src/lib.rs",
]);

const sdkworkImCheckoutAvailable = existsSync(path.join(SdkworkImRoot, "Cargo.toml"));
const sdkworkImAppCheckoutAvailable = sdkworkImPcAppRoot !== null;
const sdkworkImGatewayAvailable = sdkworkImGatewayPath !== null;
const skipWithoutSdkworkImAppCheckout = sdkworkImAppCheckoutAvailable
  ? false
  : "requires sibling repo sdkwork-im app checkout (sdkwork-im-pc or sdkwork-chat-pc)";
const skipWithoutSdkworkImGateway = sdkworkImGatewayAvailable
  ? false
  : "requires sibling repo sdkwork-im gateway checkout";
const skipWithoutSdkworkImMigrationCheckout =
  sdkworkImCheckoutAvailable && sdkworkImAppCheckoutAvailable && sdkworkImGatewayAvailable
    ? false
    : "requires complete sibling repo sdkwork-im migration checkout";

const requiredRtcPaths = [
  "sdks/sdkwork-rtc-sdk/README.md",
  "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/package.json",
  "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.openapi.json",
  "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
  "sdks/materialize-rtc-v3-openapi-boundaries.mjs",
  "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/package.json",
  "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/src/rtc.ts",
  "crates/sdkwork-communication-rtc-repository-sqlx/Cargo.toml",
  "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs",
  "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
  "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
  "crates/sdkwork-router-rtc-app-api/src/lib.rs",
  "crates/sdkwork-router-rtc-backend-api/src/lib.rs",
];

const forbiddenRtcSignalingPaths = [
  "services/sdkwork-rtc-signaling-service",
];

const forbiddenAppbasePaths = [
  "packages/pc-react/communication/sdkwork-rtc-pc-react",
];

const forbiddenAppbasePatterns = [
  /@sdkwork\/rtc-sdk/,
  /@sdkwork\/rtc-pc-react/,
  /sdkwork-rtc-pc-rtc/,
  /sdkwork-rtc-sdk/,
  /sdkwork-space[\\/]sdkwork-rtc/,
  /\.\.\/sdkwork-im\/sdks\/sdkwork-rtc-sdk/,
  /sdkwork-react-backend-rtc/,
];

const allowedAppbaseBoundaryFiles = new Set([
  "tests/static/governance/appbase-rtc-extraction-boundary.test.mjs",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/tests/catalog.test.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/tests/catalog.test.ts",
]);

const forbiddenSdkworkImPaths = [
  "plugins/rtc-aliyun",
  "plugins/rtc-tencent",
  "plugins/rtc-volcengine",
  "crates/sdkwork-im-contract-rtc",
  "sdks/sdkwork-rtc-sdk",
  "services/rtc-signaling-service",
];

const forbiddenSdkworkImPatterns = [
  /read\(['"]sdkwork-rtc-sdk\//,
  /(?:^|[\s"'`=:([{])(?:\.\.\/)+sdks\/sdkwork-rtc-sdk\b/m,
  /(?:^|[\s"'`=:([{])(?:\.\.\\)+sdks\\sdkwork-rtc-sdk\b/m,
  /link:[^\r\n]*sdkwork-im\/sdks\/sdkwork-rtc-sdk/,
  /link:[^\r\n]*sdkwork-im\\sdks\\sdkwork-rtc-sdk/,
];

const forbiddenSdkworkCorePatterns = [
  /@sdkwork\/rtc-sdk/,
  /sdkwork-space[\\/]sdkwork-rtc/,
  /sdkwork-im\/sdks\/sdkwork-rtc-sdk/,
  /sdkwork-im\\sdks\\sdkwork-rtc-sdk/,
  /link:[^\r\n]*sdkwork-im\/sdks\/sdkwork-rtc-sdk/,
  /link:[^\r\n]*sdkwork-im\\sdks\\sdkwork-rtc-sdk/,
];

function exists(root, relativePath) {
  return existsSync(workspacePath(root, relativePath));
}

function listTextFiles(root, relativePath = "") {
  const absolute = workspacePath(root, relativePath);
  if (!existsSync(absolute)) {
    return [];
  }

  const ignoredNames = new Set([
    ".git",
    ".pnpm-store",
    ".runtime",
    ".sdkwork",
    ".tmp",
    "dist",
    "node_modules",
    "target",
    "tmp",
  ]);
  const ignoredExtensions = new Set([
    ".lock",
    ".pdb",
    ".rlib",
    ".rmeta",
    ".exe",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".zip",
  ]);

  const entries = readdirSync(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) {
      continue;
    }

    const childRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    const childAbsolute = workspacePath(root, childRelative);
    if (entry.isDirectory()) {
      files.push(...listTextFiles(root, childRelative));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (ignoredExtensions.has(extension)) {
      continue;
    }

    if (statSync(childAbsolute).size > 2_000_000) {
      continue;
    }

    files.push(childRelative);
  }

  return files;
}

function findPatternMatches(root, relativePaths, patterns) {
  const matches = [];
  for (const relativePath of relativePaths) {
    const absolute = workspacePath(root, relativePath);
    let content = "";
    try {
      content = readFileSync(absolute, "utf8");
    } catch {
      continue;
    }

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        matches.push(`${relativePath}: ${match[0]}`);
      }
    }
  }

  return matches;
}

function parseRustStringArrayConstant(source, constantName) {
  const pattern = new RegExp(
    `pub\\s+const\\s+${constantName}\\s*:\\s*\\[&str;\\s*\\d+\\]\\s*=\\s*\\[(?<body>[\\s\\S]*?)\\];`,
    "u",
  );
  const match = source.match(pattern);
  assert.ok(match?.groups?.body, `Rust constant ${constantName} must exist`);
  return Array.from(match.groups.body.matchAll(/"(?<value>[^"]+)"/gu), (item) => item.groups.value);
}

function parseTypescriptProviderOptionalCapabilities(source, providerKey) {
  const providerPattern = new RegExp(
    `providerKey:\\s*'${providerKey}'[\\s\\S]+?optionalCapabilities:\\s*\\[(?<body>[^\\]]*)\\]\\s+as const`,
    "u",
  );
  const match = source.match(providerPattern);
  assert.ok(match?.groups?.body, `TypeScript provider catalog entry for ${providerKey} must exist`);
  return Array.from(match.groups.body.matchAll(/'(?<value>[^']+)'/gu), (item) => item.groups.value);
}

function assertCapabilitySetEqual(actual, expected, label) {
  assert.deepEqual(
    [...new Set(actual)].sort(),
    [...new Set(expected)].sort(),
    `${label} must match the canonical capability set`,
  );
  assert.deepEqual([...new Set(actual)], actual, `${label} must not contain duplicates`);
}

function tableBlock(schema, tableName) {
  const start = schema.indexOf(`CREATE TABLE ${tableName}`);
  assert.notEqual(start, -1, `schema should create table ${tableName}`);
  const afterStart = schema.slice(start);
  const nextTableIndex = afterStart.slice(1).search(/\r?\n\r?\nCREATE\s+/);
  return nextTableIndex === -1 ? afterStart : afterStart.slice(0, nextTableIndex + 1);
}

function collectOpenApiOperations(openapi) {
  const operations = [];
  for (const [pathKey, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) {
        continue;
      }
      operations.push({
        method: method.toUpperCase(),
        path: pathKey,
        operationId: operation.operationId,
        owner: operation["x-sdkwork-owner"],
        authority: operation["x-sdkwork-api-authority"],
      });
    }
  }
  return operations;
}

function openApiOperation(openapi, method, pathKey) {
  const operation = openapi.paths?.[pathKey]?.[method.toLowerCase()];
  assert.ok(operation, `${method.toUpperCase()} ${pathKey} must exist`);
  return operation;
}

function jsonResponseSchemaRef(operation, status = "200") {
  return operation.responses?.[status]?.content?.["application/json"]?.schema?.$ref;
}

function jsonRequestSchemaRef(operation) {
  return operation.requestBody?.content?.["application/json"]?.schema?.$ref;
}

function readJson(root, relativePath) {
  return JSON.parse(readFileSync(workspacePath(root, relativePath), "utf8"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function schemaNameToGeneratedTypeFileName(schemaName) {
  return schemaName
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function assertGeneratedTypesRequireOpenApiRequiredFields({
  openapi,
  generatedTypesRoot,
  label,
}) {
  for (const [schemaName, schema] of Object.entries(openapi.components?.schemas ?? {})) {
    if (!Array.isArray(schema.required) || schema.required.length === 0 || !schema.properties) {
      continue;
    }

    const generatedTypePath = `${generatedTypesRoot}/${schemaNameToGeneratedTypeFileName(schemaName)}.ts`;
    if (!exists(rtcRoot, generatedTypePath)) {
      continue;
    }

    const generatedSource = readFileSync(workspacePath(rtcRoot, generatedTypePath), "utf8");
    for (const requiredField of schema.required) {
      assert.match(
        generatedSource,
        new RegExp(`\\b${escapeRegExp(requiredField)}\\s*:`),
        `${label} generated ${schemaName}.${requiredField} must be required`,
      );
      assert.doesNotMatch(
        generatedSource,
        new RegExp(`\\b${escapeRegExp(requiredField)}\\s*\\?:`),
        `${label} generated ${schemaName}.${requiredField} must not be optional`,
      );
    }
  }
}

test("sdkwork-rtc owns RTC provider SDK, UI, storage, backend routes, and backend OpenAPI authority", () => {
  const missing = requiredRtcPaths.filter((relativePath) => !exists(rtcRoot, relativePath));
  assert.deepEqual(missing, []);
});

test("sdkwork-rtc does not own app call signaling routes or signaling services", () => {
  const remainingPaths = forbiddenRtcSignalingPaths.filter((relativePath) => exists(rtcRoot, relativePath));
  assert.deepEqual(remainingPaths, []);

  const textFiles = listTextFiles(rtcRoot, "").filter((relativePath) =>
    /^(Cargo\.toml|package\.json|services\/|sdks\/|tools\/|generated\/)/.test(relativePath.replaceAll("\\", "/"))
    && !relativePath.replaceAll("\\", "/").endsWith("sdks/sdkwork-rtc-sdk/bin/verify-sdk.mjs"),
  );
  const matches = findPatternMatches(rtcRoot, textFiles, [
    /sdkwork-rtc-signaling-service/,
    /\/app\/v3\/api\/rtc\/sessions/,
    /\/app\/v3\/api\/rtc\/sessions\/\{rtcSessionId\}\/signals/,
    /\/app\/v3\/api\/rtc\/media_sessions\/\{mediaSessionId\}\/signals/,
    /\bsignaling-adapter\b/,
    /\bstandard-call-stack\b/,
    /\bcall-controller\b/,
  ]);
  assert.deepEqual(matches, []);
});

test("sdkwork-rtc declares RTC-only app and backend API authorities", () => {
  const coreSource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-service/src/lib.rs"),
    "utf8",
  );

  assert.match(coreSource, /RTC_APP_API_AUTHORITY:\s*&str\s*=\s*"sdkwork-rtc-app-api"/);
  assert.match(coreSource, /RTC_APP_SDK_FAMILY:\s*&str\s*=\s*"sdkwork-rtc-app-sdk"/);
  assert.match(coreSource, /RTC_APP_API_PREFIX:\s*&str\s*=\s*"\/app\/v3\/api"/);
  assert.match(coreSource, /RTC_BACKEND_API_AUTHORITY:\s*&str\s*=\s*"sdkwork-rtc-backend-api"/);
  assert.match(coreSource, /RTC_BACKEND_SDK_FAMILY:\s*&str\s*=\s*"sdkwork-rtc-backend-sdk"/);
  assert.match(coreSource, /RTC_BACKEND_API_PREFIX:\s*&str\s*=\s*"\/backend\/v3\/api"/);

  const appOpenapi = JSON.parse(
    readFileSync(
      workspacePath(
        rtcRoot,
        "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.openapi.json",
      ),
      "utf8",
    ),
  );
  const backendOpenapi = JSON.parse(
    readFileSync(
      workspacePath(
        rtcRoot,
        "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
      ),
      "utf8",
    ),
  );
  assert.equal(appOpenapi.info["x-sdkwork-api-authority"], "sdkwork-rtc-app-api");
  assert.equal(backendOpenapi.info["x-sdkwork-api-authority"], "sdkwork-rtc-backend-api");
});

test("appbase does not retain RTC source packages or direct RTC SDK authority references", () => {
  const remainingPaths = forbiddenAppbasePaths.filter((relativePath) => exists(appbaseRoot, relativePath));
  assert.deepEqual(remainingPaths, []);

  const textFiles = listTextFiles(appbaseRoot, "").filter(
    (relativePath) => !allowedAppbaseBoundaryFiles.has(relativePath),
  );
  const matches = findPatternMatches(appbaseRoot, textFiles, forbiddenAppbasePatterns);
  assert.deepEqual(matches, []);
});

test("appbase metadata and lockfile do not aggregate the RTC SDK", () => {
  const files = [
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "tsconfig.base.json",
    ".npmrc",
  ];
  const matches = findPatternMatches(appbaseRoot, files, forbiddenAppbasePatterns);
  assert.deepEqual(matches, []);

  const packageJson = JSON.parse(readFileSync(workspacePath(appbaseRoot, "package.json"), "utf8"));
  assert.equal(packageJson.pnpm?.overrides?.["@sdkwork/rtc-sdk"], undefined);
});

test("sdkwork-im PC app consumes the RTC SDK from sdkwork-rtc", { skip: skipWithoutSdkworkImAppCheckout }, () => {
  const packageJson = readFileSync(
    workspacePath(SdkworkImRoot, `${sdkworkImPcAppRoot}/package.json`),
    "utf8",
  );
  const packageManifest = JSON.parse(packageJson);
  assert.equal(packageManifest.dependencies?.["@sdkwork/rtc-sdk"], "workspace:*");

  const workspace = readFileSync(workspacePath(appbaseRoot, "pnpm-workspace.yaml"), "utf8");
  assert.doesNotMatch(workspace, /sdkwork-space\/sdkwork-rtc/);
  const chatWorkspace = readFileSync(
    workspacePath(SdkworkImRoot, `${sdkworkImPcAppRoot}/pnpm-workspace.yaml`),
    "utf8",
  );
  assert.match(
    chatWorkspace,
    /\.\.\/\.\.\/\.\.\/sdkwork-rtc\/sdks\/sdkwork-rtc-sdk\/sdkwork-rtc-sdk-typescript/,
  );
});

test(
  "sdkwork-im PC call service routes call signaling through IM calls and keeps RTC SDK out of signaling",
  { skip: skipWithoutSdkworkImAppCheckout },
  () => {
  const callService = readFileSync(
    workspacePath(
      SdkworkImRoot,
      `${sdkworkImPcChatPackage}/src/services/CallService.ts`,
    ),
    "utf8",
  );

  assert.match(callService, /@sdkwork\/im-sdk/);
  assert.match(callService, /\.calls\.start\s*\(/);
  assert.match(callService, /\.calls\.watchIncoming\s*\(/);
  assert.match(callService, /\.calls\.retrieve\s*\(/);
  assert.doesNotMatch(callService, /@sdkwork\/rtc-sdk/);
  assert.doesNotMatch(callService, /createRtcAppHttpClient/);
  assert.doesNotMatch(callService, /createStandardRtcCallControllerStack/);
  assert.doesNotMatch(callService, /\bImRtcSdkLike\b/);
  assert.doesNotMatch(callService, /\bimClient\.rtc\b/);
  assert.doesNotMatch(callService, /\.rtc\.retrieve\s*\(/);
});

test(
  "sdkwork-im PC media service consumes RTC SDK for join/publish and not IM signaling APIs",
  { skip: skipWithoutSdkworkImAppCheckout },
  () => {
  const rtcMediaService = readFileSync(
    workspacePath(
      SdkworkImRoot,
      `${sdkworkImPcChatPackage}/src/services/RtcMediaService.ts`,
    ),
    "utf8",
  );

  assert.match(rtcMediaService, /@sdkwork\/rtc-sdk/);
  assert.match(rtcMediaService, /\bjoin\s*\(/);
  assert.match(rtcMediaService, /\bpublish\s*\(/);
  assert.doesNotMatch(rtcMediaService, /@sdkwork\/im-sdk/);
  assert.doesNotMatch(rtcMediaService, /\.calls\./);
});

test(
  "sdkwork-im Rust runtime consumes RTC media/provider crates but not RTC signaling service",
  { skip: skipWithoutSdkworkImAppCheckout },
  () => {
  const manifests = [
    "crates/im-domain-core/Cargo.toml",
    "crates/im-platform-contracts/Cargo.toml",
  ];
  const workspaceManifest = readFileSync(workspacePath(SdkworkImRoot, "Cargo.toml"), "utf8");
  assert.doesNotMatch(workspaceManifest, /sdkwork-rtc-im-compat/);
  assert.doesNotMatch(
    workspaceManifest,
    /sdkwork-rtc-core\s*=\s*\{\s*path\s*=\s*"\.\.\/sdkwork-rtc(?:-im-compat)?\/crates\/sdkwork-rtc-core"/,
  );
  assert.match(
    workspaceManifest,
    /sdkwork-communication-rtc-service = \{ path = "\.\.\/sdkwork-rtc\/crates\/sdkwork-communication-rtc-service" \}/,
  );
  assert.match(
    workspaceManifest,
    /sdkwork-rtc-adapter-volcengine = \{ path = "\.\.\/sdkwork-rtc\/plugins\/rtc-volcengine" \}/,
  );
  for (const manifest of manifests) {
    const manifestSource = readFileSync(workspacePath(SdkworkImRoot, manifest), "utf8");
    assert.match(manifestSource, /sdkwork-communication-rtc-service\.workspace = true/);
  }

  const gatewayManifest = readFileSync(
    workspacePath(SdkworkImRoot, "services/sdkwork-im-cloud-gateway/Cargo.toml"),
    "utf8",
  );
  assert.doesNotMatch(gatewayManifest, /sdkwork-rtc-state-store/);
  assert.doesNotMatch(gatewayManifest, /sdkwork-rtc-core\.workspace = true/);
  assert.doesNotMatch(gatewayManifest, /sdkwork-rtc-signaling-service/);
});

test("sdkwork-rtc Rust services do not depend back on sdkwork-im crates", () => {
  const textFiles = listTextFiles(rtcRoot, "").filter((relativePath) =>
    /^(Cargo\.toml|services\/|crates\/|adapters\/)/.test(relativePath.replaceAll("\\", "/")),
  );
  const matches = findPatternMatches(rtcRoot, textFiles, [
    /sdkwork-im-api-registry/,
    /sdkwork-im-openapi/,
    /im-app-context/,
    /craw_chat_api_registry/,
    /craw_chat_openapi/,
    /im_app_context/,
    /CRAW_CHAT_RTC_/,
  ]);

  assert.deepEqual(matches, []);
});

test("sdkwork-rtc SDK does not depend on the IM SDK for signaling", () => {
  const textFiles = listTextFiles(rtcRoot, "sdks/sdkwork-rtc-sdk").filter((relativePath) =>
    /\.(json|mjs|ts|md|yaml|yml|dart|lock)$/.test(relativePath),
  );
  const matches = findPatternMatches(rtcRoot, textFiles, [
    /@sdkwork\/im-sdk/,
    /sdkwork-im-sdk/,
    /package:im_sdk\/im_sdk\.dart/,
    /(?:^|\s)im_sdk:/m,
  ]);

  assert.deepEqual(matches, []);
});

test("sdkwork-rtc SDK exposes media/provider runtime surfaces instead of call signaling", () => {
  const publicIndex = readFileSync(
    workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/index.ts"),
    "utf8",
  );

  assert.match(publicIndex, /export \* from ['"]\.\/client\.js['"]/);
  assert.match(publicIndex, /export \* from ['"]\.\/driver-manager\.js['"]/);
  assert.match(publicIndex, /export \* from ['"]\.\/data-source\.js['"]/);
  assert.doesNotMatch(publicIndex, /app-http-client|signaling|call-controller|standard-call-stack/);
});

test("sdkwork-rtc core does not publish IM call signaling state contracts", () => {
  const workspaceManifest = readFileSync(workspacePath(rtcRoot, "Cargo.toml"), "utf8");
  assert.doesNotMatch(
    workspaceManifest,
    /sdkwork-rtc-state-store/,
    "sdkwork-rtc workspace must not keep a call-signaling state-store crate",
  );

  const coreSource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-service/src/lib.rs"),
    "utf8",
  );
  for (const forbiddenSymbol of [
    "RtcCallbackRequest",
    "RtcCallbackEvent",
    "map_provider_callback",
    "RtcSignalEvent",
    "RtcSignalSender",
    "RtcStateRecord",
    "RtcStateStore",
    "signaling_stream_id",
    "RtcSessionState",
  ]) {
    assert.doesNotMatch(
      coreSource,
      new RegExp(`\\b${forbiddenSymbol}\\b`),
      `sdkwork-communication-rtc-service must keep provider/media runtime contracts only, not IM call signaling state: ${forbiddenSymbol}`,
    );
  }
});

test("sdkwork-rtc storage schema does not keep IM call signaling tables", () => {
  const schemaFiles = [
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
  ];

  for (const relativePath of schemaFiles) {
    const source = readFileSync(workspacePath(rtcRoot, relativePath), "utf8");
    for (const forbidden of [
      "rtc_signaling_event",
      "uk_rtc_signaling_event",
      "idx_rtc_signaling_event",
    ]) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b${forbidden}\\b`),
        `${relativePath} must not retain IM call signaling storage artifact ${forbidden}`,
      );
    }
  }

  const storageRegistrySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];
  assert.doesNotMatch(
    storageRegistrySource,
    /table_name:\s*"rtc_signaling_event"/,
    "sdkwork-rtc table registry must not retain IM call signaling table entries",
  );
});

test("sdkwork-rtc HTTP surfaces expose RTC media capabilities without signaling", () => {
  const rtcTextFiles = listTextFiles(rtcRoot, "").filter((relativePath) =>
    /^(services|crates|sdks|generated)\//.test(relativePath.replaceAll("\\", "/")),
  );
  const rtcMatches = findPatternMatches(rtcRoot, rtcTextFiles, [
    /\/im\/v3\/api\/rtc/,
    /\/app\/v3\/api\/rtc\/sessions/,
    /\/app\/v3\/api\/rtc\/sessions\/\{rtcSessionId\}\/signals/,
    /\/app\/v3\/api\/rtc\/media_sessions\/\{mediaSessionId\}\/signals/,
    /\/app\/v3\/api\/rtc\/invitations/,
    /\/backend\/v3\/api\/rtc\/invitations/,
  ]);
  assert.deepEqual(rtcMatches, []);

  const appRouteSource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-router-rtc-app-api/src/paths.rs"),
    "utf8",
  );
  for (const required of [
    "/app/v3/api/rtc/rooms",
    "/app/v3/api/rtc/media_sessions",
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}/participants/{participantId}/credential",
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}/recording_artifacts",
  ]) {
    assert.match(appRouteSource, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const SdkworkImGateway = sdkworkImGatewayPath;
  if (sdkworkImGatewayAvailable) {
    const SdkworkImGatewayContent = readFileSync(workspacePath(SdkworkImRoot, SdkworkImGateway), "utf8");
    assert.doesNotMatch(SdkworkImGatewayContent, /\/im\/v3\/api\/rtc/);
    assert.doesNotMatch(
      SdkworkImGatewayContent,
      /sdkwork-rtc-signaling-service[\s\S]{0,240}SdkTarget::SdkworkImSdk/,
    );
    assert.match(SdkworkImGatewayContent, /\/im\/v3\/api\/calls\/\{\*path\}/);
    assert.doesNotMatch(SdkworkImGatewayContent, /\/app\/v3\/api\/rtc\/\{\*path\}/);
  }
});

test("sdkwork-im gateway does not expose RTC through IM API prefixes", {
  skip: skipWithoutSdkworkImGateway,
}, () => {
  const gatewayTextFiles = listTextFiles(SdkworkImRoot, "services/sdkwork-im-cloud-gateway").filter(
    (relativePath) => /\.(rs|md|toml|json|yaml|yml)$/.test(relativePath),
  );
  const gatewayMatches = findPatternMatches(SdkworkImRoot, gatewayTextFiles, [
    /\/im\/v3\/api\/rtc/,
  ]);
  assert.deepEqual(gatewayMatches, []);

  const gatewaySource = readFileSync(workspacePath(SdkworkImRoot, sdkworkImGatewayPath), "utf8");
  assert.match(gatewaySource, /\/im\/v3\/api\/calls\/\{\*path\}/);
  assert.doesNotMatch(gatewaySource, /\/app\/v3\/api\/rtc\/\{\*path\}/);
  assert.doesNotMatch(gatewaySource, /rtc_app_api_routes\(\)/);
});

test("sdkwork-rtc OpenAPI helpers do not publish WebSocket signaling metadata", () => {
  const openapiHelperFiles = [
    "Cargo.toml",
    "crates/sdkwork-rtc-api-registry/src/lib.rs",
    "crates/sdkwork-rtc-openapi/src/lib.rs",
  ];

  const matches = findPatternMatches(rtcRoot, openapiHelperFiles, [
    /features\s*=\s*\[[^\]]*"ws"[^\]]*\]/,
    /\bRouteProtocol\b/,
    /\bWebsocketRouteMetadata\b/,
    /\bWebsocket\b/,
    /\bwebsocket_subprotocols\b/,
    /\bx-sdkwork-rtc-websocket-subprotocols\b/,
    /\bx-sdkwork-rtc-protocol\b/,
    /"invite"/,
  ]);

  assert.deepEqual(matches, []);
});

test("sdkwork-im IM SDK family no longer generates or composes RTC APIs", () => {
  const imSdkTextFiles = listTextFiles(SdkworkImRoot, "sdks/sdkwork-im-sdk").filter(
    (relativePath) => /\.(cs|dart|go|java|json|kt|kts|md|mjs|py|rs|swift|toml|ts|yaml|yml)$/.test(relativePath),
  );
  const imSdkMatches = findPatternMatches(SdkworkImRoot, imSdkTextFiles, [
    /\/im\/v3\/api\/rtc/,
    /\bRtcApi\b/,
    /\bsdk\.rtc\b/,
    /rtc-module/,
    /\bImRtcModule\b/,
    /\bPostJsonRtcSignalOptions\b/,
    /\bbuildJsonRtcSignal(?:Request|Envelope)?\b/,
    /\bJsonRtcSignalOptions\b/,
    /\bbuild_json_rtc_signal\b/,
    /\breplaceRtcSubscriptions\b/,
    /\bonRtcSession\b/,
    /\brtcSessions\b/,
    /\brtc_signal\b/,
    /\brtc\.signal\b/,
  ]);
  assert.deepEqual(imSdkMatches, []);

  const imFamilyTest = readFileSync(
    workspacePath(SdkworkImRoot, "sdks/test/verify-im-v3-sdk-family-contract.test.mjs"),
    "utf8",
  );
  assert.doesNotMatch(imFamilyTest, /\/im\/v3\/api\/rtc/);
  assert.doesNotMatch(imFamilyTest, /\/app\/v3\/api\/rtc/);
});

test("sdkwork-im IM app SDK generated transport no longer owns RTC APIs", () => {
  const imAppGeneratedFiles = listTextFiles(SdkworkImRoot, "sdks/sdkwork-im-app-sdk").filter((relativePath) =>
    /(?:^|\/)(generated\/server-openapi|composed)\//.test(relativePath.replaceAll("\\", "/"))
    && /\.(cs|dart|go|java|json|kt|kts|md|mjs|py|rs|swift|toml|ts|yaml|yml)$/.test(relativePath),
  );
  const imAppMatches = findPatternMatches(SdkworkImRoot, imAppGeneratedFiles, [
    /\/app\/v3\/api\/rtc/,
    /(?:^|["'`(])\/rtc\/provider_(?:callbacks|health)\b/,
    /\bRtcApi\b/,
    /\bcreateRtcApi\b/,
    /\btransportClient\.rtc\b/,
    /\brtcApi\b/,
  ]);
  assert.deepEqual(imAppMatches, []);
});

test("sdkwork-im active scripts and published docs no longer point RTC at IM APIs", () => {
  const activeRtcDocsAndScripts = [
    "bin",
    "docs/sites",
    "docs/部署",
  ].flatMap((relativePath) => listTextFiles(SdkworkImRoot, relativePath));
  const matches = findPatternMatches(SdkworkImRoot, activeRtcDocsAndScripts, [
    /\/im\/v3\/api\/rtc/,
    /@sdkwork\/im-sdk[\s\S]{0,120}\bsdk\.rtc\b/,
    /\bsdk\.rtc\b/,
  ]);
  assert.deepEqual(matches, []);
});

test("sdkwork-im no longer owns the RTC SDK workspace source", { skip: skipWithoutSdkworkImMigrationCheckout }, () => {
  assert.equal(exists(SdkworkImRoot, "sdks/sdkwork-rtc-sdk"), false);
});

test(
  "sdkwork-im no longer owns RTC runtime source packages or local RTC SDK paths",
  { skip: skipWithoutSdkworkImMigrationCheckout },
  () => {
  const remainingPaths = forbiddenSdkworkImPaths.filter((relativePath) => exists(SdkworkImRoot, relativePath));
  assert.deepEqual(remainingPaths, []);

  const textFiles = listTextFiles(SdkworkImRoot, "");
  const matches = findPatternMatches(SdkworkImRoot, textFiles, forbiddenSdkworkImPatterns);
  assert.deepEqual(matches, []);
});

test("sdkwork-core does not aggregate RTC SDK sources", () => {
  const textFiles = listTextFiles(sdkworkCoreRoot, "");
  const matches = findPatternMatches(sdkworkCoreRoot, textFiles, forbiddenSdkworkCorePatterns);
  assert.deepEqual(matches, []);
});

test("sdkwork-rtc active contracts use media runtime names instead of call signaling lifecycle names", () => {
  const contractFiles = [
    "crates/sdkwork-communication-rtc-service/src/lib.rs",
    "crates/sdkwork-rtc-service-host/src/lib.rs",
    "crates/sdkwork-router-rtc-app-api/src/lib.rs",
    "crates/sdkwork-router-rtc-backend-api/src/lib.rs",
    "sdks/materialize-rtc-v3-openapi-boundaries.mjs",
    "sdks/_route-manifests/app-api/sdkwork-router-rtc-app-api.route-manifest.json",
    "sdks/_route-manifests/backend-api/sdkwork-router-rtc-backend-api.route-manifest.json",
    "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.openapi.json",
    "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.sdkgen.json",
    "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
    "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.sdkgen.json",
  ];

  const matches = findPatternMatches(rtcRoot, contractFiles, [
    /\bRtcCallType\b/,
    /\bRtcCallSessionStatus\b/,
    /\bRtcCallSession\b/,
    /\bRtcCallParticipant\b/,
    /\bRtcCallRecord(?:Kind|Status|Artifact|List)?\b/,
    /\bcall_type\b/,
    /\bChatLog\b/,
    /\bInvited\b/,
    /\bRinging\b/,
    /\bConnecting\b/,
    /\bTerminated\b/,
    /\bconversation_id\b/,
    /\binitiator_id\b/,
  ]);

  assert.deepEqual(matches, []);
});

test("sdkwork-rtc storage owns media runtime tables and no call invitation tables", () => {
  const schemaFiles = [
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
  ];

  for (const relativePath of schemaFiles) {
    const source = readFileSync(workspacePath(rtcRoot, relativePath), "utf8");
    for (const requiredTable of [
      "rtc_media_session",
      "rtc_media_participant",
      "rtc_media_artifact",
    ]) {
      assert.match(
        source,
        new RegExp(`CREATE TABLE ${requiredTable}\\b`),
        `${relativePath} must create media-owned RTC table ${requiredTable}`,
      );
    }

    for (const forbiddenTable of [
      "rtc_call_session",
      "rtc_call_participant",
      "rtc_call_record",
      "rtc_call_invitation",
    ]) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b${forbiddenTable}\\b`),
        `${relativePath} must not retain business call table ${forbiddenTable}`,
      );
    }
  }

  const storageRegistrySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];
  assert.match(storageRegistrySource, /table_name:\s*"rtc_media_session"/);
  assert.match(storageRegistrySource, /table_name:\s*"rtc_media_participant"/);
  assert.match(storageRegistrySource, /table_name:\s*"rtc_media_artifact"/);
  assert.doesNotMatch(storageRegistrySource, /table_name:\s*"rtc_call_/);
});

test("sdkwork-rtc storage models provider webhooks and active provider query reconciliation", () => {
  const schemaFiles = [
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
  ];

  for (const relativePath of schemaFiles) {
    const source = readFileSync(workspacePath(rtcRoot, relativePath), "utf8");
    for (const requiredTable of [
      "rtc_provider_webhook_event",
      "rtc_provider_query_job",
      "rtc_provider_query_snapshot",
    ]) {
      assert.match(
        source,
        new RegExp(`CREATE TABLE ${requiredTable}\\b`),
        `${relativePath} must create provider event/reconciliation table ${requiredTable}`,
      );
    }

    const webhookTable = tableBlock(source, "rtc_provider_webhook_event");
    for (const requiredColumn of [
      "provider",
      "provider_profile_id",
      "provider_profile_dedupe_key",
      "external_event_id",
      "external_event_dedupe_key",
      "event_type",
      "event_kind",
      "payload_hash",
      "raw_payload",
      "normalized_event",
      "signature_header",
      "received_at",
      "processed_at",
      "status",
    ]) {
      assert.match(webhookTable, new RegExp(`\\b${requiredColumn}\\b`));
    }
    assert.match(webhookTable, /uk_rtc_provider_webhook_event_dedupe/);
    assert.match(
      webhookTable,
      /uk_rtc_provider_webhook_event_dedupe\s+UNIQUE\s*\(\s*tenant_id,\s*organization_id,\s*provider,\s*provider_profile_dedupe_key,\s*external_event_dedupe_key,\s*payload_hash\s*\)/s,
      "provider webhook dedupe must use non-null profile/event dedupe keys so webhook retries without external event ids remain idempotent",
    );

    const queryJobTable = tableBlock(source, "rtc_provider_query_job");
    for (const requiredColumn of [
      "provider",
      "provider_profile_id",
      "query_kind",
      "target_kind",
      "target_id",
      "provider_request_id",
      "provider_session_id",
      "status",
      "requested_at",
      "completed_at",
      "result_snapshot",
    ]) {
      assert.match(queryJobTable, new RegExp(`\\b${requiredColumn}\\b`));
    }

    const querySnapshotTable = tableBlock(source, "rtc_provider_query_snapshot");
    assert.match(querySnapshotTable, /\bprovider_session_id\b/);
    assert.match(
      source,
      /idx_rtc_provider_query_job_provider_session_status/,
      `${relativePath} rtc_provider_query_job must support provider session reconciliation lookup`,
    );
  }

  const storageRegistrySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];
  assert.match(
    storageRegistrySource,
    /pub mod provider_event/,
    "storage crate must expose provider webhook/query storage as a focused module",
  );
  assert.match(
    storageRegistrySource,
    /RtcSqliteProviderEventRepository/,
    "storage crate root must re-export a SQLite provider event repository",
  );
  assert.match(
    storageRegistrySource,
    /RtcPostgresProviderEventRepository/,
    "storage crate root must re-export a Postgres provider event repository",
  );
  for (const tableName of [
    "rtc_provider_webhook_event",
    "rtc_provider_query_job",
    "rtc_provider_query_snapshot",
  ]) {
    assert.match(storageRegistrySource, new RegExp(`table_name:\\s*"${tableName}"`));
  }

  const providerEventRepositorySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/provider_event.rs"),
    "utf8",
  );
  assert.match(
    providerEventRepositorySource,
    /pub struct RtcSqliteProviderEventRepository/,
    "storage crate must implement a SQLite provider event repository",
  );
  assert.match(
    providerEventRepositorySource,
    /pub struct RtcPostgresProviderEventRepository/,
    "storage crate must implement a Postgres provider event repository",
  );
  for (const requiredMethod of [
    "record_webhook_event",
    "get_webhook_event_by_id",
    "record_provider_query_result",
    "get_provider_query_job_by_id",
    "list_provider_query_snapshots",
  ]) {
    assert.match(
      providerEventRepositorySource,
      new RegExp(`pub async fn ${requiredMethod}\\b`),
      `provider event repository must expose ${requiredMethod}`,
    );
  }
  assert.match(
    providerEventRepositorySource,
    /fn optional_dedupe_key\(/,
    "provider webhook storage must normalize nullable provider profile and external event ids before uniqueness checks",
  );
  assert.match(
    providerEventRepositorySource,
    /provider_profile_dedupe_key/,
    "provider webhook storage must persist a non-null provider profile dedupe key",
  );
  assert.match(
    providerEventRepositorySource,
    /external_event_dedupe_key/,
    "provider webhook storage must persist a non-null external event dedupe key",
  );
  assert.match(
    providerEventRepositorySource,
    /format!\(\s*"provider-query-\{\}-\{\}-\{\}",\s*result\.provider,\s*query_kind_to_str\(&result\.query_kind\),\s*provider_query_target_id\(result\)\s*\)/s,
    "provider query job ids must include query_kind so active room queries do not collide by target id",
  );
  assert.match(
    providerEventRepositorySource,
    /provider_session_id/,
    "provider query storage must persist provider_session_id as an explicit reconciliation column",
  );
});

test("sdkwork-rtc storage supports multiple RTC provider profiles without storing raw secrets", () => {
  const schemaFiles = [
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
  ];

  for (const relativePath of schemaFiles) {
    const source = readFileSync(workspacePath(rtcRoot, relativePath), "utf8");
    const providerProfileTable = tableBlock(source, "rtc_provider_profile");
    for (const requiredColumn of [
      "provider",
      "code",
      "name",
      "status",
      "is_default",
      "priority",
      "environment",
      "region",
      "provider_app_id",
      "endpoint",
      "credential_ref",
      "credential_fingerprint",
      "webhook_secret_ref",
      "webhook_secret_fingerprint",
      "capability_snapshot",
      "config_snapshot",
      "health_status",
      "last_verified_at",
      "last_verification_latency_ms",
      "last_verification_error",
      "created_by",
      "updated_by",
      "deleted_at",
      "deleted_by",
      "version",
    ]) {
      assert.match(
        providerProfileTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_provider_profile must persist provider configuration field ${requiredColumn}`,
      );
    }

    assert.match(
      providerProfileTable,
      /uk_rtc_provider_profile_tenant_org_provider_code/,
      `${relativePath} rtc_provider_profile must allow organization-scoped provider profile codes`,
    );
    assert.match(
      providerProfileTable,
      /UNIQUE\s*\(\s*tenant_id\s*,\s*organization_id\s*,\s*provider\s*,\s*code\s*\)/i,
      `${relativePath} rtc_provider_profile provider code uniqueness must be scoped by tenant and organization`,
    );
    assert.match(
      source,
      /idx_rtc_provider_profile_tenant_provider_status_priority/,
      `${relativePath} rtc_provider_profile must support provider/status/priority selection`,
    );
    assert.match(
      source,
      /idx_rtc_provider_profile_tenant_default/,
      `${relativePath} rtc_provider_profile must support default provider lookup`,
    );

    for (const forbiddenSecretColumn of [
      "access_key",
      "access_secret",
      "secret_key",
      "secret_id",
      "private_key",
      "raw_secret",
      "token",
    ]) {
      assert.doesNotMatch(
        providerProfileTable,
        new RegExp(`\\b${forbiddenSecretColumn}\\b`, "i"),
        `${relativePath} rtc_provider_profile must store secret references/fingerprints, not raw ${forbiddenSecretColumn}`,
      );
    }
  }

  const storageRegistrySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];
  assert.match(
    storageRegistrySource,
    /pub mod provider_profile/,
    "storage crate must expose provider profile storage as a focused module",
  );
  assert.match(
    storageRegistrySource,
    /RtcSqliteProviderProfileRepository/,
    "storage crate root must re-export a SQLite provider profile repository",
  );
  assert.match(
    storageRegistrySource,
    /RtcPostgresProviderProfileRepository/,
    "storage crate root must re-export a Postgres provider profile repository",
  );
  for (const requiredColumn of [
    "is_default",
    "priority",
    "environment",
    "region",
    "provider_app_id",
    "credential_ref",
    "credential_fingerprint",
    "webhook_secret_ref",
    "webhook_secret_fingerprint",
    "capability_snapshot",
    "health_status",
    "last_verified_at",
  ]) {
    assert.match(
      storageRegistrySource,
      new RegExp(`"${requiredColumn}"`),
      `storage table registry must require rtc_provider_profile.${requiredColumn}`,
    );
  }

  const providerProfileRepositorySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/provider_profile.rs"),
    "utf8",
  );
  assert.match(
    providerProfileRepositorySource,
    /pub struct RtcSqliteProviderProfileRepository/,
    "storage crate must implement a SQLite provider profile repository",
  );
  assert.match(
    providerProfileRepositorySource,
    /pub struct RtcPostgresProviderProfileRepository/,
    "storage crate must implement a Postgres provider profile repository",
  );
  for (const requiredMethod of [
    "upsert_provider_profile",
    "get_provider_profile_by_id",
    "list_provider_profiles",
    "list_active_provider_profiles",
    "disable_provider_profile",
    "record_provider_profile_verification",
  ]) {
    assert.match(
      providerProfileRepositorySource,
      new RegExp(`pub async fn ${requiredMethod}\\b`),
      `provider profile repository must expose ${requiredMethod}`,
    );
  }
});

test("sdkwork-rtc storage models provider accounts, applications, and credential roles", () => {
  const schemaFiles = [
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
  ];

  for (const relativePath of schemaFiles) {
    const source = readFileSync(workspacePath(rtcRoot, relativePath), "utf8");
    const providerAccountTable = tableBlock(source, "rtc_provider_account");
    const providerApplicationTable = tableBlock(source, "rtc_provider_application");
    const providerCredentialTable = tableBlock(source, "rtc_provider_credential");

    for (const requiredColumn of [
      "tenant_id",
      "organization_id",
      "provider",
      "code",
      "name",
      "status",
      "environment",
      "external_tenant_id",
      "cloud_account_id",
      "project_id",
      "resource_group_id",
      "last_verified_at",
      "last_verification_error",
      "created_by",
      "updated_by",
      "created_at",
      "updated_at",
      "version",
      "deleted_at",
      "deleted_by",
    ]) {
      assert.match(
        providerAccountTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_provider_account must persist ${requiredColumn}`,
      );
    }
    assert.match(
      providerAccountTable,
      /uk_rtc_provider_account_tenant_org_provider_code/,
      `${relativePath} rtc_provider_account must scope account code uniqueness by tenant/org/provider`,
    );

    for (const requiredColumn of [
      "provider_account_id",
      "provider",
      "code",
      "name",
      "status",
      "environment",
      "region",
      "provider_application_id",
      "provider_application_id_kind",
      "access_endpoint",
      "api_endpoint",
      "api_host",
      "api_version",
      "webhook_callback_url",
      "config_snapshot",
      "last_verified_at",
      "last_verification_error",
      "created_by",
      "updated_by",
      "created_at",
      "updated_at",
      "version",
      "deleted_at",
      "deleted_by",
    ]) {
      assert.match(
        providerApplicationTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_provider_application must persist ${requiredColumn}`,
      );
    }
    assert.match(
      providerApplicationTable,
      /uk_rtc_provider_application_account_code/,
      `${relativePath} rtc_provider_application must prevent duplicate app codes per provider account`,
    );
    assert.match(
      providerApplicationTable,
      /idx_rtc_provider_application_scope_provider_status/,
      `${relativePath} rtc_provider_application must support scoped provider/status lookup`,
    );

    for (const requiredColumn of [
      "provider_account_id",
      "provider_application_id",
      "provider",
      "credential_role",
      "credential_label",
      "credential_ref",
      "credential_fingerprint",
      "secret_version",
      "status",
      "valid_from",
      "expires_at",
      "rotation_due_at",
      "rotated_at",
      "revoked_at",
      "last_verified_at",
      "last_used_at",
      "created_by",
      "updated_by",
      "created_at",
      "updated_at",
      "version",
    ]) {
      assert.match(
        providerCredentialTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_provider_credential must persist ${requiredColumn}`,
      );
    }
    assert.match(
      providerCredentialTable,
      /uk_rtc_provider_credential_application_role_label/,
      `${relativePath} rtc_provider_credential must uniquely scope credential role labels per application`,
    );
    assert.match(
      providerCredentialTable,
      /idx_rtc_provider_credential_scope_role_status/,
      `${relativePath} rtc_provider_credential must support scoped role/status lookup`,
    );

    for (const forbiddenSecretColumn of [
      "app_key",
      "sdk_secret_key",
      "secret_key",
      "secret_access_key",
      "raw_secret",
      "private_key",
      "token",
    ]) {
      assert.doesNotMatch(
        providerCredentialTable,
        new RegExp(`\\b${forbiddenSecretColumn}\\b`, "i"),
        `${relativePath} rtc_provider_credential must store secret refs/fingerprints, not raw ${forbiddenSecretColumn}`,
      );
    }
  }

  const storageRegistrySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];
  assert.match(
    storageRegistrySource,
    /pub mod provider_account/,
    "storage crate must expose provider account storage as a focused module",
  );
  assert.match(
    storageRegistrySource,
    /RtcSqliteProviderAccountRepository/,
    "storage crate root must re-export a SQLite provider account repository",
  );
  assert.match(
    storageRegistrySource,
    /RtcPostgresProviderAccountRepository/,
    "storage crate root must re-export a Postgres provider account repository",
  );

  const providerAccountRepositoryPath = workspacePath(
    rtcRoot,
    "crates/sdkwork-communication-rtc-repository-sqlx/src/provider_account.rs",
  );
  assert.ok(existsSync(providerAccountRepositoryPath), "provider account repository module must exist");
  const providerAccountRepositorySource = readFileSync(providerAccountRepositoryPath, "utf8");
  for (const requiredMethod of [
    "upsert_provider_account",
    "get_provider_account_by_id",
    "list_provider_accounts",
    "disable_provider_account",
    "upsert_provider_application",
    "get_provider_application_by_id",
    "list_provider_applications",
    "disable_provider_application",
    "upsert_provider_credential",
    "get_provider_credential_by_id",
    "list_provider_credentials",
    "revoke_provider_credential",
  ]) {
    assert.match(
      providerAccountRepositorySource,
      new RegExp(`pub async fn ${requiredMethod}\\b`),
      `provider account repository must expose ${requiredMethod}`,
    );
  }
});

test("sdkwork-rtc storage persists provider routes for region-based RTC provider selection", () => {
  const schemaFiles = [
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
  ];

  for (const relativePath of schemaFiles) {
    const source = readFileSync(workspacePath(rtcRoot, relativePath), "utf8");
    const providerRouteTable = tableBlock(source, "rtc_provider_route");
    for (const requiredColumn of [
      "provider_profile_id",
      "route_type",
      "region",
      "priority",
      "status",
      "created_at",
      "updated_at",
      "version",
    ]) {
      assert.match(
        providerRouteTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_provider_route must persist provider routing field ${requiredColumn}`,
      );
    }

    assert.match(
      providerRouteTable,
      /region\s+(?:TEXT|VARCHAR\(64\))\s+NOT\s+NULL\s+DEFAULT\s+''/i,
      `${relativePath} rtc_provider_route.region must be normalized to a non-null key for portable uniqueness`,
    );
    assert.match(
      providerRouteTable,
      /uk_rtc_provider_route_tenant_org_route_region_profile/,
      `${relativePath} rtc_provider_route must prevent duplicate tenant/org/region/profile routes`,
    );
    assert.match(
      providerRouteTable,
      /UNIQUE\s*\(\s*tenant_id\s*,\s*organization_id\s*,\s*route_type\s*,\s*region\s*,\s*provider_profile_id\s*\)/i,
      `${relativePath} rtc_provider_route uniqueness must include route_type, normalized region, and provider profile`,
    );
    assert.match(
      source,
      /idx_rtc_provider_route_scope_status_priority/,
      `${relativePath} rtc_provider_route must support tenant/org/route_type/region/status/priority lookup`,
    );
  }

  const storageRegistrySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];
  assert.match(
    storageRegistrySource,
    /pub mod provider_route/,
    "storage crate must expose provider route storage as a focused module",
  );
  assert.match(
    storageRegistrySource,
    /RtcSqliteProviderRouteRepository/,
    "storage crate root must re-export a SQLite provider route repository",
  );
  assert.match(
    storageRegistrySource,
    /RtcPostgresProviderRouteRepository/,
    "storage crate root must re-export a Postgres provider route repository",
  );
  for (const requiredIndex of [
    "uk_rtc_provider_route_tenant_org_route_region_profile",
    "idx_rtc_provider_route_scope_status_priority",
  ]) {
    assert.match(
      storageRegistrySource,
      new RegExp(`"${requiredIndex}"`),
      `storage table registry must require ${requiredIndex}`,
    );
  }

  const providerRouteRepositoryPath = workspacePath(
    rtcRoot,
    "crates/sdkwork-communication-rtc-repository-sqlx/src/provider_route.rs",
  );
  assert.ok(existsSync(providerRouteRepositoryPath), "provider route repository module must exist");
  const providerRouteRepositorySource = readFileSync(providerRouteRepositoryPath, "utf8");
  assert.match(
    providerRouteRepositorySource,
    /pub struct RtcSqliteProviderRouteRepository/,
    "storage crate must implement a SQLite provider route repository",
  );
  assert.match(
    providerRouteRepositorySource,
    /pub struct RtcPostgresProviderRouteRepository/,
    "storage crate must implement a Postgres provider route repository",
  );
  for (const requiredMethod of [
    "upsert_provider_route",
    "get_provider_route_by_id",
    "list_provider_routes",
    "list_active_provider_routes",
    "disable_provider_route",
  ]) {
    assert.match(
      providerRouteRepositorySource,
      new RegExp(`pub async fn ${requiredMethod}\\b`),
      `provider route repository must expose ${requiredMethod}`,
    );
  }
});

test("sdkwork-rtc storage persists complete post-session media completion records", () => {
  const schemaFiles = [
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
  ];

  for (const relativePath of schemaFiles) {
    const source = readFileSync(workspacePath(rtcRoot, relativePath), "utf8");
    const sessionTable = tableBlock(source, "rtc_media_session");
    for (const requiredColumn of [
      "provider_session_id",
      "connected_at",
      "duration_ms",
      "end_reason",
      "end_source",
      "participant_count",
      "max_concurrent_participants",
      "quality_summary_snapshot",
      "recording_summary_snapshot",
      "completion_recorded_at",
      "last_provider_webhook_event_id",
      "last_provider_query_job_id",
    ]) {
      assert.match(
        sessionTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_media_session must persist ${requiredColumn}`,
      );
    }

    const participantTable = tableBlock(source, "rtc_media_participant");
    for (const requiredColumn of [
      "screen_share_active",
      "provider_participant_id",
      "joined_at",
      "left_at",
      "duration_ms",
      "leave_reason",
      "last_seen_at",
    ]) {
      assert.match(
        participantTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_media_participant must persist ${requiredColumn}`,
      );
    }

    const trackTable = tableBlock(source, "rtc_media_track");
    for (const requiredColumn of [
      "started_at",
      "ended_at",
      "duration_ms",
      "muted_duration_ms",
      "end_reason",
    ]) {
      assert.match(
        trackTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_media_track must persist ${requiredColumn}`,
      );
    }

    const artifactTable = tableBlock(source, "rtc_media_artifact");
    for (const requiredColumn of [
      "duration_ms",
      "failure_reason",
      "source_provider_webhook_event_id",
      "source_provider_query_job_id",
    ]) {
      assert.match(
        artifactTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_media_artifact must persist ${requiredColumn}`,
      );
    }

    assert.match(
      source,
      /CREATE TABLE rtc_media_session_completion_record\b/,
      `${relativePath} must create rtc_media_session_completion_record`,
    );
    const completionTable = tableBlock(source, "rtc_media_session_completion_record");
    for (const requiredColumn of [
      "id",
      "uuid",
      "tenant_id",
      "organization_id",
      "session_id",
      "room_id",
      "provider_profile_id",
      "provider_session_id",
      "media_mode",
      "session_status",
      "started_at",
      "connected_at",
      "ended_at",
      "duration_ms",
      "end_reason",
      "end_source",
      "participant_count",
      "max_concurrent_participants",
      "artifact_count",
      "recording_artifact_count",
      "failed_artifact_count",
      "quality_summary_snapshot",
      "recording_summary_snapshot",
      "participant_summary_snapshot",
      "track_summary_snapshot",
      "artifact_summary_snapshot",
      "provider_webhook_event_id",
      "provider_query_job_id",
      "completion_snapshot",
      "completion_snapshot_hash",
      "recorded_at",
      "created_at",
      "updated_at",
      "version",
    ]) {
      assert.match(
        completionTable,
        new RegExp(`\\b${requiredColumn}\\b`),
        `${relativePath} rtc_media_session_completion_record must persist ${requiredColumn}`,
      );
    }
    assert.match(completionTable, /uk_rtc_media_session_completion_record_session/);
    assert.match(source, /idx_rtc_media_session_completion_record_tenant_recorded/);
    assert.match(source, /idx_rtc_media_session_completion_record_provider_recorded/);
  }

  const storageRegistrySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];
  assert.match(
    storageRegistrySource,
    /table_name:\s*"rtc_media_session_completion_record"/,
  );
  assert.match(
    storageRegistrySource,
    /pub mod completion_record/,
    "storage crate must expose completion record storage as a focused module",
  );
  assert.match(
    storageRegistrySource,
    /pub mod media_session/,
    "storage crate must expose media session aggregate storage as a focused module",
  );
  assert.match(
    storageRegistrySource,
    /RtcSqliteMediaSessionRepository/,
    "storage crate root must re-export a SQLite media session repository",
  );
  assert.match(
    storageRegistrySource,
    /RtcPostgresMediaSessionRepository/,
    "storage crate root must re-export a Postgres media session repository",
  );
  assert.match(
    storageRegistrySource,
    /RtcSqliteCompletionRecordRepository/,
    "storage crate root must re-export a SQLite completion record repository",
  );
  assert.match(
    storageRegistrySource,
    /RtcPostgresCompletionRecordRepository/,
    "storage crate root must re-export a Postgres completion record repository",
  );

  const completionRepositorySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/completion_record.rs"),
    "utf8",
  );
  assert.match(
    completionRepositorySource,
    /pub struct RtcSqliteCompletionRecordRepository/,
    "storage crate must implement a SQLite completion record repository",
  );
  assert.match(
    completionRepositorySource,
    /pub struct RtcPostgresCompletionRecordRepository/,
    "storage crate must implement a Postgres completion record repository",
  );
  assert.match(
    completionRepositorySource,
    /pub async fn upsert_completion_record/,
    "storage repositories must persist post-session completion records",
  );
  assert.match(
    completionRepositorySource,
    /pub async fn get_completion_record_by_session_id/,
    "storage repositories must retrieve completion records by media session id",
  );

  const mediaSessionRepositorySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/media_session.rs"),
    "utf8",
  );
  assert.match(
    mediaSessionRepositorySource,
    /pub struct RtcSqliteMediaSessionRepository/,
    "storage crate must implement a SQLite media session aggregate repository",
  );
  assert.match(
    mediaSessionRepositorySource,
    /pub struct RtcPostgresMediaSessionRepository/,
    "storage crate must implement a Postgres media session aggregate repository",
  );
  for (const requiredMethod of [
    "upsert_room",
    "upsert_media_session",
    "upsert_media_participant",
    "upsert_media_track",
    "upsert_media_artifact",
    "insert_quality_sample",
    "get_completion_input_by_session_id",
  ]) {
    assert.match(
      mediaSessionRepositorySource,
      new RegExp(`pub async fn ${requiredMethod}\\b`),
      `media session repository must expose ${requiredMethod}`,
    );
  }
});

test("sdkwork-rtc backend control plane uses media session resources only", () => {
  const routeAndContractFiles = [
    "crates/sdkwork-router-rtc-backend-api/src/paths.rs",
    "sdks/materialize-rtc-v3-openapi-boundaries.mjs",
    "sdks/_route-manifests/backend-api/sdkwork-router-rtc-backend-api.route-manifest.json",
    "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
    "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.sdkgen.json",
    "sdks/sdkwork-rtc-backend-sdk/specs/component.spec.json",
  ];

  const matches = findPatternMatches(rtcRoot, routeAndContractFiles, [
    /\/backend\/v3\/api\/rtc\/sessions\b/,
    /\brtc\.sessions\./,
    /\brtcSessions\b/,
    /\bsessionId\b/,
    /\bRtcCallSession\b/,
    /\bRtcCallParticipant\b/,
  ]);
  assert.deepEqual(matches, []);

  const backendRouteSource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-router-rtc-backend-api/src/paths.rs"),
    "utf8",
  );
  assert.match(backendRouteSource, /\/backend\/v3\/api\/rtc\/media_sessions/);
  assert.match(backendRouteSource, /\brtc\.mediaSessions\.list\b/);
  assert.match(backendRouteSource, /\brtc\.mediaSessions\.retrieve\b/);
  assert.match(backendRouteSource, /\brtc\.mediaSessions\.close\b/);
});

test("sdkwork-rtc recording artifacts use dedicated RTC Drive spaces", () => {
  const coreSource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-service/src/lib.rs"),
    "utf8",
  );
  assert.match(coreSource, /RTC_DRIVE_SPACE_TYPE:\s*&str\s*=\s*"rtc"/);
  assert.match(coreSource, /pub enum RtcDriveSpaceType\b/);
  assert.match(coreSource, /pub struct RtcDriveReference[\s\S]*pub space_type:\s*RtcDriveSpaceType/);
  assert.match(coreSource, /space_type:\s*RtcDriveSpaceType::Rtc/);
  assert.match(
    coreSource,
    /"spaceType"\.to_string\(\)\s*,\s*json!\(RTC_DRIVE_SPACE_TYPE\)/,
  );

  const schemaFiles = [
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql",
    "crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql",
  ];
  for (const relativePath of schemaFiles) {
    const source = readFileSync(workspacePath(rtcRoot, relativePath), "utf8");
    const artifactTable = tableBlock(source, "rtc_media_artifact");
    assert.match(
      artifactTable,
      /\bdrive_space_type\b/,
      `${relativePath} rtc_media_artifact must persist the Drive space type used for RTC archives`,
    );
    assert.match(
      artifactTable,
      /ck_rtc_media_artifact_drive_space_type/,
      `${relativePath} rtc_media_artifact must constrain Drive space type`,
    );
    assert.match(
      artifactTable,
      /drive_space_type[^,\n]*(?:TEXT|VARCHAR\(\d+\))[^,\n]*NOT NULL[^,\n]*DEFAULT 'rtc'|drive_space_type[^,\n]*DEFAULT 'rtc'[^,\n]*NOT NULL/i,
      `${relativePath} rtc_media_artifact must default Drive space type to rtc`,
    );
    assert.match(
      artifactTable,
      /CHECK\s*\(\s*drive_space_type\s*=\s*'rtc'\s*\)/i,
      `${relativePath} rtc_media_artifact must reject non-rtc Drive spaces`,
    );
  }

  const storageRegistrySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];
  assert.match(storageRegistrySource, /"drive_space_type"/);
  assert.match(storageRegistrySource, /"ck_rtc_media_artifact_drive_space_type"/);

  const mediaSessionRepositorySource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-repository-sqlx/src/media_session.rs"),
    "utf8",
  );
  assert.match(mediaSessionRepositorySource, /drive_space_type/);
  assert.match(mediaSessionRepositorySource, /RtcDriveSpaceType::Rtc/);
  assert.match(mediaSessionRepositorySource, /fn validate_rtc_drive_reference\(/);
  assert.match(
    mediaSessionRepositorySource,
    /drive\.space_type\s*!=\s*RtcDriveSpaceType::Rtc[\s\S]*RtcStorageError::InvalidEnumValue/s,
  );

  for (const openApiPath of [
    "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.openapi.json",
    "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
  ]) {
    const openapi = JSON.parse(readFileSync(workspacePath(rtcRoot, openApiPath), "utf8"));
    const driveRef = openapi.components?.schemas?.RtcDriveReference;
    assert.ok(driveRef, `${openApiPath} must expose RtcDriveReference`);
    assert.ok(driveRef.required?.includes("spaceType"), `${openApiPath} must require spaceType`);
    assert.deepEqual(driveRef.properties?.spaceType?.enum, ["rtc"]);
    const completionArtifact =
      openapi.components?.schemas?.RtcMediaSessionCompletionArtifactSummary;
    assert.ok(
      completionArtifact,
      `${openApiPath} must expose RTC completion artifact summaries`,
    );
    for (const requiredField of ["driveSpaceId", "driveSpaceType", "driveNodeId"]) {
      assert.ok(
        completionArtifact.required?.includes(requiredField),
        `${openApiPath} completion artifact summary must require ${requiredField}`,
      );
    }
    assert.deepEqual(completionArtifact.properties?.driveSpaceType?.enum, ["rtc"]);
    assert.match(
      completionArtifact.properties?.driveUri?.pattern ?? "",
      /drive:\/\/spaces/,
      `${openApiPath} completion artifact summary must keep Drive URI identity`,
    );
    assert.equal(completionArtifact.properties?.driveNodeVersion?.type?.[0], "string");
    const mediaResource = openapi.components?.schemas?.MediaResource;
    assert.ok(mediaResource?.properties?.metadata, `${openApiPath} must keep MediaResource metadata`);
  }

  for (const generatedTypePath of [
    "sdks/sdkwork-rtc-app-sdk/sdkwork-rtc-app-sdk-typescript/generated/server-openapi/src/types/rtc-media-session-completion-artifact-summary.ts",
    "sdks/sdkwork-rtc-backend-sdk/sdkwork-rtc-backend-sdk-typescript/generated/server-openapi/src/types/rtc-media-session-completion-artifact-summary.ts",
  ]) {
    const generatedType = readFileSync(workspacePath(rtcRoot, generatedTypePath), "utf8");
    for (const field of ["driveSpaceId", "driveSpaceType", "driveNodeId", "driveNodeVersion"]) {
      assert.match(
        generatedType,
        new RegExp(`\\b${field}\\b`),
        `${generatedTypePath} must expose ${field} in generated TypeScript SDK DTOs`,
      );
    }
    assert.match(
      generatedType,
      /driveSpaceType:\s*'rtc'/,
      `${generatedTypePath} must narrow completion artifact summaries to RTC Drive space type`,
    );
  }
});

test("sdkwork-rtc route crates expose executable app and backend API routers", () => {
  const routeCrates = [
    {
      root: "crates/sdkwork-router-rtc-app-api",
      lib: "crates/sdkwork-router-rtc-app-api/src/lib.rs",
      service: "crates/sdkwork-router-rtc-app-api/src/service.rs",
      handlers: "crates/sdkwork-router-rtc-app-api/src/handlers.rs",
      routes: "crates/sdkwork-router-rtc-app-api/src/routes.rs",
      expectedTrait: "RtcAppApiService",
      expectedBuilder: "build_sdkwork_rtc_app_api_router",
      expectedPrefix: "/app/v3/api",
      expectedHandlerNames: [
        "list_rooms",
        "list_active_provider_profiles",
        "create_media_session",
        "retrieve_media_session_completion_record",
        "issue_participant_credential",
        "list_recording_artifacts",
      ],
    },
    {
      root: "crates/sdkwork-router-rtc-backend-api",
      lib: "crates/sdkwork-router-rtc-backend-api/src/lib.rs",
      service: "crates/sdkwork-router-rtc-backend-api/src/service.rs",
      handlers: "crates/sdkwork-router-rtc-backend-api/src/handlers.rs",
      routes: "crates/sdkwork-router-rtc-backend-api/src/routes.rs",
      expectedTrait: "RtcBackendApiService",
      expectedBuilder: "build_sdkwork_rtc_backend_api_router",
      expectedPrefix: "/backend/v3/api",
      expectedHandlerNames: [
        "list_provider_profiles",
        "create_provider_profile",
        "receive_provider_webhook_event",
        "create_provider_query_job",
        "list_provider_query_snapshots",
        "close_media_session",
      ],
    },
  ];

  for (const routeCrate of routeCrates) {
    const cargoToml = readFileSync(workspacePath(rtcRoot, `${routeCrate.root}/Cargo.toml`), "utf8");
    const libSource = readFileSync(workspacePath(rtcRoot, routeCrate.lib), "utf8");
    const serviceSource = readFileSync(workspacePath(rtcRoot, routeCrate.service), "utf8");
    const handlersSource = readFileSync(workspacePath(rtcRoot, routeCrate.handlers), "utf8");
    const routesSource = readFileSync(workspacePath(rtcRoot, routeCrate.routes), "utf8");

    assert.match(cargoToml, /axum\.workspace = true/);
    assert.match(cargoToml, /serde\.workspace = true/);
    assert.match(cargoToml, /serde_json\.workspace = true/);
    assert.match(libSource, /pub mod paths;/);
    assert.match(libSource, /pub mod service;/);
    assert.match(libSource, /pub mod handlers;/);
    assert.match(libSource, /pub mod routes;/);
    assert.match(libSource, new RegExp(`pub use routes::${routeCrate.expectedBuilder}`));
    assert.match(serviceSource, new RegExp(`pub trait ${routeCrate.expectedTrait}\\b`));
    assert.match(routesSource, new RegExp(`pub fn ${routeCrate.expectedBuilder}\\b`));
    assert.match(routesSource, new RegExp(routeCrate.expectedPrefix.replaceAll("/", "\\/")));
    assert.match(routesSource, /Router/);
    assert.match(routesSource, /Arc<dyn/);
    assert.match(handlersSource, new RegExp(`State<Arc<dyn ${routeCrate.expectedTrait}>>`));

    for (const handlerName of routeCrate.expectedHandlerNames) {
      assert.match(
        handlersSource,
        new RegExp(`pub async fn ${handlerName}\\b`),
        `${routeCrate.handlers} must expose executable handler ${handlerName}`,
      );
    }

    assert.doesNotMatch(handlersSource, /sqlx::|SqlitePool|PgPool|Pool<|query_as|query\(/);
    assert.doesNotMatch(handlersSource, /RtcProviderPort|create_session\(|parse_provider_webhook\(|query_provider_state\(/);
    assert.doesNotMatch(handlersSource, /Authorization|Access-Token|X-API-Key|x-api-key/i);
    assert.doesNotMatch(handlersSource, /signal|invite|\bring\b|ringing|conversation/i);
  }
});

test("sdkwork-rtc app and backend APIs cover room, credential, artifact, webhook, and active query surfaces", () => {
  const appOpenapi = JSON.parse(
    readFileSync(
      workspacePath(
        rtcRoot,
        "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.openapi.json",
      ),
      "utf8",
    ),
  );
  const backendOpenapi = JSON.parse(
    readFileSync(
      workspacePath(
        rtcRoot,
        "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
      ),
      "utf8",
    ),
  );

  const appPaths = Object.keys(appOpenapi.paths ?? {});
  const backendPaths = Object.keys(backendOpenapi.paths ?? {});
  for (const requiredPath of [
    "/app/v3/api/rtc/rooms",
    "/app/v3/api/rtc/rooms/{roomId}",
    "/app/v3/api/rtc/provider_profiles/active",
    "/app/v3/api/rtc/media_sessions",
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}",
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}/completion_record",
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}/participants/{participantId}/credential",
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}/recording_artifacts",
  ]) {
    assert.ok(appPaths.includes(requiredPath), `app API must expose ${requiredPath}`);
  }
  for (const requiredPath of [
    "/backend/v3/api/rtc/rooms",
    "/backend/v3/api/rtc/provider_accounts",
    "/backend/v3/api/rtc/provider_accounts/{providerAccountId}",
    "/backend/v3/api/rtc/provider_accounts/{providerAccountId}/disable",
    "/backend/v3/api/rtc/provider_accounts/{providerAccountId}/applications",
    "/backend/v3/api/rtc/provider_applications/{providerApplicationId}",
    "/backend/v3/api/rtc/provider_applications/{providerApplicationId}/disable",
    "/backend/v3/api/rtc/provider_applications/{providerApplicationId}/credentials",
    "/backend/v3/api/rtc/provider_credentials/{providerCredentialId}",
    "/backend/v3/api/rtc/provider_credentials/{providerCredentialId}/revoke",
    "/backend/v3/api/rtc/provider_profiles",
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}",
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}/disable",
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}/verify",
    "/backend/v3/api/rtc/provider_routes",
    "/backend/v3/api/rtc/provider_routes/{providerRouteId}",
    "/backend/v3/api/rtc/provider_routes/{providerRouteId}/disable",
    "/backend/v3/api/rtc/media_sessions",
    "/backend/v3/api/rtc/media_sessions/{mediaSessionId}/completion_record",
    "/backend/v3/api/rtc/media_artifacts",
    "/backend/v3/api/rtc/provider_webhooks/events",
    "/backend/v3/api/rtc/provider_webhooks/{provider}/events",
    "/backend/v3/api/rtc/provider_query_jobs",
    "/backend/v3/api/rtc/provider_query_jobs/{providerQueryJobId}",
    "/backend/v3/api/rtc/provider_query_jobs/{providerQueryJobId}/snapshots",
  ]) {
    assert.ok(backendPaths.includes(requiredPath), `backend API must expose ${requiredPath}`);
  }

  const appOperations = collectOpenApiOperations(appOpenapi);
  const backendOperations = collectOpenApiOperations(backendOpenapi);
  for (const operation of [...appOperations, ...backendOperations]) {
    assert.equal(operation.owner, "sdkwork-rtc");
    assert.match(operation.operationId, /^rtc\./);
    assert.doesNotMatch(operation.operationId, /signal|invite|ring|conversation/i);
    assert.doesNotMatch(operation.path, /signals|invitations|conversation/);
  }
  assert.ok(appOperations.some((operation) => operation.operationId === "rtc.rooms.list"));
  assert.ok(
    appOperations.some(
      (operation) => operation.operationId === "rtc.providerProfiles.active.list",
    ),
  );
  assert.ok(
    appOperations.some(
      (operation) => operation.operationId === "rtc.mediaSessions.participantCredentials.issue",
    ),
  );
  for (const requiredOperationId of [
    "rtc.providerAccounts.list",
    "rtc.providerAccounts.create",
    "rtc.providerAccounts.retrieve",
    "rtc.providerAccounts.update",
    "rtc.providerAccounts.disable",
    "rtc.providerAccounts.applications.list",
    "rtc.providerAccounts.applications.create",
    "rtc.providerApplications.retrieve",
    "rtc.providerApplications.update",
    "rtc.providerApplications.disable",
    "rtc.providerApplications.credentials.list",
    "rtc.providerApplications.credentials.create",
    "rtc.providerCredentials.retrieve",
    "rtc.providerCredentials.update",
    "rtc.providerCredentials.revoke",
    "rtc.providerProfiles.retrieve",
    "rtc.providerProfiles.disable",
    "rtc.providerProfiles.verify",
    "rtc.providerRoutes.list",
    "rtc.providerRoutes.create",
    "rtc.providerRoutes.retrieve",
    "rtc.providerRoutes.update",
    "rtc.providerRoutes.disable",
  ]) {
    assert.ok(
      backendOperations.some((operation) => operation.operationId === requiredOperationId),
      `backend API must expose ${requiredOperationId}`,
    );
  }
  assert.ok(
    backendOperations.some(
      (operation) => operation.operationId === "rtc.providerWebhooks.events.receive",
    ),
  );
  assert.ok(
    backendOperations.some(
      (operation) => operation.operationId === "rtc.providerQueryJobs.create",
    ),
  );

  for (const schemaName of [
    "RtcRoom",
    "RtcMediaSession",
    "RtcMediaParticipant",
    "RtcMediaSessionCompletionRecord",
    "RtcMediaSessionCompletionQualitySummary",
    "RtcMediaSessionCompletionRecordingSummary",
    "RtcMediaArtifact",
    "RtcProviderWebhookEvent",
    "RtcProviderAccount",
    "RtcProviderAccountCommand",
    "RtcProviderAccountDisableRequest",
    "RtcProviderApplication",
    "RtcProviderApplicationCommand",
    "RtcProviderApplicationDisableRequest",
    "RtcProviderCredential",
    "RtcProviderCredentialCommand",
    "RtcProviderCredentialRevokeRequest",
    "RtcProviderProfile",
    "RtcProviderProfileCommand",
    "RtcProviderProfileVerifyRequest",
    "RtcProviderProfileVerifyResult",
    "RtcProviderRoute",
    "RtcProviderRouteCommand",
    "RtcProviderQueryJob",
    "RtcProviderQuerySnapshot",
    "MediaResource",
  ]) {
    assert.ok(
      backendOpenapi.components?.schemas?.[schemaName],
      `backend OpenAPI must expose ${schemaName}`,
    );
  }
});

test("sdkwork-rtc app and backend APIs expose typed operation DTOs for generated SDKs", () => {
  const appOpenapi = JSON.parse(
    readFileSync(
      workspacePath(
        rtcRoot,
        "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.openapi.json",
      ),
      "utf8",
    ),
  );
  const backendOpenapi = JSON.parse(
    readFileSync(
      workspacePath(
        rtcRoot,
        "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
      ),
      "utf8",
    ),
  );

  const appCreateSession = openApiOperation(
    appOpenapi,
    "post",
    "/app/v3/api/rtc/media_sessions",
  );
  assert.equal(
    jsonRequestSchemaRef(appCreateSession),
    "#/components/schemas/RtcCreateMediaSessionRequest",
  );
  assert.equal(
    jsonResponseSchemaRef(appCreateSession),
    "#/components/schemas/RtcMediaSessionResponse",
  );

  assert.equal(
    jsonResponseSchemaRef(
      openApiOperation(
        appOpenapi,
        "get",
        "/app/v3/api/rtc/media_sessions/{mediaSessionId}/completion_record",
      ),
    ),
    "#/components/schemas/RtcMediaSessionCompletionRecordResponse",
  );
  const backendCompletionRecord = openApiOperation(
    backendOpenapi,
    "get",
    "/backend/v3/api/rtc/media_sessions/{mediaSessionId}/completion_record",
  );
  assert.equal(
    backendCompletionRecord.operationId,
    "rtc.mediaSessions.completionRecord.retrieve",
  );
  assert.equal(
    jsonResponseSchemaRef(backendCompletionRecord),
    "#/components/schemas/RtcMediaSessionCompletionRecordResponse",
  );
  assert.notEqual(
    jsonResponseSchemaRef(backendCompletionRecord),
    "#/components/schemas/RtcApiResult",
  );

  const completionRecordSchema =
    backendOpenapi.components?.schemas?.RtcMediaSessionCompletionRecord;
  assert.ok(completionRecordSchema, "backend OpenAPI must expose completion record schema");
  for (const requiredProperty of [
    "mediaSessionId",
    "providerSessionId",
    "startedAt",
    "connectedAt",
    "endedAt",
    "durationMs",
    "endReason",
    "endSource",
    "participantCount",
    "maxConcurrentParticipants",
    "qualitySummary",
    "recordingSummary",
    "participants",
    "tracks",
    "artifacts",
    "sourceWebhookEventId",
    "sourceProviderQueryJobId",
    "completionSnapshotHash",
    "recordedAt",
  ]) {
    assert.ok(
      completionRecordSchema.properties?.[requiredProperty],
      `completion record schema must expose ${requiredProperty}`,
    );
  }

  assert.equal(
    jsonResponseSchemaRef(
      openApiOperation(
        appOpenapi,
        "post",
        "/app/v3/api/rtc/media_sessions/{mediaSessionId}/participants/{participantId}/credential",
      ),
    ),
    "#/components/schemas/RtcParticipantCredentialResponse",
  );
  assert.equal(
    jsonResponseSchemaRef(
      openApiOperation(
        appOpenapi,
        "get",
        "/app/v3/api/rtc/media_sessions/{mediaSessionId}/recording_artifacts",
      ),
    ),
    "#/components/schemas/RtcMediaArtifactListResponse",
  );

  const appActiveProviders = openApiOperation(
    appOpenapi,
    "get",
    "/app/v3/api/rtc/provider_profiles/active",
  );
  assert.equal(appActiveProviders.operationId, "rtc.providerProfiles.active.list");
  assert.equal(
    jsonResponseSchemaRef(appActiveProviders),
    "#/components/schemas/RtcActiveProviderProfileListResponse",
  );

  const activeProviderProfileSchema =
    appOpenapi.components?.schemas?.RtcActiveProviderProfile;
  assert.ok(activeProviderProfileSchema, "app OpenAPI must expose active provider profile schema");
  for (const requiredProperty of [
    "id",
    "provider",
    "code",
    "name",
    "isDefault",
    "priority",
    "environment",
    "region",
    "providerAppId",
    "capabilities",
    "healthStatus",
  ]) {
    assert.ok(
      activeProviderProfileSchema.properties?.[requiredProperty],
      `active provider profile schema must expose ${requiredProperty}`,
    );
  }
  for (const forbiddenProperty of [
    "credentialRef",
    "credentialFingerprint",
    "webhookSecretRef",
    "webhookSecretFingerprint",
    "configSnapshot",
  ]) {
    assert.equal(
      activeProviderProfileSchema.properties?.[forbiddenProperty],
      undefined,
      `app active provider profile must not expose ${forbiddenProperty}`,
    );
  }
  for (const backendOnlySchema of [
    "RtcProviderProfile",
    "RtcProviderProfileCommand",
    "RtcProviderProfileDisableRequest",
    "RtcProviderProfileVerifyRequest",
    "RtcProviderProfileVerifyResult",
    "RtcProviderRoute",
    "RtcProviderRouteCommand",
  ]) {
    assert.equal(
      appOpenapi.components?.schemas?.[backendOnlySchema],
      undefined,
      `app OpenAPI must not generate backend-only provider management schema ${backendOnlySchema}`,
    );
  }

  const backendProviderProfile = openApiOperation(
    backendOpenapi,
    "get",
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}",
  );
  assert.equal(backendProviderProfile.operationId, "rtc.providerProfiles.retrieve");
  assert.equal(
    jsonResponseSchemaRef(backendProviderProfile),
    "#/components/schemas/RtcProviderProfileResponse",
  );
  const disableProviderProfile = openApiOperation(
    backendOpenapi,
    "post",
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}/disable",
  );
  assert.equal(disableProviderProfile.operationId, "rtc.providerProfiles.disable");
  assert.equal(
    jsonRequestSchemaRef(disableProviderProfile),
    "#/components/schemas/RtcProviderProfileDisableRequest",
  );
  assert.equal(
    jsonResponseSchemaRef(disableProviderProfile),
    "#/components/schemas/RtcProviderProfileResponse",
  );
  const verifyProviderProfile = openApiOperation(
    backendOpenapi,
    "post",
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}/verify",
  );
  assert.equal(verifyProviderProfile.operationId, "rtc.providerProfiles.verify");
  assert.equal(
    jsonRequestSchemaRef(verifyProviderProfile),
    "#/components/schemas/RtcProviderProfileVerifyRequest",
  );
  assert.equal(
    jsonResponseSchemaRef(verifyProviderProfile),
    "#/components/schemas/RtcProviderProfileVerifyResultResponse",
  );
  const providerProfileVerifySchema =
    backendOpenapi.components?.schemas?.RtcProviderProfileVerifyRequest;
  assert.ok(
    providerProfileVerifySchema,
    "backend OpenAPI must expose provider profile verify request schema",
  );
  assert.deepEqual(
    providerProfileVerifySchema.required,
    ["queryKind"],
    "provider profile verify request must require queryKind to match the Rust backend DTO",
  );
  assert.equal(
    providerProfileVerifySchema.properties?.queryKind?.default,
    undefined,
    "required provider profile verify queryKind must not rely on an OpenAPI default that makes SDKs treat it as optional",
  );

  const providerProfileSchema = backendOpenapi.components?.schemas?.RtcProviderProfile;
  assert.ok(providerProfileSchema, "backend OpenAPI must expose provider profile schema");
  for (const requiredProperty of [
    "provider",
    "code",
    "name",
    "status",
    "isDefault",
    "priority",
    "environment",
    "region",
    "providerAppId",
    "endpoint",
    "credentialRef",
    "credentialFingerprint",
    "webhookSecretRef",
    "webhookSecretFingerprint",
    "capabilities",
    "configSnapshot",
    "healthStatus",
    "lastVerifiedAt",
    "lastVerificationLatencyMs",
    "lastVerificationError",
    "version",
  ]) {
    assert.ok(
      providerProfileSchema.properties?.[requiredProperty],
      `backend provider profile schema must expose ${requiredProperty}`,
    );
  }

  const providerProfileCommandSchema =
    backendOpenapi.components?.schemas?.RtcProviderProfileCommand;
  assert.ok(providerProfileCommandSchema, "backend OpenAPI must expose provider profile command");
  for (const requiredProperty of [
    "provider",
    "code",
    "name",
    "isDefault",
    "priority",
    "environment",
    "region",
    "providerAppId",
    "endpoint",
    "credentialRef",
    "webhookSecretRef",
    "capabilities",
    "configSnapshot",
  ]) {
    assert.ok(
      providerProfileCommandSchema.properties?.[requiredProperty],
      `provider profile command schema must expose ${requiredProperty}`,
    );
  }
  for (const [schemaName, schema] of Object.entries({
    RtcProviderProfile: providerProfileSchema,
    RtcProviderProfileCommand: providerProfileCommandSchema,
  })) {
    for (const forbiddenProperty of [
      "accessKey",
      "accessSecret",
      "secretKey",
      "secretId",
      "privateKey",
      "rawSecret",
      "token",
    ]) {
      assert.equal(
        schema.properties?.[forbiddenProperty],
        undefined,
        `${schemaName} must not expose raw provider secret property ${forbiddenProperty}`,
      );
    }
  }

  const providerRouteList = openApiOperation(
    backendOpenapi,
    "get",
    "/backend/v3/api/rtc/provider_routes",
  );
  assert.equal(providerRouteList.operationId, "rtc.providerRoutes.list");
  assert.equal(
    jsonResponseSchemaRef(providerRouteList),
    "#/components/schemas/RtcProviderRouteListResponse",
  );
  const providerRouteCreate = openApiOperation(
    backendOpenapi,
    "post",
    "/backend/v3/api/rtc/provider_routes",
  );
  assert.equal(providerRouteCreate.operationId, "rtc.providerRoutes.create");
  assert.equal(
    jsonRequestSchemaRef(providerRouteCreate),
    "#/components/schemas/RtcProviderRouteCommand",
  );
  assert.equal(
    jsonResponseSchemaRef(providerRouteCreate),
    "#/components/schemas/RtcProviderRouteResponse",
  );

  const providerRouteSchema = backendOpenapi.components?.schemas?.RtcProviderRoute;
  assert.ok(providerRouteSchema, "backend OpenAPI must expose provider route schema");
  for (const requiredProperty of [
    "id",
    "tenantId",
    "organizationId",
    "providerProfileId",
    "routeType",
    "region",
    "priority",
    "status",
  ]) {
    assert.ok(
      providerRouteSchema.properties?.[requiredProperty],
      `provider route schema must expose ${requiredProperty}`,
    );
  }
  assert.deepEqual(providerRouteSchema.properties?.routeType?.enum, ["region"]);
  assert.deepEqual(providerRouteSchema.properties?.status?.enum, ["active", "disabled"]);

  const providerRouteCommandSchema =
    backendOpenapi.components?.schemas?.RtcProviderRouteCommand;
  assert.ok(providerRouteCommandSchema, "backend OpenAPI must expose provider route command");
  for (const requiredProperty of [
    "providerProfileId",
    "routeType",
    "region",
    "priority",
    "status",
  ]) {
    assert.ok(
      providerRouteCommandSchema.properties?.[requiredProperty],
      `provider route command schema must expose ${requiredProperty}`,
    );
  }
  assert.deepEqual(providerRouteCommandSchema.properties?.routeType?.enum, ["region"]);
  assert.deepEqual(providerRouteCommandSchema.properties?.status?.enum, ["active", "disabled"]);
  for (const legacyProperty of ["routeKey", "enabled"]) {
    assert.equal(
      providerRouteSchema.properties?.[legacyProperty],
      undefined,
      `provider route schema must not expose legacy ${legacyProperty}`,
    );
    assert.equal(
      providerRouteCommandSchema.properties?.[legacyProperty],
      undefined,
      `provider route command schema must not expose legacy ${legacyProperty}`,
    );
  }

  const providerManagementOperationExpectations = [
    {
      method: "get",
      path: "/backend/v3/api/rtc/provider_accounts",
      operationId: "rtc.providerAccounts.list",
      requestRef: undefined,
      responseRef: "#/components/schemas/RtcProviderAccountListResponse",
    },
    {
      method: "post",
      path: "/backend/v3/api/rtc/provider_accounts",
      operationId: "rtc.providerAccounts.create",
      requestRef: "#/components/schemas/RtcProviderAccountCommand",
      responseRef: "#/components/schemas/RtcProviderAccountResponse",
    },
    {
      method: "get",
      path: "/backend/v3/api/rtc/provider_accounts/{providerAccountId}",
      operationId: "rtc.providerAccounts.retrieve",
      requestRef: undefined,
      responseRef: "#/components/schemas/RtcProviderAccountResponse",
    },
    {
      method: "patch",
      path: "/backend/v3/api/rtc/provider_accounts/{providerAccountId}",
      operationId: "rtc.providerAccounts.update",
      requestRef: "#/components/schemas/RtcProviderAccountCommand",
      responseRef: "#/components/schemas/RtcProviderAccountResponse",
    },
    {
      method: "get",
      path: "/backend/v3/api/rtc/provider_accounts/{providerAccountId}/applications",
      operationId: "rtc.providerAccounts.applications.list",
      requestRef: undefined,
      responseRef: "#/components/schemas/RtcProviderApplicationListResponse",
    },
    {
      method: "post",
      path: "/backend/v3/api/rtc/provider_accounts/{providerAccountId}/applications",
      operationId: "rtc.providerAccounts.applications.create",
      requestRef: "#/components/schemas/RtcProviderApplicationCommand",
      responseRef: "#/components/schemas/RtcProviderApplicationResponse",
    },
    {
      method: "post",
      path: "/backend/v3/api/rtc/provider_accounts/{providerAccountId}/disable",
      operationId: "rtc.providerAccounts.disable",
      requestRef: "#/components/schemas/RtcProviderAccountDisableRequest",
      responseRef: "#/components/schemas/RtcProviderAccountResponse",
    },
    {
      method: "get",
      path: "/backend/v3/api/rtc/provider_applications/{providerApplicationId}",
      operationId: "rtc.providerApplications.retrieve",
      requestRef: undefined,
      responseRef: "#/components/schemas/RtcProviderApplicationResponse",
    },
    {
      method: "patch",
      path: "/backend/v3/api/rtc/provider_applications/{providerApplicationId}",
      operationId: "rtc.providerApplications.update",
      requestRef: "#/components/schemas/RtcProviderApplicationCommand",
      responseRef: "#/components/schemas/RtcProviderApplicationResponse",
    },
    {
      method: "get",
      path: "/backend/v3/api/rtc/provider_applications/{providerApplicationId}/credentials",
      operationId: "rtc.providerApplications.credentials.list",
      requestRef: undefined,
      responseRef: "#/components/schemas/RtcProviderCredentialListResponse",
    },
    {
      method: "post",
      path: "/backend/v3/api/rtc/provider_applications/{providerApplicationId}/credentials",
      operationId: "rtc.providerApplications.credentials.create",
      requestRef: "#/components/schemas/RtcProviderCredentialCommand",
      responseRef: "#/components/schemas/RtcProviderCredentialResponse",
    },
    {
      method: "post",
      path: "/backend/v3/api/rtc/provider_applications/{providerApplicationId}/disable",
      operationId: "rtc.providerApplications.disable",
      requestRef: "#/components/schemas/RtcProviderApplicationDisableRequest",
      responseRef: "#/components/schemas/RtcProviderApplicationResponse",
    },
    {
      method: "get",
      path: "/backend/v3/api/rtc/provider_credentials/{providerCredentialId}",
      operationId: "rtc.providerCredentials.retrieve",
      requestRef: undefined,
      responseRef: "#/components/schemas/RtcProviderCredentialResponse",
    },
    {
      method: "patch",
      path: "/backend/v3/api/rtc/provider_credentials/{providerCredentialId}",
      operationId: "rtc.providerCredentials.update",
      requestRef: "#/components/schemas/RtcProviderCredentialCommand",
      responseRef: "#/components/schemas/RtcProviderCredentialResponse",
    },
    {
      method: "post",
      path: "/backend/v3/api/rtc/provider_credentials/{providerCredentialId}/revoke",
      operationId: "rtc.providerCredentials.revoke",
      requestRef: "#/components/schemas/RtcProviderCredentialRevokeRequest",
      responseRef: "#/components/schemas/RtcProviderCredentialResponse",
    },
    {
      method: "get",
      path: "/backend/v3/api/rtc/provider_routes/{providerRouteId}",
      operationId: "rtc.providerRoutes.retrieve",
      requestRef: undefined,
      responseRef: "#/components/schemas/RtcProviderRouteResponse",
    },
    {
      method: "patch",
      path: "/backend/v3/api/rtc/provider_routes/{providerRouteId}",
      operationId: "rtc.providerRoutes.update",
      requestRef: "#/components/schemas/RtcProviderRouteCommand",
      responseRef: "#/components/schemas/RtcProviderRouteResponse",
    },
    {
      method: "post",
      path: "/backend/v3/api/rtc/provider_routes/{providerRouteId}/disable",
      operationId: "rtc.providerRoutes.disable",
      requestRef: "#/components/schemas/RtcProviderRouteDisableRequest",
      responseRef: "#/components/schemas/RtcProviderRouteResponse",
    },
  ];
  const providerManagementOperations = [];
  for (const expectation of providerManagementOperationExpectations) {
    const operation = openApiOperation(backendOpenapi, expectation.method, expectation.path);
    providerManagementOperations.push(operation);
    assert.equal(operation.operationId, expectation.operationId);
    assert.equal(
      jsonRequestSchemaRef(operation),
      expectation.requestRef,
      `${expectation.operationId} must use a provider-management request DTO`,
    );
    assert.equal(
      jsonResponseSchemaRef(operation),
      expectation.responseRef,
      `${expectation.operationId} must use a provider-management response DTO`,
    );
  }

  const providerApplicationSchema =
    backendOpenapi.components?.schemas?.RtcProviderApplication;
  const providerApplicationCommandSchema =
    backendOpenapi.components?.schemas?.RtcProviderApplicationCommand;
  for (const [schemaName, schema] of Object.entries({
    RtcProviderApplication: providerApplicationSchema,
    RtcProviderApplicationCommand: providerApplicationCommandSchema,
  })) {
    assert.deepEqual(
      schema?.properties?.providerApplicationIdKind?.enum,
      ["volcengine_app_id", "tencent_sdk_app_id", "provider_application_id"],
      `${schemaName} must distinguish Volcengine AppId and Tencent SDKAppID account standards`,
    );
  }

  const providerCredentialSchema =
    backendOpenapi.components?.schemas?.RtcProviderCredential;
  const providerCredentialCommandSchema =
    backendOpenapi.components?.schemas?.RtcProviderCredentialCommand;
  for (const [schemaName, schema] of Object.entries({
    RtcProviderCredential: providerCredentialSchema,
    RtcProviderCredentialCommand: providerCredentialCommandSchema,
  })) {
    assert.deepEqual(
      schema?.properties?.credentialRole?.enum,
      [
        "rtc_token_signing",
        "open_api_signing",
        "usersig_signing",
        "cloud_api_signing",
        "webhook_signing",
      ],
      `${schemaName} must model Volcengine and Tencent credential roles explicitly`,
    );
    for (const forbiddenProperty of [
      "appKey",
      "sdkSecretKey",
      "secretKey",
      "secretAccessKey",
      "rawSecret",
      "privateKey",
      "token",
    ]) {
      assert.equal(
        schema?.properties?.[forbiddenProperty],
        undefined,
        `${schemaName} must not expose raw provider secret property ${forbiddenProperty}`,
      );
    }
  }

  const receiveWebhook = openApiOperation(
    backendOpenapi,
    "post",
    "/backend/v3/api/rtc/provider_webhooks/{provider}/events",
  );
  assert.equal(
    jsonRequestSchemaRef(receiveWebhook),
    "#/components/schemas/RtcProviderWebhookReceiveRequest",
  );
  assert.equal(
    jsonResponseSchemaRef(receiveWebhook),
    "#/components/schemas/RtcProviderWebhookEventResponse",
  );
  assert.equal(receiveWebhook["x-sdkwork-auth-mode"], "anonymous");
  assert.equal(receiveWebhook["x-sdkwork-provider-webhook-signature"], true);
  assert.deepEqual(receiveWebhook.security, []);
  assert.equal(receiveWebhook["x-sdkwork-forbid-credential-headers"], true);
  assert.deepEqual(receiveWebhook["x-sdkwork-provider-webhook-signature-headers"], [
    "X-Volc-Signature",
    "X-VolcEngine-Signature",
    "X-Volc-Sign",
    "X-TC-Signature",
    "X-Tencent-Signature",
    "Sign",
    "Agora-Signature-V2",
    "Agora-Signature",
    "X-Agora-Signature",
    "X-Acs-Signature",
    "X-Aliyun-Signature",
    "X-Acs-Content-Sha256",
    "Authorization",
    "LiveKit-Signature",
    "X-LiveKit-Signature",
    "X-LK-Signature",
  ]);
  assert.equal(
    backendOpenapi.components?.schemas?.RtcProviderWebhookReceiveRequest?.additionalProperties,
    true,
  );
  assert.equal(
    backendOpenapi.components?.schemas?.RtcProviderWebhookReceiveRequest?.properties?.receivedAt
      ?.type?.[0],
    "string",
  );
  const backendRouteManifest = JSON.parse(
    readFileSync(
      workspacePath(
        rtcRoot,
        "sdks/_route-manifests/backend-api/sdkwork-router-rtc-backend-api.route-manifest.json",
      ),
      "utf8",
    ),
  );
  const receiveWebhookRoute = backendRouteManifest.routes.find(
    (route) => route.operationId === "rtc.providerWebhooks.events.receive",
  );
  assert.equal(receiveWebhookRoute?.auth?.mode, "public");
  assert.equal(receiveWebhookRoute?.auth?.providerWebhookSignature, true);

  const createQueryJob = openApiOperation(
    backendOpenapi,
    "post",
    "/backend/v3/api/rtc/provider_query_jobs",
  );
  assert.equal(createQueryJob["x-sdkwork-auth-mode"], "dual-token");
  assert.equal(
    jsonRequestSchemaRef(createQueryJob),
    "#/components/schemas/RtcProviderQueryJobCreateRequest",
  );
  assert.equal(
    jsonResponseSchemaRef(createQueryJob),
    "#/components/schemas/RtcProviderQueryJobResponse",
  );
  const providerQueryCreateSchema =
    backendOpenapi.components?.schemas?.RtcProviderQueryJobCreateRequest;
  assert.ok(
    providerQueryCreateSchema,
    "backend OpenAPI must expose provider query job create request schema",
  );
  assert.deepEqual(providerQueryCreateSchema.required, ["provider", "queryKind"]);
  for (const requiredProperty of [
    "provider",
    "providerProfileId",
    "queryKind",
    "roomId",
    "mediaSessionId",
    "providerSessionId",
    "cursor",
  ]) {
    assert.ok(
      providerQueryCreateSchema.properties?.[requiredProperty],
      `provider query job create schema must expose ${requiredProperty}`,
    );
  }
  for (const legacyProperty of ["targetKind", "targetId"]) {
    assert.equal(
      providerQueryCreateSchema.properties?.[legacyProperty],
      undefined,
      `provider query job create schema must not expose stale ${legacyProperty}`,
    );
  }
  const providerQueryJobSchema = backendOpenapi.components?.schemas?.RtcProviderQueryJob;
  assert.ok(providerQueryJobSchema, "backend OpenAPI must expose provider query job schema");
  assert.ok(
    providerQueryJobSchema.properties?.providerSessionId,
    "provider query job schema must expose providerSessionId for active query reconciliation",
  );
  const providerQuerySnapshotSchema =
    backendOpenapi.components?.schemas?.RtcProviderQuerySnapshot;
  assert.ok(
    providerQuerySnapshotSchema?.properties?.providerSessionId,
    "provider query snapshot schema must expose providerSessionId for historical reconciliation",
  );
  assert.equal(
    jsonResponseSchemaRef(
      openApiOperation(
        backendOpenapi,
        "get",
        "/backend/v3/api/rtc/provider_query_jobs/{providerQueryJobId}/snapshots",
      ),
    ),
    "#/components/schemas/RtcProviderQuerySnapshotListResponse",
  );

  for (const operation of [
    appCreateSession,
    ...providerManagementOperations,
    receiveWebhook,
    createQueryJob,
  ]) {
    assert.notEqual(jsonRequestSchemaRef(operation), "#/components/schemas/RtcOperationCommand");
    assert.notEqual(jsonResponseSchemaRef(operation), "#/components/schemas/RtcApiResult");
  }
});

test("sdkwork-rtc generated backend TypeScript SDK DTOs match provider management OpenAPI", () => {
  const generatedTypesRoot =
    "sdks/sdkwork-rtc-backend-sdk/sdkwork-rtc-backend-sdk-typescript/generated/server-openapi/src/types";
  const generatedApiRoot =
    "sdks/sdkwork-rtc-backend-sdk/sdkwork-rtc-backend-sdk-typescript/generated/server-openapi/src/api";
  const generatedDeclarationTypesRoot =
    "sdks/sdkwork-rtc-backend-sdk/sdkwork-rtc-backend-sdk-typescript/generated/server-openapi/dist/types";
  const generatedDeclarationApiRoot =
    "sdks/sdkwork-rtc-backend-sdk/sdkwork-rtc-backend-sdk-typescript/generated/server-openapi/dist/api";

  for (const generatedTypeFile of [
    "rtc-provider-account.ts",
    "rtc-provider-account-command.ts",
    "rtc-provider-account-disable-request.ts",
    "rtc-provider-account-list-response.ts",
    "rtc-provider-account-response.ts",
    "rtc-provider-application.ts",
    "rtc-provider-application-command.ts",
    "rtc-provider-application-disable-request.ts",
    "rtc-provider-application-list-response.ts",
    "rtc-provider-application-response.ts",
    "rtc-provider-credential.ts",
    "rtc-provider-credential-command.ts",
    "rtc-provider-credential-revoke-request.ts",
    "rtc-provider-credential-list-response.ts",
    "rtc-provider-credential-response.ts",
  ]) {
    assert.ok(
      exists(rtcRoot, `${generatedTypesRoot}/${generatedTypeFile}`),
      `generated backend TypeScript SDK source must expose ${generatedTypeFile}`,
    );
    assert.ok(
      exists(
        rtcRoot,
        `${generatedDeclarationTypesRoot}/${generatedTypeFile.replace(/\.ts$/, ".d.ts")}`,
      ),
      `generated backend TypeScript SDK declarations must expose ${generatedTypeFile}`,
    );
  }
  for (const generatedApiFile of [
    "rtc-provider-accounts.ts",
    "rtc-provider-applications.ts",
    "rtc-provider-credentials.ts",
  ]) {
    assert.ok(
      exists(rtcRoot, `${generatedApiRoot}/${generatedApiFile}`),
      `generated backend TypeScript SDK source must expose ${generatedApiFile}`,
    );
    assert.ok(
      exists(
        rtcRoot,
        `${generatedDeclarationApiRoot}/${generatedApiFile.replace(/\.ts$/, ".d.ts")}`,
      ),
      `generated backend TypeScript SDK declarations must expose ${generatedApiFile}`,
    );
  }

  const providerApplicationCommand = readFileSync(
    workspacePath(rtcRoot, `${generatedTypesRoot}/rtc-provider-application-command.ts`),
    "utf8",
  );
  assert.match(
    providerApplicationCommand,
    /providerApplicationIdKind: 'volcengine_app_id' \| 'tencent_sdk_app_id' \| 'provider_application_id'/,
    "generated provider application command must distinguish Volcengine AppId and Tencent SDKAppID",
  );

  const providerCredentialCommand = readFileSync(
    workspacePath(rtcRoot, `${generatedTypesRoot}/rtc-provider-credential-command.ts`),
    "utf8",
  );
  assert.match(
    providerCredentialCommand,
    /credentialRole: 'rtc_token_signing' \| 'open_api_signing' \| 'usersig_signing' \| 'cloud_api_signing' \| 'webhook_signing'/,
    "generated provider credential command must expose Volcengine and Tencent credential role choices",
  );
  for (const rawSecretToken of [
    "appKey",
    "sdkSecretKey",
    "secretKey",
    "secretAccessKey",
    "rawSecret",
    "privateKey",
    "token",
  ]) {
    assert.doesNotMatch(
      providerCredentialCommand,
      new RegExp(`\\b${rawSecretToken}\\b`),
      `generated provider credential command must not expose raw secret token ${rawSecretToken}`,
    );
  }

  const providerAccountsApi = readFileSync(
    workspacePath(rtcRoot, `${generatedApiRoot}/rtc-provider-accounts.ts`),
    "utf8",
  );
  for (const requiredMethod of [
    "async list",
    "async create",
    "async retrieve",
    "async update",
    "async disable",
  ]) {
    assert.match(
      providerAccountsApi,
      new RegExp(requiredMethod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `generated provider accounts API must expose ${requiredMethod}`,
    );
  }

  const providerApplicationsApi = readFileSync(
    workspacePath(rtcRoot, `${generatedApiRoot}/rtc-provider-applications.ts`),
    "utf8",
  );
  for (const requiredMethod of [
    "async list",
    "async create",
    "async retrieve",
    "async update",
    "async disable",
  ]) {
    assert.match(
      providerApplicationsApi,
      new RegExp(requiredMethod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `generated provider applications API must expose ${requiredMethod}`,
    );
  }

  const providerCredentialsApi = readFileSync(
    workspacePath(rtcRoot, `${generatedApiRoot}/rtc-provider-credentials.ts`),
    "utf8",
  );
  for (const requiredMethod of [
    "async list",
    "async create",
    "async retrieve",
    "async update",
    "async revoke",
  ]) {
    assert.match(
      providerCredentialsApi,
      new RegExp(requiredMethod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `generated provider credentials API must expose ${requiredMethod}`,
    );
  }

  const providerProfileVerifyRequest = readFileSync(
    workspacePath(rtcRoot, `${generatedTypesRoot}/rtc-provider-profile-verify-request.ts`),
    "utf8",
  );
  assert.match(
    providerProfileVerifyRequest,
    /\bqueryKind: 'credential' \| 'webhook' \| 'active_query' \| 'recording' \| 'full'/,
    "generated provider profile verify request must require queryKind",
  );
  assert.doesNotMatch(
    providerProfileVerifyRequest,
    /\bqueryKind\?:/,
    "generated provider profile verify request must not make queryKind optional",
  );
  const providerProfileVerifyDeclaration = readFileSync(
    workspacePath(
      rtcRoot,
      "sdks/sdkwork-rtc-backend-sdk/sdkwork-rtc-backend-sdk-typescript/generated/server-openapi/dist/types/rtc-provider-profile-verify-request.d.ts",
    ),
    "utf8",
  );
  assert.match(
    providerProfileVerifyDeclaration,
    /\bqueryKind: 'credential' \| 'webhook' \| 'active_query' \| 'recording' \| 'full'/,
    "generated provider profile verify declaration must require queryKind",
  );
  assert.doesNotMatch(
    providerProfileVerifyDeclaration,
    /\bqueryKind\?:/,
    "generated provider profile verify declaration must not make queryKind optional",
  );

  const providerQueryCreateRequest = readFileSync(
    workspacePath(rtcRoot, `${generatedTypesRoot}/rtc-provider-query-job-create-request.ts`),
    "utf8",
  );
  for (const requiredField of [
    "provider: string",
    "providerProfileId?: string | null",
    "queryKind:",
    "roomId?: string | null",
    "mediaSessionId?: string | null",
    "providerSessionId?: string | null",
    "cursor?: string | null",
  ]) {
    assert.match(
      providerQueryCreateRequest,
      new RegExp(requiredField.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `generated provider query create request must expose ${requiredField}`,
    );
  }
  for (const staleField of ["targetKind", "targetId"]) {
    assert.doesNotMatch(
      providerQueryCreateRequest,
      new RegExp(`\\b${staleField}\\b`),
      `generated provider query create request must not expose stale ${staleField}`,
    );
  }
  const providerQueryJob = readFileSync(
    workspacePath(rtcRoot, `${generatedTypesRoot}/rtc-provider-query-job.ts`),
    "utf8",
  );
  assert.match(
    providerQueryJob,
    /providerSessionId\?: string \| null/,
    "generated provider query job must expose providerSessionId",
  );
  const providerQuerySnapshot = readFileSync(
    workspacePath(rtcRoot, `${generatedTypesRoot}/rtc-provider-query-snapshot.ts`),
    "utf8",
  );
  assert.match(
    providerQuerySnapshot,
    /providerSessionId\?: string \| null/,
    "generated provider query snapshot must expose providerSessionId",
  );

  const providerRoute = readFileSync(
    workspacePath(rtcRoot, `${generatedTypesRoot}/rtc-provider-route.ts`),
    "utf8",
  );
  for (const requiredField of [
    "id: string",
    "tenantId: string",
    "organizationId: string",
    "providerProfileId: string",
    "routeType: 'region'",
    "region?: string | null",
    "priority: number",
    "status: 'active' | 'disabled'",
  ]) {
    assert.match(
      providerRoute,
      new RegExp(requiredField.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `generated provider route DTO must expose ${requiredField}`,
    );
  }
});

test("sdkwork-rtc generated TypeScript SDK DTOs preserve OpenAPI required fields", () => {
  assertGeneratedTypesRequireOpenApiRequiredFields({
    openapi: readJson(
      rtcRoot,
      "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.openapi.json",
    ),
    generatedTypesRoot:
      "sdks/sdkwork-rtc-app-sdk/sdkwork-rtc-app-sdk-typescript/generated/server-openapi/src/types",
    label: "app-api",
  });
  assertGeneratedTypesRequireOpenApiRequiredFields({
    openapi: readJson(
      rtcRoot,
      "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
    ),
    generatedTypesRoot:
      "sdks/sdkwork-rtc-backend-sdk/sdkwork-rtc-backend-sdk-typescript/generated/server-openapi/src/types",
    label: "backend-api",
  });
});

test("sdkwork-rtc PC React package exposes media runtime helpers instead of call workflow helpers", () => {
  const packageFiles = [
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/package.json",
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/src/rtc.ts",
    "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/tests/rtc.test.ts",
  ];

  const matches = findPatternMatches(rtcRoot, packageFiles, [
    /\bSdkworkRtcCallType\b/,
    /\bcallType\b/,
    /\bSdkworkRtcDesktopCallIntent\b/,
    /\bCreateRtcDesktopCallIntentOptions\b/,
    /\bcreateRtcDesktopCallIntent\b/,
    /call-toast/,
    /rtc-call-intent/,
    /\bring(?:ing)?\b/i,
    /\/calls\b/,
    /Realtime audio and video calling/i,
  ]);
  assert.deepEqual(matches, []);

  const source = readFileSync(
    workspacePath(rtcRoot, "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/src/rtc.ts"),
    "utf8",
  );
  assert.match(source, /\bSdkworkRtcMediaSessionMode\b/);
  assert.match(source, /\bmediaMode\b/);
  assert.match(source, /\bCreateRtcMediaWorkspaceManifestOptions\b/);
  assert.match(source, /\bcreateRtcMediaWorkspaceManifest\b/);
});

test("sdkwork-rtc capability keys use media runtime terms instead of call workflow terms", () => {
  const capabilityFiles = [
    "crates/sdkwork-communication-rtc-service/src/lib.rs",
    "sdks/sdkwork-rtc-sdk/.sdkwork-assembly.json",
    "sdks/sdkwork-rtc-sdk/bin/rtc-standard-contract-constants.mjs",
    "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/capability-catalog.ts",
    "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/provider-catalog.ts",
    "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts",
    "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-volcengine/package.json",
    "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter/lib/src/rtc_capability_catalog.dart",
    "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter/providers/rtc_sdk_provider_volcengine/pubspec.yaml",
  ];

  const matches = findPatternMatches(rtcRoot, capabilityFiles, [
    /"callback"/,
    /call\.audio/,
    /call\.video/,
  ]);
  assert.deepEqual(matches, []);

  const assembly = readFileSync(
    workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/.sdkwork-assembly.json"),
    "utf8",
  );
  assert.match(assembly, /"capabilityKey":\s*"media\.audio"/);
  assert.match(assembly, /"capabilityKey":\s*"media\.video"/);
});

test("sdkwork-rtc SDK root packages stay provider-neutral and vendor-free", () => {
  const typescriptPackage = JSON.parse(
    readFileSync(
      workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/package.json"),
      "utf8",
    ),
  );
  assert.equal(typescriptPackage.peerDependencies?.["@volcengine/rtc"], undefined);
  assert.equal(typescriptPackage.dependencies?.["@volcengine/rtc"], undefined);
  assert.equal(typescriptPackage.optionalDependencies?.["@volcengine/rtc"], undefined);

  const typescriptIndex = readFileSync(
    workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/index.ts"),
    "utf8",
  );
  assert.doesNotMatch(typescriptIndex, /['"]\.\/providers(?:\/index|\/[a-z-]+)?\.js['"]/);
  assert.doesNotMatch(typescriptIndex, /\bcreateBuiltinRtcDriverManager\b/);

  const flutterPubspec = readFileSync(
    workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter/pubspec.yaml"),
    "utf8",
  );
  assert.doesNotMatch(flutterPubspec, /\bvolc_engine_rtc\b/);

  const flutterBarrel = readFileSync(
    workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart"),
    "utf8",
  );
  assert.doesNotMatch(flutterBarrel, /volcengine_official_flutter|src\/providers\//);
});

test("sdkwork-rtc root typecheck excludes generator-owned OpenAPI transport output", () => {
  const rootTsconfig = JSON.parse(readFileSync(workspacePath(rtcRoot, "tsconfig.json"), "utf8"));
  const excluded = rootTsconfig.exclude ?? [];

  for (const generatedOutput of [
    "sdks/sdkwork-rtc-app-sdk/**/generated/server-openapi/**",
    "sdks/sdkwork-rtc-backend-sdk/**/generated/server-openapi/**",
  ]) {
    assert.ok(
      excluded.includes(generatedOutput),
      `root tsconfig must exclude generator-owned output ${generatedOutput}`,
    );
  }
});

test("sdkwork-rtc builtin Rust provider adapters implement declared webhook and active query surfaces", () => {
  const providerCatalogSource = readFileSync(
    workspacePath(
      rtcRoot,
      "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/provider-catalog.ts",
    ),
    "utf8",
  );
  const builtinProviderKeysMatch = providerCatalogSource.match(
    /BUILTIN_RTC_PROVIDER_KEYS\s*=\s*freezeRtcRuntimeValue\(\[(?<keys>[^\]]+)\]\s+as const\)/,
  );
  assert.ok(builtinProviderKeysMatch?.groups?.keys, "provider catalog must declare built-in keys");
  const builtinProviderKeys = Array.from(
    builtinProviderKeysMatch.groups.keys.matchAll(/'(?<provider>[^']+)'/g),
    (match) => match.groups.provider,
  );
  assert.deepEqual(builtinProviderKeys, ["volcengine", "aliyun", "tencent", "agora", "livekit"]);

  for (const providerKey of builtinProviderKeys) {
    const providerEntryPattern = new RegExp(
      `providerKey:\\s*'${providerKey}'[\\s\\S]+?optionalCapabilities:\\s*\\[[^\\]]*'provider\\.active-query'[\\s\\S]+?builtin:\\s*true`,
    );
    assert.match(
      providerCatalogSource,
      providerEntryPattern,
      `${providerKey} must be cataloged as a built-in provider with active query capability`,
    );

    const adapterSourcePath = `plugins/rtc-${providerKey}/src`;
    const adapterSource = listTextFiles(rtcRoot, adapterSourcePath)
      .filter((relativePath) => relativePath.endsWith(".rs"))
      .map((relativePath) => readFileSync(workspacePath(rtcRoot, relativePath), "utf8"))
      .join("\n");
    for (const requiredToken of [
      "fn parse_provider_webhook",
      "fn verify_provider_webhook_signature",
      "RtcProviderWebhookEvent",
      "rtc_provider_payload_hash",
      "fn query_provider_state",
      "RtcProviderQueryResult",
    ]) {
      assert.match(
        adapterSource,
        new RegExp(requiredToken.replaceAll(" ", "\\s+")),
        `${adapterSourcePath} must implement ${requiredToken}`,
      );
    }
    assert.doesNotMatch(
      adapterSource,
      /UnsupportedCapability[\s\S]{0,160}provider webhook parsing is not implemented/,
      `${adapterSourcePath} must not rely on default webhook unsupported capability`,
    );
    assert.doesNotMatch(
      adapterSource,
      /UnsupportedCapability[\s\S]{0,160}provider active query is not implemented/,
      `${adapterSourcePath} must not rely on default active query unsupported capability`,
    );

    const adapterTestPath = `plugins/rtc-${providerKey}/tests/adapter_contract_test.rs`;
    const adapterTestSource = readFileSync(workspacePath(rtcRoot, adapterTestPath), "utf8");
    assert.match(
      adapterTestSource,
      new RegExp(`test_${providerKey}_rtc_provider_implements_webhook_and_active_query_surface`),
      `${adapterTestPath} must include a webhook and active query contract test`,
    );
    for (const requiredToken of [
      "provider.webhook",
      "provider.active-query",
      ".parse_provider_webhook(RtcProviderWebhookParseRequest",
      ".verify_provider_webhook_signature(RtcProviderWebhookVerifyRequest",
      ".query_provider_state(RtcProviderQueryRequest",
    ]) {
      assert.match(
        adapterTestSource,
        new RegExp(requiredToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${adapterTestPath} must cover ${requiredToken}`,
      );
    }
  }
});

test("sdkwork-rtc builtin Rust provider adapters expose component-level plugin contracts", () => {
  const expectedProviders = {
    agora: {
      exports: [
        "AgoraRtcProvider",
        "AgoraRtcProviderConfig",
        "AgoraRtcProviderPluginFactory",
        "AgoraRtcOpenApiExecutor",
        "AgoraRtcOpenApiRequest",
        "AgoraRtcOpenApiResponse",
        "AGORA_RTC_PLUGIN_ID",
        "create_agora_rtc_provider_plugin_factory",
      ],
      factoryExport: "AgoraRtcProviderPluginFactory",
      factoryFunction: "create_agora_rtc_provider_plugin_factory",
      configKeys: [
        "SDKWORK_RTC_AGORA_ACCESS_ENDPOINT",
        "SDKWORK_RTC_AGORA_REGION",
        "SDKWORK_RTC_AGORA_APP_ID",
        "SDKWORK_RTC_AGORA_APP_CERTIFICATE",
        "SDKWORK_RTC_AGORA_CREDENTIAL_TTL_SECONDS",
      ],
    },
    aliyun: {
      exports: [
        "AliyunRtcProvider",
        "AliyunRtcProviderConfig",
        "AliyunRtcProviderPluginFactory",
        "AliyunRtcOpenApiExecutor",
        "AliyunRtcOpenApiRequest",
        "AliyunRtcOpenApiResponse",
        "ALIYUN_RTC_PLUGIN_ID",
        "create_aliyun_rtc_provider_plugin_factory",
      ],
      factoryExport: "AliyunRtcProviderPluginFactory",
      factoryFunction: "create_aliyun_rtc_provider_plugin_factory",
      configKeys: [
        "SDKWORK_RTC_ALIYUN_ACCESS_ENDPOINT",
        "SDKWORK_RTC_ALIYUN_REGION",
        "SDKWORK_RTC_ALIYUN_APP_ID",
        "SDKWORK_RTC_ALIYUN_APP_KEY",
        "SDKWORK_RTC_ALIYUN_CREDENTIAL_TTL_SECONDS",
      ],
    },
    livekit: {
      exports: [
        "LivekitRtcProvider",
        "LivekitRtcProviderConfig",
        "LivekitRtcProviderPluginFactory",
        "LivekitRtcOpenApiExecutor",
        "LivekitRtcOpenApiRequest",
        "LivekitRtcOpenApiResponse",
        "LIVEKIT_RTC_PLUGIN_ID",
        "create_livekit_rtc_provider_plugin_factory",
      ],
      factoryExport: "LivekitRtcProviderPluginFactory",
      factoryFunction: "create_livekit_rtc_provider_plugin_factory",
      configKeys: [
        "SDKWORK_RTC_LIVEKIT_ACCESS_ENDPOINT",
        "SDKWORK_RTC_LIVEKIT_REGION",
        "SDKWORK_RTC_LIVEKIT_API_ENDPOINT",
        "SDKWORK_RTC_LIVEKIT_API_KEY",
        "SDKWORK_RTC_LIVEKIT_API_SECRET",
        "SDKWORK_RTC_LIVEKIT_CREDENTIAL_TTL_SECONDS",
      ],
    },
    tencent: {
      exports: [
        "TencentRtcProvider",
        "TencentRtcProviderConfig",
        "TencentRtcProviderPluginFactory",
        "TencentRtcOpenApiExecutor",
        "TencentRtcOpenApiRequest",
        "TencentRtcOpenApiResponse",
        "TENCENT_RTC_PLUGIN_ID",
        "create_tencent_rtc_provider_plugin_factory",
      ],
      factoryExport: "TencentRtcProviderPluginFactory",
      factoryFunction: "create_tencent_rtc_provider_plugin_factory",
      configKeys: [
        "SDKWORK_RTC_TENCENT_ACCESS_ENDPOINT",
        "SDKWORK_RTC_TENCENT_REGION",
        "SDKWORK_RTC_TENCENT_SDK_APP_ID",
        "SDKWORK_RTC_TENCENT_SDK_SECRET_KEY",
        "SDKWORK_RTC_TENCENT_CREDENTIAL_TTL_SECONDS",
        "SDKWORK_RTC_TENCENT_API_ENDPOINT",
        "SDKWORK_RTC_TENCENT_API_HOST",
        "SDKWORK_RTC_TENCENT_API_VERSION",
        "SDKWORK_RTC_TENCENT_SECRET_ID",
        "SDKWORK_RTC_TENCENT_SECRET_KEY",
      ],
    },
    volcengine: {
      exports: [
        "VolcengineRtcProvider",
        "VolcengineRtcProviderConfig",
        "VolcengineRtcProviderPluginFactory",
        "VolcengineRtcOpenApiExecutor",
        "VolcengineRtcOpenApiRequest",
        "VolcengineRtcOpenApiResponse",
        "VOLCENGINE_RTC_PLUGIN_ID",
        "create_volcengine_rtc_provider_plugin_factory",
      ],
      factoryExport: "VolcengineRtcProviderPluginFactory",
      factoryFunction: "create_volcengine_rtc_provider_plugin_factory",
      configKeys: [
        "SDKWORK_RTC_VOLCENGINE_ACCESS_ENDPOINT",
        "SDKWORK_RTC_VOLCENGINE_REGION",
        "SDKWORK_RTC_VOLCENGINE_APP_ID",
        "SDKWORK_RTC_VOLCENGINE_APP_KEY",
        "SDKWORK_RTC_VOLCENGINE_CREDENTIAL_TTL_SECONDS",
        "SDKWORK_RTC_VOLCENGINE_API_ENDPOINT",
        "SDKWORK_RTC_VOLCENGINE_API_HOST",
        "SDKWORK_RTC_VOLCENGINE_API_VERSION",
        "SDKWORK_RTC_VOLCENGINE_ACCESS_KEY_ID",
        "SDKWORK_RTC_VOLCENGINE_SECRET_ACCESS_KEY",
      ],
    },
  };
  const requiredCanonicalSpecs = [
    "CODE_STYLE_SPEC.md",
    "NAMING_SPEC.md",
    "COMPONENT_SPEC.md",
    "RUST_CODE_SPEC.md",
    "TEST_SPEC.md",
  ];

  for (const [providerKey, expectation] of Object.entries(expectedProviders)) {
    const componentSpecPath = `plugins/rtc-${providerKey}/specs/component.spec.json`;
    const componentSpecAbsolutePath = workspacePath(rtcRoot, componentSpecPath);
    const componentSpec = JSON.parse(readFileSync(componentSpecAbsolutePath, "utf8"));

    assert.equal(componentSpec.kind, "sdkwork.component.spec");
    assert.equal(componentSpec.component?.name, `sdkwork-rtc-adapter-${providerKey}`);
    assert.equal(componentSpec.component?.type, "rust-crate");
    assert.equal(componentSpec.component?.domain, "communication");
    assert.equal(componentSpec.component?.capability, "rtc");
    assert.equal(componentSpec.component?.generated, false);
    assert.ok(componentSpec.component?.languages?.includes("rust"));
    assert.ok(componentSpec.component?.manifests?.includes("Cargo.toml"));

    const canonicalSpecFiles = new Set(
      (componentSpec.canonicalSpecs ?? []).map((entry) => entry.file),
    );
    for (const requiredSpec of requiredCanonicalSpecs) {
      assert.ok(
        canonicalSpecFiles.has(requiredSpec),
        `${componentSpecPath} must cite ${requiredSpec}`,
      );
    }
    for (const canonicalSpec of componentSpec.canonicalSpecs ?? []) {
      assert.ok(canonicalSpec.path, `${componentSpecPath} canonical spec must declare a path`);
      assert.ok(
        existsSync(path.resolve(path.dirname(componentSpecAbsolutePath), canonicalSpec.path)),
        `${componentSpecPath} canonical spec path must resolve: ${canonicalSpec.path}`,
      );
    }

    assert.deepEqual(
      componentSpec.contracts?.providerPlugin,
      {
        pluginId: `rtc-${providerKey}`,
        providerKey,
        registrationContract: "RtcProviderPort",
        factoryContract: "RtcProviderPluginFactory",
        factoryExport: expectation.factoryExport,
        factoryFunction: expectation.factoryFunction,
        descriptorMethod: "RtcProviderPort::descriptor",
        capabilitiesSource: "crates/sdkwork-communication-rtc-service/src/lib.rs",
      },
      `${componentSpecPath} must declare the RTC provider plugin contract`,
    );
    assert.deepEqual(componentSpec.contracts?.publicExports, expectation.exports);
    assert.deepEqual(componentSpec.contracts?.runtimeEntrypoints, ["Cargo.toml"]);
    assert.deepEqual(componentSpec.contracts?.sdkClients, []);
    assert.deepEqual(componentSpec.contracts?.configKeys, expectation.configKeys);
    assert.deepEqual(componentSpec.verification?.commands, [
      `cargo test -p sdkwork-rtc-adapter-${providerKey}`,
    ]);
  }
});

test("sdkwork-rtc builtin Rust provider adapter crate roots stay thin plugin entrypoints", () => {
  const expectedModules = {
    agora: ["config", "open_api", "plugin", "provider", "query", "recording", "webhook"],
    aliyun: ["config", "open_api", "plugin", "provider", "query", "recording", "webhook"],
    livekit: ["config", "open_api", "plugin", "provider", "query", "recording", "webhook"],
    tencent: [
      "config",
      "credential",
      "open_api",
      "plugin",
      "provider",
      "query",
      "recording",
      "webhook",
    ],
    volcengine: [
      "config",
      "credential",
      "open_api",
      "plugin",
      "provider",
      "query",
      "recording",
      "webhook",
    ],
  };
  const forbiddenRootPatterns = [
    /\bimpl\s+RtcProviderPort\s+for\s+\w+RtcProvider\b/u,
    /\bfn\s+parse_provider_webhook\s*\(/u,
    /\bfn\s+query_provider_state\s*\(/u,
    /\bfn\s+export_recording_artifact\s*\(/u,
    /\bfn\s+parse_payload\s*\(/u,
    /\bfn\s+string_field(?:_in)?\s*\(/u,
    /\bfn\s+header_value\s*\(/u,
    /\bfn\s+\w+_event_kind\s*\(/u,
    /\buse\s+std::collections::BTreeMap\b/u,
    /\buse\s+serde_json::/u,
  ];

  for (const [providerKey, modules] of Object.entries(expectedModules)) {
    const libPath = `plugins/rtc-${providerKey}/src/lib.rs`;
    const libSource = readFileSync(workspacePath(rtcRoot, libPath), "utf8");
    const lineCount = libSource.split(/\r?\n/u).length;
    assert.ok(lineCount <= 80, `${libPath} must remain a thin crate-root entrypoint`);
    for (const moduleName of modules) {
      assert.match(
        libSource,
        new RegExp(`(?:pub\\s+)?mod\\s+${moduleName}\\s*;`, "u"),
        `${libPath} must assemble ${moduleName}.rs`,
      );
      assert.ok(
        exists(rtcRoot, `plugins/rtc-${providerKey}/src/${moduleName}.rs`),
        `plugins/rtc-${providerKey}/src/${moduleName}.rs must exist`,
      );
    }
    assert.match(
      libSource,
      /pub\s+use\s+config::\w+RtcProviderConfig;/u,
      `${libPath} must re-export provider config from config.rs`,
    );
    assert.match(
      libSource,
      /pub\s+use\s+provider::\w+RtcProvider;/u,
      `${libPath} must re-export provider implementation from provider.rs`,
    );
    assert.match(
      libSource,
      /pub\s+use\s+plugin::\w+RtcProviderPluginFactory;/u,
      `${libPath} must re-export provider plugin factory from plugin.rs`,
    );
    assert.match(
      libSource,
      /pub\s+use\s+plugin::create_\w+_rtc_provider_plugin_factory;/u,
      `${libPath} must re-export provider plugin factory function from plugin.rs`,
    );
    for (const forbiddenPattern of forbiddenRootPatterns) {
      assert.doesNotMatch(
        libSource,
        forbiddenPattern,
        `${libPath} must not keep implementation logic in the crate root`,
      );
    }
  }
});

test("sdkwork-rtc builtin provider capability declarations stay aligned across Rust core and SDK catalogs", () => {
  const providerConstants = {
    volcengine: "RTC_PROVIDER_VOLCENGINE_OPTIONAL_CAPABILITIES",
    aliyun: "RTC_PROVIDER_ALIYUN_OPTIONAL_CAPABILITIES",
    tencent: "RTC_PROVIDER_TENCENT_OPTIONAL_CAPABILITIES",
    agora: "RTC_PROVIDER_AGORA_OPTIONAL_CAPABILITIES",
    livekit: "RTC_PROVIDER_LIVEKIT_OPTIONAL_CAPABILITIES",
  };
  const coreSource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-service/src/lib.rs"),
    "utf8",
  );
  const requiredCapabilities = parseRustStringArrayConstant(
    coreSource,
    "RTC_PROVIDER_REQUIRED_CAPABILITIES",
  );
  const providerOptionalCapabilities = Object.fromEntries(
    Object.entries(providerConstants).map(([providerKey, constantName]) => [
      providerKey,
      parseRustStringArrayConstant(coreSource, constantName),
    ]),
  );
  const assembly = JSON.parse(
    readFileSync(workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/.sdkwork-assembly.json"), "utf8"),
  );
  const providerCatalogSource = readFileSync(
    workspacePath(
      rtcRoot,
      "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/provider-catalog.ts",
    ),
    "utf8",
  );
  const builtinProviderKeys = Object.keys(providerConstants);

  for (const capabilityList of [
    ["Rust required RTC capabilities", requiredCapabilities],
    ...Object.entries(providerOptionalCapabilities).map(([providerKey, capabilities]) => [
      `Rust ${providerKey} optional RTC capabilities`,
      capabilities,
    ]),
  ]) {
    const [label, capabilities] = capabilityList;
    assert.deepEqual(
      [...new Set(capabilities)],
      capabilities,
      `${label} must not contain duplicates`,
    );
  }

  for (const providerKey of builtinProviderKeys) {
    const assemblyProvider = assembly.providers?.find(
      (provider) => provider.providerKey === providerKey,
    );
    assert.ok(assemblyProvider?.builtin, `${providerKey} must be a built-in SDK provider`);
    assertCapabilitySetEqual(
      assemblyProvider.requiredCapabilities,
      requiredCapabilities,
      `assembly ${providerKey} required capabilities`,
    );
    assertCapabilitySetEqual(
      assemblyProvider.optionalCapabilities,
      providerOptionalCapabilities[providerKey],
      `assembly ${providerKey} optional capabilities`,
    );

    const catalogCapabilities = parseTypescriptProviderOptionalCapabilities(
      providerCatalogSource,
      providerKey,
    );
    assertCapabilitySetEqual(
      catalogCapabilities,
      providerOptionalCapabilities[providerKey],
      `TypeScript catalog ${providerKey} optional capabilities`,
    );
  }
});

test("sdkwork-rtc builtin Rust provider adapter tests cover declared media session and recording artifact capabilities", () => {
  const providerCatalogSource = readFileSync(
    workspacePath(
      rtcRoot,
      "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/provider-catalog.ts",
    ),
    "utf8",
  );
  const builtinProviderKeysMatch = providerCatalogSource.match(
    /BUILTIN_RTC_PROVIDER_KEYS\s*=\s*freezeRtcRuntimeValue\(\[(?<keys>[^\]]+)\]\s+as const\)/,
  );
  assert.ok(builtinProviderKeysMatch?.groups?.keys, "provider catalog must declare built-in keys");
  const builtinProviderKeys = Array.from(
    builtinProviderKeysMatch.groups.keys.matchAll(/'(?<provider>[^']+)'/g),
    (match) => match.groups.provider,
  );

  for (const providerKey of builtinProviderKeys) {
    const providerEntryMatch = providerCatalogSource.match(
      new RegExp(
        `providerKey:\\s*'${providerKey}'[\\s\\S]+?requiredCapabilities:\\s*(?<required>REQUIRED_RTC_CAPABILITIES|\\[[^\\]]*\\])[\\s\\S]+?optionalCapabilities:\\s*\\[(?<optional>[^\\]]*)\\][\\s\\S]+?builtin:\\s*true`,
      ),
    );
    assert.ok(providerEntryMatch?.groups, `${providerKey} must have a built-in provider catalog entry`);
    assert.equal(
      providerEntryMatch.groups.required,
      "REQUIRED_RTC_CAPABILITIES",
      `${providerKey} must inherit the standard required RTC capabilities`,
    );

    const adapterTestPath = `plugins/rtc-${providerKey}/tests/adapter_contract_test.rs`;
    const adapterTestSource = readFileSync(workspacePath(rtcRoot, adapterTestPath), "utf8");

    for (const modeName of ["Audio", "Video", "Live"]) {
      assert.match(
        adapterTestSource,
        new RegExp(`RtcMediaSessionMode::${modeName}\\b`),
        `${adapterTestPath} must explicitly create a ${modeName} media session because ${providerKey} declares the standard audio/video/live capability set`,
      );
    }

    for (const requiredSessionAssertion of [
      "create_session(RtcCreateMediaSessionRequest",
      "access_endpoint.as_deref()",
      "region.as_deref()",
      "provider_session_id",
      "assert_requested_region_overrides_provider_default",
    ]) {
      assert.match(
        adapterTestSource,
        new RegExp(requiredSessionAssertion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${adapterTestPath} must assert the provider session contract for declared media session capabilities`,
      );
    }

    const optionalCapabilities = providerEntryMatch.groups.optional;
    if (optionalCapabilities.includes("'recording'") && optionalCapabilities.includes("'artifact'")) {
      for (const artifactToken of [
        "export_recording_artifact",
        "RtcRecordingArtifactImportPort",
        "RtcRecordingArtifactImportRequest",
        "with_recording_importer",
        "recording export must fail closed",
        "resource.uri.as_deref()",
      ]) {
        assert.match(
          adapterTestSource,
          new RegExp(artifactToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
          `${adapterTestPath} must assert the Drive importer boundary because ${providerKey} declares recording + artifact capabilities`,
        );
      }
      assert.doesNotMatch(
        adapterTestSource,
        /space_rtc_recordings/,
        `${adapterTestPath} must not assert provider-fabricated Drive recording spaces`,
      );

      const adapterSource = listTextFiles(rtcRoot, `plugins/rtc-${providerKey}/src`)
        .filter((relativePath) => relativePath.endsWith(".rs"))
        .map((relativePath) => readFileSync(workspacePath(rtcRoot, relativePath), "utf8"))
        .join("\n");
      assert.doesNotMatch(
        adapterSource,
        /space_rtc_recordings|provider_executor_not_configured/,
        `plugins/rtc-${providerKey}/src must fail closed instead of fabricating Drive resources or local provider-query success`,
      );
    }
  }
});

test("sdkwork-rtc provider registry is RTC-only", () => {
  const coreSource = readFileSync(
    workspacePath(rtcRoot, "crates/sdkwork-communication-rtc-service/src/lib.rs"),
    "utf8",
  ).split("#[cfg(test)]")[0];

  for (const forbidden of [
    "ObjectStorage",
    "PrincipalProfile",
    "IotAccess",
    "IotProtocol",
    "object-storage",
    "principal-profile",
    "iot-access",
    "iot-protocol",
  ]) {
    assert.doesNotMatch(
      coreSource,
      new RegExp(`\\b${forbidden}\\b`),
      `sdkwork-rtc provider registry must stay RTC-only, but found ${forbidden}`,
    );
  }
});
