#[allow(non_snake_case)]
pub struct RtcProviderSupport {
    pub providerKey: String,
    pub status: &'static str,
    pub builtin: bool,
    pub official: bool,
    pub registered: bool,
}

#[allow(non_snake_case)]
pub struct RtcProviderSupportStateRequest {
    pub providerKey: String,
    pub builtin: bool,
    pub official: bool,
    pub registered: bool,
}

pub const RTC_PROVIDER_SUPPORT_STATUSES: [&str; 4] = [
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
];

pub fn resolve_rtc_provider_support_status(
    request: &RtcProviderSupportStateRequest,
) -> &'static str {
    if request.official && request.registered {
        return if request.builtin {
            "builtin_registered"
        } else {
            "official_registered"
        };
    }

    if request.official {
        return "official_unregistered";
    }

    "unknown"
}

pub fn create_rtc_provider_support_state(
    request: RtcProviderSupportStateRequest,
) -> RtcProviderSupport {
    let status = resolve_rtc_provider_support_status(&request);

    RtcProviderSupport {
        providerKey: request.providerKey,
        status,
        builtin: request.builtin,
        official: request.official,
        registered: request.registered,
    }
}
