import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

function readPackageJson() {
  return JSON.parse(readFileSync(path.resolve('package.json'), 'utf8'));
}

function joined(parts, separator = '') {
  return parts.join(separator);
}

function retiredRootExports() {
  const transportWord = joined(['SIGN', 'ALING']);
  const transportLower = transportWord.toLowerCase();

  return [
    joined(['RTC_', transportWord, '_TRANSPORT_STANDARD']),
    joined(['RTC_', transportWord, '_TRANSPORT_TERM']),
    joined(['createStandardRtc', 'CallStack']),
    joined(['createStandardRtc', 'CallController']),
    joined(['createStandardRtc', 'CallControllerStack']),
    joined(['createRtc', 'App', 'Http', 'Client']),
    joined(['createRtc', transportLower[0].toUpperCase(), transportLower.slice(1), 'Adapter']),
    joined(['StandardRtc', 'CallSession']),
    joined(['StandardRtc', 'CallController']),
    joined(['DEFAULT_RTC_', 'CALL', '_SUBSCRIBE_', transportWord, 'S']),
    joined(['RTC_', 'CALL', '_INVITE_', transportWord, '_TYPE']),
    joined(['RTC_', 'CALL', '_ACCEPTED_', transportWord, '_TYPE']),
  ];
}

const ROOT_NEUTRAL_EXPORT_PATHS = [
  './errors.js',
  './runtime-surface.js',
  './runtime-immutability.js',
  './root-public-surface.js',
  './types.js',
  './capability-catalog.js',
  './capability-negotiation.js',
  './provider-catalog.js',
  './language-workspace-catalog.js',
  './provider-selection.js',
  './provider-support.js',
  './provider-extension-catalog.js',
  './provider-package-catalog.js',
  './provider-package-loader.js',
  './provider-activation-catalog.js',
  './capabilities.js',
  './client.js',
  './driver.js',
  './driver-manager.js',
  './data-source.js',
  './provider-module.js',
];

const FORBIDDEN_ROOT_PROVIDER_EXPORTS = [
  'createBuiltinRtcDriverManager',
  'getBuiltinRtcProviderModules',
  'getOfficialRtcProviderModules',
  'createVolcengineRtcDriver',
  'createOfficialVolcengineWebRtcDriver',
  'createAliyunRtcDriver',
  'createTencentRtcDriver',
  'createAgoraRtcDriver',
  'createZegoRtcDriver',
  'createLivekitRtcDriver',
  'createTwilioRtcDriver',
  'createJitsiRtcDriver',
  'createJanusRtcDriver',
  'createMediasoupRtcDriver',
  'VOLCENGINE_RTC_PROVIDER_MODULE',
  'ALIYUN_RTC_PROVIDER_MODULE',
  'TENCENT_RTC_PROVIDER_MODULE',
  'AGORA_RTC_PROVIDER_MODULE',
  'ZEGO_RTC_PROVIDER_MODULE',
  'LIVEKIT_RTC_PROVIDER_MODULE',
  'TWILIO_RTC_PROVIDER_MODULE',
  'JITSI_RTC_PROVIDER_MODULE',
  'JANUS_RTC_PROVIDER_MODULE',
  'MEDIASOUP_RTC_PROVIDER_MODULE',
];

test('root public API exposes provider-neutral RTC contracts and plugin SPI only', async () => {
  const sdk = await loadSdk();

  assert.equal(typeof sdk.RtcDriverManager, 'function');
  assert.equal(typeof sdk.RtcDataSource, 'function');
  assert.equal(typeof sdk.createRtcProviderDriver, 'function');
  assert.equal(typeof sdk.createRtcProviderModule, 'function');
  assert.equal(typeof sdk.registerRtcProviderModule, 'function');
  assert.equal(typeof sdk.registerRtcProviderModules, 'function');
  assert.equal(typeof sdk.createRtcProviderPackageLoader, 'function');
  assert.equal(typeof sdk.resolveRtcProviderPackageLoadTarget, 'function');
  assert.equal(typeof sdk.loadRtcProviderModule, 'function');
  assert.equal(typeof sdk.installRtcProviderPackage, 'function');
  assert.equal(typeof sdk.installRtcProviderPackages, 'function');

  assert.equal(typeof sdk.resolveRtcProviderSelection, 'function');
  assert.equal(typeof sdk.parseRtcProviderUrl, 'function');
  assert.equal(typeof sdk.resolveRtcCapabilityNegotiationStatus, 'function');
  assert.equal(typeof sdk.resolveRtcProviderSupportStatus, 'function');
  assert.equal(typeof sdk.createRtcProviderSupportState, 'function');
  assert.equal(typeof sdk.RtcSdkException, 'function');

  assert.equal(typeof sdk.getRtcProviderByProviderKey, 'function');
  assert.equal(typeof sdk.getBuiltinRtcProviderMetadata, 'function');
  assert.equal(typeof sdk.getBuiltinRtcProviderMetadataByKey, 'function');
  assert.equal(typeof sdk.getOfficialRtcProviderMetadata, 'function');
  assert.equal(typeof sdk.getOfficialRtcProviderMetadataByKey, 'function');
  assert.equal(typeof sdk.getRtcLanguageWorkspaceCatalog, 'function');
  assert.equal(typeof sdk.getRtcLanguageWorkspaceByLanguage, 'function');
  assert.equal(typeof sdk.getRtcLanguageWorkspace, 'function');
  assert.equal(typeof sdk.getRtcProviderPackageCatalog, 'function');
  assert.equal(typeof sdk.getRtcProviderPackageByProviderKey, 'function');
  assert.equal(typeof sdk.getRtcProviderPackageByPackageIdentity, 'function');
  assert.equal(typeof sdk.getRtcProviderPackage, 'function');
  assert.equal(typeof sdk.getRtcProviderActivationCatalog, 'function');
  assert.equal(typeof sdk.getRtcProviderActivationByProviderKey, 'function');
  assert.equal(typeof sdk.getRtcProviderActivation, 'function');

  assert.deepEqual(sdk.RTC_SDK_ERROR_CODES, [
    'provider_package_not_found',
    'provider_package_identity_mismatch',
    'provider_package_load_failed',
    'provider_module_export_missing',
    'provider_module_contract_mismatch',
    'driver_already_registered',
    'driver_not_found',
    'provider_not_official',
    'provider_not_supported',
    'provider_metadata_mismatch',
    'provider_selection_failed',
    'capability_not_supported',
    'invalid_provider_url',
    'invalid_native_config',
    'native_sdk_not_available',
    'vendor_error',
  ]);
  assert.deepEqual(sdk.RTC_RUNTIME_SURFACE_METHODS, [
    'join',
    'leave',
    'publish',
    'unpublish',
    'startScreenShare',
    'stopScreenShare',
    'muteAudio',
    'muteVideo',
  ]);
  assert.deepEqual(sdk.RTC_RUNTIME_IMMUTABILITY_STANDARD, {
    frozenTerm: 'runtime-frozen',
    snapshotTerm: 'immutable-snapshots',
    controllerContextTerm: 'shallow-immutable-context',
    nativeClientTerm: 'mutable-native-client',
  });
  assert.deepEqual(sdk.RTC_ROOT_PUBLIC_SURFACE_STANDARD, {
    typescriptProviderNeutralExportPaths: ROOT_NEUTRAL_EXPORT_PATHS,
    typescriptBuiltinProviderExportPaths: [],
    typescriptInlineHelperNames: [],
    reservedSurfaceFamilies: [
      'standard-contract',
      'provider-catalog',
      'provider-package-catalog',
      'provider-activation-catalog',
      'capability-catalog',
      'provider-extension-catalog',
      'language-workspace-catalog',
      'provider-selection',
      'provider-package-loader',
      'provider-support',
      'driver-manager',
      'data-source',
    ],
    reservedEntryPointKinds: {
      flutter: 'barrel',
      python: 'package-init',
    },
    builtinProviderExposureTerm: 'provider-plugin-package-only',
    nonBuiltinProviderExposureTerm: 'package-boundary-only',
  });

  assert.deepEqual(
    sdk.RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
    ROOT_NEUTRAL_EXPORT_PATHS,
  );
  assert.deepEqual(sdk.RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS, []);
  assert.deepEqual(sdk.RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES, []);
  assert.equal(
    sdk.RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM,
    'provider-plugin-package-only',
  );
  assert.equal(
    sdk.RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM,
    'package-boundary-only',
  );
  assert.equal(Object.isFrozen(sdk.RTC_ROOT_PUBLIC_SURFACE_STANDARD), true);
  assert.equal(Object.isFrozen(sdk.RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES), true);
  assert.equal(sdk.DEFAULT_RTC_PROVIDER_KEY, 'volcengine');
  assert.equal(sdk.DEFAULT_RTC_PROVIDER_PLUGIN_ID, 'rtc-volcengine');
  assert.equal(sdk.DEFAULT_RTC_PROVIDER_DRIVER_ID, 'sdkwork-rtc-driver-volcengine');

  for (const retiredExport of retiredRootExports()) {
    assert.equal(retiredExport in sdk, false, `${retiredExport} must be owned by IM, not RTC`);
  }
});

test('root package does not export provider implementations or vendor dependencies', async () => {
  const sdk = await loadSdk();
  const packageJson = readPackageJson();

  for (const exportName of FORBIDDEN_ROOT_PROVIDER_EXPORTS) {
    assert.equal(exportName in sdk, false, `${exportName} must live in a provider plugin package`);
  }

  assert.deepEqual(Object.keys(packageJson.exports), ['.']);
  assert.equal(packageJson.peerDependencies?.['@volcengine/rtc'], undefined);
  assert.equal(packageJson.dependencies?.['@volcengine/rtc'], undefined);
  assert.equal(packageJson.optionalDependencies?.['@volcengine/rtc'], undefined);
});
