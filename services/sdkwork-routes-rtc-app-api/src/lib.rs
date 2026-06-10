//! SDKWork RTC app-api route manifest and executable router exports.

pub mod handlers;
pub mod paths;
pub mod routes;
pub mod service;

pub use paths::{RTC_APP_ROUTES, RtcAppRoute, route_manifest_header};
pub use routes::build_sdkwork_rtc_app_api_router;
pub use service::*;
