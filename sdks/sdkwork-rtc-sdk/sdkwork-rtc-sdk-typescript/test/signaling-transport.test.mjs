import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test(
  'describeRtcSignalingTransport resolves the root public websocket auth and liveConnection contract',
  async () => {
    const { describeRtcSignalingTransport } = await loadSdk();

    const descriptor = describeRtcSignalingTransport({
      deviceId: ' device-1 ',
      liveConnection: { id: 'shared-live-1' },
      connectOptions: {
        deviceId: 'device-1',
      },
    });

    assert.deepEqual(descriptor, {
      deviceId: 'device-1',
      connectOptionsDeviceId: 'device-1',
      authMode: 'automatic',
      usesSharedLiveConnection: true,
      transportTerm: 'websocket-only',
      authConfigPath: 'connectOptions.webSocketAuth',
      authPassThroughTerm: 'signaling-adapter-pass-through',
      recommendedAuthMode: 'automatic',
      deviceIdAuthorityTerm: 'top-level-device-id',
      connectOptionsDeviceIdRuleTerm: 'must-match-top-level-device-id',
      liveConnectionTerm: 'shared-rtc-live-connection',
      pollingFallbackTerm: 'not-supported',
      authFailureTerm: 'fail-fast',
    });
    assert.ok(Object.isFrozen(descriptor));
  },
);

test(
  'describeRtcSignalingTransport rejects mismatched connectOptions.deviceId',
  async () => {
    const { describeRtcSignalingTransport } = await loadSdk();

    assert.throws(
      () =>
        describeRtcSignalingTransport({
          deviceId: 'device-1',
          connectOptions: {
            deviceId: 'device-2',
          },
        }),
      /deviceId must match connectOptions\.deviceId/i,
    );
  },
);
