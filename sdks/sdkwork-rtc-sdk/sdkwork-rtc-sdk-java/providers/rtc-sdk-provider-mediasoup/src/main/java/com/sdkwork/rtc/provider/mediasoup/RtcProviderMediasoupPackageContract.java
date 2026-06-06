package com.sdkwork.rtc.provider.mediasoup;

/**
 * Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
 */
public final class RtcProviderMediasoupPackageContract {
  public static final String PROVIDER_KEY = "mediasoup";
  public static final String PLUGIN_ID = "rtc-mediasoup";
  public static final String DRIVER_ID = "sdkwork-rtc-driver-mediasoup";
  public static final String PACKAGE_IDENTITY = "com.sdkwork:rtc-sdk-provider-mediasoup";
  public static final String STATUS = "future-runtime-bridge-only";
  public static final String RUNTIME_BRIDGE_STATUS = "reserved";
  public static final boolean ROOT_PUBLIC = false;

  private RtcProviderMediasoupPackageContract() {
  }
}
