use axum::{
    body::Body,
    http::{Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use sdkwork_rtc_app_context::{AppContext, AppContextError, resolve_app_context};

use crate::paths::{RTC_APP_ROUTES, RtcAppRoute};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppAuthError {
    status: StatusCode,
    message: String,
}

impl AppAuthError {
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

impl IntoResponse for AppAuthError {
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

pub async fn enforce_app_route_auth(
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, AppAuthError> {
    let method = request.method().as_str();
    let path = request.uri().path();
    let route = match match_app_route(method, path) {
        Some(route) => route,
        None => return Ok(next.run(request).await),
    };

    if request.extensions().get::<AppContext>().is_some() {
        return Ok(next.run(request).await);
    }

    let context = resolve_app_context(request.headers()).map_err(map_context_error)?;
    if !context.has_permission(route.permission) {
        return Err(AppAuthError::forbidden(format!(
            "missing permission {}",
            route.permission
        )));
    }

    request.extensions_mut().insert(context);
    Ok(next.run(request).await)
}

fn map_context_error(error: AppContextError) -> AppAuthError {
    AppAuthError::unauthorized(error.message())
}

pub fn match_app_route(method: &str, path: &str) -> Option<&'static RtcAppRoute> {
    RTC_APP_ROUTES
        .iter()
        .find(|route| route.method == method && path_matches(route.path, path))
}

fn path_matches(template: &str, path: &str) -> bool {
    let template_segments: Vec<&str> = template
        .split('/')
        .filter(|segment| !segment.is_empty())
        .collect();
    let path_segments: Vec<&str> = path
        .split('/')
        .filter(|segment| !segment.is_empty())
        .collect();
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
