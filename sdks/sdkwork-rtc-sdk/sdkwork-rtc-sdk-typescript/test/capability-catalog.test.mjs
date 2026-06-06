import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

async function loadCapabilityCatalog() {
  return import('../dist/capability-catalog.js');
}

function readAssembly() {
  const assemblyPath = path.resolve('..', '.sdkwork-assembly.json');
  return JSON.parse(readFileSync(assemblyPath, 'utf8'));
}

test('materialized rtc capability catalog matches the assembly capability descriptors', async () => {
  const catalog = await loadCapabilityCatalog();
  const assembly = readAssembly();

  assert.deepEqual(
    catalog.RTC_CAPABILITY_CATALOG.map((descriptor) => ({
      capabilityKey: descriptor.capabilityKey,
      category: descriptor.category,
      surface: descriptor.surface,
    })),
    assembly.capabilityCatalog.map((descriptor) => ({
      capabilityKey: descriptor.capabilityKey,
      category: descriptor.category,
      surface: descriptor.surface,
    })),
  );

  for (const provider of assembly.providers) {
    for (const capability of provider.requiredCapabilities) {
      assert.equal(
        catalog.getRtcCapabilityDescriptor(capability)?.category,
        'required-baseline',
      );
    }

    for (const capability of provider.optionalCapabilities) {
      assert.equal(
        catalog.getRtcCapabilityDescriptor(capability)?.category,
        'optional-advanced',
      );
    }
  }
});

test('root sdk re-exports capability catalog helpers and descriptors', async () => {
  const sdk = await loadSdk();
  const catalog = await loadCapabilityCatalog();

  assert.equal(typeof sdk.getRtcCapabilityCatalog, 'function');
  assert.equal(typeof sdk.getRtcCapabilityDescriptor, 'function');
  assert.deepEqual(sdk.getRtcCapabilityCatalog(), catalog.RTC_CAPABILITY_CATALOG);
  assert.deepEqual(sdk.getRtcCapabilityDescriptor('session'), {
    capabilityKey: 'session',
    category: 'required-baseline',
    surface: 'cross-surface',
  });
});

test('materialized rtc capability catalog is runtime-frozen', async () => {
  const catalog = await loadCapabilityCatalog();

  assert.equal(Object.isFrozen(catalog.REQUIRED_RTC_CAPABILITIES), true);
  assert.equal(Object.isFrozen(catalog.OPTIONAL_RTC_CAPABILITIES), true);
  assert.equal(Object.isFrozen(catalog.RTC_CAPABILITY_CATALOG), true);
  assert.equal(Object.isFrozen(catalog.SESSION_RTC_CAPABILITY_DESCRIPTOR), true);
  assert.throws(() => {
    catalog.SESSION_RTC_CAPABILITY_DESCRIPTOR.surface = 'control-plane';
  }, /TypeError/);
});
