#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(root, "crates/sdkwork-router-rtc-backend-api/src/handlers.rs");
let content = readFileSync(path, "utf8");

if (!content.includes("use sdkwork_web_core::WebRequestContext")) {
  content = content.replace(
    "use sdkwork_rtc_app_context::AppContext;",
    "use sdkwork_rtc_app_context::AppContext;\nuse sdkwork_web_core::WebRequestContext;",
  );
}

content = content.replace(
  /pub fn ok\(data: T\) -> Self \{\s+Self \{\s+code: "ok"\.to_owned\(\),\s+message: "OK"\.to_owned\(\),\s+request_id: deterministic_request_id\(\),\s+data,\s+\}\s+\}/s,
  `pub fn ok(data: T, request_id: impl Into<String>) -> Self {
        Self {
            code: "ok".to_owned(),
            message: "OK".to_owned(),
            request_id: request_id.into(),
            data,
        }
    }`,
);

content = content.replace(
  /fn from_error\(error: &RtcBackendApiError\) -> Self \{\s+Self \{\s+code: error\.code\(\)\.to_owned\(\),\s+message: error\.message\(\)\.to_owned\(\),\s+request_id: deterministic_request_id\(\),\s+data: json!\(\{\}\),\s+\}\s+\}/s,
  `fn from_error(error: &RtcBackendApiError, request_id: impl Into<String>) -> Self {
        Self {
            code: error.code().to_owned(),
            message: error.message().to_owned(),
            request_id: request_id.into(),
            data: json!({}),
        }
    }`,
);

content = content.replaceAll(
  "    Extension(context): Extension<AppContext>,",
  "    Extension(web_context): Extension<WebRequestContext>,\n    Extension(context): Extension<AppContext>,",
);

for (const fn of [
  "list_provider_config_schemas",
  "get_provider_config_schema",
  "list_provider_plugins",
  "get_provider_plugin",
  "receive_provider_webhook_event",
]) {
  const needle = `pub async fn ${fn}(\n    State(service): State<Arc<dyn RtcBackendApiService>>,`;
  if (content.includes(needle) && !content.includes(`${needle}\n    Extension(web_context)`)) {
    content = content.replace(
      needle,
      `${needle}\n    Extension(web_context): Extension<WebRequestContext>,`,
    );
  }
}

const handlerBody =
  /\n\) -> Result<([\s\S]*?), RtcBackendHandlerError> \{\n    let result = ([\s\S]*?)\.await\?;\n    Ok\(Json\(RtcApiEnvelope::ok\(result\)\)\)\n\}/g;
content = content.replace(handlerBody, (match, ret, call) => {
  return `\n) -> Result<${ret}, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(&request_id, ${call}.await)?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}`;
});

content = content.replace(
  `#[derive(Debug)]
pub struct RtcBackendHandlerError(RtcBackendApiError);

impl From<RtcBackendApiError> for RtcBackendHandlerError {
    fn from(error: RtcBackendApiError) -> Self {
        Self(error)
    }
}

impl IntoResponse for RtcBackendHandlerError {
    fn into_response(self) -> Response {
        let status = self.0.status_code();
        (status, Json(RtcProblemEnvelope::from_error(&self.0))).into_response()
    }
}`,
  `#[derive(Debug)]
pub struct RtcBackendHandlerError {
    error: RtcBackendApiError,
    request_id: String,
}

impl RtcBackendHandlerError {
    fn from_api_error(error: RtcBackendApiError, request_id: String) -> Self {
        Self { error, request_id }
    }
}

impl IntoResponse for RtcBackendHandlerError {
    fn into_response(self) -> Response {
        let status = self.error.status_code();
        (
            status,
            Json(RtcProblemEnvelope::from_error(&self.error, self.request_id)),
        )
            .into_response()
    }
}

fn map_handler_error<T>(
    request_id: &str,
    result: Result<T, RtcBackendApiError>,
) -> Result<T, RtcBackendHandlerError> {
    result.map_err(|error| RtcBackendHandlerError::from_api_error(error, request_id.to_owned()))
}

fn envelope_request_id(web_context: &WebRequestContext) -> String {
    web_context.request_id.0.clone()
}`,
);

content = content.replace(
  /\nfn deterministic_request_id\(\) -> String \{\n    uuid::Uuid::new_v4\(\)\.to_string\(\)\n\}\n?/,
  "\n",
);

writeFileSync(path, content);
const count = (content.match(/envelope_request_id\(&web_context\)/g) ?? []).length;
process.stdout.write(`transformed ${count} backend handlers\n`);
