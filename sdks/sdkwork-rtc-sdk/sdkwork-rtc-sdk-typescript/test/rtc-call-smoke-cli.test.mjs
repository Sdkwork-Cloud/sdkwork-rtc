import assert from 'node:assert/strict';
import test from 'node:test';

const {
  getRtcCallSmokeHelpText,
  parseRtcCallSmokeArgs,
  runRtcCallSmokeCli,
} = await import('../bin/sdk-call-smoke.mjs');

function createWriter() {
  let buffer = '';
  return {
    write(chunk) {
      buffer += String(chunk);
    },
    toString() {
      return buffer;
    },
  };
}

test('rtc call smoke cli help keeps the mocked public usage contract explicit', () => {
  const helpText = getRtcCallSmokeHelpText();

  assert.match(helpText, /sdk-call-smoke\.mjs/);
  assert.match(helpText, /mocked RTC signaling adapter signaling/i);
  assert.match(helpText, /mocked official Volcengine Web SDK module/i);

  const parsed = parseRtcCallSmokeArgs(['--help']);
  assert.equal(parsed.help, true);
});

test('rtc call smoke cli verifies the default volcengine plus signaling-adapter stack through the public package', async () => {
  const stdout = createWriter();
  const result = await runRtcCallSmokeCli(['--json'], {
    stdout,
  });

  assert.equal(result.exitCode, 0);

  const summary = JSON.parse(stdout.toString());
  assert.equal(summary.defaultProviderKey, 'volcengine');
  assert.equal(summary.selectedProviderKey, 'volcengine');
  assert.equal(summary.mediaProviderKey, 'volcengine');
  assert.deepEqual(summary.signalingTransport, {
    deviceId: 'device-smoke',
    connectOptionsDeviceId: 'device-smoke',
    authMode: 'automatic',
    usesSharedLiveConnection: false,
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
  assert.equal(summary.endedControllerState, 'ended');
  assert.equal(summary.closedControllerState, 'idle');
  assert.equal(summary.closedCallState, 'idle');
  assert.ok(
    summary.runtimeCalls.some(([name]) => name === 'createEngine'),
    'expected the official Volcengine runtime bridge to create an engine',
  );
  assert.ok(
    summary.runtimeCalls.some(([name]) => name === 'joinRoom'),
    'expected the official Volcengine runtime bridge to join a room',
  );
  assert.ok(
    summary.signalingCalls.some(([name]) => name === 'create'),
    'expected the RTC signaling adapter to create an RTC session',
  );
  assert.ok(
    summary.signalingCalls.some(
      ([name, , signalType]) => name === 'postJsonSignal' && signalType === 'sdkwork.rtc.call.offer',
    ),
    'expected the RTC signaling adapter to publish an SDP offer through the standard signal path',
  );
  assert.ok(
    summary.signalingCalls.some(
      ([name, , signalType]) =>
        name === 'postJsonSignal' && signalType === 'sdkwork.rtc.call.ice-candidate',
    ),
    'expected the RTC signaling adapter to publish an ICE candidate through the standard signal path',
  );
});

test('rtc call smoke cli reports shared liveConnection reuse in the signaling transport descriptor', async () => {
  const stdout = createWriter();
  const result = await runRtcCallSmokeCli(['--json', '--reuse-live-connection'], {
    stdout,
  });

  assert.equal(result.exitCode, 0);

  const summary = JSON.parse(stdout.toString());
  assert.equal(summary.reusedLiveConnection, true);
  assert.equal(summary.signalingTransport.usesSharedLiveConnection, true);
  assert.equal(summary.signalingTransport.deviceId, 'device-smoke');
  assert.equal(summary.signalingTransport.connectOptionsDeviceId, 'device-smoke');
  assert.equal(summary.signalingTransport.authMode, 'automatic');
});
