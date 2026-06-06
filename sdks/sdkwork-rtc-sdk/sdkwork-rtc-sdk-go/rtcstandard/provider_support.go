package rtcstandard

type RtcProviderSupportStateRequest struct {
    ProviderKey string
    Builtin     bool
    Official    bool
    Registered  bool
}

type RtcProviderSupport struct {
    ProviderKey string
    Status      string
    Builtin     bool
    Official    bool
    Registered  bool
}

var RtcProviderSupportStatuses = []string{
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
}

func ResolveRtcProviderSupportStatus(request RtcProviderSupportStateRequest) string {
    if request.Official && request.Registered {
        if request.Builtin {
            return "builtin_registered"
        }
        return "official_registered"
    }

    if request.Official {
        return "official_unregistered"
    }

    return "unknown"
}

func CreateRtcProviderSupportState(
    request RtcProviderSupportStateRequest,
) RtcProviderSupport {
    return RtcProviderSupport{
        ProviderKey: request.ProviderKey,
        Status:      ResolveRtcProviderSupportStatus(request),
        Builtin:     request.Builtin,
        Official:    request.Official,
        Registered:  request.Registered,
    }
}
