namespace Sdkwork.Rtc.Sdk;

using System;
using System.Collections.Generic;

public enum RtcProviderSelectionSource
{
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider,
}

public sealed record ParsedRtcProviderUrl(string providerKey, string rawUrl);

public sealed record RtcProviderSelectionRequest(
    string? providerUrl = null,
    string? providerKey = null,
    string? tenantOverrideProviderKey = null,
    string? deploymentProfileProviderKey = null
);

public sealed record RtcProviderSelection(
    string providerKey,
    RtcProviderSelectionSource source
)
{
    public static readonly IReadOnlyList<string> RtcProviderSelectionSources =
    [
        "provider_url",
        "provider_key",
        "tenant_override",
        "deployment_profile",
        "default_provider",
    ];

    public static readonly IReadOnlyList<string> RtcProviderSelectionPrecedence =
    [
        "provider_url",
        "provider_key",
        "tenant_override",
        "deployment_profile",
        "default_provider",
    ];

    public static ParsedRtcProviderUrl ParseRtcProviderUrl(string providerUrl)
    {
        var trimmed = providerUrl.Trim();
        if (!trimmed.StartsWith("rtc:", StringComparison.OrdinalIgnoreCase) || !trimmed.Contains("://", StringComparison.Ordinal))
        {
            throw new ArgumentException($"Invalid RTC provider URL: {providerUrl}", nameof(providerUrl));
        }

        return new ParsedRtcProviderUrl(
            trimmed[4..trimmed.IndexOf("://", StringComparison.Ordinal)].ToLowerInvariant(),
            providerUrl
        );
    }

    public static RtcProviderSelection ResolveRtcProviderSelection(
        RtcProviderSelectionRequest? request = null,
        string defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    )
    {
        request ??= new RtcProviderSelectionRequest();

        if (HasText(request.providerUrl))
        {
            return new RtcProviderSelection(
                ParseRtcProviderUrl(request.providerUrl!).providerKey,
                RtcProviderSelectionSource.provider_url
            );
        }

        if (HasText(request.providerKey))
        {
            return new RtcProviderSelection(
                request.providerKey!.Trim(),
                RtcProviderSelectionSource.provider_key
            );
        }

        if (HasText(request.tenantOverrideProviderKey))
        {
            return new RtcProviderSelection(
                request.tenantOverrideProviderKey!.Trim(),
                RtcProviderSelectionSource.tenant_override
            );
        }

        if (HasText(request.deploymentProfileProviderKey))
        {
            return new RtcProviderSelection(
                request.deploymentProfileProviderKey!.Trim(),
                RtcProviderSelectionSource.deployment_profile
            );
        }

        return new RtcProviderSelection(
            defaultProviderKey,
            RtcProviderSelectionSource.default_provider
        );
    }

    private static bool HasText(string? value) => !string.IsNullOrWhiteSpace(value);
}
