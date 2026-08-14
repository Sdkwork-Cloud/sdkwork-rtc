#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  sdkWorkEnvelopeComponentSchemas,
  typedSdkWorkResourceResponse,
} from "../../sdkwork-specs/tools/lib/openapi-envelope-schemas.mjs";

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
      "App/client contract for RTC rooms, media sessions, participant credentials, and recording artifacts.",
    prefix: "/app/v3/api",
    apiContext: "AppRequestContext",
    sdkType: "app",
    authMode: "dual-token",
    path: resolve(rtcRoot, "crates/sdkwork-routes-rtc-app-api/src/paths.rs"),
    arrayName: "RTC_APP_ROUTES",
    routeType: "RtcAppRoute",
    manifestPath:
      "sdks/_route-manifests/app-api/sdkwork-routes-rtc-app-api.route-manifest.json",
    sourceOpenapiPath: "apis/app-api/communication/sdkwork-rtc-app-api.openapi.json",
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
      "Backend/admin contract for SDKWork RTC rooms, provider profiles, provider routes, media sessions, media artifacts, provider webhooks, active provider query jobs, and quality samples.",
    prefix: "/backend/v3/api",
    apiContext: "BackendRequestContext",
    sdkType: "backend",
    authMode: "dual-token",
    path: resolve(rtcRoot, "crates/sdkwork-routes-rtc-backend-api/src/paths.rs"),
    arrayName: "RTC_BACKEND_ROUTES",
    routeType: "RtcBackendRoute",
    manifestPath:
      "sdks/_route-manifests/backend-api/sdkwork-routes-rtc-backend-api.route-manifest.json",
    sourceOpenapiPath: "apis/backend-api/communication/sdkwork-rtc-backend-api.openapi.json",
  },
];

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const PROVIDER_WEBHOOK_RECEIVE_OPERATION_ID = "rtc.providerWebhooks.events.receive";
const BOUNDED_CATALOG_LIST_OPERATIONS = new Set([
  "rtc.providerPlugins.list",
  "rtc.providerSchemas.list",
]);
const PROVIDER_WEBHOOK_SIGNATURE_HEADERS = [
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
];

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
  const stringConstants = collectStringConstants(content);
  const arrayPattern = new RegExp(
    `pub\\s+const\\s+${escapeRegExp(source.arrayName)}\\s*:\\s*&\\[${escapeRegExp(source.routeType)}\\]\\s*=\\s*&\\[(?<body>[\\s\\S]*?)\\];`,
    "m",
  );
  const arrayMatch = content.match(arrayPattern);
  if (!arrayMatch?.groups?.body) {
    throw new Error(`Unable to find ${source.arrayName} in ${relativeForDisplay(source.path)}.`);
  }

  const routePattern = new RegExp(
    `${escapeRegExp(source.routeType)}\\s*\\{\\s*method:\\s*"(?<method>[^"]+)",\\s*path:\\s*(?<pathToken>"[^"]+"|[A-Z][A-Z0-9_]*),\\s*tag:\\s*"(?<tag>[^"]+)",\\s*operation_id:\\s*"(?<operationId>[^"]+)",\\s*owner:\\s*RTC_OWNER,\\s*permission:\\s*"(?<permission>[^"]+)",\\s*\\}`,
    "g",
  );
  const routes = [];
  for (const match of arrayMatch.groups.body.matchAll(routePattern)) {
    const path = resolveRustStringValue(match.groups.pathToken, stringConstants);
    routes.push({
      method: match.groups.method.toUpperCase(),
      path,
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

function collectStringConstants(content) {
  const constants = new Map();
  const pattern = /pub\s+const\s+(?<name>[A-Z][A-Z0-9_]*)\s*:\s*&str\s*=\s*"(?<value>[^"]*)";/g;
  for (const match of content.matchAll(pattern)) {
    constants.set(match.groups.name, match.groups.value);
  }
  return constants;
}

function resolveRustStringValue(token, constants) {
  if (token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1);
  }
  const value = constants.get(token);
  if (!value) {
    throw new Error(`Unable to resolve Rust string constant ${token}.`);
  }
  return value;
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
      requestContext: "WebRequestContext",
      apiSurface: source.surface,
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
        request: operationRequestSchemaName(route),
        response: operationResponseSchemaName(route),
        problem: "ProblemDetail",
      },
      ...routeAuthManifest(route),
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
  const sourceOpenapiPath = resolve(rtcRoot, source.sourceOpenapiPath);
  await mkdir(dirname(sourceOpenapiPath), { recursive: true });
  await writeFile(sourceOpenapiPath, content, "utf8");
  await writeFile(resolve(openapiRoot, `${source.authorityName}.openapi.json`), content, "utf8");
  await writeFile(resolve(openapiRoot, `${source.authorityName}.sdkgen.json`), content, "utf8");
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

  return pruneUnusedSchemas({
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
        url: "http://127.0.0.1:18088",
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
  });
}

function pruneUnusedSchemas(openapi) {
  const allSchemas = openapi.components?.schemas ?? {};
  const usedSchemas = new Set();

  const visit = (value) => {
    if (!value || typeof value !== "object") {
      return;
    }
    if (typeof value.$ref === "string") {
      const schemaName = schemaNameFromRef(value.$ref);
      if (schemaName && allSchemas[schemaName] && !usedSchemas.has(schemaName)) {
        usedSchemas.add(schemaName);
        visit(allSchemas[schemaName]);
      }
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }
    for (const child of Object.values(value)) {
      visit(child);
    }
  };

  visit(openapi.paths);

  const prunedSchemas = {};
  for (const [schemaName, schema] of Object.entries(allSchemas)) {
    if (usedSchemas.has(schemaName)) {
      prunedSchemas[schemaName] = schema;
    }
  }
  openapi.components.schemas = prunedSchemas;
  return openapi;
}

function schemaNameFromRef(ref) {
  const prefix = "#/components/schemas/";
  return ref.startsWith(prefix) ? ref.slice(prefix.length) : null;
}

function buildOperation(source, route) {
  const method = route.method.toLowerCase();
  const operationAuth = operationAuthMetadata(source, route);
  const operation = {
    tags: [route.tag],
    summary: `${toTitle(route.operationId)}.`,
    operationId: route.operationId,
    parameters: extractPathParameters(route.path),
    responses: {
      200: jsonResponse("Success", operationSuccessResponseSchema(route)),
      400: problemResponse("Bad request"),
      401: problemResponse("Unauthorized"),
      403: problemResponse("Forbidden"),
      404: problemResponse("Not found"),
      409: problemResponse("Conflict"),
      500: problemResponse("Internal server error"),
    },
    security: operationAuth.security,
    "x-sdkwork-owner": source.sdkOwner,
    "x-sdkwork-api-authority": source.authorityName,
    "x-sdkwork-source-route-crate": source.packageName,
    "x-sdkwork-domain": source.domain,
    "x-sdkwork-resource": route.operationId.split(".").slice(0, -1).join("."),
    "x-sdkwork-request-context": "WebRequestContext",
    "x-sdkwork-api-surface": source.surface,
    "x-sdkwork-server-request-id": true,
    "x-sdkwork-permission": route.permission,
    "x-sdkwork-auth-mode": operationAuth.authMode,
  };

  if (operationAuth.providerWebhookSignature) {
    operation["x-sdkwork-provider-webhook-signature"] = true;
    operation["x-sdkwork-provider-webhook-signature-headers"] =
      PROVIDER_WEBHOOK_SIGNATURE_HEADERS;
    operation["x-sdkwork-request-context"] = "ProviderWebhookRequestContext";
    operation["x-sdkwork-forbid-credential-headers"] = true;
  }

  if (operationAuth.rateLimitTier) {
    operation["x-sdkwork-rate-limit-tier"] = operationAuth.rateLimitTier;
  }

  if (operationAuth.idempotent) {
    operation["x-sdkwork-idempotent"] = true;
    operation.parameters.push(idempotencyParam());
  }

  if (usesJsonBody(method)) {
    operation.requestBody = {
      required: method !== "patch",
      content: {
        "application/json": {
          schema: { $ref: `#/components/schemas/${operationRequestSchemaName(route)}` },
        },
      },
    };
  }

  if (isPaginatedListOperation(route)) {
    operation.parameters.push(
      queryParameter("page", { type: "integer", minimum: 1, default: 1 }),
      queryParameter("page_size", { type: "integer", minimum: 1, maximum: 200, default: 20 }),
      queryParameter("cursor", { type: "string" }),
      queryParameter("sort", { type: "string" }),
      queryParameter("q", { type: "string" }),
      ...operationListFilterParameters(route),
    );
  }

  return operation;
}

function operationListFilterParameters(route) {
  switch (route.operationId) {
    case "rtc.rooms.list":
      return [
        queryParameter("status", {
          type: "string",
          enum: ["active", "archived", "disabled"],
        }),
        queryParameter("ownerUserId", { type: "string" }),
        queryParameter("createdAfter", { type: "string", format: "date-time" }),
      ];
    case "rtc.mediaSessions.list":
      return [
        queryParameter("status", {
          type: "string",
          enum: ["preparing", "active", "closing", "ended", "failed"],
        }),
        queryParameter("ownerUserId", { type: "string" }),
        queryParameter("createdAfter", { type: "string", format: "date-time" }),
      ];
    case "rtc.mediaArtifacts.list":
      return [
        queryParameter("status", {
          type: "string",
          enum: ["pending", "processing", "ready", "failed", "deleted"],
        }),
        queryParameter("createdAfter", { type: "string", format: "date-time" }),
      ];
    case "rtc.qualitySamples.list":
      return [queryParameter("createdAfter", { type: "string", format: "date-time" })];
    default:
      return [];
  }
}

function securityRequirement() {
  return [{ AuthToken: [], AccessToken: [] }];
}

function operationAuthMetadata(source, route) {
  if (route.operationId === PROVIDER_WEBHOOK_RECEIVE_OPERATION_ID) {
    return {
      authMode: "anonymous",
      providerWebhookSignature: true,
      security: [],
      rateLimitTier: "openApiDefault",
      idempotent: true,
    };
  }

  const mutationPolicy = mutationRoutePolicy(route);
  return {
    authMode: source.authMode,
    providerWebhookSignature: false,
    security: securityRequirement(source),
    rateLimitTier: mutationPolicy.rateLimitTier,
    idempotent: mutationPolicy.idempotent,
  };
}

function routeAuthManifest(route) {
  if (route.operationId === PROVIDER_WEBHOOK_RECEIVE_OPERATION_ID) {
    return {
      rateLimitTier: "openApiDefault",
      idempotent: true,
      auth: {
        mode: "public",
        required: true,
        permission: route.permission,
        tenantScope: "tenant",
        dataScope: "organization",
        providerWebhookSignature: true,
      },
    };
  }

  const mutationPolicy = mutationRoutePolicy(route);
  return {
    ...(mutationPolicy.rateLimitTier ? { rateLimitTier: mutationPolicy.rateLimitTier } : {}),
    ...(mutationPolicy.idempotent ? { idempotent: true } : {}),
    auth: {
      mode: "dual-token",
      required: true,
      permission: route.permission,
      tenantScope: "tenant",
      dataScope: "organization",
    },
  };
}

function mutationRoutePolicy(route) {
  const method = route.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { rateLimitTier: null, idempotent: false };
  }

  if (route.operationId.endsWith(".issue") || route.operationId.includes("credential")) {
    return { rateLimitTier: "authCritical", idempotent: true };
  }

  if (method === "PUT" || method === "PATCH" || method === "DELETE") {
    return { rateLimitTier: "openApiDefault", idempotent: true };
  }

  if (
    method === "POST" &&
    (route.operationId.endsWith(".disable") ||
      route.operationId.endsWith(".revoke") ||
      route.operationId.endsWith(".close") ||
      route.operationId.endsWith(".verify") ||
      route.operationId.endsWith(".configure") ||
      route.operationId.endsWith(".create"))
  ) {
    return { rateLimitTier: "openApiDefault", idempotent: true };
  }

  if (method === "POST") {
    return { rateLimitTier: "openApiDefault", idempotent: false };
  }

  return { rateLimitTier: "openApiDefault", idempotent: false };
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
    ...structuredClone(sdkWorkEnvelopeComponentSchemas),
    RtcOperationCommand: {
      type: "object",
      additionalProperties: true,
      description:
        "Operation-specific RTC command payload defined by the owning sdkwork-rtc Rust route/service module.",
    },
    MediaKind: {
      type: "string",
      enum: ["image", "video", "audio", "voice", "document", "archive", "model", "other"],
    },
    MediaSource: {
      type: "string",
      enum: ["drive", "external_url", "data_url", "provider_asset", "generated"],
    },
    MediaChecksum: {
      type: "object",
      additionalProperties: false,
      required: ["algorithm", "value"],
      properties: {
        algorithm: { type: "string", enum: ["sha256", "md5", "etag"] },
        value: { type: "string" },
      },
    },
    MediaAccess: {
      type: "object",
      additionalProperties: false,
      required: ["visibility"],
      properties: {
        visibility: {
          type: "string",
          enum: ["private", "tenant", "organization", "public", "signed"],
        },
        expiresAt: { type: ["string", "null"], format: "date-time" },
      },
    },
    MediaResource: {
      type: "object",
      additionalProperties: false,
      required: ["kind", "source"],
      properties: {
        id: { type: ["string", "null"] },
        kind: { $ref: "#/components/schemas/MediaKind" },
        source: { $ref: "#/components/schemas/MediaSource" },
        url: {
          type: ["string", "null"],
          format: "uri",
          description: "Delivery URL. It is optional and may be temporary.",
        },
        publicUrl: { type: ["string", "null"], format: "uri" },
        uri: { type: ["string", "null"] },
        objectBlobId: { type: ["string", "null"] },
        fileName: { type: ["string", "null"], maxLength: 512 },
        mimeType: { type: ["string", "null"], maxLength: 256 },
        sizeBytes: { type: ["string", "null"], pattern: "^[0-9]+$" },
        checksum: { $ref: "#/components/schemas/MediaChecksum" },
        width: { type: ["integer", "null"], minimum: 0 },
        height: { type: ["integer", "null"], minimum: 0 },
        durationSeconds: { type: ["number", "null"], minimum: 0 },
        altText: { type: ["string", "null"], maxLength: 512 },
        title: { type: ["string", "null"], maxLength: 255 },
        access: { $ref: "#/components/schemas/MediaAccess" },
        metadata: {
          type: "object",
          additionalProperties: true,
          description:
            "Extension metadata. Drive-backed RTC recordings include metadata.drive.spaceType = rtc.",
        },
      },
    },
    RtcDriveReference: {
      type: "object",
      additionalProperties: false,
      required: ["driveUri", "spaceId", "spaceType", "nodeId"],
      properties: {
        driveUri: {
          type: "string",
          pattern: "^drive://spaces/.+/nodes/.+$",
        },
        spaceId: { type: "string" },
        spaceType: {
          type: "string",
          enum: ["rtc"],
          description:
            "Dedicated Drive space type for SDKWork RTC recording and artifact archives.",
        },
        nodeId: { type: "string" },
        nodeVersion: { type: ["string", "null"] },
      },
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
    RtcRoomListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcRoom" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcRoomResponse: envelope({ $ref: "#/components/schemas/RtcRoom" }),
    RtcCreateRoomRequest: {
      type: "object",
      additionalProperties: false,
      required: ["title"],
      properties: {
        title: { type: "string", minLength: 1, maxLength: 120 },
        roomId: { type: ["string", "null"] },
      },
    },
    RtcCreateMediaSessionRequest: {
      type: "object",
      additionalProperties: false,
      required: ["roomId", "mediaMode"],
      properties: {
        roomId: { type: "string" },
        mediaMode: { type: "string", enum: ["audio", "video", "live"] },
        providerProfileId: { type: ["string", "null"] },
        provider: { type: ["string", "null"] },
        region: { type: ["string", "null"] },
        recordingRequested: { type: "boolean", default: false },
        metadata: { type: "object", additionalProperties: true },
      },
    },
    RtcCloseMediaSessionRequest: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcMediaSession: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "roomId",
        "tenantId",
        "organizationId",
        "ownerUserId",
        "mediaMode",
        "status",
        "participants",
      ],
      properties: {
        id: { type: "string" },
        roomId: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        ownerUserId: { type: "string" },
        mediaMode: { type: "string", enum: ["audio", "video", "live"] },
        status: {
          type: "string",
          enum: ["preparing", "active", "closing", "ended", "failed"],
        },
        providerProfileId: { type: ["string", "null"] },
        providerSessionId: { type: ["string", "null"] },
        startedAt: { type: ["string", "null"], format: "date-time" },
        connectedAt: { type: ["string", "null"], format: "date-time" },
        endedAt: { type: ["string", "null"], format: "date-time" },
        durationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        endReason: { type: ["string", "null"], maxLength: 500 },
        endSource: {
          type: ["string", "null"],
          enum: [
            "manual_close",
            "provider_webhook",
            "active_provider_query",
            "provider_state_sync",
            "timeout",
            "system_reconcile",
            "unknown",
            null,
          ],
        },
        participantCount: { type: "integer", minimum: 0 },
        maxConcurrentParticipants: { type: "integer", minimum: 0 },
        qualitySummary: {
          anyOf: [
            { $ref: "#/components/schemas/RtcMediaSessionCompletionQualitySummary" },
            { type: "null" },
          ],
        },
        recordingSummary: {
          anyOf: [
            { $ref: "#/components/schemas/RtcMediaSessionCompletionRecordingSummary" },
            { type: "null" },
          ],
        },
        completionRecordedAt: { type: ["string", "null"], format: "date-time" },
        lastProviderWebhookEventId: { type: ["string", "null"] },
        lastProviderQueryJobId: { type: ["string", "null"] },
        participants: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcMediaParticipant" },
        },
      },
    },
    RtcMediaSessionListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcMediaSession" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcMediaSessionResponse: envelope({ $ref: "#/components/schemas/RtcMediaSession" }),
    RtcMediaParticipant: {
      type: "object",
      additionalProperties: false,
      required: ["id", "mediaSessionId", "userId", "displayName", "role", "state"],
      properties: {
        id: { type: "string" },
        mediaSessionId: { type: "string" },
        userId: { type: "string" },
        displayName: { type: "string" },
        role: { type: "string", enum: ["host", "guest", "listener"] },
        state: { type: "string", enum: ["joining", "joined", "left", "kicked", "timeout"] },
        audioMuted: { type: "boolean" },
        videoMuted: { type: "boolean" },
        screenShareActive: { type: "boolean" },
        providerParticipantId: { type: ["string", "null"] },
        joinedAt: { type: ["string", "null"], format: "date-time" },
        leftAt: { type: ["string", "null"], format: "date-time" },
        durationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        leaveReason: { type: ["string", "null"], maxLength: 500 },
        lastSeenAt: { type: ["string", "null"], format: "date-time" },
      },
    },
    RtcParticipantCredential: {
      type: "object",
      additionalProperties: false,
      required: ["tenantId", "mediaSessionId", "participantId", "credential", "expiresAt"],
      properties: {
        tenantId: { type: "string" },
        mediaSessionId: { type: "string" },
        participantId: { type: "string" },
        credential: { type: "string" },
        expiresAt: { type: "string", format: "date-time" },
      },
    },
    RtcParticipantCredentialResponse: envelope({
      $ref: "#/components/schemas/RtcParticipantCredential",
    }),
    RtcMediaArtifact: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "tenantId",
        "mediaSessionId",
        "ownerUserId",
        "artifactKind",
        "artifactStatus",
        "mediaRole",
        "drive",
        "resource",
      ],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: ["string", "null"] },
        mediaSessionId: { type: "string" },
        ownerUserId: { type: "string" },
        artifactKind: {
          type: "string",
          enum: ["recording", "transcript", "screen_share", "snapshot", "other"],
        },
        artifactStatus: {
          type: "string",
          enum: ["pending", "processing", "ready", "failed", "deleted"],
        },
        mediaRole: { type: "string" },
        providerProfileId: { type: ["string", "null"] },
        providerArtifactId: { type: ["string", "null"] },
        drive: { $ref: "#/components/schemas/RtcDriveReference" },
        resource: { $ref: "#/components/schemas/MediaResource" },
        resourceHash: { type: ["string", "null"] },
        startedAt: { type: ["string", "null"], format: "date-time" },
        endedAt: { type: ["string", "null"], format: "date-time" },
        durationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        failureReason: { type: ["string", "null"], maxLength: 500 },
        sourceProviderWebhookEventId: { type: ["string", "null"] },
        sourceProviderQueryJobId: { type: ["string", "null"] },
      },
    },
    RtcMediaArtifactListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcMediaArtifact" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcMediaArtifactResponse: envelope({ $ref: "#/components/schemas/RtcMediaArtifact" }),
    RtcMediaTrack: {
      type: "object",
      additionalProperties: false,
      required: ["id", "mediaSessionId", "participantId", "trackKind", "trackSource", "status"],
      properties: {
        id: { type: "string" },
        mediaSessionId: { type: "string" },
        participantId: { type: "string" },
        trackKind: { type: "string", enum: ["audio", "video", "screen_share", "data"] },
        trackSource: {
          type: "string",
          enum: ["microphone", "camera", "screen", "system", "custom"],
        },
        providerTrackId: { type: ["string", "null"] },
        status: { type: "string", enum: ["publishing", "muted", "stopped", "failed"] },
        startedAt: { type: ["string", "null"], format: "date-time" },
        endedAt: { type: ["string", "null"], format: "date-time" },
        durationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        mutedDurationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        endReason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcMediaSessionCompletionQualitySummary: {
      type: "object",
      additionalProperties: false,
      required: ["sampleCount", "participantSampleCount"],
      properties: {
        sampleCount: { type: "integer", minimum: 0 },
        participantSampleCount: { type: "integer", minimum: 0 },
        avgLatencyMs: { type: ["integer", "null"], minimum: 0 },
        maxLatencyMs: { type: ["integer", "null"], minimum: 0 },
        avgJitterMs: { type: ["integer", "null"], minimum: 0 },
        maxJitterMs: { type: ["integer", "null"], minimum: 0 },
        maxPacketLossRate: { type: ["string", "null"] },
        minBitrateKbps: { type: ["integer", "null"], minimum: 0 },
        avgBitrateKbps: { type: ["integer", "null"], minimum: 0 },
        firstSampledAt: { type: ["string", "null"], format: "date-time" },
        lastSampledAt: { type: ["string", "null"], format: "date-time" },
      },
    },
    RtcMediaSessionCompletionRecordingSummary: {
      type: "object",
      additionalProperties: false,
      required: [
        "artifactCount",
        "recordingArtifactCount",
        "readyArtifactCount",
        "failedArtifactCount",
        "processingArtifactCount",
        "driveResourceCount",
      ],
      properties: {
        artifactCount: { type: "integer", minimum: 0 },
        recordingArtifactCount: { type: "integer", minimum: 0 },
        readyArtifactCount: { type: "integer", minimum: 0 },
        failedArtifactCount: { type: "integer", minimum: 0 },
        processingArtifactCount: { type: "integer", minimum: 0 },
        totalDurationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        driveResourceCount: { type: "integer", minimum: 0 },
      },
    },
    RtcMediaSessionCompletionParticipantSummary: {
      type: "object",
      additionalProperties: false,
      required: ["participantId", "userId", "displayName", "role", "state"],
      properties: {
        participantId: { type: "string" },
        userId: { type: "string" },
        displayName: { type: "string" },
        role: { type: "string", enum: ["host", "guest", "listener"] },
        state: { type: "string", enum: ["joining", "joined", "left", "kicked", "timeout"] },
        joinedAt: { type: ["string", "null"], format: "date-time" },
        leftAt: { type: ["string", "null"], format: "date-time" },
        durationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        leaveReason: { type: ["string", "null"], maxLength: 500 },
        providerParticipantId: { type: ["string", "null"] },
      },
    },
    RtcMediaSessionCompletionTrackSummary: {
      type: "object",
      additionalProperties: false,
      required: ["trackId", "participantId", "trackKind", "trackSource", "status"],
      properties: {
        trackId: { type: "string" },
        participantId: { type: "string" },
        trackKind: { type: "string", enum: ["audio", "video", "screen_share", "data"] },
        trackSource: {
          type: "string",
          enum: ["microphone", "camera", "screen", "system", "custom"],
        },
        status: { type: "string", enum: ["publishing", "muted", "stopped", "failed"] },
        startedAt: { type: ["string", "null"], format: "date-time" },
        endedAt: { type: ["string", "null"], format: "date-time" },
        durationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        mutedDurationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        endReason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcMediaSessionCompletionArtifactSummary: {
      type: "object",
      additionalProperties: false,
      required: [
        "artifactId",
        "artifactKind",
        "artifactStatus",
        "mediaRole",
        "driveUri",
        "driveSpaceId",
        "driveSpaceType",
        "driveNodeId",
      ],
      properties: {
        artifactId: { type: "string" },
        artifactKind: {
          type: "string",
          enum: ["recording", "transcript", "screen_share", "snapshot", "other"],
        },
        artifactStatus: {
          type: "string",
          enum: ["pending", "processing", "ready", "failed", "deleted"],
        },
        mediaRole: { type: "string" },
        driveUri: { type: "string", pattern: "^drive://spaces/.+/nodes/.+$" },
        driveSpaceId: { type: "string" },
        driveSpaceType: {
          type: "string",
          enum: ["rtc"],
          description:
            "Dedicated Drive space type used by SDKWork RTC post-session recording and artifact archives.",
        },
        driveNodeId: { type: "string" },
        driveNodeVersion: { type: ["string", "null"] },
        providerArtifactId: { type: ["string", "null"] },
        startedAt: { type: ["string", "null"], format: "date-time" },
        endedAt: { type: ["string", "null"], format: "date-time" },
        durationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        failureReason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcMediaSessionCompletionRecord: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "tenantId",
        "organizationId",
        "mediaSessionId",
        "roomId",
        "ownerUserId",
        "mediaMode",
        "sessionStatus",
        "participantCount",
        "maxConcurrentParticipants",
        "qualitySummary",
        "recordingSummary",
        "participants",
        "tracks",
        "artifacts",
        "completionSnapshotHash",
        "recordedAt",
      ],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        mediaSessionId: { type: "string" },
        roomId: { type: "string" },
        ownerUserId: { type: "string" },
        providerProfileId: { type: ["string", "null"] },
        providerSessionId: { type: ["string", "null"] },
        mediaMode: { type: "string", enum: ["audio", "video", "live"] },
        sessionStatus: {
          type: "string",
          enum: ["preparing", "active", "closing", "ended", "failed"],
        },
        startedAt: { type: ["string", "null"], format: "date-time" },
        connectedAt: { type: ["string", "null"], format: "date-time" },
        endedAt: { type: ["string", "null"], format: "date-time" },
        durationMs: { type: ["string", "null"], pattern: "^[0-9]+$" },
        endReason: { type: ["string", "null"], maxLength: 500 },
        endSource: {
          type: ["string", "null"],
          enum: [
            "manual_close",
            "provider_webhook",
            "active_provider_query",
            "provider_state_sync",
            "timeout",
            "system_reconcile",
            "unknown",
            null,
          ],
        },
        participantCount: { type: "integer", minimum: 0 },
        maxConcurrentParticipants: { type: "integer", minimum: 0 },
        qualitySummary: { $ref: "#/components/schemas/RtcMediaSessionCompletionQualitySummary" },
        recordingSummary: {
          $ref: "#/components/schemas/RtcMediaSessionCompletionRecordingSummary",
        },
        participants: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcMediaSessionCompletionParticipantSummary" },
        },
        tracks: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcMediaSessionCompletionTrackSummary" },
        },
        artifacts: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcMediaSessionCompletionArtifactSummary" },
        },
        sourceWebhookEventId: { type: ["string", "null"] },
        sourceProviderQueryJobId: { type: ["string", "null"] },
        completionSnapshot: { type: "object", additionalProperties: true },
        completionSnapshotHash: { type: "string" },
        recordedAt: { type: "string", format: "date-time" },
      },
    },
    RtcMediaSessionCompletionRecordResponse: envelope({
      $ref: "#/components/schemas/RtcMediaSessionCompletionRecord",
    }),
    RtcProviderAccount: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "tenantId",
        "organizationId",
        "provider",
        "code",
        "name",
        "status",
        "environment",
        "version",
      ],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        provider: { type: "string" },
        code: { type: "string" },
        name: { type: "string" },
        status: { type: "string", enum: ["active", "disabled", "archived"] },
        environment: {
          type: "string",
          enum: ["production", "staging", "development", "test", "sandbox"],
        },
        externalTenantId: { type: ["string", "null"] },
        cloudAccountId: { type: ["string", "null"] },
        projectId: { type: ["string", "null"] },
        resourceGroupId: { type: ["string", "null"] },
        lastVerifiedAt: { type: ["string", "null"], format: "date-time" },
        lastVerificationError: { type: ["string", "null"], maxLength: 1000 },
        createdBy: { type: ["string", "null"] },
        updatedBy: { type: ["string", "null"] },
        createdAt: { type: ["string", "null"], format: "date-time" },
        updatedAt: { type: ["string", "null"], format: "date-time" },
        version: { type: "string", pattern: "^[0-9]+$" },
        deletedAt: { type: ["string", "null"], format: "date-time" },
        deletedBy: { type: ["string", "null"] },
      },
    },
    RtcProviderAccountCommand: {
      type: "object",
      additionalProperties: false,
      required: ["provider", "code", "name", "environment"],
      properties: {
        provider: { type: "string" },
        code: { type: "string" },
        name: { type: "string" },
        status: { type: "string", enum: ["active", "disabled", "archived"] },
        environment: {
          type: "string",
          enum: ["production", "staging", "development", "test", "sandbox"],
        },
        externalTenantId: { type: ["string", "null"] },
        cloudAccountId: { type: ["string", "null"] },
        projectId: { type: ["string", "null"] },
        resourceGroupId: { type: ["string", "null"] },
      },
    },
    RtcProviderAccountDisableRequest: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcProviderAccountListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderAccount" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcProviderAccountResponse: envelope({
      $ref: "#/components/schemas/RtcProviderAccount",
    }),
    RtcProviderApplication: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "tenantId",
        "organizationId",
        "providerAccountId",
        "provider",
        "code",
        "name",
        "status",
        "environment",
        "providerApplicationId",
        "providerApplicationIdKind",
        "configSnapshot",
        "version",
      ],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        providerAccountId: { type: "string" },
        provider: { type: "string" },
        code: { type: "string" },
        name: { type: "string" },
        status: { type: "string", enum: ["active", "disabled", "archived"] },
        environment: {
          type: "string",
          enum: ["production", "staging", "development", "test", "sandbox"],
        },
        region: { type: ["string", "null"] },
        providerApplicationId: { type: "string" },
        providerApplicationIdKind: {
          type: "string",
          enum: ["volcengine_app_id", "tencent_sdk_app_id", "provider_application_id"],
        },
        accessEndpoint: { type: ["string", "null"], format: "uri" },
        apiEndpoint: { type: ["string", "null"], format: "uri" },
        apiHost: { type: ["string", "null"] },
        apiVersion: { type: ["string", "null"] },
        webhookCallbackUrl: { type: ["string", "null"], format: "uri" },
        configSnapshot: { type: "object", additionalProperties: true },
        lastVerifiedAt: { type: ["string", "null"], format: "date-time" },
        lastVerificationError: { type: ["string", "null"], maxLength: 1000 },
        createdBy: { type: ["string", "null"] },
        updatedBy: { type: ["string", "null"] },
        createdAt: { type: ["string", "null"], format: "date-time" },
        updatedAt: { type: ["string", "null"], format: "date-time" },
        version: { type: "string", pattern: "^[0-9]+$" },
        deletedAt: { type: ["string", "null"], format: "date-time" },
        deletedBy: { type: ["string", "null"] },
      },
    },
    RtcProviderApplicationCommand: {
      type: "object",
      additionalProperties: false,
      required: [
        "code",
        "name",
        "environment",
        "providerApplicationId",
        "providerApplicationIdKind",
        "configSnapshot",
      ],
      properties: {
        code: { type: "string" },
        name: { type: "string" },
        status: { type: "string", enum: ["active", "disabled", "archived"] },
        environment: {
          type: "string",
          enum: ["production", "staging", "development", "test", "sandbox"],
        },
        region: { type: ["string", "null"] },
        providerApplicationId: { type: "string" },
        providerApplicationIdKind: {
          type: "string",
          enum: ["volcengine_app_id", "tencent_sdk_app_id", "provider_application_id"],
        },
        accessEndpoint: { type: ["string", "null"], format: "uri" },
        apiEndpoint: { type: ["string", "null"], format: "uri" },
        apiHost: { type: ["string", "null"] },
        apiVersion: { type: ["string", "null"] },
        webhookCallbackUrl: { type: ["string", "null"], format: "uri" },
        configSnapshot: { type: "object", additionalProperties: true },
      },
    },
    RtcProviderApplicationDisableRequest: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcProviderApplicationListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderApplication" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcProviderApplicationResponse: envelope({
      $ref: "#/components/schemas/RtcProviderApplication",
    }),
    RtcProviderCredential: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "tenantId",
        "organizationId",
        "providerAccountId",
        "providerApplicationId",
        "provider",
        "credentialRole",
        "credentialLabel",
        "credentialRef",
        "status",
        "version",
      ],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        providerAccountId: { type: "string" },
        providerApplicationId: { type: "string" },
        provider: { type: "string" },
        credentialRole: {
          type: "string",
          enum: [
            "rtc_token_signing",
            "open_api_signing",
            "usersig_signing",
            "cloud_api_signing",
            "webhook_signing",
          ],
        },
        credentialLabel: { type: "string" },
        credentialRef: {
          type: "string",
          description:
            "Reference to secret-managed provider credential material. Raw provider secrets are never returned by the RTC API.",
        },
        credentialFingerprint: { type: ["string", "null"] },
        secretVersion: { type: ["string", "null"] },
        status: {
          type: "string",
          enum: ["active", "pending", "disabled", "revoked", "expired"],
        },
        validFrom: { type: ["string", "null"], format: "date-time" },
        expiresAt: { type: ["string", "null"], format: "date-time" },
        rotationDueAt: { type: ["string", "null"], format: "date-time" },
        rotatedAt: { type: ["string", "null"], format: "date-time" },
        revokedAt: { type: ["string", "null"], format: "date-time" },
        lastVerifiedAt: { type: ["string", "null"], format: "date-time" },
        lastUsedAt: { type: ["string", "null"], format: "date-time" },
        createdBy: { type: ["string", "null"] },
        updatedBy: { type: ["string", "null"] },
        createdAt: { type: ["string", "null"], format: "date-time" },
        updatedAt: { type: ["string", "null"], format: "date-time" },
        version: { type: "string", pattern: "^[0-9]+$" },
      },
    },
    RtcProviderCredentialCommand: {
      type: "object",
      additionalProperties: false,
      required: ["credentialRole", "credentialLabel", "credentialRef"],
      properties: {
        credentialRole: {
          type: "string",
          enum: [
            "rtc_token_signing",
            "open_api_signing",
            "usersig_signing",
            "cloud_api_signing",
            "webhook_signing",
          ],
        },
        credentialLabel: { type: "string" },
        credentialRef: { type: "string" },
        credentialFingerprint: { type: ["string", "null"] },
        secretVersion: { type: ["string", "null"] },
        status: {
          type: "string",
          enum: ["active", "pending", "disabled", "revoked", "expired"],
        },
        validFrom: { type: ["string", "null"], format: "date-time" },
        expiresAt: { type: ["string", "null"], format: "date-time" },
        rotationDueAt: { type: ["string", "null"], format: "date-time" },
      },
    },
    RtcProviderCredentialRevokeRequest: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcProviderCredentialListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderCredential" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcProviderCredentialResponse: envelope({
      $ref: "#/components/schemas/RtcProviderCredential",
    }),
    RtcProviderProfile: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "provider",
        "code",
        "name",
        "status",
        "isDefault",
        "priority",
        "environment",
        "capabilities",
        "healthStatus",
        "version",
      ],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        provider: { type: "string" },
        code: { type: "string" },
        name: { type: "string" },
        status: { type: "string", enum: ["active", "disabled", "archived"] },
        isDefault: { type: "boolean" },
        priority: { type: "integer", minimum: 0 },
        environment: {
          type: "string",
          enum: ["production", "staging", "development", "test", "sandbox"],
        },
        region: { type: ["string", "null"] },
        providerAppId: { type: ["string", "null"] },
        endpoint: { type: ["string", "null"], format: "uri" },
        credentialRef: {
          type: ["string", "null"],
          description:
            "Reference to secret-managed provider credentials. Raw provider secrets are never returned by the RTC API.",
        },
        credentialFingerprint: { type: ["string", "null"] },
        webhookSecretRef: {
          type: ["string", "null"],
          description:
            "Reference to secret-managed webhook verification material. Raw webhook secrets are never returned by the RTC API.",
        },
        webhookSecretFingerprint: { type: ["string", "null"] },
        capabilities: { $ref: "#/components/schemas/RtcProviderCapabilitySnapshot" },
        configSnapshot: { type: "object", additionalProperties: true },
        healthStatus: {
          type: "string",
          enum: ["unknown", "healthy", "degraded", "unhealthy"],
        },
        lastVerifiedAt: { type: ["string", "null"], format: "date-time" },
        lastVerificationLatencyMs: { type: ["integer", "null"], minimum: 0 },
        lastVerificationError: { type: ["string", "null"], maxLength: 1000 },
        createdAt: { type: ["string", "null"], format: "date-time" },
        updatedAt: { type: ["string", "null"], format: "date-time" },
        version: { type: "string", pattern: "^[0-9]+$" },
      },
    },
    RtcActiveProviderProfile: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "provider",
        "code",
        "name",
        "isDefault",
        "priority",
        "environment",
        "capabilities",
        "healthStatus",
      ],
      properties: {
        id: { type: "string" },
        provider: { type: "string" },
        code: { type: "string" },
        name: { type: "string" },
        isDefault: { type: "boolean" },
        priority: { type: "integer", minimum: 0 },
        environment: {
          type: "string",
          enum: ["production", "staging", "development", "test", "sandbox"],
        },
        region: { type: ["string", "null"] },
        providerAppId: { type: ["string", "null"] },
        endpoint: { type: ["string", "null"], format: "uri" },
        capabilities: { $ref: "#/components/schemas/RtcProviderCapabilitySnapshot" },
        healthStatus: {
          type: "string",
          enum: ["unknown", "healthy", "degraded", "unhealthy"],
        },
      },
    },
    RtcProviderCapabilitySnapshot: {
      type: "object",
      additionalProperties: false,
      required: [
        "audio",
        "video",
        "live",
        "screenShare",
        "recording",
        "webhook",
        "activeQuery",
      ],
      properties: {
        audio: { type: "boolean" },
        video: { type: "boolean" },
        live: { type: "boolean" },
        liveBroadcast: { type: "boolean" },
        liveAudience: { type: "boolean" },
        cdnRelay: { type: "boolean" },
        screenShare: { type: "boolean" },
        recording: { type: "boolean" },
        webhook: { type: "boolean" },
        activeQuery: { type: "boolean" },
        maxParticipants: { type: ["integer", "null"], minimum: 0 },
        supportedRegions: {
          type: "array",
          items: { type: "string" },
        },
        providerFeatures: { type: "object", additionalProperties: true },
      },
    },
    RtcProviderProfileCommand: {
      type: "object",
      additionalProperties: false,
      required: [
        "provider",
        "code",
        "name",
        "environment",
        "capabilities",
        "configSnapshot",
      ],
      properties: {
        provider: { type: "string" },
        code: { type: "string" },
        name: { type: "string" },
        status: { type: "string", enum: ["active", "disabled", "archived"] },
        isDefault: { type: "boolean", default: false },
        priority: { type: "integer", minimum: 0, default: 100 },
        environment: {
          type: "string",
          enum: ["production", "staging", "development", "test", "sandbox"],
        },
        region: { type: ["string", "null"] },
        providerAppId: { type: ["string", "null"] },
        endpoint: { type: ["string", "null"], format: "uri" },
        credentialRef: { type: ["string", "null"] },
        webhookSecretRef: { type: ["string", "null"] },
        capabilities: { $ref: "#/components/schemas/RtcProviderCapabilitySnapshot" },
        configSnapshot: { type: "object", additionalProperties: true },
      },
    },
    RtcProviderProfileDisableRequest: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcProviderProfileVerifyRequest: {
      type: "object",
      additionalProperties: false,
      required: ["queryKind"],
      properties: {
        queryKind: {
          type: "string",
          enum: ["credential", "webhook", "active_query", "recording", "full"],
        },
        timeoutMs: { type: ["integer", "null"], minimum: 1000, maximum: 60000 },
      },
    },
    RtcProviderProfileVerifyResult: {
      type: "object",
      additionalProperties: false,
      required: ["providerProfileId", "provider", "status", "verifiedAt"],
      properties: {
        providerProfileId: { type: "string" },
        provider: { type: "string" },
        status: {
          type: "string",
          enum: ["healthy", "degraded", "unhealthy"],
        },
        verifiedAt: { type: "string", format: "date-time" },
        latencyMs: { type: ["integer", "null"], minimum: 0 },
        checks: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderProfileVerifyCheck" },
        },
      },
    },
    RtcProviderProfileVerifyCheck: {
      type: "object",
      additionalProperties: false,
      required: ["name", "status"],
      properties: {
        name: { type: "string" },
        status: { type: "string", enum: ["passed", "warning", "failed", "skipped"] },
        detail: { type: ["string", "null"] },
      },
    },
    RtcProviderProfileListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderProfile" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcActiveProviderProfileListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcActiveProviderProfile" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcProviderProfileResponse: envelope({ $ref: "#/components/schemas/RtcProviderProfile" }),
    RtcProviderProfileVerifyResultResponse: envelope({
      $ref: "#/components/schemas/RtcProviderProfileVerifyResult",
    }),
    RtcProviderRoute: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "tenantId",
        "organizationId",
        "providerProfileId",
        "routeType",
        "priority",
        "status",
      ],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        providerProfileId: { type: "string" },
        routeType: { type: "string", enum: ["region"] },
        region: { type: ["string", "null"] },
        priority: { type: "integer" },
        status: { type: "string", enum: ["active", "disabled"] },
      },
    },
    RtcProviderRouteCommand: {
      type: "object",
      additionalProperties: false,
      required: ["providerProfileId", "routeType"],
      properties: {
        providerProfileId: { type: "string" },
        routeType: { type: "string", enum: ["region"] },
        region: { type: ["string", "null"] },
        priority: { type: "integer", default: 100 },
        status: { type: "string", enum: ["active", "disabled"] },
      },
    },
    RtcProviderRouteDisableRequest: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: ["string", "null"], maxLength: 500 },
      },
    },
    RtcProviderRouteListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderRoute" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcProviderRouteResponse: envelope({ $ref: "#/components/schemas/RtcProviderRoute" }),
    RtcProviderPluginDescriptor: {
      type: "object",
      additionalProperties: false,
      required: [
        "pluginId",
        "domain",
        "providerKind",
        "displayName",
        "interfaceVersion",
        "configSchemaRef",
        "defaultSelected",
        "tenantOverrideAllowed",
        "requiredCapabilities",
        "optionalCapabilities",
        "unsupportedFeatures",
        "degradedBehaviors",
      ],
      properties: {
        pluginId: { type: "string" },
        domain: { type: "string", enum: ["rtc"] },
        providerKind: { type: "string" },
        displayName: { type: "string" },
        interfaceVersion: { type: "string" },
        configSchemaRef: { type: "string" },
        defaultSelected: { type: "boolean" },
        tenantOverrideAllowed: { type: "boolean" },
        requiredCapabilities: { type: "array", items: { type: "string" } },
        optionalCapabilities: { type: "array", items: { type: "string" } },
        unsupportedFeatures: { type: "array", items: { type: "string" } },
        degradedBehaviors: { type: "array", items: { type: "string" } },
      },
    },
    RtcProviderPluginListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderPluginDescriptor" },
        },
      },
    }),
    RtcProviderPluginResponse: envelope({
      $ref: "#/components/schemas/RtcProviderPluginDescriptor",
    }),
    RtcProviderConfigFieldSchema: {
      type: "object",
      additionalProperties: false,
      required: ["key", "label", "type"],
      properties: {
        key: { type: "string" },
        label: { type: "string" },
        type: { type: "string" },
        required: { type: "boolean", default: false },
        default: {},
        placeholder: { type: ["string", "null"] },
        values: { type: ["array", "null"], items: { type: "string" } },
        min: { type: ["integer", "null"] },
        max: { type: ["integer", "null"] },
        hidden: { type: "boolean", default: false },
      },
    },
    RtcProviderCredentialRoleSchema: {
      type: "object",
      additionalProperties: false,
      required: ["role", "label", "description", "fields"],
      properties: {
        role: { type: "string" },
        label: { type: "string" },
        description: { type: "string" },
        fields: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderConfigFieldSchema" },
        },
      },
    },
    RtcProviderConfigSchema: {
      type: "object",
      additionalProperties: false,
      required: [
        "provider",
        "displayName",
        "description",
        "accountFields",
        "applicationFields",
        "credentialRoles",
        "profileFields",
        "optionalCapabilities",
        "requiredCapabilities",
      ],
      properties: {
        provider: { type: "string" },
        displayName: { type: "string" },
        description: { type: "string" },
        accountFields: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderConfigFieldSchema" },
        },
        applicationFields: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderConfigFieldSchema" },
        },
        credentialRoles: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderCredentialRoleSchema" },
        },
        profileFields: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderConfigFieldSchema" },
        },
        optionalCapabilities: { type: "array", items: { type: "string" } },
        requiredCapabilities: { type: "array", items: { type: "string" } },
      },
    },
    RtcProviderConfigSchemaListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderConfigSchema" },
        },
      },
    }),
    RtcProviderConfigSchemaResponse: envelope({
      $ref: "#/components/schemas/RtcProviderConfigSchema",
    }),
    RtcQualitySample: {
      type: "object",
      additionalProperties: false,
      required: ["id", "mediaSessionId", "sampledAt"],
      properties: {
        id: { type: "string" },
        mediaSessionId: { type: "string" },
        participantId: { type: ["string", "null"] },
        latencyMs: { type: ["integer", "null"] },
        packetLossRate: { type: ["string", "null"] },
        jitterMs: { type: ["integer", "null"] },
        bitrateKbps: { type: ["integer", "null"] },
        sampledAt: { type: "string", format: "date-time" },
      },
    },
    RtcQualitySampleListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcQualitySample" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcProviderWebhookEvent: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "provider",
        "eventType",
        "eventKind",
        "payloadHash",
        "receivedAt",
        "status",
      ],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        provider: { type: "string" },
        providerProfileId: { type: ["string", "null"] },
        externalEventId: { type: ["string", "null"] },
        eventType: { type: "string" },
        eventKind: {
          type: "string",
          enum: [
            "room_started",
            "room_ended",
            "participant_joined",
            "participant_left",
            "recording_started",
            "recording_completed",
            "recording_failed",
            "media_track_started",
            "media_track_stopped",
            "quality_sample",
            "unknown",
          ],
        },
        roomId: { type: ["string", "null"] },
        mediaSessionId: { type: ["string", "null"] },
        participantId: { type: ["string", "null"] },
        recordingId: { type: ["string", "null"] },
        payloadHash: { type: "string" },
        rawPayload: { type: "object", additionalProperties: true },
        normalizedEvent: { type: "object", additionalProperties: true },
        signatureHeader: { type: ["string", "null"] },
        receivedAt: { type: "string", format: "date-time" },
        processedAt: { type: ["string", "null"], format: "date-time" },
        status: { type: "string", enum: ["received", "processed", "duplicate", "failed"] },
      },
    },
    RtcProviderWebhookReceiveRequest: {
      type: "object",
      additionalProperties: true,
      properties: {
        providerProfileId: { type: ["string", "null"] },
        externalEventId: { type: ["string", "null"] },
        signatureHeader: { type: ["string", "null"] },
        headers: {
          type: "object",
          additionalProperties: { type: "string" },
        },
        rawPayload: { type: "object", additionalProperties: true },
        receivedAt: {
          type: ["string", "null"],
          format: "date-time",
          description:
            "Optional gateway receive timestamp. The RTC runtime records the authoritative receive time when this field is absent.",
        },
      },
      description:
        "RTC provider webhook body. Provider gateways may wrap the provider payload in rawPayload, while direct Volcengine/Tencent callbacks may send provider-native JSON at the top level; the RTC provider plugin normalizes either shape and verifies provider-native signatures.",
    },
    RtcProviderWebhookEventListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderWebhookEvent" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcProviderWebhookEventResponse: envelope({
      $ref: "#/components/schemas/RtcProviderWebhookEvent",
    }),
    RtcProviderQueryJob: {
      type: "object",
      additionalProperties: false,
      required: ["id", "provider", "queryKind", "targetKind", "targetId", "status", "requestedAt"],
      properties: {
        id: { type: "string" },
        tenantId: { type: "string" },
        organizationId: { type: "string" },
        provider: { type: "string" },
        providerProfileId: { type: ["string", "null"] },
        queryKind: {
          type: "string",
          enum: [
            "room_online_users",
            "room_state",
            "media_session_state",
            "recording_artifacts",
            "quality_samples",
          ],
        },
        targetKind: { type: "string", enum: ["room", "media_session", "recording", "quality"] },
        targetId: { type: "string" },
        roomId: { type: ["string", "null"] },
        mediaSessionId: { type: ["string", "null"] },
        providerSessionId: { type: ["string", "null"] },
        providerRequestId: { type: ["string", "null"] },
        status: { type: "string", enum: ["requested", "running", "completed", "failed"] },
        requestedAt: { type: "string", format: "date-time" },
        completedAt: { type: ["string", "null"], format: "date-time" },
        resultSnapshot: { type: "object", additionalProperties: true },
      },
    },
    RtcProviderQueryJobCreateRequest: {
      type: "object",
      additionalProperties: false,
      required: ["provider", "queryKind"],
      properties: {
        provider: { type: "string" },
        providerProfileId: { type: ["string", "null"] },
        queryKind: {
          type: "string",
          enum: [
            "room_online_users",
            "room_state",
            "media_session_state",
            "recording_artifacts",
            "quality_samples",
          ],
        },
        roomId: { type: ["string", "null"] },
        mediaSessionId: { type: ["string", "null"] },
        providerSessionId: { type: ["string", "null"] },
        cursor: { type: ["string", "null"] },
      },
    },
    RtcProviderQueryJobListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderQueryJob" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
    RtcProviderQueryJobResponse: envelope({ $ref: "#/components/schemas/RtcProviderQueryJob" }),
    RtcProviderQuerySnapshot: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "providerQueryJobId",
        "provider",
        "queryKind",
        "targetKind",
        "targetId",
        "snapshotKind",
        "snapshotPayload",
        "capturedAt",
      ],
      properties: {
        id: { type: "string" },
        providerQueryJobId: { type: "string" },
        provider: { type: "string" },
        queryKind: { type: "string" },
        targetKind: { type: "string" },
        targetId: { type: "string" },
        providerSessionId: { type: ["string", "null"] },
        snapshotKind: { type: "string" },
        snapshotPayload: { type: "object", additionalProperties: true },
        capturedAt: { type: "string", format: "date-time" },
      },
    },
    RtcProviderQuerySnapshotListResponse: envelope({
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/RtcProviderQuerySnapshot" },
        },
        nextCursor: { type: ["string", "null"] },
      },
    }),
  };
}

function envelope(dataSchema) {
  if (typeof dataSchema?.$ref === "string") {
    return typedSdkWorkResourceResponse(dataSchema.$ref);
  }

  if (dataSchema?.properties?.items) {
    const pageInfo = dataSchema.properties?.nextCursor
      ? {
          type: "object",
          additionalProperties: false,
          required: ["mode", "hasMore"],
          properties: {
            mode: { type: "string", enum: ["cursor"] },
            nextCursor: dataSchema.properties.nextCursor,
            hasMore: { type: "boolean" },
          },
        }
      : { $ref: "#/components/schemas/PageInfo" };

    return {
      allOf: [
        { $ref: "#/components/schemas/SdkWorkApiResponse" },
        {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "object",
              additionalProperties: false,
              required: ["items", "pageInfo"],
              properties: {
                items: dataSchema.properties.items,
                pageInfo,
              },
            },
          },
        },
      ],
    };
  }

  if (dataSchema?.properties?.item) {
    return {
      allOf: [
        { $ref: "#/components/schemas/SdkWorkApiResponse" },
        {
          type: "object",
          required: ["data"],
          properties: {
            data: dataSchema,
          },
        },
      ],
    };
  }

  return {
    allOf: [
      { $ref: "#/components/schemas/SdkWorkApiResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["item"],
            properties: {
              item: dataSchema,
            },
          },
        },
      },
    ],
  };
}

function operationRequestSchemaName(route) {
  switch (route.operationId) {
    case "rtc.mediaSessions.create":
      return "RtcCreateMediaSessionRequest";
    case "rtc.mediaSessions.close":
      return "RtcCloseMediaSessionRequest";
    case "rtc.providerAccounts.create":
    case "rtc.providerAccounts.update":
      return "RtcProviderAccountCommand";
    case "rtc.providerAccounts.disable":
      return "RtcProviderAccountDisableRequest";
    case "rtc.providerAccounts.applications.create":
    case "rtc.providerApplications.update":
      return "RtcProviderApplicationCommand";
    case "rtc.providerApplications.disable":
      return "RtcProviderApplicationDisableRequest";
    case "rtc.providerApplications.credentials.create":
    case "rtc.providerCredentials.update":
      return "RtcProviderCredentialCommand";
    case "rtc.providerCredentials.revoke":
      return "RtcProviderCredentialRevokeRequest";
    case "rtc.providerProfiles.create":
    case "rtc.providerProfiles.update":
      return "RtcProviderProfileCommand";
    case "rtc.providerProfiles.disable":
      return "RtcProviderProfileDisableRequest";
    case "rtc.providerProfiles.verify":
      return "RtcProviderProfileVerifyRequest";
    case "rtc.providerRoutes.create":
    case "rtc.providerRoutes.update":
      return "RtcProviderRouteCommand";
    case "rtc.providerRoutes.disable":
      return "RtcProviderRouteDisableRequest";
    case "rtc.providerWebhooks.events.receive":
      return "RtcProviderWebhookReceiveRequest";
    case "rtc.providerQueryJobs.create":
      return "RtcProviderQueryJobCreateRequest";
    case "rtc.rooms.create":
      return "RtcCreateRoomRequest";
    default:
      return usesJsonBody(route.method.toLowerCase()) ? "RtcOperationCommand" : null;
  }
}

function operationResponseSchemaName(route) {
  switch (route.operationId) {
    case "rtc.rooms.list":
      return "RtcRoomListResponse";
    case "rtc.rooms.retrieve":
    case "rtc.rooms.create":
      return "RtcRoomResponse";
    case "rtc.mediaSessions.list":
      return "RtcMediaSessionListResponse";
    case "rtc.mediaSessions.create":
    case "rtc.mediaSessions.retrieve":
    case "rtc.mediaSessions.close":
      return "RtcMediaSessionResponse";
    case "rtc.mediaSessions.completionRecord.retrieve":
      return "RtcMediaSessionCompletionRecordResponse";
    case "rtc.mediaSessions.participantCredentials.issue":
      return "RtcParticipantCredentialResponse";
    case "rtc.mediaSessions.recordingArtifacts.list":
    case "rtc.mediaArtifacts.list":
      return "RtcMediaArtifactListResponse";
    case "rtc.mediaArtifacts.retrieve":
      return "RtcMediaArtifactResponse";
    case "rtc.providerProfiles.active.list":
      return "RtcActiveProviderProfileListResponse";
    case "rtc.providerAccounts.list":
      return "RtcProviderAccountListResponse";
    case "rtc.providerAccounts.create":
    case "rtc.providerAccounts.retrieve":
    case "rtc.providerAccounts.update":
    case "rtc.providerAccounts.disable":
      return "RtcProviderAccountResponse";
    case "rtc.providerAccounts.applications.list":
      return "RtcProviderApplicationListResponse";
    case "rtc.providerAccounts.applications.create":
    case "rtc.providerApplications.retrieve":
    case "rtc.providerApplications.update":
    case "rtc.providerApplications.disable":
      return "RtcProviderApplicationResponse";
    case "rtc.providerApplications.credentials.list":
      return "RtcProviderCredentialListResponse";
    case "rtc.providerApplications.credentials.create":
    case "rtc.providerCredentials.retrieve":
    case "rtc.providerCredentials.update":
    case "rtc.providerCredentials.revoke":
      return "RtcProviderCredentialResponse";
    case "rtc.providerProfiles.list":
      return "RtcProviderProfileListResponse";
    case "rtc.providerProfiles.create":
    case "rtc.providerProfiles.retrieve":
    case "rtc.providerProfiles.update":
    case "rtc.providerProfiles.disable":
    case "rtc.providerProfiles.capabilities.configure":
      return "RtcProviderProfileResponse";
    case "rtc.providerProfiles.verify":
      return "RtcProviderProfileVerifyResultResponse";
    case "rtc.providerRoutes.list":
      return "RtcProviderRouteListResponse";
    case "rtc.providerRoutes.create":
    case "rtc.providerRoutes.retrieve":
    case "rtc.providerRoutes.update":
    case "rtc.providerRoutes.disable":
      return "RtcProviderRouteResponse";
    case "rtc.qualitySamples.list":
      return "RtcQualitySampleListResponse";
    case "rtc.providerWebhooks.events.list":
      return "RtcProviderWebhookEventListResponse";
    case "rtc.providerWebhooks.events.receive":
      return "RtcProviderWebhookEventResponse";
    case "rtc.providerQueryJobs.create":
    case "rtc.providerQueryJobs.retrieve":
      return "RtcProviderQueryJobResponse";
    case "rtc.providerQueryJobs.snapshots.list":
      return "RtcProviderQuerySnapshotListResponse";
    case "rtc.providerPlugins.list":
      return "RtcProviderPluginListResponse";
    case "rtc.providerPlugins.retrieve":
      return "RtcProviderPluginResponse";
    case "rtc.providerSchemas.list":
      return "RtcProviderConfigSchemaListResponse";
    case "rtc.providerSchemas.retrieve":
      return "RtcProviderConfigSchemaResponse";
    default:
      return "SdkWorkResourceResponse";
  }
}

function operationSuccessResponseSchema(route) {
  const responseName = operationResponseSchemaName(route);
  return { $ref: `#/components/schemas/${responseName}` };
}

function jsonResponse(description, schema) {
  return {
    description,
    content: {
      "application/json": {
        schema,
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

function idempotencyParam() {
  return {
    name: "Idempotency-Key",
    in: "header",
    required: false,
    schema: { type: "string", minLength: 1, maxLength: 128 },
    description:
      "Client retry idempotency key scoped by tenant, organization, method, and path.",
  };
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

function isPaginatedListOperation(route) {
  return isListOperation(route) && !BOUNDED_CATALOG_LIST_OPERATIONS.has(route.operationId);
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
