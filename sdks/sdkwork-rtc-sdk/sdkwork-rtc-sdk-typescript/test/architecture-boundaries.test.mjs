import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const packageRoot = path.resolve('.');
const srcRoot = path.join(packageRoot, 'src');
const providersRoot = path.join(srcRoot, 'providers');

function readSource(relativePath) {
  return readFileSync(path.join(srcRoot, relativePath), 'utf8');
}

test('provider-neutral core files do not depend on provider implementation modules', () => {
  const providerNeutralFiles = [
    'errors.ts',
    'types.ts',
    'capabilities.ts',
    'client.ts',
    'driver.ts',
    'driver-manager.ts',
    'data-source.ts',
    'provider-module.ts',
    'provider-catalog.ts',
  ];

  for (const relativePath of providerNeutralFiles) {
    const source = readSource(relativePath);
    assert.doesNotMatch(
      source,
      /from\s+['"]\.\/providers\//,
      `expected ${relativePath} to stay outside provider implementation boundaries`,
    );
  }
});

test('provider adapter source files depend only on core contracts and the core provider catalog', () => {
  const providerFiles = [
    'volcengine.ts',
    'aliyun.ts',
    'tencent.ts',
    'agora.ts',
    'zego.ts',
    'livekit.ts',
    'twilio.ts',
    'jitsi.ts',
    'janus.ts',
    'mediasoup.ts',
  ];

  for (const providerFile of providerFiles) {
    const source = readFileSync(path.join(providersRoot, providerFile), 'utf8');
    assert.doesNotMatch(
      source,
      /from\s+['"]\.\//,
      `expected ${providerFile} to avoid sibling provider imports`,
    );
    assert.match(
      source,
      /from\s+['"]\.\.\/provider-catalog\.js['"]/,
      `expected ${providerFile} to import the core provider catalog`,
    );
  }
});
