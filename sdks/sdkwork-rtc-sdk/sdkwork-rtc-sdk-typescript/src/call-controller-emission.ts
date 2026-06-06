import type { RtcCallSignal } from './call-types.js';
import type {
  RtcCallControllerEvent,
  RtcCallControllerEventHandler,
  RtcCallControllerSnapshot,
  RtcCallControllerSnapshotHandler,
  RtcIncomingCallInvitation,
} from './call-controller-models.js';

export function emitRtcCallControllerSnapshot(input: {
  snapshot: RtcCallControllerSnapshot;
  snapshotHandlers: Iterable<RtcCallControllerSnapshotHandler>;
  eventHandlers: Iterable<RtcCallControllerEventHandler>;
  onError(error: unknown): void;
}): RtcCallControllerSnapshot {
  for (const handler of input.snapshotHandlers) {
    handler(input.snapshot);
  }

  dispatchRtcCallControllerEvent(input.eventHandlers, {
    type: 'snapshot',
    snapshot: input.snapshot,
  }, input.onError);

  return input.snapshot;
}

export function emitRtcCallControllerSignal(input: {
  signal: RtcCallSignal;
  snapshot: RtcCallControllerSnapshot;
  eventHandlers: Iterable<RtcCallControllerEventHandler>;
  onError(error: unknown): void;
}): void {
  dispatchRtcCallControllerEvent(input.eventHandlers, {
    type: 'signal',
    signal: input.signal,
    snapshot: input.snapshot,
  }, input.onError);
}

export function emitRtcCallControllerIncomingInvitation(input: {
  invitation: RtcIncomingCallInvitation;
  snapshot: RtcCallControllerSnapshot;
  eventHandlers: Iterable<RtcCallControllerEventHandler>;
  onError(error: unknown): void;
}): void {
  dispatchRtcCallControllerEvent(input.eventHandlers, {
    type: 'incoming_invitation',
    invitation: input.invitation,
    snapshot: input.snapshot,
  }, input.onError);
}

function dispatchRtcCallControllerEvent(
  eventHandlers: Iterable<RtcCallControllerEventHandler>,
  event: RtcCallControllerEvent,
  onError: (error: unknown) => void,
): void {
  for (const handler of eventHandlers) {
    try {
      handler(event);
    } catch (error) {
      onError(error);
    }
  }
}
