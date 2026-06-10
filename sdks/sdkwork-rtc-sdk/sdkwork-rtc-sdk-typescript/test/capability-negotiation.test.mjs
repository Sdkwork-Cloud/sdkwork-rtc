import assert from 'node:assert/strict';
import test from 'node:test';
import { createManagerWithProviderPackages, loadSdk } from './provider-test-helpers.mjs';

test('capability negotiation standard exports stable statuses, rules, and resolver semantics', async () => {
  const sdk = await loadSdk();

  assert.deepEqual(sdk.RTC_CAPABILITY_NEGOTIATION_STATUSES, [
    'supported',
    'degraded',
    'unsupported',
  ]);
  assert.deepEqual(sdk.RTC_CAPABILITY_NEGOTIATION_RULES, {
    supported: 'all-requested-capabilities-available',
    degraded: 'all-required-capabilities-available_optional-capabilities-missing',
    unsupported: 'required-capabilities-missing',
  });
  assert.equal(sdk.resolveRtcCapabilityNegotiationStatus(0, 0), 'supported');
  assert.equal(sdk.resolveRtcCapabilityNegotiationStatus(0, 2), 'degraded');
  assert.equal(sdk.resolveRtcCapabilityNegotiationStatus(1, 0), 'unsupported');
  assert.equal(Object.isFrozen(sdk.RTC_CAPABILITY_NEGOTIATION_STATUSES), true);
  assert.equal(Object.isFrozen(sdk.RTC_CAPABILITY_NEGOTIATION_RULES), true);
});

test('data source negotiates optional capability degradation with surface-aware missing sets', async () => {
  const { sdk, manager } = await createManagerWithProviderPackages(['aliyun']);

  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'aliyun',
  });

  assert.deepEqual(
    dataSource.negotiateCapabilities({
      required: ['session', 'media.audio'],
      optional: ['recording', 'data-channel'],
    }),
    {
      status: 'degraded',
      supportedRequired: ['session', 'media.audio'],
      missingRequired: [],
      supportedOptional: ['recording'],
      missingOptional: ['data-channel'],
      missingBySurface: {
        controlPlane: [],
        runtimeBridge: ['data-channel'],
        crossSurface: [],
      },
    },
  );
});

test('client describes capability support with category and surface metadata', async () => {
  const { sdk, manager } = await createManagerWithProviderPackages(['aliyun']);

  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'aliyun',
  });
  const client = await dataSource.createClient();

  assert.deepEqual(client.describeCapability('session'), {
    capabilityKey: 'session',
    category: 'required-baseline',
    surface: 'cross-surface',
    supported: true,
  });
  assert.deepEqual(client.describeCapability('data-channel'), {
    capabilityKey: 'data-channel',
    category: 'optional-advanced',
    surface: 'runtime-bridge',
    supported: false,
  });
});

test('client negotiation reports unsupported when required capabilities are missing', async () => {
  const { sdk, manager } = await createManagerWithProviderPackages(['aliyun']);

  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'aliyun',
  });
  const client = await dataSource.createClient();

  assert.deepEqual(
    client.negotiateCapabilities({
      required: ['session', 'data-channel'],
      optional: ['recording'],
    }),
    {
      status: 'unsupported',
      supportedRequired: ['session'],
      missingRequired: ['data-channel'],
      supportedOptional: ['recording'],
      missingOptional: [],
      missingBySurface: {
        controlPlane: [],
        runtimeBridge: ['data-channel'],
        crossSurface: [],
      },
    },
  );
});
