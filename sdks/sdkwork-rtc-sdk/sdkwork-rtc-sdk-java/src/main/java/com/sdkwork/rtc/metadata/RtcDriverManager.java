package com.sdkwork.rtc.metadata;

import java.util.List;

public final class RtcDriverManager {

  public RtcProviderSelection resolveSelection(
      RtcProviderSelection.RtcProviderSelectionRequest request
  ) {
    return resolveSelection(request, RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY);
  }

  public RtcProviderSelection resolveSelection(
      RtcProviderSelection.RtcProviderSelectionRequest request,
      String defaultProviderKey
  ) {
    return RtcProviderSelection.resolveRtcProviderSelection(request, defaultProviderKey);
  }

  public RtcProviderSupport describeProviderSupport(String providerKey) {
    var official = RtcProviderCatalog.getRtcProviderByProviderKey(providerKey).isPresent();
    var activation = RtcProviderActivationCatalog.getRtcProviderActivationByProviderKey(providerKey);

    return RtcProviderSupport.createRtcProviderSupportState(
        new RtcProviderSupport.RtcProviderSupportStateRequest(
            providerKey,
            activation
                .map(RtcProviderActivationCatalog.RtcProviderActivationCatalogEntry::builtin)
                .orElse(false),
            official,
            activation
                .map(RtcProviderActivationCatalog.RtcProviderActivationCatalogEntry::runtimeBridge)
                .orElse(false)
        )
    );
  }

  public List<RtcProviderSupport> listProviderSupport() {
    return RtcProviderCatalog.ENTRIES.stream()
        .map(entry -> describeProviderSupport(entry.providerKey()))
        .toList();
  }
}
