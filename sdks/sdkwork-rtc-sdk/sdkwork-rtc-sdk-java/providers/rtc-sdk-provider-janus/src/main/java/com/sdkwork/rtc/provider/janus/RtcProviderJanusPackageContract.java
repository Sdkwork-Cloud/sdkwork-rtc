package com.sdkwork.rtc.provider.janus;

/**
 * Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
 */
public final class RtcProviderJanusPackageContract {
  public static final String PROVIDER_KEY = "janus";
  public static final String PLUGIN_ID = "rtc-janus";
  public static final String DRIVER_ID = "sdkwork-rtc-driver-janus";
  public static final String PACKAGE_IDENTITY = "com.sdkwork:rtc-sdk-provider-janus";
  public static final String STATUS = "future-runtime-bridge-only";
  public static final String RUNTIME_BRIDGE_STATUS = "reserved";
  public static final boolean ROOT_PUBLIC = false;

  private RtcProviderJanusPackageContract() {
  }
}
