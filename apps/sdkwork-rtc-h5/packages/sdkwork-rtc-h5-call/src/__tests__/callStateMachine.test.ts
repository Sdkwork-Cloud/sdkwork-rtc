import { describe, expect, it } from "vitest";

import {
  canApplyRtcCallState,
  createIdleRtcCallSnapshot,
  createRtcRuntimeId,
  formatRtcCallDuration,
  isRtcCallActive,
  isTerminalRtcCallState,
  normalizeRtcIdSegment,
  resolveRtcCallPeerUserId,
  resolveRtcCallType,
  toRtcCallControllerState,
  toRecoveredRtcCallState,
} from "../domain/callTypes";

describe("call state machine", () => {
  it("allows forward progression only", () => {
    expect(canApplyRtcCallState("idle", "ringing")).toBe(true);
    expect(canApplyRtcCallState("ringing", "connecting")).toBe(true);
    expect(canApplyRtcCallState("connecting", "connected")).toBe(true);
    expect(canApplyRtcCallState("connected", "ringing")).toBe(false);
    expect(canApplyRtcCallState("ringing", "idle")).toBe(false);
  });

  it("allows any non-terminal state to move into a terminal state", () => {
    expect(canApplyRtcCallState("ringing", "ended")).toBe(true);
    expect(canApplyRtcCallState("connected", "rejected")).toBe(true);
    expect(canApplyRtcCallState("idle", "errored")).toBe(true);
  });

  it("treats terminal states as absorbing", () => {
    expect(canApplyRtcCallState("ended", "ringing")).toBe(false);
    expect(canApplyRtcCallState("rejected", "connected")).toBe(false);
    expect(canApplyRtcCallState("errored", "idle")).toBe(false);
    expect(canApplyRtcCallState("ended", "ended")).toBe(true);
  });

  it("maps controller states by direction", () => {
    expect(toRtcCallControllerState("ringing", "incoming")).toBe("incoming_ringing");
    expect(toRtcCallControllerState("ringing", "outgoing")).toBe("outgoing_ringing");
    expect(toRtcCallControllerState("connected", "incoming")).toBe("connected");
  });

  it("normalizes service states", () => {
    expect(toRecoveredRtcCallState("accepted")).toBe("connected");
    expect(toRecoveredRtcCallState("connecting")).toBe("connected");
    expect(toRecoveredRtcCallState("rejected")).toBe("rejected");
    expect(toRecoveredRtcCallState("canceled")).toBe("ended");
    expect(toRecoveredRtcCallState("started")).toBe("ringing");
    expect(toRecoveredRtcCallState("unknown-future-state")).toBe("ringing");
  });

  it("resolves call type from rtc mode", () => {
    expect(resolveRtcCallType("video")).toBe("video");
    expect(resolveRtcCallType("video_call")).toBe("video");
    expect(resolveRtcCallType("voice")).toBe("voice");
    expect(resolveRtcCallType(undefined)).toBe("voice");
  });

  it("resolves the peer as the initiator unless local initiated", () => {
    expect(resolveRtcCallPeerUserId({ initiatorId: "alice" }, "bob")).toBe("alice");
    expect(resolveRtcCallPeerUserId({ initiatorId: "alice" }, "alice")).toBeUndefined();
    expect(resolveRtcCallPeerUserId({}, "bob")).toBeUndefined();
  });
});

describe("call identity helpers", () => {
  it("normalizes id segments", () => {
    expect(normalizeRtcIdSegment("  hello world! ")).toBe("hello-world");
    expect(normalizeRtcIdSegment("")).toBe("");
  });

  it("builds runtime ids with a stable prefix", () => {
    const id = createRtcRuntimeId("call-h5", "conversation-42");
    expect(id.startsWith("call-h5-conversation-42-")).toBe(true);
    const fallback = createRtcRuntimeId("call-h5", "");
    expect(fallback.startsWith("call-h5-conversation-")).toBe(true);
  });
});

describe("call snapshot helpers", () => {
  it("creates a safe idle snapshot", () => {
    const snapshot = createIdleRtcCallSnapshot();
    expect(snapshot.state).toBe("idle");
    expect(snapshot.isAudioMuted).toBe(false);
    expect(snapshot.isVideoMuted).toBe(false);
  });

  it("detects active calls", () => {
    expect(isRtcCallActive({ rtcSessionId: "s1", controllerState: "connected", state: "connected" })).toBe(true);
    expect(isRtcCallActive({ rtcSessionId: "s1", controllerState: "watching", state: "idle" })).toBe(false);
    expect(isRtcCallActive({ rtcSessionId: "s1", controllerState: "ended", state: "ended" })).toBe(false);
    expect(isRtcCallActive({ controllerState: "idle", state: "idle" })).toBe(false);
  });

  it("detects terminal states", () => {
    expect(isTerminalRtcCallState("ended")).toBe(true);
    expect(isTerminalRtcCallState("rejected")).toBe(true);
    expect(isTerminalRtcCallState("errored")).toBe(true);
    expect(isTerminalRtcCallState("connected")).toBe(false);
  });

  it("formats durations", () => {
    expect(formatRtcCallDuration(0)).toBe("00:00");
    expect(formatRtcCallDuration(65)).toBe("01:05");
    expect(formatRtcCallDuration(3661)).toBe("01:01:01");
    expect(formatRtcCallDuration(-5)).toBe("00:00");
    expect(formatRtcCallDuration(Number.NaN)).toBe("00:00");
  });
});
