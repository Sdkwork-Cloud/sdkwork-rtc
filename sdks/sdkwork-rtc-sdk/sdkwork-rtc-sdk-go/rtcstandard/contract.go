package rtcstandard

type RtcStandardContract struct{}

type RtcProviderDriver interface {
    ProviderKey() string
}

type RtcDriverManager interface {
    ResolveDriver(providerKey string)
}

type RtcDataSource interface {
    CreateClient()
}

type RtcClient interface {
    Join() error
    Leave() error
    Publish(trackID string) error
    Unpublish(trackID string) error
    MuteAudio(muted bool) error
    MuteVideo(muted bool) error
    Unwrap() any
}

type RtcRuntimeController interface {
    Join() error
    Leave() error
    Publish(trackID string) error
    Unpublish(trackID string) error
    MuteAudio(muted bool) error
    MuteVideo(muted bool) error
}
