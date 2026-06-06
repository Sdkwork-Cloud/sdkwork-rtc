#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TYPESCRIPT_PARITY_TERMS = Object.freeze([
  'createBuiltinRtcDriverManager',
  'resolveRtcCapabilityNegotiationStatus',
  'getRtcProviderByProviderKey',
  'getRtcCapabilityCatalog',
  'getRtcCapabilityDescriptor',
  'getRtcProviderPackageByProviderKey',
  'getRtcProviderPackageByPackageIdentity',
  'getRtcProviderActivationByProviderKey',
  'getRtcProviderExtensionCatalog',
  'getRtcProviderExtensionDescriptor',
  'getRtcProviderExtensionsForProvider',
  'hasRtcProviderExtension',
  'getRtcLanguageWorkspaceByLanguage',
  'getRtcLanguageWorkspace',
  'parseRtcProviderUrl',
  'resolveRtcProviderSelection',
  'resolveRtcProviderSupportStatus',
  'createRtcProviderSupportState',
  'createRtcProviderPackageLoader',
  'installRtcProviderPackage',
  'installRtcProviderPackages',
  'createStandardRtcCallControllerStack',
  'RTC_RUNTIME_SURFACE_METHODS',
  'RTC_RUNTIME_SURFACE_FAILURE_CODE',
  'RTC_RUNTIME_SURFACE_STANDARD',
  'RTC_RUNTIME_IMMUTABILITY_STANDARD',
  'RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM',
  'RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM',
  'RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM',
  'RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM',
]);

const FLUTTER_PARITY_TERMS = Object.freeze([
  'createBuiltinRtcDriverManager',
  'resolveRtcCapabilityNegotiationStatus',
  'getRtcProviderByProviderKey',
  'getRtcCapabilityCatalog',
  'getRtcCapabilityDescriptor',
  'getRtcProviderPackageByProviderKey',
  'getRtcProviderPackageByPackageIdentity',
  'getRtcProviderActivationByProviderKey',
  'getRtcProviderExtensionCatalog',
  'getRtcProviderExtensionDescriptor',
  'getRtcProviderExtensionsForProvider',
  'hasRtcProviderExtension',
  'getRtcLanguageWorkspaceByLanguage',
  'getRtcLanguageWorkspace',
  'parseRtcProviderUrl',
  'resolveRtcProviderSelection',
  'resolveRtcProviderSupportStatus',
  'createRtcProviderSupportState',
  'createRtcProviderPackageLoader',
  'installRtcProviderPackage',
  'installRtcProviderPackages',
  'createStandardRtcCallControllerStack',
  'rtcRuntimeSurfaceMethods',
  'rtcRuntimeSurfaceFailureCode',
  'rtcRuntimeSurfaceStandard',
  'rtcRuntimeImmutabilityStandard',
  'rtcRuntimeImmutabilityFrozenTerm',
  'rtcRuntimeImmutabilitySnapshotTerm',
  'rtcRuntimeImmutabilityControllerContextTerm',
  'rtcRuntimeImmutabilityNativeClientTerm',
]);

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function walkFiles(root, extension, result = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, extension, result);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(extension)) {
      result.push(entryPath);
    }
  }
  return result;
}

function collectWorkspaceSource(root, extension) {
  if (!existsSync(root)) {
    fail(`Workspace path not found: ${root}`);
  }
  return walkFiles(root, extension)
    .sort()
    .map((filePath) => readText(filePath))
    .join('\n');
}

function assertContainsAllTerms(source, terms, label) {
  const missingTerms = terms.filter((term) => !source.includes(term));
  if (missingTerms.length > 0) {
    fail(`${label} is missing required terms: ${missingTerms.join(', ')}`);
  }
}

function assertRootExports(rootSource, requiredExports, label) {
  for (const requiredExport of requiredExports) {
    if (!rootSource.includes(requiredExport)) {
      fail(`${label} must export ${requiredExport}`);
    }
  }
}

export function verifyFlutterTypeScriptParity(workspaceRoot) {
  const root = workspaceRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const typescriptRoot = path.join(root, 'sdkwork-rtc-sdk-typescript', 'src');
  const flutterRoot = path.join(root, 'sdkwork-rtc-sdk-flutter', 'lib');

  const typescriptSource = collectWorkspaceSource(typescriptRoot, '.ts');
  const flutterSource = collectWorkspaceSource(flutterRoot, '.dart');
  assertContainsAllTerms(typescriptSource, TYPESCRIPT_PARITY_TERMS, 'TypeScript RTC workspace');
  assertContainsAllTerms(flutterSource, FLUTTER_PARITY_TERMS, 'Flutter RTC workspace');

  const typescriptRootSource = readText(path.join(typescriptRoot, 'index.ts'));
  const flutterRootSource = readText(path.join(flutterRoot, 'rtc_sdk.dart'));
  const flutterExtensionSource = readText(path.join(flutterRoot, 'rtc_sdk_extensions.dart'));

  assertRootExports(
    typescriptRootSource,
    [
      './runtime-surface.js',
      './runtime-immutability.js',
      './capability-negotiation.js',
      './provider-selection.js',
      './provider-support.js',
      './provider-package-loader.js',
    ],
    'TypeScript rtc-sdk index',
  );
  assertRootExports(
    flutterRootSource,
    [
      "export 'src/rtc_provider_selection.dart';",
      "export 'src/rtc_provider_support.dart';",
      "export 'src/rtc_provider_package_loader.dart';",
    ],
    'Flutter rtc_sdk.dart',
  );
  assertRootExports(
    flutterExtensionSource,
    [
      "export 'src/rtc_runtime_surface.dart';",
      "export 'src/rtc_runtime_immutability.dart';",
      "export 'src/rtc_capability_negotiation.dart';",
      "export 'src/rtc_language_workspace_lookup.dart';",
      "export 'src/rtc_builtin_driver_manager.dart';",
    ],
    'Flutter rtc_sdk_extensions.dart',
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
const isCliEntry = invokedPath === import.meta.url;

if (isCliEntry) {
  const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  try {
    verifyFlutterTypeScriptParity(workspaceRoot);
    console.log('[sdkwork-rtc-sdk] Flutter/TypeScript parity verification passed.');
  } catch (error) {
    console.error(`[sdkwork-rtc-sdk] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
