//! SDKWork RTC backend-api route manifest and executable router exports.

pub mod handlers;
pub mod paths;
pub mod routes;
pub mod service;

pub use paths::{RTC_BACKEND_ROUTES, RtcBackendRoute, route_manifest_header};
pub use routes::build_sdkwork_rtc_backend_api_router;
pub use service::*;
