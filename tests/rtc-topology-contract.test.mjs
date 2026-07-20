#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

async function exists(relativePath) {
  try {
    await stat(path.join(ROOT, relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function read(relativePath) {
  return readFile(path.join(ROOT, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

test('declares v2 topology spec and profile env files for sdkwork-rtc', async () => {
  assert.equal(await exists('specs/topology.spec.json'), true);
  const topologyBytes = await readFile(path.join(ROOT, 'specs/topology.spec.json'));
  assert.notDeepEqual(
    Array.from(topologyBytes.slice(0, 3)),
    [0xef, 0xbb, 0xbf],
    'specs/topology.spec.json must not contain a UTF-8 BOM',
  );
  assert.equal(await exists('scripts/lib/rtc-topology.mjs'), true);
  assert.equal(await exists('scripts/rtc-dev.mjs'), true);
  assert.equal(await exists('docs/topology-standard.md'), true);
  assert.equal(await exists('configs/topology/README.md'), true);

  const spec = await readJson('specs/topology.spec.json');
  assert.equal(spec.schemaVersion, 2);
  assert.equal(spec.kind, 'sdkwork.app.topology');
  assert.equal(spec.appId, 'sdkwork-rtc');
  assert.equal(spec.archetype, 'application-http-gateway');
  assert.equal(spec.defaults.developmentProfileId, 'standalone.split-services.development');
  assert.ok(spec.surfaces['application.public-ingress']);
  assert.ok(spec.surfaces['platform.api-gateway']);

  for (const profileId of [
    'standalone.split-services.development',
    'standalone.development',
    'cloud.development',
    'cloud.production',
  ]) {
    const profilePath = spec.profileFiles[profileId];
    assert.equal(await exists(profilePath), true, `${profilePath} should exist`);
    const profileEnv = await read(profilePath);
    assert.match(profileEnv, /SDKWORK_RTC_PROFILE_ID=/);
    assert.match(profileEnv, /SDKWORK_RTC_APPLICATION_PUBLIC_INGRESS_BIND=/);
    assert.match(profileEnv, /VITE_SDKWORK_RTC_PC_APPLICATION_PUBLIC_HTTP_URL=/);
    assert.match(profileEnv, /VITE_SDKWORK_RTC_PC_PLATFORM_API_GATEWAY_HTTP_URL=/);
    assert.match(profileEnv, /VITE_SDKWORK_RTC_H5_APPLICATION_PUBLIC_HTTP_URL=/);
    assert.match(profileEnv, /VITE_SDKWORK_RTC_H5_PLATFORM_API_GATEWAY_HTTP_URL=/);
  }
});

test('root package.json wires @sdkwork/app-topology and standard dev scripts', async () => {
  const packageJson = await readJson('package.json');
  assert.equal(packageJson.dependencies['@sdkwork/app-topology'], 'file:../sdkwork-app-topology');
  assert.match(packageJson.scripts.dev, /dev:browser:postgres:standalone/u);
  assert.match(
    packageJson.scripts['dev:browser:postgres:standalone'],
    /scripts\/rtc-dev\.mjs/,
  );
  assert.match(packageJson.scripts['dev:browser:cloud'], /--deployment-profile cloud/u);
  assert.match(packageJson.scripts['test:topology-validate'], /sdkwork-topology\.mjs validate/);
});

test('rtc dev orchestrator uses topology adapter helpers', async () => {
  const devScript = await read('scripts/rtc-dev.mjs');
  assert.match(devScript, /loadProfile/);
  assert.match(devScript, /mergeRuntimeEnv/);
  assert.match(devScript, /listHealthSurfaces/);
  assert.match(devScript, /listOrchestrationProcesses/);
  assert.match(devScript, /resolveSurfaceHttpUrl/);
  assert.match(devScript, /resolveIamDevEnv/);
  assert.match(devScript, /IAM_APPLICATION_BOOTSTRAP_ENV/);
  assert.match(devScript, /resolveCloudGatewayConfigPath/);
  assert.match(devScript, /shouldAutostartGateway/);
  assert.match(devScript, /--config/);
  assert.match(devScript, /--hosting is retired/u);
  assert.match(devScript, /--topology is retired/u);
});

test('rtc topology adapter exports IAM application bootstrap env aliases', async () => {
  const topologyAdapter = await read('scripts/lib/rtc-topology.mjs');
  assert.match(topologyAdapter, /export const IAM_APPLICATION_BOOTSTRAP_ENV/u);
  assert.match(topologyAdapter, /SDKWORK_APP_ROOT/u);
  assert.match(topologyAdapter, /SDKWORK_IAM_APP_ROOT/u);
  assert.match(topologyAdapter, /SDKWORK_RTC_APP_ROOT/u);
});

test('declares cloud gateway config bundles referenced by topology spec', async () => {
  const spec = await readJson('specs/topology.spec.json');
  for (const configFile of spec.packaging.cloudConfigFiles) {
    const configPath = path.join('configs', configFile);
    assert.equal(await exists(configPath), true, `${configPath} should exist`);
  }
  assert.ok(spec.packaging.targets?.length >= 1, 'packaging targets required');
  const bundleTarget = spec.packaging.targets.find((target) => target.id === 'platform-config-bundle-tar-gz');
  assert.equal(bundleTarget?.profile, 'platform-config-bundle');
});

test('gateway cloud bundle and package matrix scripts are wired', async () => {
  const packageJson = await readJson('package.json');
  assert.match(packageJson.scripts['gateway:package:cloud'], /gateway-cloud-bundle\.mjs bundle/);
  assert.match(packageJson.scripts['gateway:matrix:cloud'], /print-matrix/);

  const bundleScript = await read('scripts/gateway-cloud-bundle.mjs');
  assert.match(bundleScript, /RTC_CLOUD_GATEWAY_CONFIGS/);
  assert.match(bundleScript, /sdkwork-rtc-api-gateway-config-/);

  const spec = await readJson('specs/topology.spec.json');
  assert.equal(spec.scripts.gatewayCloudBundle, 'scripts/gateway-cloud-bundle.mjs');
});

test('openapi default servers use topology application port', async () => {
  for (const openapiPath of [
    'apis/app-api/communication/sdkwork-rtc-app-api.openapi.json',
    'apis/backend-api/communication/sdkwork-rtc-backend-api.openapi.json',
  ]) {
    const openapi = JSON.parse(await read(openapiPath));
    const serverUrl = openapi.servers?.[0]?.url ?? '';
    assert.match(serverUrl, /127\.0\.0\.1:18088/u, `${openapiPath} must use topology dev application port`);
  }
});

test('client runtime env examples route IAM through platform.api-gateway', async () => {
  const runtimeExamples = [
    'apps/sdkwork-rtc-pc/config/browser/runtime-env.development.example.json',
    'apps/sdkwork-rtc-pc/config/browser/runtime-env.production.example.json',
    'apps/sdkwork-rtc-h5/config/browser/runtime-env.development.example.json',
    'apps/sdkwork-rtc-h5/config/browser/runtime-env.production.example.json',
    'apps/sdkwork-rtc-flutter-mobile/config/app/runtime-env.development.example.json',
    'apps/sdkwork-rtc-flutter-mobile/config/app/runtime-env.production.example.json',
  ];

  for (const examplePath of runtimeExamples) {
    const example = JSON.parse(await read(examplePath));
    assert.match(example.appbase.loginUrl, /^https?:\/\//);
    assert.doesNotMatch(
      example.appbase.loginUrl,
      /\/app\/v3\/api\/auth$/,
      `${examplePath} must not point IAM login at application.public-ingress`,
    );
    if (examplePath.includes('development')) {
      assert.match(example.rtc.apiBaseUrl, /127\.0\.0\.1:18088/);
      assert.equal(example.appbase.loginUrl, 'http://127.0.0.1:3900');
    }
    if (examplePath.includes('production')) {
      assert.match(example.rtc.apiBaseUrl, /rtc\.sdkwork\.com/);
      assert.equal(example.appbase.loginUrl, 'https://api.sdkwork.com');
    }
  }
});

test('rtc api server reads topology bind env key', async () => {
  const mainSource = await read('crates/sdkwork-api-rtc-standalone-gateway/src/main.rs');
  assert.match(mainSource, /SDKWORK_RTC_APPLICATION_PUBLIC_INGRESS_BIND/);
  assert.doesNotMatch(mainSource, /SDKWORK_RTC_API_BIND/);
});

test('client bootstrap reads topology surface env keys', async () => {
  const pcEnvironment = await read('apps/sdkwork-rtc-pc/src/bootstrap/environment.ts');
  const h5Environment = await read('apps/sdkwork-rtc-h5/src/bootstrap/environment.ts');
  const flutterEnvironment = await read('apps/sdkwork-rtc-flutter-mobile/lib/bootstrap/environment.dart');

  assert.match(pcEnvironment, /VITE_SDKWORK_RTC_PC_APPLICATION_PUBLIC_HTTP_URL/);
  assert.match(pcEnvironment, /VITE_SDKWORK_RTC_PC_APP_API_BASE_URL/);
  assert.match(pcEnvironment, /VITE_SDKWORK_RTC_PC_BACKEND_API_BASE_URL/);
  assert.doesNotMatch(pcEnvironment, /VITE_RTC_API_BASE_URL/);

  assert.match(h5Environment, /VITE_SDKWORK_RTC_H5_APPLICATION_PUBLIC_HTTP_URL/);
  assert.match(h5Environment, /VITE_SDKWORK_RTC_H5_APP_API_BASE_URL/);
  assert.match(h5Environment, /VITE_SDKWORK_RTC_H5_APPBASE_APP_API_BASE_URL/);
  assert.match(h5Environment, /VITE_SDKWORK_RTC_H5_BACKEND_API_BASE_URL/);

  assert.match(flutterEnvironment, /SDKWORK_RTC_APPLICATION_PUBLIC_HTTP_URL/);
  assert.match(flutterEnvironment, /SDKWORK_RTC_APP_API_BASE_URL/);
  assert.match(flutterEnvironment, /SDKWORK_RTC_BACKEND_API_BASE_URL/);
  assert.match(flutterEnvironment, /SDKWORK_RTC_PLATFORM_API_GATEWAY_HTTP_URL/);
});
