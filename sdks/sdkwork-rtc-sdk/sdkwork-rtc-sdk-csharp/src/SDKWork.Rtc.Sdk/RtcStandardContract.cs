namespace Sdkwork.Rtc.Sdk;

public static class RtcStandardContract
{
    public const string Symbol = "RtcStandardContract";
}

public interface RtcProviderDriver<TNativeClient>
{
    string ProviderKey { get; }

    RtcClient<TNativeClient> CreateClient();
}

public interface RtcDriverManager<TNativeClient>
{
    RtcProviderDriver<TNativeClient> ResolveDriver(string providerKey);
}

public interface RtcDataSource<TNativeClient>
{
    RtcClient<TNativeClient> CreateClient();
}

public interface RtcClient<TNativeClient>
{
    void Join();

    void Leave();

    void Publish(string trackId);

    void Unpublish(string trackId);

    void MuteAudio(bool muted);

    void MuteVideo(bool muted);

    TNativeClient? Unwrap();
}

public interface RtcRuntimeController<TNativeClient>
{
    void Join();

    void Leave();

    void Publish(string trackId);

    void Unpublish(string trackId);

    void MuteAudio(bool muted);

    void MuteVideo(bool muted);
}
