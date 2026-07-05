#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const handlersPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../crates/sdkwork-routes-rtc-backend-api/src/handlers.rs",
);
let content = readFileSync(handlersPath, "utf8");

const header = `use std::sync::Arc;

use axum::{
    Extension, Json,
    body::Bytes,
    extract::{Path, Query, State},
    http::HeaderMap,
    response::Response,
};
use sdkwork_communication_rtc_service::{
    ProviderConfigSchema, ProviderPluginDescriptor, RtcMediaArtifact, RtcMediaSession,
    RtcMediaSessionCompletionRecord, RtcProviderAccount, RtcProviderAccountCommand,
    RtcProviderAccountDisableRequest, RtcProviderApplication, RtcProviderApplicationCommand,
    RtcProviderApplicationDisableRequest, RtcProviderCredential, RtcProviderCredentialCommand,
    RtcProviderCredentialRevokeRequest, RtcProviderProfile, RtcProviderProfileCommand,
    RtcProviderProfileDisableRequest, RtcProviderProfileVerifyRequest,
    RtcProviderProfileVerifyResult, RtcProviderQueryJobRecord, RtcProviderWebhookEventRecord,
    RtcQualitySample, RtcRoom,
};
use sdkwork_rtc_app_context::AppContext;
use sdkwork_web_core::WebRequestContext;

use crate::responses::{
    api_catalog_list, api_created, api_item, api_list_payload, list_params_from_backend_query,
    map_handler_error, resolved_trace_id, RtcBackendHandlerError,
};
use crate::service::{
    RtcBackendApiService, RtcBackendListQuery, RtcBackendListRequest, RtcCloseMediaSessionRequest,
    RtcCreateRoomCommand, RtcProviderQueryJobCreateRequest, RtcProviderRoute,
    RtcProviderRouteCommand, RtcProviderRouteDisableRequest, RtcProviderWebhookIngress,
};

`;

const listHandlers = new Set([
  "list_rooms",
  "list_media_sessions",
  "list_backend_provider_profiles",
  "list_provider_accounts",
  "list_provider_applications",
  "list_provider_credentials",
  "list_provider_routes",
  "list_media_artifacts",
  "list_quality_samples",
  "list_provider_webhook_events",
  "list_provider_query_snapshots",
]);

const catalogHandlers = new Set([
  "list_provider_plugins",
  "list_provider_config_schemas",
]);

const createHandlers = new Set([
  "create_room",
  "create_provider_account",
  "create_provider_application",
  "create_provider_credential",
  "create_backend_provider_profile",
  "create_provider_route",
  "create_media_session",
  "create_provider_query_job",
  "configure_provider_capabilities",
]);

const start = content.indexOf("pub async fn list_rooms");
content = header + content.slice(start);

content = content.replace(
  /-> Result<Json<RtcApiEnvelope<[^>]+>>, RtcBackendHandlerError>/g,
  "-> Result<Response, RtcBackendHandlerError>",
);

content = content.replace(
  /let request_id = envelope_request_id\(&web_context\);\n    let result = map_handler_error\(\n        &request_id,\n        ([\s\S]*?)\.await,\n    \)\?;\n    Ok\(Json\(RtcApiEnvelope::ok\(result, request_id\)\)\)/g,
  "let trace_id = resolved_trace_id(&web_context);\n    let result = map_handler_error(\n        &trace_id,\n        $1.await,\n    )?;\n    __OK__($1)",
);

content = content.replace(
  /pub async fn (\w+)\(([\s\S]*?\) -> Result<Response, RtcBackendHandlerError> \{[\s\S]*?)__OK__\([^)]*\)/g,
  (block, fnName, body) => {
    if (listHandlers.has(fnName)) {
      return `pub async fn ${fnName}(${body}Ok(api_list_payload(result.items, result.next_cursor, &list_params_from_backend_query(&query), &trace_id))`;
    }
    if (catalogHandlers.has(fnName)) {
      return `pub async fn ${fnName}(${body}Ok(api_catalog_list(result, &trace_id))`;
    }
    if (createHandlers.has(fnName)) {
      return `pub async fn ${fnName}(${body}Ok(api_created(result, &trace_id))`;
    }
    return `pub async fn ${fnName}(${body}Ok(api_item(result, &trace_id))`;
  },
);

content = content.replace(
  /\n#\[derive\(Debug\)\]\npub struct RtcBackendHandlerError[\s\S]*?fn envelope_request_id[\s\S]*?\}\n\nfn list_request/,
  "\n\nfn list_request",
);

content = content.replace(
  "fn list_request(context: &AppContext, query: RtcBackendListQuery)",
  "fn list_request(context: &AppContext, query: &RtcBackendListQuery)",
);
content = content.replaceAll("list_request(&context, query)", "list_request(&context, &query)");

writeFileSync(handlersPath, content);
process.stdout.write(`backend handlers migrated\n`);
