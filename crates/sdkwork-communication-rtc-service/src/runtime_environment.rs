/// RTC runtime deployment profile helpers shared by service host and API server.
pub fn rtc_runtime_environment() -> String {
    std::env::var("SDKWORK_RTC_ENVIRONMENT")
        .or_else(|_| std::env::var("SDKWORK_ENVIRONMENT"))
        .unwrap_or_else(|_| "development".to_owned())
        .to_ascii_lowercase()
}

pub fn rtc_allows_in_memory_only_runtime() -> bool {
    matches!(
        rtc_runtime_environment().as_str(),
        "development" | "dev" | "local" | "test"
    )
}

pub fn rtc_persistence_required() -> bool {
    !rtc_allows_in_memory_only_runtime()
}

pub fn rtc_requires_provider_webhook_timestamp() -> bool {
    !rtc_allows_in_memory_only_runtime()
}
