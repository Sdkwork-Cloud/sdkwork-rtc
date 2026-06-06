import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  readJsonFile,
  resolveRtcSdkWorkspaceRoot,
  writePrettyJsonFile,
} from '../bin/rtc-standard-file-helpers.mjs';
import {
  buildProviderPackageManifestPath,
  buildProviderPackageReadmePath,
  buildProviderPackageSourcePath,
  normalizeStringArray,
} from '../bin/rtc-standard-shared-helpers.mjs';
import {
  RTC_FLUTTER_REQUIRED_STANDARD_FILES,
  RTC_ROOT_REQUIRED_CONTRACT_FILES,
  RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README,
  RTC_TYPESCRIPT_REQUIRED_STANDARD_FILES,
} from '../bin/rtc-standard-workspace-file-contracts.mjs';
import { getReservedLanguageRootPublicContract } from '../bin/verify-sdk-language-helpers.mjs';

export function getReservedLanguageWorkspaceEntries(assembly) {
  return (assembly.languages ?? []).filter((languageEntry) => languageEntry.language !== 'typescript');
}

export function buildRtcVerifierFixtureFileList(assembly) {
  const filesToCopy = [
    ...RTC_ROOT_REQUIRED_CONTRACT_FILES,
    'bin/materialize-sdk.mjs',
    'bin/materialize-sdk.ps1',
    'bin/materialize-sdk.sh',
    'bin/smoke-sdk.mjs',
    'bin/smoke-sdk.ps1',
    'bin/smoke-sdk.sh',
    'bin/verify-sdk.mjs',
    ...RTC_TYPESCRIPT_REQUIRED_STANDARD_FILES,
    ...RTC_FLUTTER_REQUIRED_STANDARD_FILES,
    RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README,
  ];

  for (const language of assembly.officialLanguages ?? []) {
    filesToCopy.push(`sdkwork-rtc-sdk-${language}/README.md`);
  }

  for (const languageEntry of assembly.languages ?? []) {
    if (typeof languageEntry.workspaceCatalogRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`);
    }

    const rootPublicContract = getReservedLanguageRootPublicContract(languageEntry);
    if (rootPublicContract) {
      filesToCopy.push(`${languageEntry.workspace}/${rootPublicContract.relativePath}`);
    }
  }

  for (const languageEntry of getReservedLanguageWorkspaceEntries(assembly)) {
    if (typeof languageEntry.contractScaffold?.relativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`);
    }

    if (typeof languageEntry.packageScaffold?.manifestRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`);
    }

    if (typeof languageEntry.providerPackageScaffold?.relativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.providerPackageScaffold.relativePath}`);
    }

    if (typeof languageEntry.providerPackageScaffold?.directoryPattern === 'string') {
      for (const provider of assembly.providers ?? []) {
        filesToCopy.push(
          `${languageEntry.workspace}/${buildProviderPackageManifestPath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          )}`,
        );
        filesToCopy.push(
          `${languageEntry.workspace}/${buildProviderPackageReadmePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          )}`,
        );
        filesToCopy.push(
          `${languageEntry.workspace}/${buildProviderPackageSourcePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          )}`,
        );
      }
    }

    if (typeof languageEntry.metadataScaffold?.providerCatalogRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`);
    }
    if (typeof languageEntry.metadataScaffold?.providerPackageCatalogRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`);
    }
    if (typeof languageEntry.metadataScaffold?.providerActivationCatalogRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`);
    }
    if (typeof languageEntry.metadataScaffold?.capabilityCatalogRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`);
    }
    if (typeof languageEntry.metadataScaffold?.providerExtensionCatalogRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`);
    }
    if (typeof languageEntry.metadataScaffold?.providerSelectionRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`);
    }

    if (typeof languageEntry.resolutionScaffold?.driverManagerRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`);
    }
    if (typeof languageEntry.resolutionScaffold?.dataSourceRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`);
    }
    if (typeof languageEntry.resolutionScaffold?.providerSupportRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`);
    }
    if (typeof languageEntry.resolutionScaffold?.providerPackageLoaderRelativePath === 'string') {
      filesToCopy.push(`${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerPackageLoaderRelativePath}`);
    }
  }

  for (const provider of assembly.providers ?? []) {
    filesToCopy.push(`sdkwork-rtc-sdk-typescript/src/providers/${provider.providerKey}.ts`);
    filesToCopy.push(`sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/README.md`);
    filesToCopy.push(`sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/index.js`);
    filesToCopy.push(`sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/index.d.ts`);
    filesToCopy.push(`sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/package.json`);
  }

  return normalizeStringArray(filesToCopy);
}

export function createRtcVerifierFixture(
  mutator,
  workspaceRoot = resolveRtcSdkWorkspaceRoot(import.meta.url),
) {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'sdkwork-rtc-sdk-verify-'));
  const workspaceCopy = path.join(fixtureRoot, 'sdkwork-rtc-sdk');
  const assemblyPath = path.join(workspaceRoot, '.sdkwork-assembly.json');
  const assemblySnapshot = readJsonFile(assemblyPath);
  const filesToCopy = buildRtcVerifierFixtureFileList(assemblySnapshot);

  for (const relativePath of filesToCopy) {
    const sourcePath = path.join(workspaceRoot, relativePath);
    const targetPath = path.join(workspaceCopy, relativePath);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, readFileSync(sourcePath));
  }

  const copiedAssemblyPath = path.join(workspaceCopy, '.sdkwork-assembly.json');
  const assembly = readJsonFile(copiedAssemblyPath);
  mutator(assembly);
  writePrettyJsonFile(copiedAssemblyPath, assembly);

  return {
    fixtureRoot,
    workspaceCopy,
  };
}
