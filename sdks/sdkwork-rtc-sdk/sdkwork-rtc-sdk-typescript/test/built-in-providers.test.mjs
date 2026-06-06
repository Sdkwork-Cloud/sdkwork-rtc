import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('built-in provider metadata exports the stable provider key set', async () => {
  const { BUILTIN_RTC_PROVIDER_KEYS, getBuiltinRtcProviderMetadata } = await loadSdk();

  assert.deepEqual(BUILTIN_RTC_PROVIDER_KEYS, [
    'volcengine',
    'aliyun',
    'tencent',
    'agora',
    'livekit',
  ]);

  const metadata = getBuiltinRtcProviderMetadata();
  assert.deepEqual(
    metadata.map((entry) => entry.providerKey),
    BUILTIN_RTC_PROVIDER_KEYS,
  );
});

test('built-in provider metadata keeps volcengine as the only default-selected provider', async () => {
  const { getBuiltinRtcProviderMetadata } = await loadSdk();

  const metadata = getBuiltinRtcProviderMetadata();
  const defaultSelected = metadata.filter((entry) => entry.defaultSelected);

  assert.equal(defaultSelected.length, 1);
  assert.equal(defaultSelected[0].providerKey, 'volcengine');
});

test('built-in providers advertise the required capability baseline', async () => {
  const { getBuiltinRtcProviderMetadata, REQUIRED_RTC_CAPABILITIES } = await loadSdk();

  for (const metadata of getBuiltinRtcProviderMetadata()) {
    assert.deepEqual(metadata.requiredCapabilities, REQUIRED_RTC_CAPABILITIES);
    assert.ok(metadata.optionalCapabilities.includes('screen-share'));
    assert.ok(metadata.optionalCapabilities.includes('recording'));
  }
});

test('built-in provider clients unwrap the exact native client instance', async () => {
  const {
    RtcDriverManager,
    createTencentRtcDriver,
  } = await loadSdk();

  const nativeClient = { sdk: 'tencent-web-native' };
  const manager = new RtcDriverManager({
    drivers: [
      createTencentRtcDriver({
        nativeFactory: async () => nativeClient,
      }),
    ],
  });

  const client = await manager.connect({ providerKey: 'tencent' });
  assert.equal(client.unwrap(), nativeClient);
});
