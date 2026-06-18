//! SDKWork RTC app-api route manifest and executable router exports.

pub mod handlers;
pub mod paths;
pub mod routes;
pub mod service;
pub mod web_bootstrap;

pub use paths::{RTC_APP_ROUTES, RtcAppRoute, route_manifest_header};
pub use routes::build_sdkwork_rtc_app_api_router;
pub use service::*;
pub use web_bootstrap::{wrap_router_with_web_framework, wrap_router_with_web_framework_from_env};
