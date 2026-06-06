namespace Sdkwork.Rtc.Sdk;

using System.Collections.Generic;

public enum RtcProviderSupportStatus
{
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown,
}

public sealed record RtcProviderSupportStateRequest(
    string providerKey,
    bool builtin,
    bool official,
    bool registered
);

public sealed record RtcProviderSupport(
    string providerKey,
    RtcProviderSupportStatus status,
    bool builtin,
    bool official,
    bool registered
)
{
    public static readonly IReadOnlyList<string> RtcProviderSupportStatuses =
    [
        "builtin_registered",
        "official_registered",
        "official_unregistered",
        "unknown",
    ];

    public static RtcProviderSupportStatus ResolveRtcProviderSupportStatus(
        RtcProviderSupportStateRequest request
    )
    {
        if (request.official && request.registered)
        {
            return request.builtin
                ? RtcProviderSupportStatus.builtin_registered
                : RtcProviderSupportStatus.official_registered;
        }

        if (request.official)
        {
            return RtcProviderSupportStatus.official_unregistered;
        }

        return RtcProviderSupportStatus.unknown;
    }

    public static RtcProviderSupport CreateRtcProviderSupportState(
        RtcProviderSupportStateRequest request
    )
    {
        return new RtcProviderSupport(
            request.providerKey,
            ResolveRtcProviderSupportStatus(request),
            request.builtin,
            request.official,
            request.registered
        );
    }
}
