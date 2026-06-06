public enum RtcStandardContract {
    public static let symbol = "RtcStandardContract"
}

public protocol RtcProviderDriver {
    var providerKey: String { get }
}

public protocol RtcDriverManager {
    func resolveDriver(providerKey: String)
}

public protocol RtcDataSource {
    func createClient() async throws
}

public protocol RtcClient {
    func join() async throws
    func leave() async throws
    func publish(trackId: String) async throws
    func unpublish(trackId: String) async throws
    func muteAudio(muted: Bool) async throws
    func muteVideo(muted: Bool) async throws
    func unwrap() -> Any?
}

public protocol RtcRuntimeController {
    func join() async throws
    func leave() async throws
    func publish(trackId: String) async throws
    func unpublish(trackId: String) async throws
    func muteAudio(muted: Bool) async throws
    func muteVideo(muted: Bool) async throws
}
