package com.sdkwork.rtc.metadata;

import java.util.List;

public record RtcProviderSelection(String providerKey, RtcProviderSelectionSource source) {

  public enum RtcProviderSelectionSource {
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider
  }

  public record ParsedRtcProviderUrl(String providerKey, String rawUrl) {
  }

  public record RtcProviderSelectionRequest(
      String providerUrl,
      String providerKey,
      String tenantOverrideProviderKey,
      String deploymentProfileProviderKey
  ) {
  }

  public static final List<String> RTC_PROVIDER_SELECTION_SOURCES = List.of(
      "provider_url",
      "provider_key",
      "tenant_override",
      "deployment_profile",
      "default_provider"
  );

  public static final List<String> RTC_PROVIDER_SELECTION_PRECEDENCE = List.of(
      "provider_url",
      "provider_key",
      "tenant_override",
      "deployment_profile",
      "default_provider"
  );

  public static ParsedRtcProviderUrl parseRtcProviderUrl(String providerUrl) {
    var trimmed = providerUrl.trim();
    if (!trimmed.startsWith("rtc:") || !trimmed.contains("://")) {
      throw new IllegalArgumentException("Invalid RTC provider URL: " + providerUrl);
    }

    return new ParsedRtcProviderUrl(
        trimmed.substring(4, trimmed.indexOf("://")).toLowerCase(),
        providerUrl
    );
  }

  public static RtcProviderSelection resolveRtcProviderSelection(
      RtcProviderSelectionRequest request
  ) {
    return resolveRtcProviderSelection(request, RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY);
  }

  public static RtcProviderSelection resolveRtcProviderSelection(
      RtcProviderSelectionRequest request,
      String defaultProviderKey
  ) {
    var resolvedRequest = request == null
        ? new RtcProviderSelectionRequest(null, null, null, null)
        : request;

    if (hasText(resolvedRequest.providerUrl())) {
      return new RtcProviderSelection(
          parseRtcProviderUrl(resolvedRequest.providerUrl()).providerKey(),
          RtcProviderSelectionSource.provider_url
      );
    }

    if (hasText(resolvedRequest.providerKey())) {
      return new RtcProviderSelection(
          resolvedRequest.providerKey().trim(),
          RtcProviderSelectionSource.provider_key
      );
    }

    if (hasText(resolvedRequest.tenantOverrideProviderKey())) {
      return new RtcProviderSelection(
          resolvedRequest.tenantOverrideProviderKey().trim(),
          RtcProviderSelectionSource.tenant_override
      );
    }

    if (hasText(resolvedRequest.deploymentProfileProviderKey())) {
      return new RtcProviderSelection(
          resolvedRequest.deploymentProfileProviderKey().trim(),
          RtcProviderSelectionSource.deployment_profile
      );
    }

    return new RtcProviderSelection(
        defaultProviderKey,
        RtcProviderSelectionSource.default_provider
    );
  }

  private static boolean hasText(String value) {
    return value != null && !value.trim().isEmpty();
  }
}
