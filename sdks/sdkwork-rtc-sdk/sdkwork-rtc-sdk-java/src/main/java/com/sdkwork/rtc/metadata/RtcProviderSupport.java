package com.sdkwork.rtc.metadata;

import java.util.List;

public record RtcProviderSupport(
    String providerKey,
    RtcProviderSupportStatus status,
    boolean builtin,
    boolean official,
    boolean registered
) {

  public enum RtcProviderSupportStatus {
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown
  }

  public record RtcProviderSupportStateRequest(
      String providerKey,
      boolean builtin,
      boolean official,
      boolean registered
  ) {
  }

  public static final List<String> RTC_PROVIDER_SUPPORT_STATUSES = List.of(
      "builtin_registered",
      "official_registered",
      "official_unregistered",
      "unknown"
  );

  public static RtcProviderSupportStatus resolveRtcProviderSupportStatus(
      RtcProviderSupportStateRequest request
  ) {
    if (request.official() && request.registered()) {
      return request.builtin()
          ? RtcProviderSupportStatus.builtin_registered
          : RtcProviderSupportStatus.official_registered;
    }

    if (request.official()) {
      return RtcProviderSupportStatus.official_unregistered;
    }

    return RtcProviderSupportStatus.unknown;
  }

  public static RtcProviderSupport createRtcProviderSupportState(
      RtcProviderSupportStateRequest request
  ) {
    return new RtcProviderSupport(
        request.providerKey(),
        resolveRtcProviderSupportStatus(request),
        request.builtin(),
        request.official(),
        request.registered()
    );
  }
}
