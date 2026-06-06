#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const OFFICIAL_LANGUAGE_ORDER = ["typescript", "rust", "java", "python", "go"];
const DEFAULT_LANGUAGE = "typescript";
const STANDARD_PROFILE = "sdkwork-v3";
const GENERATOR_BIN =
  "D:\\javasource\\spring-ai-plus\\sdk\\sdkwork-sdk-generator\\bin\\sdkgen.js";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const families = [
  {
    familyName: "sdkwork-rtc-app-sdk",
    authorityName: "sdkwork-rtc-app-api",
    sdkType: "app",
    apiPrefix: "/app/v3/api",
    sourceRouteCrate: "sdkwork-routes-rtc-app-api",
    routeManifest:
      "sdks/_route-manifests/app-api/sdkwork-routes-rtc-app-api.route-manifest.json",
    sourceOpenapi: "generated/openapi/rtc-app-api.openapi.json",
    defaultBaseUrl: "http://127.0.0.1:18080",
    sdkDependencies: [
      {
        workspace: "sdkwork-rtc-sdk",
        role: "provider-runtime-sdk",
        required: true,
        dependencyMode: "consumer-sdk",
        apiPrefix: null,
        generatedTransportImportPolicy: "forbidden",
        packageByLanguage: {
          typescript: "@sdkwork/rtc-sdk",
          rust: "sdkwork-rtc-sdk",
          java: "com.sdkwork:sdkwork-rtc-sdk",
          python: "sdkwork-rtc-sdk",
          go: "github.com/sdkwork/sdkwork-rtc-sdk",
        },
      },
    ],
  },
  {
    familyName: "sdkwork-rtc-backend-sdk",
    authorityName: "sdkwork-rtc-backend-api",
    sdkType: "backend",
    apiPrefix: "/backend/v3/api",
    sourceRouteCrate: "sdkwork-routes-rtc-backend-api",
    routeManifest:
      "sdks/_route-manifests/backend-api/sdkwork-routes-rtc-backend-api.route-manifest.json",
    sourceOpenapi: "generated/openapi/rtc-backend-api.openapi.json",
    defaultBaseUrl: "http://127.0.0.1:18080",
    sdkDependencies: [
      {
        workspace: "sdkwork-rtc-sdk",
        role: "provider-runtime-sdk",
        required: true,
        dependencyMode: "consumer-sdk",
        apiPrefix: null,
        generatedTransportImportPolicy: "forbidden",
        packageByLanguage: {
          typescript: "@sdkwork/rtc-sdk",
          rust: "sdkwork-rtc-sdk",
          java: "com.sdkwork:sdkwork-rtc-sdk",
          python: "sdkwork-rtc-sdk",
          go: "github.com/sdkwork/sdkwork-rtc-sdk",
        },
      },
    ],
  },
];

function fail(message) {
  process.stderr.write(`[rtc_sdk_generate] ${message}\n`);
  process.exit(1);
}

function resolveRoot(relativeOrAbsolute) {
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.resolve(workspaceRoot, relativeOrAbsolute);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function collectOperations(openapi) {
  const operations = [];
  for (const [pathKey, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(method)) {
        continue;
      }
      operations.push({
        method: method.toUpperCase(),
        path: pathKey,
        operationId: operation.operationId,
        owner: operation["x-sdkwork-owner"],
        authority: operation["x-sdkwork-api-authority"],
        sourceRouteCrate: operation["x-sdkwork-source-route-crate"],
        permission: operation["x-sdkwork-permission"],
      });
    }
  }
  return operations.sort((left, right) =>
    `${left.path} ${left.method}`.localeCompare(`${right.path} ${right.method}`),
  );
}

function operationKey(operation) {
  return `${operation.method} ${operation.path} ${operation.operationId}`;
}

function validateRouteManifest(family, openapiOperations) {
  const manifestPath = resolveRoot(family.routeManifest);
  if (!existsSync(manifestPath)) {
    throw new Error(`missing route manifest: ${family.routeManifest}`);
  }
  const manifest = readJson(manifestPath);
  if (manifest.schemaVersion !== 1) {
    throw new Error(`${family.routeManifest} must use schemaVersion 1`);
  }
  if (manifest.kind !== "sdkwork.route.manifest") {
    throw new Error(`${family.routeManifest} must be a sdkwork.route.manifest`);
  }
  if (manifest.packageName !== family.sourceRouteCrate) {
    throw new Error(`${family.routeManifest} packageName mismatch`);
  }
  if (manifest.owner !== "sdkwork-rtc") {
    throw new Error(`${family.routeManifest} owner mismatch`);
  }
  if (manifest.domain !== "rtc" || manifest.capability !== "rtc") {
    throw new Error(`${family.routeManifest} domain/capability mismatch`);
  }
  if (manifest.apiAuthority !== family.authorityName) {
    throw new Error(`${family.routeManifest} authority mismatch`);
  }
  if (manifest.sdkFamily !== family.familyName) {
    throw new Error(`${family.routeManifest} SDK family mismatch`);
  }
  if (manifest.prefix !== family.apiPrefix) {
    throw new Error(`${family.routeManifest} prefix mismatch`);
  }
  if (!Array.isArray(manifest.routes) || manifest.routes.length === 0) {
    throw new Error(`${family.routeManifest} must declare routes`);
  }

  const manifestKeys = manifest.routes
    .map((route) => {
      if (!route.path?.startsWith(family.apiPrefix)) {
        throw new Error(`${route.operationId} manifest path must start with ${family.apiPrefix}`);
      }
      if (route.ownership?.owner !== "sdkwork-rtc") {
        throw new Error(`${route.operationId} manifest owner mismatch`);
      }
      if (route.ownership?.apiAuthority !== family.authorityName) {
        throw new Error(`${route.operationId} manifest authority mismatch`);
      }
      if (route.source?.packageName !== family.sourceRouteCrate) {
        throw new Error(`${route.operationId} manifest source package mismatch`);
      }
      if (route.auth?.mode !== "dual-token") {
        throw new Error(`${route.operationId} manifest auth mode must be dual-token`);
      }
      if (!route.auth?.permission?.startsWith("rtc.")) {
        throw new Error(`${route.operationId} manifest must declare rtc permission`);
      }
      if (route.schemas?.problem !== "ProblemDetail") {
        throw new Error(`${route.operationId} manifest must declare ProblemDetail`);
      }
      return `${route.method} ${route.path} ${route.operationId}`;
    })
    .sort();

  const openapiKeys = openapiOperations.map(operationKey).sort();
  if (JSON.stringify(manifestKeys) !== JSON.stringify(openapiKeys)) {
    throw new Error(`${family.routeManifest} routes do not match authority OpenAPI operations`);
  }
}

function validateOpenapi(family, openapi) {
  if (openapi.openapi !== "3.1.2") {
    throw new Error(`${family.authorityName} must use OpenAPI 3.1.2`);
  }
  if (openapi.info?.["x-sdkwork-api-authority"] !== family.authorityName) {
    throw new Error(`${family.authorityName} authority metadata mismatch`);
  }
  const operations = collectOperations(openapi);
  if (operations.length === 0) {
    throw new Error(`${family.authorityName} must declare operations`);
  }
  for (const operation of operations) {
    if (!operation.path.startsWith(family.apiPrefix)) {
      throw new Error(`${operation.path} must start with ${family.apiPrefix}`);
    }
    if (operation.owner !== "sdkwork-rtc") {
      throw new Error(`${operation.operationId} must be owned by sdkwork-rtc`);
    }
    if (operation.authority !== family.authorityName) {
      throw new Error(`${operation.operationId} authority mismatch`);
    }
    if (operation.sourceRouteCrate !== family.sourceRouteCrate) {
      throw new Error(`${operation.operationId} source route crate mismatch`);
    }
    if (!operation.permission?.startsWith("rtc.")) {
      throw new Error(`${operation.operationId} permission mismatch`);
    }
  }
  if (!openapi.components?.schemas?.RtcRoom) {
    throw new Error(`${family.authorityName} must expose RtcRoom`);
  }
  if (!openapi.components?.schemas?.RtcCallSession) {
    throw new Error(`${family.authorityName} must expose RtcCallSession`);
  }
  validateRouteManifest(family, operations);
  return operations;
}

function languageEntries(family) {
  return OFFICIAL_LANGUAGE_ORDER.map((language) => ({
    language,
    workspace: `${family.familyName}-${language}`,
    generationState: "declared",
    releaseState: "not_published",
    generatedPath: `${family.familyName}-${language}/generated/server-openapi`,
    name:
      language === "typescript"
        ? `@sdkwork/${family.familyName}`
        : language === "java"
          ? `com.sdkwork:${family.familyName}`
          : language === "go"
            ? `github.com/sdkwork/${family.familyName}`
            : family.familyName,
    version: "0.1.0",
  }));
}

function componentSpec(family, operations) {
  return {
    schemaVersion: 1,
    kind: "sdkwork.component.spec",
    component: {
      name: family.familyName,
      displayName:
        family.sdkType === "app" ? "SDKWork RTC App SDK" : "SDKWork RTC Backend SDK",
      version: "0.1.0",
      type: "sdk-family",
      root: `sdkwork-rtc/sdks/${family.familyName}`,
      domain: "rtc",
      declaredDomain: "rtc",
      capability: `${family.sdkType}-sdk`,
      status: "standardizing",
      languages: OFFICIAL_LANGUAGE_ORDER,
      generated: true,
      private: true,
      manifests: [".sdkwork-assembly.json"],
    },
    contracts: {
      publicExports: [],
      runtimeEntrypoints: ["bin/generate-sdk.mjs"],
      sdkClients: [],
      sdkDependencies: family.sdkDependencies,
      events: [],
      configKeys: [],
      ownedOperations: operations.map((operation) => operation.operationId),
    },
    verification: {
      commands: [`node tools/rtc_sdk_generate.mjs --check --family ${family.familyName}`],
    },
  };
}

function syncFamily(family) {
  const sourceOpenapiPath = resolveRoot(family.sourceOpenapi);
  if (!existsSync(sourceOpenapiPath)) {
    throw new Error(`missing source OpenAPI: ${sourceOpenapiPath}`);
  }
  const openapi = readJson(sourceOpenapiPath);
  const operations = validateOpenapi(family, openapi);
  const familyRoot = path.join(workspaceRoot, "sdks", family.familyName);
  const authorityPath = path.join(familyRoot, "openapi", `${family.authorityName}.openapi.json`);
  const sdkgenPath = path.join(familyRoot, "openapi", `${family.authorityName}.sdkgen.json`);

  writeJson(authorityPath, openapi);
  writeJson(sdkgenPath, openapi);
  writeJson(path.join(familyRoot, ".sdkwork-assembly.json"), {
    schemaVersion: 1,
    workspace: family.familyName,
    sdkOwner: "sdkwork-rtc",
    apiAuthority: family.authorityName,
    authoritySpec: `openapi/${family.authorityName}.openapi.json`,
    generationInputSpec: `openapi/${family.authorityName}.sdkgen.json`,
    derivedSpecs: {
      default: `openapi/${family.authorityName}.sdkgen.json`,
    },
    discoverySurface: {
      sdkTarget: family.sdkType,
      apiPrefix: family.apiPrefix,
      generatedProtocols: ["http-openapi"],
      manualTransports: [],
    },
    languages: languageEntries(family),
    sdkDependencies: family.sdkDependencies,
  });
  writeJson(path.join(familyRoot, "sdk-manifest.json"), {
    schemaVersion: 1,
    sdkName: family.familyName,
    sdkOwner: "sdkwork-rtc",
    apiAuthority: family.authorityName,
    sdkFamily: family.familyName,
    sdkType: family.sdkType,
    apiPrefix: family.apiPrefix,
    generationInputSpec: `openapi/${family.authorityName}.sdkgen.json`,
    sdkDependencies: family.sdkDependencies,
    generatorName: "@sdkwork/sdk-generator",
    generatorEntryPoint: GENERATOR_BIN,
    standardProfile: STANDARD_PROFILE,
    ownerOnlyOperationCount: operations.length,
  });
  writeJson(path.join(familyRoot, "specs", "component.spec.json"), componentSpec(family, operations));

  return { familyRoot, sdkgenPath, operations };
}

function parseArgs(argv) {
  const parsed = {
    check: false,
    allLanguages: false,
    languages: [],
    family: null,
    baseUrl: null,
    passthrough: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") {
      parsed.check = true;
      continue;
    }
    if (arg === "--all-languages") {
      parsed.allLanguages = true;
      continue;
    }
    if (arg === "--language") {
      parsed.languages.push(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg.startsWith("--language=")) {
      parsed.languages.push(arg.slice("--language=".length));
      continue;
    }
    if (arg === "--family") {
      parsed.family = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--base-url") {
      parsed.baseUrl = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--") {
      parsed.passthrough.push(...argv.slice(index + 1));
      break;
    }
    parsed.passthrough.push(arg);
  }
  return parsed;
}

function selectedLanguages(args) {
  if (args.allLanguages) {
    return OFFICIAL_LANGUAGE_ORDER;
  }
  const requested = args.languages.length > 0 ? args.languages : [DEFAULT_LANGUAGE];
  const normalized = requested
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  for (const language of normalized) {
    if (!OFFICIAL_LANGUAGE_ORDER.includes(language)) {
      throw new Error(`unsupported language: ${language}`);
    }
  }
  return OFFICIAL_LANGUAGE_ORDER.filter((language) => normalized.includes(language));
}

function runSdkgen(family, synced, args) {
  if (!existsSync(GENERATOR_BIN)) {
    throw new Error(`standard SDK generator not found: ${GENERATOR_BIN}`);
  }
  const languages = selectedLanguages(args);
  for (const language of languages) {
    const outputPath = path.join(
      synced.familyRoot,
      `${family.familyName}-${language}`,
      "generated",
      "server-openapi",
    );
    const result = spawnSync(
      "node",
      [
        GENERATOR_BIN,
        "generate",
        "--input",
        synced.sdkgenPath,
        "--output",
        outputPath,
        "--name",
        family.familyName,
        "--type",
        family.sdkType,
        "--language",
        language,
        "--base-url",
        args.baseUrl || family.defaultBaseUrl,
        "--api-prefix",
        family.apiPrefix,
        "--fixed-sdk-version",
        "0.1.0",
        "--sdk-root",
        synced.familyRoot,
        "--sdk-name",
        family.familyName,
        "--package-name",
        `${family.familyName}-generated-${language}`,
        "--standard-profile",
        STANDARD_PROFILE,
        ...args.passthrough,
      ],
      {
        cwd: synced.familyRoot,
        stdio: "inherit",
      },
    );
    if (result.error) {
      throw new Error(`failed to start sdkgen: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(`sdkgen failed for ${family.familyName} ${language}`);
    }
  }
}

export async function runRtcSdkGenerator(family, argv) {
  const args = parseArgs(argv);
  const synced = syncFamily(family);
  if (!args.check) {
    runSdkgen(family, synced, args);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = args.family
    ? families.filter((family) => family.familyName === args.family)
    : families;
  if (targets.length === 0) {
    fail(`unknown family: ${args.family}`);
  }
  try {
    for (const family of targets) {
      const synced = syncFamily(family);
      if (!args.check) {
        runSdkgen(family, synced, args);
      }
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
  process.stdout.write(
    `[rtc_sdk_generate] ${args.check ? "check passed" : "generation completed"}\n`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
