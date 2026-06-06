package rtcstandard

import "strings"

type ParsedRtcProviderUrl struct {
    ProviderKey string
    RawUrl      string
}

type RtcProviderSelection struct {
    ProviderKey string
    Source      string
}

type RtcProviderSelectionRequest struct {
    ProviderUrl                  string
    ProviderKey                  string
    TenantOverrideProviderKey    string
    DeploymentProfileProviderKey string
}

var RtcProviderSelectionSources = []string{
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
}

var RtcProviderSelectionPrecedence = []string{
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
}

func hasRtcProviderSelectionText(value string) bool {
    return strings.TrimSpace(value) != ""
}

func ParseRtcProviderUrl(providerUrl string) ParsedRtcProviderUrl {
    trimmed := strings.TrimSpace(providerUrl)
    if !strings.HasPrefix(trimmed, "rtc:") || !strings.Contains(trimmed, "://") {
        panic("Invalid RTC provider URL: " + providerUrl)
    }

    withoutPrefix := strings.TrimPrefix(trimmed, "rtc:")
    providerKey, _, _ := strings.Cut(withoutPrefix, "://")

    return ParsedRtcProviderUrl{
        ProviderKey: strings.ToLower(providerKey),
        RawUrl:      providerUrl,
    }
}

func ResolveRtcProviderSelection(
    request RtcProviderSelectionRequest,
    defaultProviderKey string,
) RtcProviderSelection {
    if hasRtcProviderSelectionText(request.ProviderUrl) {
        return RtcProviderSelection{
            ProviderKey: ParseRtcProviderUrl(request.ProviderUrl).ProviderKey,
            Source:      "provider_url",
        }
    }

    if hasRtcProviderSelectionText(request.ProviderKey) {
        return RtcProviderSelection{
            ProviderKey: strings.TrimSpace(request.ProviderKey),
            Source:      "provider_key",
        }
    }

    if hasRtcProviderSelectionText(request.TenantOverrideProviderKey) {
        return RtcProviderSelection{
            ProviderKey: strings.TrimSpace(request.TenantOverrideProviderKey),
            Source:      "tenant_override",
        }
    }

    if hasRtcProviderSelectionText(request.DeploymentProfileProviderKey) {
        return RtcProviderSelection{
            ProviderKey: strings.TrimSpace(request.DeploymentProfileProviderKey),
            Source:      "deployment_profile",
        }
    }

    resolvedDefaultProviderKey := defaultProviderKey
    if !hasRtcProviderSelectionText(resolvedDefaultProviderKey) {
        resolvedDefaultProviderKey = DEFAULT_RTC_PROVIDER_KEY
    }

    return RtcProviderSelection{
        ProviderKey: resolvedDefaultProviderKey,
        Source:      "default_provider",
    }
}
