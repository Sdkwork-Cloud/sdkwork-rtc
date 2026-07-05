//! SDKWork RTC backend-api route manifest and executable router exports.

use std::sync::Arc;

use axum::Router;

pub mod handlers;
pub mod paths;
pub mod responses;
pub mod routes;
pub mod service;
pub mod web_bootstrap;

pub use paths::{RTC_BACKEND_ROUTES, RtcBackendRoute, match_backend_route, route_manifest_header};
pub use routes::build_sdkwork_rtc_backend_api_router;
pub use service::*;
pub use web_bootstrap::{wrap_router_with_web_framework, wrap_router_with_web_framework_from_env};

pub fn gateway_mount(service: Arc<dyn RtcBackendApiService>) -> Router {
    build_sdkwork_rtc_backend_api_router(service)
}
