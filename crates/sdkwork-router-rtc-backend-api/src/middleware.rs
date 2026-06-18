use axum::{
    body::Body,
    http::{Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use sdkwork_rtc_app_context::{AppContext, AppContextError, resolve_app_context};

use crate::paths::{RTC_BACKEND_ROUTES, RtcBackendRoute};

const PROVIDER_WEBHOOK_RECEIVE_OPERATION_ID: &str = "rtc.providerWebhooks.events.receive";

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BackendAuthError {
    status: StatusCode,
    message: String,
}

impl BackendAuthError {
    fn unauthorized(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            message: message.into(),
        }
    }

    fn forbidden(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::FORBIDDEN,
            message: message.into(),
        }
    }
}

impl IntoResponse for BackendAuthError {
    fn into_response(self) -> Response {
        (
            self.status,
            axum::Json(serde_json::json!({
                "success": false,
                "message": self.message,
            })),
        )
            .into_response()
    }
}

pub async fn enforce_backend_route_auth(
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, BackendAuthError> {
    let method = request.method().as_str();
    let path = request.uri().path();
    let route = match match_backend_route(method, path) {
        Some(route) => route,
        None => return Ok(next.run(request).await),
    };

    if route.operation_id == PROVIDER_WEBHOOK_RECEIVE_OPERATION_ID {
        enforce_webhook_rate_limit(path)?;
        return Ok(next.run(request).await);
    }

    if request.extensions().get::<AppContext>().is_some() {
        return Ok(next.run(request).await);
    }

    let context = resolve_app_context(request.headers()).map_err(map_context_error)?;
    if !context.has_permission(route.permission) {
        return Err(BackendAuthError::forbidden(format!(
            "missing permission {}",
            route.permission
        )));
    }

    request.extensions_mut().insert(context);
    Ok(next.run(request).await)
}

fn map_context_error(error: AppContextError) -> BackendAuthError {
    if error.code() == "app_context_invalid" {
        BackendAuthError::unauthorized(error.message())
    } else {
        BackendAuthError::unauthorized(error.message())
    }
}

pub fn match_backend_route(method: &str, path: &str) -> Option<&'static RtcBackendRoute> {
    RTC_BACKEND_ROUTES
        .iter()
        .find(|route| route.method == method && path_matches(route.path, path))
}

fn path_matches(template: &str, path: &str) -> bool {
    let template_segments = template.split('/').filter(|segment| !segment.is_empty());
    let path_segments = path.split('/').filter(|segment| !segment.is_empty());
    let template_segments: Vec<&str> = template_segments.collect();
    let path_segments: Vec<&str> = path_segments.collect();
    if template_segments.len() != path_segments.len() {
        return false;
    }

    template_segments
        .iter()
        .zip(path_segments.iter())
        .all(|(template_segment, path_segment)| {
            template_segment.starts_with('{') || template_segment == path_segment
        })
}

fn enforce_webhook_rate_limit(path: &str) -> Result<(), BackendAuthError> {
    let provider = path
        .split('/')
        .nth(5)
        .filter(|value| !value.is_empty())
        .unwrap_or("unknown");
    if !WEBHOOK_RATE_LIMITER.allow(provider) {
        return Err(BackendAuthError {
            status: StatusCode::TOO_MANY_REQUESTS,
            message: format!("RTC provider webhook rate limit exceeded for provider {provider}"),
        });
    }
    Ok(())
}

struct WebhookRateLimiter {
    limit_per_minute: u32,
    buckets: std::sync::Mutex<std::collections::BTreeMap<String, RateBucket>>,
}

struct RateBucket {
    window_started_at: std::time::Instant,
    count: u32,
}

impl WebhookRateLimiter {
    fn new(limit_per_minute: u32) -> Self {
        Self {
            limit_per_minute,
            buckets: std::sync::Mutex::new(std::collections::BTreeMap::new()),
        }
    }

    fn allow(&self, key: &str) -> bool {
        let now = std::time::Instant::now();
        let mut buckets = self.buckets.lock().expect("webhook rate limiter lock");
        let bucket = buckets.entry(key.to_owned()).or_insert(RateBucket {
            window_started_at: now,
            count: 0,
        });
        if now.duration_since(bucket.window_started_at) >= std::time::Duration::from_secs(60) {
            bucket.window_started_at = now;
            bucket.count = 0;
        }
        if bucket.count >= self.limit_per_minute {
            return false;
        }
        bucket.count += 1;
        true
    }
}

static WEBHOOK_RATE_LIMITER: std::sync::LazyLock<WebhookRateLimiter> =
    std::sync::LazyLock::new(|| WebhookRateLimiter::new(120));

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backend_route_matching_supports_path_parameters() {
        let route = match_backend_route(
            "GET",
            "/backend/v3/api/rtc/media_sessions/session-1/completion_record",
        )
        .expect("route should match");
        assert_eq!(
            route.operation_id,
            "rtc.mediaSessions.completionRecord.retrieve"
        );
    }
}
