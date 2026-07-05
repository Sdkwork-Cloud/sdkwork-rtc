pub mod completion;
pub mod constants;
pub mod domain;
pub mod error;
pub mod idempotency;
pub mod list_window;
pub mod persistence;
pub mod provider;
pub mod provider_account;
pub mod provider_capability;
pub mod provider_event;
pub mod provider_profile;
pub mod provider_recording_export;
pub mod provider_route;
pub mod provider_webhook_parse;
pub mod runtime_environment;
pub mod session_tracker;
pub mod time;
pub mod webhook_signature;

pub use completion::*;
pub use constants::*;
pub use domain::*;
pub use error::*;
pub use idempotency::*;
pub use list_window::{
    DEFAULT_LIST_PAGE_SIZE, MAX_LIST_PAGE_SIZE, RtcListWindow, RtcListWindowError,
    RtcListWindowParams, apply_list_window, list_window_sort, matches_query_tokens,
    resolve_list_limit, resolve_list_offset,
};
pub use persistence::*;
pub use provider::*;
pub use provider_account::*;
pub use provider_capability::provider_descriptor_has_capability;
pub use provider_event::*;
pub use provider_profile::*;
pub use provider_recording_export::*;
pub use provider_route::*;
pub use provider_webhook_parse::*;
pub use runtime_environment::{
    rtc_allows_in_memory_only_runtime, rtc_persistence_required,
    rtc_requires_provider_webhook_timestamp, rtc_runtime_environment,
};
pub use session_tracker::RtcActiveSessionTracker;
pub use time::*;
pub use webhook_signature::{
    RtcProviderWebhookVerifyRequest, required_signature_header, sign_hmac_sha256_payload_hex,
    strip_bearer_prefix, validate_provider_webhook_freshness, verify_hmac_sha256_payload,
    verify_livekit_webhook_signature, verify_provider_webhook_signature_hmac,
};

#[cfg(test)]
mod contract_tests {
    use super::*;

    include!("contract_tests.rs");
}
