import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('provider support standard exports stable statuses', async () => {
  const sdk = await loadSdk();

  assert.deepEqual(sdk.RTC_PROVIDER_SUPPORT_STATUSES, [
    'builtin_registered',
    'official_registered',
    'official_unregistered',
    'unknown',
  ]);
  assert.equal(Object.isFrozen(sdk.RTC_PROVIDER_SUPPORT_STATUSES), true);
  assert.throws(() => {
    sdk.RTC_PROVIDER_SUPPORT_STATUSES.push('drifted');
  }, TypeError);
});

test('provider support standard resolves statuses and immutable states independently from driver manager state', async () => {
  const sdk = await loadSdk();

  const builtinRegistered = sdk.createRtcProviderSupportState({
    providerKey: 'volcengine',
    builtin: true,
    official: true,
    registered: true,
  });
  const officialRegistered = sdk.createRtcProviderSupportState({
    providerKey: 'agora',
    builtin: false,
    official: true,
    registered: true,
  });
  const officialUnregistered = sdk.createRtcProviderSupportState({
    providerKey: 'livekit',
    builtin: false,
    official: true,
    registered: false,
  });
  const unknown = sdk.createRtcProviderSupportState({
    providerKey: 'vendor-x',
    builtin: false,
    official: false,
    registered: false,
  });

  assert.equal(
    sdk.resolveRtcProviderSupportStatus({
      providerKey: 'volcengine',
      builtin: true,
      official: true,
      registered: true,
    }),
    'builtin_registered',
  );
  assert.equal(
    sdk.resolveRtcProviderSupportStatus({
      providerKey: 'agora',
      builtin: false,
      official: true,
      registered: true,
    }),
    'official_registered',
  );
  assert.equal(
    sdk.resolveRtcProviderSupportStatus({
      providerKey: 'livekit',
      builtin: false,
      official: true,
      registered: false,
    }),
    'official_unregistered',
  );
  assert.equal(
    sdk.resolveRtcProviderSupportStatus({
      providerKey: 'vendor-x',
      builtin: false,
      official: false,
      registered: false,
    }),
    'unknown',
  );

  assert.deepEqual(builtinRegistered, {
    providerKey: 'volcengine',
    status: 'builtin_registered',
    builtin: true,
    official: true,
    registered: true,
  });
  assert.deepEqual(officialRegistered, {
    providerKey: 'agora',
    status: 'official_registered',
    builtin: false,
    official: true,
    registered: true,
  });
  assert.deepEqual(officialUnregistered, {
    providerKey: 'livekit',
    status: 'official_unregistered',
    builtin: false,
    official: true,
    registered: false,
  });
  assert.deepEqual(unknown, {
    providerKey: 'vendor-x',
    status: 'unknown',
    builtin: false,
    official: false,
    registered: false,
  });

  assert.equal(Object.isFrozen(builtinRegistered), true);
  assert.equal(Object.isFrozen(officialRegistered), true);
  assert.equal(Object.isFrozen(officialUnregistered), true);
  assert.equal(Object.isFrozen(unknown), true);
});
