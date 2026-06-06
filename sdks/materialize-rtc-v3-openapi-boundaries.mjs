#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rtcRoot = resolve(__dirname, "..");

const routeSources = [
  {
    packageName: "sdkwork-routes-rtc-app-api",
    surface: "app-api",
    owner: "sdkwork-rtc",
    domain: "rtc",
    capability: "rtc",
    sdkOwner: "sdkwork-rtc",
    familyName: "sdkwork-rtc-app-sdk",
    authorityName: "sdkwork-rtc-app-api",
    title: "SDKWork RTC App API",
    description:
      "App/client contract for SDKWork RTC session lifecycle, signaling, credential issue, callback mapping, recording artifacts, and provider health flows.",
    prefix: "/app/v3/api",
    apiContext: "AppRequestContext",
    sdkType: "app",
    authMode: "dual-token",
    path: resolve(rtcRoot, "services/sdkwork-routes-rtc-app-api/src/lib.rs"),
    arrayName: "RTC_APP_ROUTES",
    routeType: "RtcAppRoute",
    manifestPath:
      "sdks/_route-manifests/app-api/sdkwork-routes-rtc-app-api.route-manifest.json",
  },
  {
    packageName: "sdkwork-routes-rtc-backend-api",
    surface: "backend-api",
    owner: "sdkwork-rtc",
    domain: "rtc",
    capability: "rtc",
    sdkOwner: "sdkwork-rtc",
    familyName: "sdkwork-rtc-backend-sdk",
    authorityName: "sdkwork-rtc-backend-api",
    title: "SDKWork RTC Backend API",
    description:
      "Backend/admin contract for SDKWork RTC provider profiles, provider routes, sessions, signaling audits, and quality samples.",
    prefix: "/backend/v3/api",
    apiContext: "BackendRequestContext",
    sdkType: "backend",
    authMode: "dual-token",
    path: resolve(rtcRoot, "services/sdkwork-routes-rtc-backend-api/src/lib.rs"),
    arrayName: "RTC_BACKEND_ROUTES",
    routeType: "RtcBackendRoute",
    manifestPath:
      "sdks/_route-manifests/backend-api/sdkwork-routes-rtc-backend-api.route-manifest.json",
  },
];

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

async function main() {
  for (const source of routeSources) {
    const routes = await collectRoutes(source);
    if (routes.length === 0) {
      throw new Error(`No RTC routes were materialized from ${source.packageName}.`);
    }
    validateRoutes(source, routes);
    const routeManifest = buildRouteManifest(source, routes);
    const openapi = buildOpenApi(source, routes);
    await writeRouteManifest(source, routeManifest);
    await writeSurfaceOpenApi(source, openapi);
    console.log(`Materialized ${routes.length} ${source.surface} RTC operations.`);
  }
}

async function collectRoutes(source) {
  const content = await readFile(source.path, "utf8");
  const arrayPattern = new RegExp(
    `pub\\s+const\\s+${escapeRegExp(source.arrayName)}\\s*:\\s*&\\[${escapeRegExp(source.routeType)}\\]\\s*=\\s*&\\[(?<body>[\\s\\S]*?)\\];`,
    "m",
  );
  const arrayMatch = content.match(arrayPattern);
  if (!arrayMatch?.groups?.body) {
    throw new Error(`Unable to find ${source.arrayName} in ${relativeForDisplay(source.path)}.`);
  }

  const routePattern = new RegExp(
    `${escapeRegExp(source.routeType)}\\s*\\{\\s*method:\\s*"(?<method>[^"]+)",\\s*path:\\s*"(?<path>[^"]+)",\\s*tag:\\s*"(?<tag>[^"]+)",\\s*operation_id:\\s*"(?<operationId>[^"]+)",\\s*owner:\\s*RTC_OWNER,\\s*permission:\\s*"(?<permission>[^"]+)",\\s*\\}`,
    "g",
  );
  const routes = [];
  for (const match of arrayMatch.groups.body.matchAll(routePattern)) {
    routes.push({
      method: match.groups.method.toUpperCase(),
      path: match.groups.path,
      tag: match.groups.tag,
      operationId: match.groups.operationId,
      permission: match.groups.permission,
      owner: source.owner,
      sourcePackageName: source.packageName,
      sourceFile: relativeForDisplay(source.path),
    });
  }

  const byKey = new Map();
  for (const route of routes) {
    const key = `${route.method} ${route.path}`;
    const previous = byKey.get(key);
    if (previous && previous.operationId !== route.operationId) {
      throw new Error(
        `Conflicting RTC route metadata for ${key}: ${previous.operationId} vs ${route.operationId}`,
      );
    }
    byKey.set(key, route);
  }

  return Array.from(byKey.values()).sort(compareRoutes);
}

function validateRoutes(source, routes) {
  for (const route of routes) {
    const method = route.method.toLowerCase();
    if (!HTTP_METHODS.has(method)) {
      throw new Error(`${route.operationId} uses unsupported method ${route.method}.`);
    }
    if (!route.path.startsWith(`${source.prefix}/rtc`)) {
      throw new Error(`${route.operationId} must start with ${source.prefix}/rtc.`);
    }
    if (!route.operationId.startsWith("rtc.")) {
      throw new Error(`${route.operationId} must use rtc.* operationId namespace.`);
    }
    if (!route.permission.startsWith("rtc.")) {
      throw new Error(`${route.operationId} must declare an rtc.* permission.`);
    }
  }
}

function buildRouteManifest(source, routes) {
  return {
    schemaVersion: 1,
    kind: "sdkwork.route.manifest",
    packageName: source.packageName,
    surface: source.surface,
    owner: source.owner,
    domain: source.domain,
    capability: source.capability,
    apiAuthority: source.authorityName,
    sdkFamily: source.familyName,
    prefix: source.prefix,
    source: {
      crateRoot: relativeForDisplay(dirname(source.path)),
      crateImport: source.packageName.replaceAll("-", "_"),
    },
    routes: routes.map((route) => ({
      method: route.method,
      path: route.path,
      operationId: route.operationId,
      tags: [route.tag],
      auth: {
        mode: "dual-token",
        required: true,
        permission: route.permission,
        tenantScope: "tenant",
        dataScope: "organization",
      },
      handler: {
        module: "crate::handlers",
        name: toHandlerName(route.operationId),
      },
      schemas: {
        request: usesJsonBody(route.method.toLowerCase()) ? "RtcOperationCommand" : null,
        response: "RtcApiResult",
        problem: "ProblemDetail",
      },
      ownership: {
        owner: source.owner,
        apiAuthority: source.authorityName,
      },
      source: {
        packageName: source.packageName,
        file: route.sourceFile,
      },
    })),
  };
}

async function writeRouteManifest(source, routeManifest) {
  const manifestPath = resolve(rtcRoot, source.manifestPath);
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(routeManifest, null, 2)}\n`, "utf8");
}

async function writeSurfaceOpenApi(source, openapi) {
  const familyRoot = resolve(rtcRoot, "sdks", source.familyName);
  const openapiRoot = resolve(familyRoot, "openapi");
  await mkdir(openapiRoot, { recursive: true });
  const content = `${JSON.stringify(openapi, null, 2)}\n`;
  await writeFile(resolve(openapiRoot, `${source.authorityName}.openapi.json`), content, "utf8");
  await writeFile(resolve(openapiRoot, `${source.authorityName}.sdkgen.json`), content, "utf8");
  await writeFile(
    resolve(rtcRoot, "generated/openapi", `${source.domain}-${source.sdkType}-api.openapi.json`),
    content,
    "utf8",
  );
}

function buildOpenApi(source, routes) {
  const paths = {};
  for (const route of routes) {
    const pathItem = paths[route.path] ?? {};
    pathItem[route.method.toLowerCase()] = buildOperation(source, route);
    paths[route.path] = pathItem;
  }

  const tags = Array.from(new Set(routes.map((route) => route.tag)))
    .sort()
    .map((name) => ({
      name,
      description: `${toTitle(name)} API resources.`,
      "x-sdk-nested-resource-surface": true,
    }));

  return {
    openapi: "3.1.2",
    info: {
      title: source.title,
      version: "1.0.0",
      description: source.description,
      "x-sdkwork-api-authority": source.authorityName,
      "x-sdkwork-sdk-family": source.familyName,
      "x-sdkwork-owner": source.owner,
      "x-sdkwork-domain": source.domain,
    },
    servers: [
      {
        url: "http://127.0.0.1:18080",
        description: "Local sdkwork-rtc runtime",
      },
    ],
    tags,
    security: securityRequirement(source),
    paths,
    components: {
      securitySchemes: securitySchemes(source),
      schemas: buildSchemas(),
    },
    "x-sdkwork-materialized-from": [
      {
        owner: source.owner,
        path: relativeForDisplay(source.path),
        packageName: source.packageName,
      },
    ],
    "x-sdkwork-route-manifest": source.manifestPath,
    "x-sdkwork-request-context": {
      contextObject: source.apiContext,
      serverRequestId: "server-owned",
      clientRequestIdHeader: "forbidden",
      tenantSource: "AuthToken + AccessToken",
      organizationSource: "AuthToken + AccessToken",
      userSource: "AuthToken + AccessToken",
    },
  };
}

function buildOperation(source, route) {
  const method = route.method.toLowerCase();
  const operation = {
    tags: [route.tag],
    summary: `${toTitle(route.operationId)}.`,
    operationId: route.operationId,
    parameters: extractPathParameters(route.path),
    responses: {
      200: jsonResponse("Success", "#/components/schemas/RtcApiResult"),
      400: problemResponse("Bad request"),
      401: problemResponse("Unauthorized"),
      403: problemResponse("Forbidden"),
      404: problemResponse("Not found"),
      409: problemResponse("Conflict"),
      500: problemResponse("Internal server error"),
    },
    security: securityRequirement(source),
    "x-sdkwork-owner": source.sdkOwner,
    "x-sdkwork-api-authority": source.authorityName,
    "x-sdkwork-source-route-crate": source.packageName,
    "x-sdkwork-domain": source.domain,
    "x-sdkwork-resource": route.operationId.split(".").slice(0, -1).join("."),
    "x-sdkwork-request-context": source.apiContext,
    "x-sdkwork-server-request-id": true,
    "x-sdkwork-permission": route.permission,
  };

  if (usesJsonBody(method)) {
    operation.requestBody = {
      required: method !== "patch",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RtcOperationCommand" },
        },
      },
    };
  }

  if (isListOperation(route)) {
    operation.parameters.push(
      queryParameter("page", { type: "integer", minimum: 1, default: 1 }),
      queryParameter("page_size", { type: "integer", minimum: 1, maximum: 200, default: 20 }),
      queryParameter("cursor", { type: "string" }),
      queryParameter("sort", { type: "string" }),
      queryParameter("q", { type: "string" }),
    );
  }

  return operation;
}

function securityRequirement() {
  return [{ AuthToken: [], AccessToken: [] }];
}

function securitySchemes() {
  return {
    AuthToken: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "SDKWork auth token carried as Authorization: Bearer <auth_token>.",
    },
    AccessToken: {
      type: "apiKey",
      in: "header",
      name: "Access-Token",
      description: "SDKWork access isolation token.",
    },
  };
}

function buildSchemas() {
  return {
    RtcApiResult: {
      type: "object",
      additionalProperties: false,
      required: ["code", "message", "requestId", "data"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        requestId: {
          type: "string",
          format: "uuid",
          description: "Server-owned request correlation id.",
        },
        data: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    RtcOperationCommand: {
      type: "object",
      additionalProperties: true,
      description:
        "Operation-specific RTC command payload defined by the owning sdkwork-rtc Rust route/service module.",
    },
    RtcRoom: {
      type: "object",
      additionalProperties: false,
      required: ["id", "tenantId", "organizationId", "ownerUserId", "title", "status"],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        ownerUserId: { type: "string" },
        title: { type: "string" },
        status: { type: "string", enum: ["active", "archived", "disabled"] },
      },
    },
    RtcCallSession: {
      type: "object",
      additionalProperties: false,
      required: ["id", "roomId", "callType", "status", "participants"],
      properties: {
        id: { type: "string" },
        roomId: { type: "string" },
        callType: { type: "string", enum: ["audio", "video"] },
        status: {
          type: "string",
          enum: ["ringing", "connecting", "connected", "ended", "failed", "terminated"],
        },
        providerProfileId: { type: "string" },
        startedAt: { type: "string", format: "date-time" },
        endedAt: { type: "string", format: "date-time" },
        participants: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcCallParticipant" },
        },
      },
    },
    RtcCallParticipant: {
      type: "object",
      additionalProperties: false,
      required: ["id", "sessionId", "userId", "displayName", "role", "state"],
      properties: {
        id: { type: "string" },
        sessionId: { type: "string" },
        userId: { type: "string" },
        displayName: { type: "string" },
        role: { type: "string", enum: ["host", "guest", "listener"] },
        state: { type: "string", enum: ["invited", "joined", "left", "kicked", "timeout"] },
        audioMuted: { type: "boolean" },
        videoMuted: { type: "boolean" },
      },
    },
    ProblemDetail: {
      type: "object",
      additionalProperties: true,
      required: ["type", "title", "status"],
      properties: {
        type: { type: "string", format: "uri-reference" },
        title: { type: "string" },
        status: { type: "integer", minimum: 100, maximum: 599 },
        detail: { type: "string" },
        instance: { type: "string" },
        code: { type: "string" },
        traceId: { type: "string" },
        requestId: {
          type: "string",
          format: "uuid",
          description: "Server-owned request correlation id.",
        },
        errors: {
          type: "array",
          items: { $ref: "#/components/schemas/FieldError" },
        },
      },
    },
    FieldError: {
      type: "object",
      additionalProperties: false,
      required: ["field", "message"],
      properties: {
        field: { type: "string" },
        message: { type: "string" },
        code: { type: "string" },
      },
    },
  };
}

function jsonResponse(description, schemaRef) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: schemaRef },
      },
    },
  };
}

function problemResponse(description) {
  return {
    description,
    content: {
      "application/problem+json": {
        schema: { $ref: "#/components/schemas/ProblemDetail" },
      },
    },
  };
}

function extractPathParameters(path) {
  const parameters = [];
  for (const match of path.matchAll(/\{([^}]+)\}/g)) {
    parameters.push({
      name: match[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    });
  }
  return parameters;
}

function queryParameter(name, schema) {
  return {
    name,
    in: "query",
    required: false,
    schema,
  };
}

function usesJsonBody(method) {
  return method === "post" || method === "put" || method === "patch";
}

function isListOperation(route) {
  return route.method.toLowerCase() === "get" && route.operationId.endsWith(".list");
}

function compareRoutes(left, right) {
  return left.path.localeCompare(right.path) || left.method.localeCompare(right.method);
}

function toHandlerName(operationId) {
  return operationId.replace(/^rtc\./, "").replaceAll(".", "_");
}

function toTitle(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function relativeForDisplay(filePath) {
  return relative(rtcRoot, filePath).replace(/\\/g, "/");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

await main();
