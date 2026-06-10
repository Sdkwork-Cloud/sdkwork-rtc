import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, '..');
const srcRoot = path.join(packageRoot, 'src');
const providersRoot = path.join(srcRoot, 'providers');
const providerPackagesRoot = path.join(packageRoot, 'providers');
const tsconfigBuildPath = path.join(packageRoot, 'tsconfig.build.json');

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
    assert.doesNotMatch(
      source,
      /from\s+['"]@sdkwork\/rtc-sdk-provider-|import\(['"]@sdkwork\/rtc-sdk-provider-/,
      `expected ${relativePath} to avoid static provider package imports`,
    );
    assert.doesNotMatch(
      source,
      /from\s+['"](?:@volcengine\/rtc|trtc-sdk-v5)['"]|import\(['"](?:@volcengine\/rtc|trtc-sdk-v5)['"]\)/,
      `expected ${relativePath} to avoid direct vendor SDK imports`,
    );
  }
});

test('root package manifest keeps provider packages and vendor SDKs out of dependencies', () => {
  const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const dependencyScopes = [
    manifest.dependencies ?? {},
    manifest.peerDependencies ?? {},
    manifest.optionalDependencies ?? {},
    manifest.devDependencies ?? {},
  ];

  for (const dependencies of dependencyScopes) {
    for (const dependencyName of Object.keys(dependencies)) {
      assert.doesNotMatch(
        dependencyName,
        /^@sdkwork\/rtc-sdk-provider-/,
        'root RTC SDK must not declare provider packages as direct dependencies',
      );
      assert.notEqual(
        dependencyName,
        '@volcengine/rtc',
        'root RTC SDK must not declare the Volcengine vendor SDK directly',
      );
      assert.notEqual(
        dependencyName,
        'trtc-sdk-v5',
        'root RTC SDK must not declare the Tencent vendor SDK directly',
      );
    }
  }
});

test('root package does not keep concrete provider implementation source files', () => {
  if (!existsSync(providersRoot)) {
    return;
  }

  assert.deepEqual(
    readdirSync(providersRoot),
    [],
    'src/providers is a retired root-public provider implementation boundary',
  );
});

test('root TypeScript build config has no retired provider implementation boundary globs', () => {
  const tsconfigBuild = JSON.parse(readFileSync(tsconfigBuildPath, 'utf8'));
  const serializedConfig = JSON.stringify(tsconfigBuild);

  assert.doesNotMatch(serializedConfig, /src\/providers/);
  assert.doesNotMatch(serializedConfig, /volcengine-official-web/);
  assert.doesNotMatch(serializedConfig, /builtin-driver-manager/);
});

test('provider plugin entrypoints depend on the root public SDK boundary only', () => {
  const providerPackageDirs = readdirSync(providerPackagesRoot)
    .filter((entry) => entry.startsWith('rtc-sdk-provider-'))
    .sort();

  assert.deepEqual(providerPackageDirs, [
    'rtc-sdk-provider-agora',
    'rtc-sdk-provider-aliyun',
    'rtc-sdk-provider-janus',
    'rtc-sdk-provider-jitsi',
    'rtc-sdk-provider-livekit',
    'rtc-sdk-provider-mediasoup',
    'rtc-sdk-provider-tencent',
    'rtc-sdk-provider-twilio',
    'rtc-sdk-provider-volcengine',
    'rtc-sdk-provider-zego',
  ]);

  for (const providerPackageDir of providerPackageDirs) {
    const source = readFileSync(path.join(providerPackagesRoot, providerPackageDir, 'index.js'), 'utf8');
    assert.doesNotMatch(
      source,
      /dist\/providers|src\/providers/,
      `expected ${providerPackageDir} to avoid retired root provider implementation imports`,
    );
    assert.doesNotMatch(
      source,
      /import\('@sdkwork\/rtc-sdk'\)/,
      `expected ${providerPackageDir} to avoid browser-incompatible dynamic root SDK imports`,
    );
    assert.match(
      source,
      /from '@sdkwork\/rtc-sdk';/,
      `expected ${providerPackageDir} to statically load through the root public SDK package`,
    );
  }
});
