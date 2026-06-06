import type {
  RtcCallSignal,
  RtcCallSignalSubscription,
  RtcCallSignalingAdapter,
} from './call-types.js';
import type {
  RtcSignalingLiveMessageContextLike,
  RtcSignalingRealtimeDispatcher,
} from './signaling-adapter.js';

export class RtcCallControllerSessionSubscriptionManager {
  readonly #signaling: RtcCallSignalingAdapter;
  readonly #onSignal: (signal: RtcCallSignal) => void | Promise<void>;
  #activeSessionId?: string;
  #activeSessionSubscription?: RtcCallSignalSubscription;

  constructor(input: {
    signaling: RtcCallSignalingAdapter;
    onSignal(signal: RtcCallSignal): void | Promise<void>;
  }) {
    this.#signaling = input.signaling;
    this.#onSignal = input.onSignal;
  }

  get activeSessionId(): string | undefined {
    return this.#activeSessionId;
  }

  async subscribe(rtcSessionId: string): Promise<void> {
    if (this.#activeSessionId === rtcSessionId && this.#activeSessionSubscription) {
      return;
    }

    const nextSubscription = await this.#signaling.subscribeSessionSignals(
      rtcSessionId,
      (signal) => {
        void this.#onSignal(signal);
      },
    );

    const previousSubscription = this.#activeSessionSubscription;
    this.#activeSessionId = rtcSessionId;
    this.#activeSessionSubscription = nextSubscription;
    previousSubscription?.unsubscribe();
  }

  clear(): void {
    this.#activeSessionSubscription?.unsubscribe();
    this.#activeSessionSubscription = undefined;
    this.#activeSessionId = undefined;
  }
}

export class RtcCallControllerConversationSubscriptionManager {
  readonly #realtimeDispatcher: RtcSignalingRealtimeDispatcher;
  readonly #onMessage:
    (message: unknown, context: RtcSignalingLiveMessageContextLike) => void | Promise<void>;
  readonly #subscriptionsByConversationId = new Map<
    string,
    RtcCallSignalSubscription
  >();

  constructor(input: {
    realtimeDispatcher: RtcSignalingRealtimeDispatcher;
    onMessage(message: unknown, context: RtcSignalingLiveMessageContextLike): void | Promise<void>;
  }) {
    this.#realtimeDispatcher = input.realtimeDispatcher;
    this.#onMessage = input.onMessage;
  }

  async reconnect(conversationIds: readonly string[]): Promise<void> {
    const nextConversationIds = new Set(conversationIds.map(String));

    for (const [conversationId, subscription] of this.#subscriptionsByConversationId) {
      if (nextConversationIds.has(conversationId)) {
        continue;
      }

      subscription.unsubscribe();
      this.#subscriptionsByConversationId.delete(conversationId);
    }

    for (const conversationId of nextConversationIds) {
      if (this.#subscriptionsByConversationId.has(conversationId)) {
        continue;
      }

      const subscription = await this.#realtimeDispatcher.subscribeConversationSignals(
        conversationId,
        (message, context) => {
          void this.#onMessage(message, context);
        },
      );
      this.#subscriptionsByConversationId.set(conversationId, subscription);
    }
  }

  disconnect(): void {
    for (const subscription of this.#subscriptionsByConversationId.values()) {
      subscription.unsubscribe();
    }
    this.#subscriptionsByConversationId.clear();
  }
}
