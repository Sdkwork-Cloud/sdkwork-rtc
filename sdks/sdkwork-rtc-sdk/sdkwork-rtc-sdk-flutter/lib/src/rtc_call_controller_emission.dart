import 'rtc_call_controller_models.dart';
import 'rtc_call_types.dart';

RtcCallControllerSnapshot emitRtcCallControllerSnapshot({
  required RtcCallControllerSnapshot snapshot,
  required Iterable<RtcCallControllerSnapshotHandler> snapshotHandlers,
  required Iterable<RtcCallControllerEventHandler> eventHandlers,
  required void Function(Object error) onError,
}) {
  for (final handler in snapshotHandlers) {
    handler(snapshot);
  }

  _dispatchRtcCallControllerEvent(
    eventHandlers,
    RtcCallControllerEvent(
      type: RtcCallControllerEventType.snapshot,
      snapshot: snapshot,
    ),
    onError,
  );

  return snapshot;
}

void emitRtcCallControllerSignal({
  required RtcCallSignal signal,
  required RtcCallControllerSnapshot snapshot,
  required Iterable<RtcCallControllerEventHandler> eventHandlers,
  required void Function(Object error) onError,
}) {
  _dispatchRtcCallControllerEvent(
    eventHandlers,
    RtcCallControllerEvent(
      type: RtcCallControllerEventType.signal,
      signal: signal,
      snapshot: snapshot,
    ),
    onError,
  );
}

void emitRtcCallControllerIncomingInvitation({
  required RtcIncomingCallInvitation invitation,
  required RtcCallControllerSnapshot snapshot,
  required Iterable<RtcCallControllerEventHandler> eventHandlers,
  required void Function(Object error) onError,
}) {
  _dispatchRtcCallControllerEvent(
    eventHandlers,
    RtcCallControllerEvent(
      type: RtcCallControllerEventType.incomingInvitation,
      invitation: invitation,
      snapshot: snapshot,
    ),
    onError,
  );
}

void _dispatchRtcCallControllerEvent(
  Iterable<RtcCallControllerEventHandler> eventHandlers,
  RtcCallControllerEvent event,
  void Function(Object error) onError,
) {
  for (final handler in eventHandlers) {
    try {
      handler(event);
    } catch (error) {
      onError(error);
    }
  }
}
