import { describe, expect, it, vi } from "vitest";

import {
  createRtcCallMediaService,
  resolveRtcCallMediaPublishKinds,
  type RtcCallMediaJoinOptions,
} from "../media/rtcCallMediaService";

interface MockEngine {
  setLocalVideoPlayer: ReturnType<typeof vi.fn>;
  setRemoteVideoPlayer: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function createMockClient(engine: MockEngine) {
  return {
    supportsProviderExtension: vi.fn((key: string) => key === "volcengine.native-client"),
    unwrap: vi.fn(() => ({ engine })),
    join: vi.fn(async () => ({ sessionId: "s1" })),
    leave: vi.fn(async () => ({})),
    publish: vi.fn(async () => ({ trackId: "t", kind: "audio", muted: false })),
    muteAudio: vi.fn(async () => ({ kind: "audio", muted: true })),
    muteVideo: vi.fn(async () => ({ kind: "video", muted: true })),
  };
}

function createMockDataSource(client: ReturnType<typeof createMockClient>) {
  return {
    createClient: vi.fn(async () => client),
  };
}

function buildJoinOptions(overrides: Partial<RtcCallMediaJoinOptions> = {}): RtcCallMediaJoinOptions {
  return {
    sessionId: "s1",
    roomId: "room-1",
    participantId: "p1",
    token: "token-1",
    rtcMode: "video",
    ...overrides,
  };
}

describe("rtcCallMediaService", () => {
  it("joins and publishes per rtc mode", async () => {
    const engine = {
      setLocalVideoPlayer: vi.fn(),
      setRemoteVideoPlayer: vi.fn(),
      play: vi.fn(async () => undefined),
      stop: vi.fn(),
    };
    const client = createMockClient(engine);
    const dataSource = createMockDataSource(client);
    const service = createRtcCallMediaService({ createDataSource: async () => dataSource as never });

    await service.join(buildJoinOptions());
    expect(client.join).toHaveBeenCalledWith({
      sessionId: "s1",
      roomId: "room-1",
      participantId: "p1",
      token: "token-1",
      metadata: { rtcMode: "video" },
    });

    await service.publish({ kinds: ["audio", "video"], sessionId: "s1" });
    expect(client.publish).toHaveBeenCalledTimes(2);
    // Duplicate publish of the same track is idempotent.
    await service.publish({ kinds: ["audio", "video"], sessionId: "s1" });
    expect(client.publish).toHaveBeenCalledTimes(2);

    expect(service.getStatus().connected).toBe(true);
    await service.leave();
    expect(client.leave).toHaveBeenCalledTimes(1);
    expect(service.getStatus().connected).toBe(false);
  });

  it("publishes only audio for voice calls", () => {
    expect(resolveRtcCallMediaPublishKinds(buildJoinOptions())).toEqual(["audio", "video"]);
    expect(
      resolveRtcCallMediaPublishKinds(buildJoinOptions({ rtcMode: "voice" })),
    ).toEqual(["audio"]);
    expect(
      resolveRtcCallMediaPublishKinds(buildJoinOptions({ rtcMode: undefined })),
    ).toEqual(["audio"]);
  });

  it("binds local and remote video through the provider native client", async () => {
    const engine = {
      setLocalVideoPlayer: vi.fn(),
      setRemoteVideoPlayer: vi.fn(),
      play: vi.fn(async () => undefined),
      stop: vi.fn(),
    };
    const client = createMockClient(engine);
    const dataSource = createMockDataSource(client);
    const service = createRtcCallMediaService({ createDataSource: async () => dataSource as never });

    await service.join(buildJoinOptions());
    const localElement = document.createElement("div");
    const remoteElement = document.createElement("div");
    await service.bindLocalVideoElement(localElement);
    await service.bindRemoteVideoElement("peer-1", remoteElement);

    expect(engine.setLocalVideoPlayer).toHaveBeenCalledTimes(1);
    expect(engine.setRemoteVideoPlayer).toHaveBeenCalledTimes(1);
    expect(engine.play).toHaveBeenCalledTimes(2);

    // Unbinding clears the remote binding.
    await service.bindRemoteVideoElement(null, null);
    expect(engine.stop).toHaveBeenCalled();
  });

  it("releases media when join fails", async () => {
    const client = createMockClient({
      setLocalVideoPlayer: vi.fn(),
      setRemoteVideoPlayer: vi.fn(),
      play: vi.fn(async () => undefined),
      stop: vi.fn(),
    });
    client.join.mockRejectedValueOnce(new Error("join rejected"));
    const dataSource = createMockDataSource(client);
    const service = createRtcCallMediaService({ createDataSource: async () => dataSource as never });

    await expect(service.join(buildJoinOptions())).rejects.toThrow("join rejected");
    expect(client.leave).toHaveBeenCalledTimes(1);
    expect(service.getStatus().connected).toBe(false);
  });

  it("mutes audio and video through the client", async () => {
    const engine = {
      setLocalVideoPlayer: vi.fn(),
      setRemoteVideoPlayer: vi.fn(),
      play: vi.fn(async () => undefined),
      stop: vi.fn(),
    };
    const client = createMockClient(engine);
    const dataSource = createMockDataSource(client);
    const service = createRtcCallMediaService({ createDataSource: async () => dataSource as never });
    await service.join(buildJoinOptions());

    await service.muteAudio(true);
    await service.muteVideo(true);
    expect(client.muteAudio).toHaveBeenCalledWith(true);
    expect(client.muteVideo).toHaveBeenCalledWith(true);
  });
});
