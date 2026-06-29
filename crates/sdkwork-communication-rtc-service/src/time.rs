pub fn utc_now_rfc3339_millis() -> String {
    sdkwork_utils_rust::format_datetime(sdkwork_utils_rust::now(), None)
}

pub fn rfc3339_age_ms(value: &str) -> Option<u64> {
    sdkwork_utils_rust::parse_datetime(value, None).map(|started| {
        sdkwork_utils_rust::now()
            .signed_duration_since(started)
            .num_milliseconds()
            .max(0) as u64
    })
}

pub fn issued_at_unix_seconds() -> u32 {
    sdkwork_utils_rust::now()
        .timestamp()
        .try_into()
        .unwrap_or(u32::MAX)
}

pub fn issued_at_unix_seconds_u64() -> u64 {
    sdkwork_utils_rust::now()
        .timestamp()
        .try_into()
        .unwrap_or(u64::MAX)
}

pub fn format_unix_seconds_rfc3339(seconds: u32) -> String {
    format_unix_timestamp_rfc3339(i64::from(seconds))
}

pub fn format_unix_seconds_rfc3339_u64(seconds: u64) -> String {
    format_unix_timestamp_rfc3339(i64::try_from(seconds).unwrap_or(i64::MAX))
}

fn format_unix_timestamp_rfc3339(seconds: i64) -> String {
    sdkwork_utils_rust::format_datetime(
        sdkwork_utils_rust::from_unix_millis(seconds.saturating_mul(1000))
            .expect("unix timestamp within chrono range"),
        None,
    )
}
