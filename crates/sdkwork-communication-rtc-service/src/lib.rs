pub mod completion;
pub mod constants;
pub mod domain;
pub mod error;
pub mod idempotency;
pub mod list_page;
pub mod list_window;
pub mod persistence;
pub mod scoped_list_query;
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
pub use list_page::{
    map_rtc_api_error_code, resolved_list_page_size, rtc_list_page_to_sdkwork_page_data,
    rtc_list_window_to_sdkwork_page_data, RtcListPage,
};
pub use list_window::{
    DEFAULT_LIST_PAGE_SIZE, MAX_LIST_PAGE_SIZE, RtcListWindow, RtcListWindowError,
    RtcListWindowParams, apply_list_window, list_window_sort, matches_query_tokens,
    resolve_list_limit, resolve_list_offset,
};
pub use persistence::*;
pub use scoped_list_query::RtcScopedListQuery;
pub use provider::*;
pub use provider_account::*;
pub use provider_capability::provider_descriptor_has_capability;
pub use provider_event::*;
pub use provider_profile::*;
pub use provider_recording_export::*;
pub use provider_route::*;
pub use provider_webhook_parse::*;
pub use runtime_environment::{
    require_signed_provider_configuration, rtc_allows_development_provider_placeholders,
    rtc_allows_in_memory_only_runtime, rtc_hydration_max_idempotency_records,
    rtc_hydration_max_media_sessions, rtc_hydration_max_provider_accounts,
    rtc_hydration_max_provider_applications,     rtc_hydration_max_provider_credentials, rtc_hydration_max_provider_profiles,
    rtc_hydration_max_provider_query_jobs, rtc_hydration_max_provider_query_snapshots,
    rtc_hydration_max_provider_routes, rtc_hydration_max_rooms, rtc_hydration_max_session_token_grants,
    rtc_hydration_max_webhook_events,
    provider_credential_signing_ready, rtc_persistence_required,
    rtc_requires_provider_webhook_timestamp, rtc_runtime_environment,
    validate_production_runtime_profile,
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
