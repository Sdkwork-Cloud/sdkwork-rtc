import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('provider selection standard exports stable sources and precedence', async () => {
  const sdk = await loadSdk();

  assert.deepEqual(sdk.RTC_PROVIDER_SELECTION_SOURCES, [
    'provider_url',
    'provider_key',
    'tenant_override',
    'deployment_profile',
    'default_provider',
  ]);
  assert.deepEqual(sdk.RTC_PROVIDER_SELECTION_PRECEDENCE, [
    'provider_url',
    'provider_key',
    'tenant_override',
    'deployment_profile',
    'default_provider',
  ]);
  assert.equal(Object.isFrozen(sdk.RTC_PROVIDER_SELECTION_SOURCES), true);
  assert.equal(Object.isFrozen(sdk.RTC_PROVIDER_SELECTION_PRECEDENCE), true);
  assert.throws(() => {
    sdk.RTC_PROVIDER_SELECTION_SOURCES.push('drifted');
  }, TypeError);
});

test('provider selection standard resolves precedence independently from driver manager state', async () => {
  const sdk = await loadSdk();

  const parsed = sdk.parseRtcProviderUrl('rtc:aliyun://cluster/main');
  const explicitSelection = sdk.resolveRtcProviderSelection(
    {
      providerKey: 'tencent',
      tenantOverrideProviderKey: 'aliyun',
      deploymentProfileProviderKey: 'volcengine',
    },
    'volcengine',
  );
  const urlSelection = sdk.resolveRtcProviderSelection(
    {
      providerUrl: 'rtc:aliyun://cluster/main',
      providerKey: 'tencent',
      tenantOverrideProviderKey: 'volcengine',
    },
    'volcengine',
  );
  const defaultSelection = sdk.resolveRtcProviderSelection({}, 'volcengine');
  const implicitDefaultSelection = sdk.resolveRtcProviderSelection({});

  assert.deepEqual(parsed, {
    providerKey: 'aliyun',
    rawUrl: 'rtc:aliyun://cluster/main',
  });
  assert.deepEqual(explicitSelection, {
    providerKey: 'tencent',
    source: 'provider_key',
  });
  assert.deepEqual(urlSelection, {
    providerKey: 'aliyun',
    source: 'provider_url',
  });
  assert.deepEqual(defaultSelection, {
    providerKey: 'volcengine',
    source: 'default_provider',
  });
  assert.deepEqual(implicitDefaultSelection, {
    providerKey: 'volcengine',
    source: 'default_provider',
  });
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(explicitSelection), true);
  assert.equal(Object.isFrozen(urlSelection), true);
  assert.equal(Object.isFrozen(defaultSelection), true);
  assert.equal(Object.isFrozen(implicitDefaultSelection), true);
});
