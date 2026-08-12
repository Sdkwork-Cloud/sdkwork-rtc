import { describe, expect, it } from "vitest";

import {
  createUnavailableRtcCallSignaling,
  RtcCallUnavailableError,
} from "../signaling/unavailableCallSignaling";

describe("unavailable signaling (fail-closed)", () => {
  const signaling = createUnavailableRtcCallSignaling();

  it("rejects every session mutation", async () => {
    await expect(
      signaling.startOutgoingCall({ rtcMode: "video", rtcSessionId: "s1" }),
    ).rejects.toBeInstanceOf(RtcCallUnavailableError);
    await expect(signaling.accept("s1")).rejects.toBeInstanceOf(RtcCallUnavailableError);
    await expect(signaling.reject("s1")).rejects.toBeInstanceOf(RtcCallUnavailableError);
    await expect(signaling.end("s1")).rejects.toBeInstanceOf(RtcCallUnavailableError);
    await expect(signaling.retrieve("s1")).rejects.toBeInstanceOf(RtcCallUnavailableError);
    await expect(
      signaling.issueParticipantCredential("s1", { participantId: "p1" }),
    ).rejects.toBeInstanceOf(RtcCallUnavailableError);
  });

  it("never reports an incoming call", async () => {
    await expect(
      signaling.watchIncoming({ conversationIds: [], principalId: "p1" }),
    ).resolves.toBeNull();
  });

  it("returns a no-op subscription", () => {
    const unsubscribe = signaling.subscribe(() => {
      throw new Error("must not be invoked");
    });
    expect(() => unsubscribe()).not.toThrow();
  });
});
