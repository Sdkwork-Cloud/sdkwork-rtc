import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rtcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appbaseRoot = path.resolve(rtcRoot, "..", "sdkwork-appbase");
const crawChatRoot = path.resolve(rtcRoot, "..", "craw-chat");
const sdkworkCoreRoot = path.resolve(rtcRoot, "..", "sdkwork-core");

const requiredRtcPaths = [
  "sdks/sdkwork-rtc-sdk/README.md",
  "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/package.json",
  "sdks/sdkwork-rtc-app-sdk/openapi/sdkwork-rtc-app-api.openapi.json",
  "sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json",
  "sdks/materialize-rtc-v3-openapi-boundaries.mjs",
  "packages/pc-react/communication/sdkwork-rtc-pc-react/package.json",
  "packages/pc-react/communication/sdkwork-rtc-pc-react/src/rtc.ts",
  "crates/sdkwork-rtc-storage-sqlx/Cargo.toml",
  "crates/sdkwork-rtc-storage-sqlx/src/lib.rs",
  "crates/sdkwork-rtc-storage-sqlx/src/schema/postgres_rtc.sql",
  "crates/sdkwork-rtc-storage-sqlx/src/schema/sqlite_rtc.sql",
  "services/sdkwork-routes-rtc-app-api/src/lib.rs",
  "services/sdkwork-routes-rtc-backend-api/src/lib.rs",
];

const forbiddenAppbasePaths = [
  "packages/pc-react/communication/sdkwork-rtc-pc-react",
];

const forbiddenAppbasePatterns = [
  /@sdkwork\/rtc-sdk/,
  /@sdkwork\/rtc-pc-react/,
  /sdkwork-rtc-sdk/,
  /sdkwork-space[\\/]sdkwork-rtc/,
  /\.\.\/craw-chat\/sdks\/sdkwork-rtc-sdk/,
  /sdkwork-react-backend-rtc/,
];

const allowedAppbaseBoundaryFiles = new Set([
  "scripts/appbase-rtc-extraction-boundary.test.mjs",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/tests/catalog.test.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/tests/catalog.test.ts",
]);

const forbiddenCrawChatPaths = [
  "adapters/rtc-aliyun",
  "adapters/rtc-tencent",
  "adapters/rtc-volcengine",
  "crates/craw-chat-contract-rtc",
  "sdks/sdkwork-rtc-sdk",
  "services/rtc-signaling-service",
];

const forbiddenCrawChatPatterns = [
  /read\(['"]sdkwork-rtc-sdk\//,
  /(?:^|[\s"'`=:([{])(?:\.\.\/)+sdks\/sdkwork-rtc-sdk\b/m,
  /(?:^|[\s"'`=:([{])(?:\.\.\\)+sdks\\sdkwork-rtc-sdk\b/m,
  /(?:^|[\s"'`=:([{])sdks\/sdkwork-rtc-sdk\b/m,
  /(?:^|[\s"'`=:([{])sdks\\sdkwork-rtc-sdk\b/m,
  /link:[^\r\n]*craw-chat\/sdks\/sdkwork-rtc-sdk/,
  /link:[^\r\n]*craw-chat\\sdks\\sdkwork-rtc-sdk/,
];

const forbiddenSdkworkCorePatterns = [
  /@sdkwork\/rtc-sdk/,
  /sdkwork-space[\\/]sdkwork-rtc/,
  /craw-chat\/sdks\/sdkwork-rtc-sdk/,
  /craw-chat\\sdks\\sdkwork-rtc-sdk/,
  /link:[^\r\n]*craw-chat\/sdks\/sdkwork-rtc-sdk/,
  /link:[^\r\n]*craw-chat\\sdks\\sdkwork-rtc-sdk/,
];

function workspacePath(root, relativePath) {
  return path.join(root, ...relativePath.split("/"));
}

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

test("sdkwork-rtc owns RTC SDK, UI, Rust storage, routes, and OpenAPI authorities", () => {
  const missing = requiredRtcPaths.filter((relativePath) => !exists(rtcRoot, relativePath));
  assert.deepEqual(missing, []);
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

test("craw-chat PC app consumes the RTC SDK from sdkwork-rtc", () => {
  const packageJson = readFileSync(
    workspacePath(crawChatRoot, "apps/sdkwork-chat-pc/package.json"),
    "utf8",
  );
  assert.match(
    packageJson,
    /@sdkwork\/rtc-sdk[\s\S]*\.\.\/\.\.\/\.\.\/sdkwork-rtc\/sdks\/sdkwork-rtc-sdk\/sdkwork-rtc-sdk-typescript/,
  );

  const workspace = readFileSync(workspacePath(appbaseRoot, "pnpm-workspace.yaml"), "utf8");
  assert.doesNotMatch(workspace, /sdkwork-space\/sdkwork-rtc/);
  const chatWorkspace = readFileSync(
    workspacePath(crawChatRoot, "apps/sdkwork-chat-pc/pnpm-workspace.yaml"),
    "utf8",
  );
  assert.match(
    chatWorkspace,
    /\.\.\/\.\.\/\.\.\/sdkwork-rtc\/sdks\/sdkwork-rtc-sdk\/sdkwork-rtc-sdk-typescript/,
  );
});

test("craw-chat PC call service routes RTC through sdkwork-rtc instead of IM SDK RTC modules", () => {
  const callService = readFileSync(
    workspacePath(
      crawChatRoot,
      "apps/sdkwork-chat-pc/packages/sdkwork-clawchat-pc-chat/src/services/CallService.ts",
    ),
    "utf8",
  );

  assert.match(callService, /@sdkwork\/rtc-sdk/);
  assert.match(callService, /createRtcAppHttpClient/);
  assert.match(callService, /createStandardRtcCallControllerStack/);
  assert.doesNotMatch(callService, /@sdkwork\/im-sdk/);
  assert.doesNotMatch(callService, /\bImRtcSdkLike\b/);
  assert.doesNotMatch(callService, /\bImSdkClient\b/);
  assert.doesNotMatch(callService, /\bRtcSession\b[\s\S]{0,120}from ['"]@sdkwork\/im-sdk['"]/);
  assert.doesNotMatch(callService, /\bimClient\.rtc\b/);
  assert.doesNotMatch(callService, /\.rtc\.retrieve\s*\(/);
});

test("craw-chat Rust runtime consumes sdkwork-rtc crates from the current workspace", () => {
  const manifests = [
    "crates/im-domain-core/Cargo.toml",
    "crates/im-platform-contracts/Cargo.toml",
    "services/local-minimal-node/Cargo.toml",
  ];
  const matches = findPatternMatches(crawChatRoot, manifests, [
    /sdkwork-rtc-core = \{ path = "\.\.\/\.\.\/\.\.\/sdkwork-rtc\/crates\/sdkwork-rtc-core" \}/,
  ]);
  assert.equal(matches.length, manifests.length);

  const localMinimalNode = readFileSync(
    workspacePath(crawChatRoot, "services/local-minimal-node/Cargo.toml"),
    "utf8",
  );
  assert.match(
    localMinimalNode,
    /sdkwork-rtc-signaling-service = \{ path = "\.\.\/\.\.\/\.\.\/sdkwork-rtc\/services\/sdkwork-rtc-signaling-service" \}/,
  );
  assert.match(
    localMinimalNode,
    /sdkwork-rtc-state-store = \{ path = "\.\.\/\.\.\/\.\.\/sdkwork-rtc\/crates\/sdkwork-rtc-state-store" \}/,
  );
});

test("sdkwork-rtc Rust services do not depend back on craw-chat crates", () => {
  const textFiles = listTextFiles(rtcRoot, "").filter((relativePath) =>
    /^(Cargo\.toml|services\/|crates\/|adapters\/)/.test(relativePath.replaceAll("\\", "/")),
  );
  const matches = findPatternMatches(rtcRoot, textFiles, [
    /craw-chat-api-registry/,
    /craw-chat-openapi/,
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

test("sdkwork-rtc SDK exposes an RTC app transport instead of an IM-shaped sdk.rtc adapter", () => {
  const signalingAdapter = readFileSync(
    workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/signaling-adapter.ts"),
    "utf8",
  );
  const standardCallStack = readFileSync(
    workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/standard-call-stack.ts"),
    "utf8",
  );
  const publicIndex = readFileSync(
    workspacePath(rtcRoot, "sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/index.ts"),
    "utf8",
  );

  assert.match(publicIndex, /export \* from ['"]\.\/app-http-client\.js['"]/);
  assert.match(standardCallStack, /\btransport\?: RtcSignalingTransportLike\b/);
  assert.doesNotMatch(signalingAdapter, /\bsdk\.rtc\./);
  assert.doesNotMatch(signalingAdapter, /\bRtcSignalingClientLike\b/);
  assert.doesNotMatch(standardCallStack, /\bCreateRtcSignalingAdapterOptions\b/);
});

test("sdkwork-rtc HTTP surfaces do not expose RTC through IM API prefixes", () => {
  const rtcTextFiles = listTextFiles(rtcRoot, "").filter((relativePath) =>
    /^(services|crates|sdks|generated)\//.test(relativePath.replaceAll("\\", "/")),
  );
  const rtcMatches = findPatternMatches(rtcRoot, rtcTextFiles, [/\/im\/v3\/api\/rtc/]);
  assert.deepEqual(rtcMatches, []);

  const crawChatGateway = "services/web-gateway/src/lib.rs";
  const crawChatGatewayContent = readFileSync(workspacePath(crawChatRoot, crawChatGateway), "utf8");
  assert.doesNotMatch(crawChatGatewayContent, /\/im\/v3\/api\/rtc/);
  assert.doesNotMatch(
    crawChatGatewayContent,
    /sdkwork-rtc-signaling-service[\s\S]{0,240}SdkTarget::SdkworkImSdk/,
  );
  assert.match(crawChatGatewayContent, /\/app\/v3\/api\/rtc\/\{\*path\}/);
});

test("craw-chat local-minimal-node does not expose RTC through IM API prefixes", () => {
  const localMinimalTextFiles = listTextFiles(crawChatRoot, "services/local-minimal-node").filter(
    (relativePath) => /\.(rs|md|toml|json|yaml|yml)$/.test(relativePath),
  );
  const localMinimalMatches = findPatternMatches(crawChatRoot, localMinimalTextFiles, [
    /\/im\/v3\/api\/rtc/,
  ]);
  assert.deepEqual(localMinimalMatches, []);

  const buildSource = readFileSync(
    workspacePath(crawChatRoot, "services/local-minimal-node/src/node/build.rs"),
    "utf8",
  );
  assert.doesNotMatch(
    buildSource,
    /\.nest\("\/im\/v3\/api",\s*im_standard_api_routes\(\)\)[\s\S]*\.route\("\/rtc\/sessions"/,
  );
  assert.match(buildSource, /\.nest\("\/app\/v3\/api\/rtc",\s*rtc_app_api_routes\(\)\)/);
});

test("craw-chat IM SDK family no longer generates or composes RTC APIs", () => {
  const imSdkTextFiles = listTextFiles(crawChatRoot, "sdks/sdkwork-im-sdk").filter(
    (relativePath) => /\.(cs|dart|go|java|json|kt|kts|md|mjs|py|rs|swift|toml|ts|yaml|yml)$/.test(relativePath),
  );
  const imSdkMatches = findPatternMatches(crawChatRoot, imSdkTextFiles, [
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
    /\brtc_session\b/,
  ]);
  assert.deepEqual(imSdkMatches, []);

  const imFamilyTest = readFileSync(
    workspacePath(crawChatRoot, "sdks/test/verify-im-v3-sdk-family-contract.test.mjs"),
    "utf8",
  );
  assert.doesNotMatch(imFamilyTest, /\/im\/v3\/api\/rtc/);
  assert.doesNotMatch(imFamilyTest, /\/app\/v3\/api\/rtc/);
});

test("craw-chat IM app SDK generated transport no longer owns RTC APIs", () => {
  const imAppGeneratedFiles = listTextFiles(crawChatRoot, "sdks/sdkwork-im-app-sdk").filter((relativePath) =>
    /(?:^|\/)(generated\/server-openapi|composed)\//.test(relativePath.replaceAll("\\", "/"))
    && /\.(cs|dart|go|java|json|kt|kts|md|mjs|py|rs|swift|toml|ts|yaml|yml)$/.test(relativePath),
  );
  const imAppMatches = findPatternMatches(crawChatRoot, imAppGeneratedFiles, [
    /\/app\/v3\/api\/rtc/,
    /(?:^|["'`(])\/rtc\/provider_(?:callbacks|health)\b/,
    /\bRtcApi\b/,
    /\bcreateRtcApi\b/,
    /\btransportClient\.rtc\b/,
    /\brtcApi\b/,
  ]);
  assert.deepEqual(imAppMatches, []);
});

test("craw-chat active scripts and published docs no longer point RTC at IM APIs", () => {
  const activeRtcDocsAndScripts = [
    "bin",
    "docs/sites",
    "docs/部署",
  ].flatMap((relativePath) => listTextFiles(crawChatRoot, relativePath));
  const matches = findPatternMatches(crawChatRoot, activeRtcDocsAndScripts, [
    /\/im\/v3\/api\/rtc/,
    /@sdkwork\/im-sdk[\s\S]{0,120}\bsdk\.rtc\b/,
    /\bsdk\.rtc\b/,
  ]);
  assert.deepEqual(matches, []);
});

test("craw-chat no longer owns the RTC SDK workspace source", () => {
  assert.equal(exists(crawChatRoot, "sdks/sdkwork-rtc-sdk"), false);
});

test("craw-chat no longer owns RTC runtime source packages or local RTC SDK paths", () => {
  const remainingPaths = forbiddenCrawChatPaths.filter((relativePath) => exists(crawChatRoot, relativePath));
  assert.deepEqual(remainingPaths, []);

  const textFiles = listTextFiles(crawChatRoot, "");
  const matches = findPatternMatches(crawChatRoot, textFiles, forbiddenCrawChatPatterns);
  assert.deepEqual(matches, []);
});

test("sdkwork-core does not aggregate RTC SDK sources", () => {
  const textFiles = listTextFiles(sdkworkCoreRoot, "");
  const matches = findPatternMatches(sdkworkCoreRoot, textFiles, forbiddenSdkworkCorePatterns);
  assert.deepEqual(matches, []);
});
