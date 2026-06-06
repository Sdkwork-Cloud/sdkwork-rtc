import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

async function loadExtensionCatalog() {
  return import('../dist/provider-extension-catalog.js');
}

function readAssembly() {
  const assemblyPath = path.resolve('..', '.sdkwork-assembly.json');
  return JSON.parse(readFileSync(assemblyPath, 'utf8'));
}

test('materialized provider extension catalog matches the assembly extension registry snapshot', async () => {
  const catalog = await loadExtensionCatalog();
  const assembly = readAssembly();

  assert.deepEqual(
    catalog.RTC_PROVIDER_EXTENSION_CATALOG.map((descriptor) => ({
      extensionKey: descriptor.extensionKey,
      providerKey: descriptor.providerKey,
      displayName: descriptor.displayName,
      surface: descriptor.surface,
      access: descriptor.access,
      status: descriptor.status,
    })),
    assembly.providerExtensionCatalog.map((descriptor) => ({
      extensionKey: descriptor.extensionKey,
      providerKey: descriptor.providerKey,
      displayName: descriptor.displayName,
      surface: descriptor.surface,
      access: descriptor.access,
      status: descriptor.status,
    })),
  );
});

test('data source and client expose provider extension descriptors through standard metadata helpers', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    providerKey: 'volcengine',
  });

  assert.deepEqual(dataSource.describeProviderExtensions(), [
    {
      extensionKey: 'volcengine.native-client',
      providerKey: 'volcengine',
      displayName: 'Volcengine Native Client',
      surface: 'runtime-bridge',
      access: 'unwrap-only',
      status: 'reference-baseline',
    },
  ]);
  assert.equal(dataSource.supportsProviderExtension('volcengine.native-client'), true);
  assert.equal(dataSource.supportsProviderExtension('aliyun.native-client'), false);

  const client = await dataSource.createClient();

  assert.deepEqual(client.getProviderExtensions(), [
    {
      extensionKey: 'volcengine.native-client',
      providerKey: 'volcengine',
      displayName: 'Volcengine Native Client',
      surface: 'runtime-bridge',
      access: 'unwrap-only',
      status: 'reference-baseline',
    },
  ]);
  assert.equal(client.supportsProviderExtension('volcengine.native-client'), true);
  assert.equal(client.supportsProviderExtension('agora.native-client'), false);
});

test('materialized provider extension catalog is runtime-frozen', async () => {
  const catalog = await loadExtensionCatalog();

  assert.equal(Object.isFrozen(catalog.RTC_PROVIDER_EXTENSION_KEYS), true);
  assert.equal(Object.isFrozen(catalog.RTC_PROVIDER_EXTENSION_CATALOG), true);
  assert.equal(
    Object.isFrozen(catalog.VOLCENGINE_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR),
    true,
  );
  assert.equal(
    Object.isFrozen(catalog.getRtcProviderExtensionsForProvider('volcengine')),
    true,
  );
  assert.throws(() => {
    catalog.VOLCENGINE_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR.status = 'reserved';
  }, /TypeError/);
});
