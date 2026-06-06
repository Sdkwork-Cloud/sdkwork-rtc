package com.sdkwork.rtc.standard;

public final class RtcStandardContract {

  private RtcStandardContract() {
  }

  public interface RtcProviderDriver<TNativeClient> {
    String providerKey();

    RtcClient<TNativeClient> createClient();
  }

  public interface RtcDriverManager<TNativeClient> {
    RtcProviderDriver<TNativeClient> resolveDriver(String providerKey);
  }

  public interface RtcDataSource<TNativeClient> {
    RtcClient<TNativeClient> createClient();
  }

  public interface RtcClient<TNativeClient> {
    void join();

    void leave();

    void publish(String trackId);

    void unpublish(String trackId);

    void muteAudio(boolean muted);

    void muteVideo(boolean muted);

    TNativeClient unwrap();
  }

  public interface RtcRuntimeController<TNativeClient> {
    void join();

    void leave();

    void publish(String trackId);

    void unpublish(String trackId);

    void muteAudio(boolean muted);

    void muteVideo(boolean muted);
  }
}
