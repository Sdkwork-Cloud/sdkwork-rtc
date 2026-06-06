use crate::provider_catalog::DEFAULT_RTC_PROVIDER_KEY;

#[allow(non_snake_case)]
pub struct ParsedRtcProviderUrl {
    pub providerKey: String,
    pub rawUrl: String,
}

#[allow(non_snake_case)]
pub struct RtcProviderSelection {
    pub providerKey: String,
    pub source: &'static str,
}

#[derive(Default)]
#[allow(non_snake_case)]
pub struct RtcProviderSelectionRequest {
    pub providerUrl: Option<String>,
    pub providerKey: Option<String>,
    pub tenantOverrideProviderKey: Option<String>,
    pub deploymentProfileProviderKey: Option<String>,
}

pub const RTC_PROVIDER_SELECTION_SOURCES: [&str; 5] = [
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
];

pub const RTC_PROVIDER_SELECTION_PRECEDENCE: [&str; 5] = [
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
];

fn has_rtc_provider_selection_text(value: &Option<String>) -> bool {
    value.as_ref().is_some_and(|entry| !entry.trim().is_empty())
}

pub fn parse_rtc_provider_url(provider_url: &str) -> ParsedRtcProviderUrl {
    let trimmed = provider_url.trim();
    if !trimmed.starts_with("rtc:") || !trimmed.contains("://") {
        panic!("Invalid RTC provider URL: {provider_url}");
    }

    let provider_key = trimmed[4..]
        .split("://")
        .next()
        .unwrap_or(DEFAULT_RTC_PROVIDER_KEY)
        .to_lowercase();

    ParsedRtcProviderUrl {
        providerKey: provider_key,
        rawUrl: provider_url.to_string(),
    }
}

pub fn resolve_rtc_provider_selection(
    request: &RtcProviderSelectionRequest,
    default_provider_key: Option<&str>,
) -> RtcProviderSelection {
    if has_rtc_provider_selection_text(&request.providerUrl) {
        return RtcProviderSelection {
            providerKey: parse_rtc_provider_url(request.providerUrl.as_deref().unwrap()).providerKey,
            source: "provider_url",
        };
    }

    if has_rtc_provider_selection_text(&request.providerKey) {
        return RtcProviderSelection {
            providerKey: request.providerKey.as_deref().unwrap().trim().to_string(),
            source: "provider_key",
        };
    }

    if has_rtc_provider_selection_text(&request.tenantOverrideProviderKey) {
        return RtcProviderSelection {
            providerKey: request
                .tenantOverrideProviderKey
                .as_deref()
                .unwrap()
                .trim()
                .to_string(),
            source: "tenant_override",
        };
    }

    if has_rtc_provider_selection_text(&request.deploymentProfileProviderKey) {
        return RtcProviderSelection {
            providerKey: request
                .deploymentProfileProviderKey
                .as_deref()
                .unwrap()
                .trim()
                .to_string(),
            source: "deployment_profile",
        };
    }

    RtcProviderSelection {
        providerKey: default_provider_key
            .unwrap_or(DEFAULT_RTC_PROVIDER_KEY)
            .to_string(),
        source: "default_provider",
    }
}
