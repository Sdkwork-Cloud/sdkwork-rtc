#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  assertRtcAssemblyWorkspaceBaseline,
  getRtcExecutableLanguageEntries,
  getRtcExecutableLanguageEntriesBySmokeMode,
} from './rtc-standard-assembly-baseline.mjs';
import {
  readJsonFile,
  readUtf8File,
  resolveRtcSdkWorkspaceRoot,
  writeUtf8File,
} from './rtc-standard-file-helpers.mjs';
import {
  buildReservedLanguageMaterializationPlan,
} from './materialize-sdk-reserved-scaffolds.mjs';
import { RTC_TEMPLATE_MATERIALIZATION_ASSETS } from './materialize-sdk-template-assets.mjs';
import {
  DEFAULT_RTC_PROVIDER_KEY,
  DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT,
  RTC_PROVIDER_ACTIVATION_STATUSES as PROVIDER_ACTIVATION_STATUSES,
} from './rtc-standard-contract-constants.mjs';
import {
  buildLanguageProviderActivationCatalogEntries,
  describeProviderActivationStatus,
  materializeProviderPackagePattern,
  toPascalCase,
  toUpperSnakeCase,
} from './rtc-standard-shared-helpers.mjs';
import { REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS } from './verify-sdk-standard-constants.mjs';

export const RTC_SDK_STALE_MATERIALIZED_FILES = [
  'sdkwork-rtc-sdk-typescript/src/builtin-driver-manager.ts',
  'sdkwork-rtc-sdk-typescript/src/volcengine-official-web.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/agora.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/aliyun.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/index.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/janus.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/jitsi.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/livekit.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/mediasoup.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/tencent.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/twilio.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/volcengine.ts',
  'sdkwork-rtc-sdk-typescript/src/providers/zego.ts',
  'sdkwork-rtc-sdk-flutter/lib/src/rtc_builtin_driver_manager.dart',
  'sdkwork-rtc-sdk-flutter/lib/src/volcengine_official_flutter.dart',
  'sdkwork-rtc-sdk-flutter/lib/src/providers/volcengine.dart',
  'sdkwork-rtc-sdk-flutter/lib/rtc_sdk_extensions.dart',
  'sdkwork-rtc-sdk-flutter/pubspec_overrides.yaml',
];

function readMaterializedTemplate(workspaceRoot, relativePath) {
  return readUtf8File(path.join(workspaceRoot, 'bin', 'templates', relativePath));
}

function lines(value) {
  return `${value.trim()}\n`;
}

function renderStringLiteral(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function renderReadonlyStringArray(values) {
  return `[${values.map((value) => renderStringLiteral(value)).join(', ')}] as const`;
}

function renderReadonlyStringRecord(entries) {
  return `{
${Object.entries(entries ?? {})
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${renderStringLiteral(value)},`)
    .join('\n')}
}`;
}

function renderMarkdownCodeList(values) {
  const items = (values ?? []).map((value) => `\`${value}\``);
  if (items.length === 0) {
    return '`none`';
  }

  return items.join(', ');
}

function renderMarkdownCodeNaturalList(values) {
  const items = (values ?? []).filter(Boolean).map((value) => `\`${value}\``);
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function renderNaturalLanguageList(values) {
  const items = (values ?? []).filter(Boolean);
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function getExecutableRuntimeLanguageEntries(assembly) {
  return getRtcExecutableLanguageEntries(assembly).filter((languageEntry) => languageEntry.runtimeBaseline);
}

function getExecutableLanguageRuntimeDocumentation(languageEntry) {
  if (!languageEntry.runtimeDocumentation) {
    throw new Error(
      `Executable language ${languageEntry.language} must declare runtimeDocumentation metadata`,
    );
  }

  return languageEntry.runtimeDocumentation;
}

function renderExecutableLandingSummary(assembly) {
  const executableDisplayNames = getExecutableRuntimeLanguageEntries(assembly).map(
    (languageEntry) => languageEntry.displayName,
  );

  if (executableDisplayNames.length === 0) {
    return 'No executable reference baselines are declared in the current landing.';
  }

  if (executableDisplayNames.length === 1) {
    return `${executableDisplayNames[0]} is the executable reference baseline in the current landing.`;
  }

  return `${renderNaturalLanguageList(executableDisplayNames)} are the executable reference baselines in the current landing.`;
}

function renderTemplateExecutableTargetsSummary(assembly) {
  const executableLanguages = getExecutableRuntimeLanguageEntries(assembly).map(
    (languageEntry) => languageEntry.language,
  );

  if (executableLanguages.length === 0) {
    return 'Current implemented targets are assembly-governed and no executable language baseline is declared yet.';
  }

  const languageSummary = renderMarkdownCodeNaturalList(executableLanguages);
  if (executableLanguages.length === 1) {
    return `Current implemented target is ${languageSummary}. Runtime smoke is executed from that workspace-owned command.`;
  }

  return `Current implemented targets are ${languageSummary}. Runtime smoke is executed from each workspace-owned command.`;
}

function renderRootRuntimeSmokeCommand(languageEntry) {
  const command = String(languageEntry.runtimeBaseline?.smokeCommand ?? '').trim();
  if (!command) {
    return '';
  }

  return `cd .\\${languageEntry.workspace.replace(/\//gu, '\\')} && ${command}`;
}

function renderTemplateFastRuntimeSmokeCommands(assembly) {
  return getExecutableRuntimeLanguageEntries(assembly)
    .map(renderRootRuntimeSmokeCommand)
    .filter(Boolean)
    .join('\n');
}

function renderTemplateRequiredRuntimeSmokeSteps(assembly) {
  const requiredEntries = getRtcExecutableLanguageEntriesBySmokeMode(assembly, 'runtime-backed');
  if (requiredEntries.length === 0) {
    return '- none currently declared in assembly';
  }

  return requiredEntries
    .map((languageEntry) => `- \`${renderRootRuntimeSmokeCommand(languageEntry)}\``)
    .join('\n');
}

function renderTemplateOptionalRuntimeSmokeSteps(assembly) {
  const optionalEntries = getRtcExecutableLanguageEntriesBySmokeMode(assembly, 'analysis-backed');
  if (optionalEntries.length === 0) {
    return '- none currently declared in assembly';
  }

  return optionalEntries
    .map((languageEntry) => `- \`${renderRootRuntimeSmokeCommand(languageEntry)}\``)
    .join('\n');
}

function renderUsageGuideLocalVerificationCommands(assembly) {
  const commandLines = [
    'node .\\bin\\materialize-sdk.mjs',
    'node .\\test\\verify-sdk-automation.test.mjs',
    'node .\\bin\\verify-sdk.mjs',
    ...getExecutableRuntimeLanguageEntries(assembly).map(renderRootRuntimeSmokeCommand),
    'node .\\bin\\smoke-sdk.mjs',
  ];

  return commandLines.filter(Boolean).join('\n');
}

function renderUsageGuideAdoptionGuidance(assembly) {
  const guideBullets = getExecutableRuntimeLanguageEntries(assembly)
    .map((languageEntry) => {
      const guide = renderUsageGuideDetailedGuide(languageEntry);
      if (!guide) {
        return null;
      }

      return `- if you need the ${guide.runtimeLabel} baseline, start from
  [\`${guide.label}\`](${guide.path})`;
    })
    .filter(Boolean)
    .join('\n');

  return `${guideBullets}
- if you need to understand the cross-language standard and provider package boundary model, read
  [\`docs/package-standards.md\`](./package-standards.md) and
  [\`docs/provider-adapter-standard.md\`](./provider-adapter-standard.md)`;
}

function renderMaterializedTemplateContent(workspaceRoot, templateRelativePath, assembly) {
  const templateContent = readMaterializedTemplate(workspaceRoot, templateRelativePath);
  const replacements = new Map([
    ['{{RTC_EXECUTABLE_TARGETS_SUMMARY}}', renderTemplateExecutableTargetsSummary(assembly)],
    ['{{RTC_FAST_RUNTIME_SMOKE_COMMANDS}}', renderTemplateFastRuntimeSmokeCommands(assembly)],
    ['{{RTC_REQUIRED_RUNTIME_SMOKE_STEPS}}', renderTemplateRequiredRuntimeSmokeSteps(assembly)],
    ['{{RTC_OPTIONAL_RUNTIME_SMOKE_STEPS}}', renderTemplateOptionalRuntimeSmokeSteps(assembly)],
  ]);

  let materializedContent = templateContent;
  for (const [token, value] of replacements.entries()) {
    materializedContent = materializedContent.split(token).join(value);
  }

  return materializedContent;
}

function renderUsageGuideSelectionSourceLabel(source) {
  switch (source) {
    case 'provider_url':
      return 'providerUrl';
    case 'provider_key':
      return 'providerKey';
    case 'tenant_override':
      return 'tenantOverrideProviderKey';
    case 'deployment_profile':
      return 'deploymentProfileProviderKey';
    case 'default_provider':
      return 'defaultProvider';
    default:
      return source;
  }
}

function renderUsageGuideProviderRole(provider, assembly) {
  const defaultProviderKey = assembly.defaults?.providerKey ?? DEFAULT_RTC_PROVIDER_KEY;
  const executableLanguageDisplays = getExecutableRuntimeLanguageEntries(assembly).map(
    (languageEntry) => languageEntry.displayName,
  );

  if (provider.providerKey === defaultProviderKey) {
    return `default provider and current runnable baseline across ${renderMarkdownCodeNaturalList(executableLanguageDisplays)} executable workspaces`;
  }

  if (provider.builtin) {
    return 'official builtin catalog entry; runtime activation remains language-matrix driven';
  }

  if (provider.tier === 'tier-b') {
    return 'official package-boundary target';
  }

  return 'future SPI target';
}

function renderUsageGuideProviderRows(assembly) {
  return (assembly.providers ?? [])
    .map(
      (provider) =>
        `| \`${provider.providerKey}\` | ${provider.displayName} | \`${provider.tier}\` | \`${provider.builtin}\` | ${renderUsageGuideProviderRole(provider, assembly)} |`,
    )
    .join('\n');
}

function renderUsageGuideLanguageRows(assembly) {
  return (assembly.languages ?? [])
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.workspace}\` | \`${languageEntry.publicPackage}\` | \`${languageEntry.maturityTier}\` | ${languageEntry.runtimeBridge ? 'yes' : 'no'} | ${languageEntry.currentRole} |`,
    )
    .join('\n');
}

function renderUsageGuideExecutableLanguageConclusion(languageEntry) {
  return getExecutableLanguageRuntimeDocumentation(languageEntry).baselineConclusion;
}

function renderUsageGuideDetailedGuide(languageEntry) {
  const runtimeDocumentation = getExecutableLanguageRuntimeDocumentation(languageEntry);

  return {
    title: runtimeDocumentation.guideTitle,
    path: runtimeDocumentation.detailedGuidePath,
    label: runtimeDocumentation.detailedGuideLabel,
    runtimeLabel: runtimeDocumentation.runtimeLabel,
  };
}

function renderUsageGuideExecutableRuntimeLabels(assembly) {
  return getExecutableRuntimeLanguageEntries(assembly).map(
    (languageEntry) => renderUsageGuideDetailedGuide(languageEntry).runtimeLabel,
  );
}

function renderUsageGuideExecutableBaselineSection(languageEntry, assembly) {
  if (!languageEntry.runtimeBaseline) {
    return '';
  }

  const guide = renderUsageGuideDetailedGuide(languageEntry);
  const defaultProviderKey =
    languageEntry.defaultProviderContract?.providerKey ??
    assembly.defaults?.providerKey ??
    DEFAULT_RTC_PROVIDER_KEY;

  return lines(`
### ${guide.title}

${renderUsageGuideExecutableLanguageConclusion(languageEntry)}

The current ${guide.runtimeLabel} runtime path is:

- standard package: \`${languageEntry.publicPackage}\`
- default provider: \`${defaultProviderKey}\`
- vendor SDK package: \`${languageEntry.runtimeBaseline.vendorSdkPackage}\`
- vendor SDK import path: \`${languageEntry.runtimeBaseline.vendorSdkImportPath}\`
- recommended media runtime entrypoint: \`${languageEntry.runtimeBaseline.recommendedEntrypoint}\`
- smoke command: \`${languageEntry.runtimeBaseline.smokeCommand}\`
- smoke mode: \`${languageEntry.runtimeBaseline.smokeMode}\`
- smoke variants: ${renderMarkdownCodeNaturalList(languageEntry.runtimeBaseline.smokeVariants)}

Use the detailed guide here:

- [\`${guide.label}\`](${guide.path})
`);
}

function renderUsageGuideDefaultProviderFallbackNarrative(assembly, defaultProviderKey) {
  const runtimeLabels = renderUsageGuideExecutableRuntimeLabels(assembly);

  if (runtimeLabels.length === 0) {
    return `That means the current runnable landing falls back to \`${defaultProviderKey}\` when the caller does not explicitly override provider selection.`;
  }

  if (runtimeLabels.length === 1) {
    return `That means the ${runtimeLabels[0]} baseline falls back to \`${defaultProviderKey}\` when the caller does not explicitly override provider selection.`;
  }

  return `That means the ${renderNaturalLanguageList(runtimeLabels)} baselines fall back to \`${defaultProviderKey}\` when the caller does not explicitly override provider selection.`;
}

function renderUsageGuideExecutableSmokeNotes(assembly) {
  return getExecutableRuntimeLanguageEntries(assembly)
    .map((languageEntry) => {
      const runtimeDocumentation = getExecutableLanguageRuntimeDocumentation(languageEntry);

      return `- ${languageEntry.displayName} smoke mode is \`${languageEntry.runtimeBaseline.smokeMode}\`: \`${languageEntry.runtimeBaseline.smokeCommand}\` ${runtimeDocumentation.smokeNarrative}`;
    })
    .join('\n');
}

function renderUsageGuideExecutableIntegrationBindings(assembly) {
  return getExecutableRuntimeLanguageEntries(assembly)
    .map(
      (languageEntry) =>
        `- ${languageEntry.displayName} binds the standard surface to the official \`${languageEntry.runtimeBaseline.vendorSdkImportPath}\` runtime bridge`,
    )
    .join('\n');
}

function renderUsageGuide(assembly) {
  const executableLanguageEntries = getExecutableRuntimeLanguageEntries(assembly);
  const executableLanguageSections = executableLanguageEntries
    .map((languageEntry) => renderUsageGuideExecutableBaselineSection(languageEntry, assembly))
    .join('\n');
  const executableLanguageConclusions = executableLanguageEntries
    .map((languageEntry) => `- ${renderUsageGuideExecutableLanguageConclusion(languageEntry).replace(/\.$/u, '')}`)
    .join('\n');
  const providerSelectionPrecedence = (assembly.providerSelectionStandard?.precedence ?? [])
    .map(
      (source, index) =>
        `${index + 1}. \`${renderUsageGuideSelectionSourceLabel(source)}\``,
    )
    .join('\n');
  const defaultProviderKey = assembly.defaults?.providerKey ?? DEFAULT_RTC_PROVIDER_KEY;
  const nonBuiltinProviderKeys = (assembly.providers ?? [])
    .filter((provider) => !provider.builtin)
    .map((provider) => provider.providerKey);
  const executableLanguageLabels = renderMarkdownCodeNaturalList(
    executableLanguageEntries.map((languageEntry) => languageEntry.language),
  );

  return lines(`
# SDKWork RTC SDK Usage Guide

This document is the entrypoint for adopting \`sdkwork-rtc-sdk\`.

It focuses on provider-neutral RTC media runtime contracts, current runnable baselines, default
\`${defaultProviderKey}\` selection, and runtime-specific guides. IM owns user call lifecycle,
invite delivery, conversation discovery, and business session orchestration.

## 1. Positioning

\`sdkwork-rtc-sdk\` is not a reimplementation of vendor media engines.

Its responsibility is to provide one provider-neutral RTC media runtime standard:

- JDBC-style \`DriverManager\` / \`DataSource\` / \`Client\` contracts
- standardized provider selection and default-provider resolution
- standardized capability negotiation, error semantics, and extension metadata
- pluggable provider integration through official catalogs and package boundaries
- one consistent media runtime surface across web, mobile, and future language workspaces

The standard intentionally keeps vendor SDK ownership on the application side:

- official vendor SDKs remain consumer-supplied
- \`sdkwork-rtc-sdk\` provides the standard contracts and adapter boundaries
- runtime bridges map vendor behavior into the standard surface instead of hiding vendor engines
- application and IM layers provide room/session credentials before the RTC client joins media

## 2. Official Providers

The current official provider catalog is:

| Provider key | Display name | Tier | Builtin | Current role |
| --- | --- | --- | --- | --- |
${renderUsageGuideProviderRows(assembly)}

Notes:

- \`builtin = true\` means the provider is part of the official assembly-driven builtin catalog
- builtin does not mean the vendor runtime is bundled into every language workspace
- non-default providers still follow the same provider metadata, capability, and activation rules

## 3. Language Status

Current language workspace status:

| Language | Workspace | Public package | Maturity | Runtime bridge | Current role |
| --- | --- | --- | --- | --- | --- |
${renderUsageGuideLanguageRows(assembly)}

Current conclusion:

${executableLanguageConclusions}
- current runnable baselines default to \`${defaultProviderKey}\`
- remaining languages preserve standardized metadata, provider selection, lookup helpers, and
  package-boundary scaffolds for future runtime-bridge landings

## 4. Default Provider Contract

The default provider remains \`${defaultProviderKey}\`.

Canonical defaults:

- \`DEFAULT_RTC_PROVIDER_KEY = '${assembly.defaults?.providerKey ?? DEFAULT_RTC_PROVIDER_KEY}'\`
- \`DEFAULT_RTC_PROVIDER_PLUGIN_ID = '${assembly.defaults?.pluginId ?? ''}'\`
- \`DEFAULT_RTC_PROVIDER_DRIVER_ID = '${assembly.defaults?.driverId ?? ''}'\`

Provider selection precedence remains:

${providerSelectionPrecedence}

${renderUsageGuideDefaultProviderFallbackNarrative(assembly, defaultProviderKey)}

## 5. Runnable Baselines

${executableLanguageSections}
## 6. Standard Integration Boundary

The correct vendor integration boundary is still the same:

- \`sdkwork-rtc-sdk\` owns the standard contracts and provider-neutral runtime surface
- the vendor SDK owns real media behavior
- the application wires vendor SDK instances into the standard driver/runtime-controller boundary
- IM creates or resolves business call sessions and provider credentials before media join
- RTC runtime code accepts room, participant, and provider token inputs; it does not discover invites
  or manage conversation delivery

For the current runnable baselines, this boundary is already materialized:

${renderUsageGuideExecutableIntegrationBindings(assembly)}

## 7. Non-Builtin Provider Packages

For providers such as ${renderMarkdownCodeList(nonBuiltinProviderKeys)},
the standard path is package-boundary integration instead of deep root-entrypoint coupling.

That contract stays:

- official provider metadata remains assembly-driven
- package identity, manifest path, README path, and source symbol stay standardized
- runtime code is loaded through the provider-package loader SPI
- runtime bridge ownership stays with the integrating application or provider package

## 8. Error Semantics

Important standardized error codes include:

- \`invalid_provider_url\`
- \`driver_not_found\`
- \`provider_not_supported\`
- \`provider_package_not_found\`
- \`provider_package_identity_mismatch\`
- \`provider_package_load_failed\`
- \`provider_module_export_missing\`
- \`provider_module_contract_mismatch\`
- \`provider_metadata_mismatch\`
- \`native_sdk_not_available\`
- \`vendor_error\`

The two most important runtime distinctions are:

- \`provider_not_supported\`: the provider exists in the official catalog but no runnable driver is
  registered in the current runtime
- \`native_sdk_not_available\`: the standard surface exists but the actual vendor runtime bridge is
  missing or misconfigured

## 9. Local Verification

Use the following commands in the workspace root:

\`\`\`powershell
${renderUsageGuideLocalVerificationCommands(assembly)}
\`\`\`

Verification intent:

- \`materialize-sdk.mjs\` keeps generated catalogs, READMEs, matrices, and this usage guide aligned to the assembly
- \`verify-sdk-automation.test.mjs\` protects standard assets and materialization behavior
- \`verify-sdk.mjs\` validates assembly contracts and generated output
${renderUsageGuideExecutableSmokeNotes(assembly)}
- \`smoke-sdk.mjs\` runs the repository regression entrypoint, including TypeScript package tests
  and optional language checks when toolchains are available

## 10. Practical Adoption Guidance

Use this rule of thumb:

${renderUsageGuideAdoptionGuidance(assembly)}

Current reality is straightforward:

- \`${defaultProviderKey}\` is the default provider
- executable language baselines are ${executableLanguageLabels}
- IM owns call session lifecycle and realtime business delivery
- RTC owns media runtime provider selection, joining, publishing, muting, and leaving
- the remaining language workspaces stay standardized and extensible without pretending they are
  already executable runtimes
`);
}

function renderTypeScriptRuntimeUsageDoc(assembly) {
  const { languageEntry, runtimeBaseline } = getExecutableLanguageRuntimeBaseline(
    assembly,
    'typescript',
  );
  const defaultProviderKey =
    languageEntry.defaultProviderContract?.providerKey ??
    assembly.defaults?.providerKey ??
    DEFAULT_RTC_PROVIDER_KEY;

  return lines(`
# SDKWork RTC SDK TypeScript Runtime Usage

This guide describes the executable TypeScript/web media runtime baseline of \`sdkwork-rtc-sdk\`.
IM-owned SDKs and services create business call sessions, deliver invitations, and issue provider
credentials. The RTC SDK consumes media-room inputs and drives provider media behavior.

## Current Runnable Baseline

- Default media provider: \`${defaultProviderKey}\`
- Default web provider plugin package: \`${runtimeBaseline.vendorSdkPackage}\`
- Default web provider plugin import path: \`${runtimeBaseline.vendorSdkImportPath}\`
- Default web vendor SDK package: \`@volcengine/rtc\`
- Standard media entrypoint: \`RtcDataSource\`
- Recommended runtime entrypoint: \`${runtimeBaseline.recommendedEntrypoint}\`
- Smoke command: \`${runtimeBaseline.smokeCommand}\`
- Smoke mode: \`${runtimeBaseline.smokeMode}\`
- Smoke variants: ${renderMarkdownCodeNaturalList(runtimeBaseline.smokeVariants)}

## Install

\`\`\`bash
npm install ${languageEntry.publicPackage} ${runtimeBaseline.vendorSdkPackage} @volcengine/rtc
\`\`\`

## Fast Runtime Verification

Run the public TypeScript smoke command inside \`${languageEntry.workspace}\` when you want to validate
the default provider runtime bridge without depending on live credentials:

\`\`\`bash
${runtimeBaseline.smokeCommand}
\`\`\`

The smoke command builds the TypeScript package and verifies the root public API boundary. It guards
against retired call-lifecycle exports reappearing in the RTC SDK surface.

## Media Runtime Flow

\`\`\`ts
import {
  createRtcProviderPackageLoader,
  installRtcProviderPackage,
  RtcDriverManager,
  RtcDataSource,
} from '${languageEntry.publicPackage}';
import * as volcengineProvider from '${runtimeBaseline.vendorSdkImportPath}';

const driverManager = await installRtcProviderPackage(
  new RtcDriverManager(),
  {
    providerKey: '${defaultProviderKey}',
  },
  createRtcProviderPackageLoader(async () => volcengineProvider),
);

const dataSource = new RtcDataSource({
  driverManager,
  nativeConfig: {
    appId: 'volc-app-id',
    engineConfig: {
      env: 'production',
    },
    roomConfig: {
      profile: 'communication',
    },
    userExtraInfo: {
      displayName: 'Alice',
    },
    capture: {
      audioDeviceId: 'default-mic',
      videoDeviceId: 'default-camera',
    },
  },
});

const rtcClient = await dataSource.createClient();

await rtcClient.join({
  sessionId: 'media-session-1',
  roomId: 'provider-room-1',
  participantId: 'user-1',
  token: 'provider-issued-token',
});

await rtcClient.publish({
  trackId: 'media-session-1-audio',
  kind: 'audio',
});

await rtcClient.publish({
  trackId: 'media-session-1-video',
  kind: 'video',
});
\`\`\`

## Required Native Config

For the default Volcengine Web runtime, \`nativeConfig.appId\` is mandatory before \`join()\`.

Supported Volcengine Web native config shape:

\`\`\`ts
type RtcVolcengineWebNativeConfig = {
  appId?: string;
  engineConfig?: Record<string, unknown>;
  roomConfig?: Record<string, unknown>;
  userExtraInfo?: Record<string, unknown>;
  capture?: {
    audioDeviceId?: string;
    videoDeviceId?: string;
  };
};
\`\`\`

## Runtime Guarantees

- \`RtcDataSource\` is the standard provider-neutral media client factory
- \`installRtcProviderPackage(...)\` registers provider drivers through explicit plugin packages
- \`RtcDriverManager\` and \`RtcDataSource\` default to \`${defaultProviderKey}\` only after the
  matching provider package is installed into the manager
- official provider plugin packages and vendor SDKs are not bundled into the RTC standard root package
- provider plugin packages own any vendor SDK peer dependencies
- provider credentials are supplied by the application or IM layer before \`join()\`
- RTC runtime code does not own user invitation, conversation delivery, or business call lifecycle
`);
}
function renderFlutterRuntimeUsageInstallDependencies(languageEntry) {
  if (!languageEntry.runtimeBaseline) {
    throw new Error('Flutter usage guide requires runtimeBaseline metadata');
  }

  return [
    '  flutter:',
    '    sdk: flutter',
    `  ${languageEntry.publicPackage}:`,
    '    path: ../sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter',
  ].join('\n');
}

function renderFlutterRuntimeUsageDoc(assembly) {
  const { languageEntry, runtimeBaseline } = getExecutableLanguageRuntimeBaseline(
    assembly,
    'flutter',
  );
  const defaultProviderKey =
    languageEntry.defaultProviderContract?.providerKey ??
    assembly.defaults?.providerKey ??
    DEFAULT_RTC_PROVIDER_KEY;

  return lines(`
# SDKWork RTC SDK Flutter Runtime Usage

This guide describes the executable Flutter/mobile media runtime baseline of \`sdkwork-rtc-sdk\`.
IM-owned SDKs and services create business call sessions, deliver invitations, and issue provider
credentials. The RTC SDK consumes media-room inputs and drives provider media behavior.

## Current Runnable Baseline

- Default media provider: \`${defaultProviderKey}\`
- Default mobile provider plugin package: \`${runtimeBaseline.vendorSdkPackage}\`
- Default mobile provider plugin import path: \`${runtimeBaseline.vendorSdkImportPath}\`
- Standard media entrypoint: \`RtcDataSource\`
- Recommended runtime entrypoint: \`${runtimeBaseline.recommendedEntrypoint}\`
- Smoke command: \`${runtimeBaseline.smokeCommand}\`
- Smoke mode: \`${runtimeBaseline.smokeMode}\`
- Smoke variants: ${renderMarkdownCodeNaturalList(runtimeBaseline.smokeVariants)}

## Install

Add the standard RTC package. Provider plugin packages such as
\`${runtimeBaseline.vendorSdkPackage}\` are installed by the application only when that provider is
selected. The root package has no provider or vendor SDK dependency.

\`\`\`yaml
dependencies:
${renderFlutterRuntimeUsageInstallDependencies(languageEntry)}
\`\`\`

## Fast Runtime Verification

Run the public Flutter analysis command inside \`${languageEntry.workspace}\` when you need to verify
the provider-neutral media runtime contracts:

\`\`\`powershell
${runtimeBaseline.smokeCommand}
\`\`\`

## Media Runtime Flow

\`\`\`dart
import 'package:rtc_sdk/rtc_sdk.dart';

void inspectRtcProviderBoundary() {
  final packageEntry = getRtcProviderPackageByProviderKey('${defaultProviderKey}');
  final target = resolveRtcProviderPackageLoadTarget(
    const RtcProviderPackageLoadRequest(providerKey: '${defaultProviderKey}'),
  );

  assert(packageEntry?.packageIdentity == '${runtimeBaseline.vendorSdkPackage}');
  assert(target.packageEntry.packageIdentity == '${runtimeBaseline.vendorSdkPackage}');
}
\`\`\`

## Provider Native Config

The Flutter root package is provider-neutral. Provider-specific native config types belong to the
selected provider plugin package and are imported only by applications that install that plugin.

## Runtime Guarantees

- \`RtcDataSource\` is the standard provider-neutral media client factory
- \`RtcDriverManager\` accepts provider drivers registered by explicit provider plugin packages
- \`RtcDataSource\` defaults to \`${defaultProviderKey}\` only after the matching provider driver is
  registered
- provider plugin packages own concrete native bridge implementations and vendor dependencies
- provider credentials are supplied by the application or IM layer before \`join()\`
- RTC runtime code does not own user invitation, conversation delivery, or business call lifecycle
- audio and video publish operations stay standardized through \`RtcPublishOptions\`
`);
}
function renderTypeScriptAdapterContract(contract) {
  return `{
    sdkProvisioning: ${renderStringLiteral(contract.sdkProvisioning)},
    bindingStrategy: ${renderStringLiteral(contract.bindingStrategy)},
    bundlePolicy: ${renderStringLiteral(contract.bundlePolicy)},
    runtimeBridgeStatus: ${renderStringLiteral(contract.runtimeBridgeStatus)},
    officialVendorSdkRequirement: ${renderStringLiteral(contract.officialVendorSdkRequirement)},
  }`;
}

function renderTypeScriptRuntimeSurface(assembly) {
  return `import type { RtcSdkErrorCode } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_RUNTIME_SURFACE_METHODS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.runtimeSurfaceStandard?.methodTerms ?? [],
  )});

export type RtcRuntimeSurfaceMethodName = (typeof RTC_RUNTIME_SURFACE_METHODS)[number];

export type RtcRuntimeSurfaceFailureCode = Extract<RtcSdkErrorCode, ${renderStringLiteral(
    assembly.runtimeSurfaceStandard?.failureCode ?? '',
  )}>;

export const RTC_RUNTIME_SURFACE_FAILURE_CODE: RtcRuntimeSurfaceFailureCode = ${renderStringLiteral(
    assembly.runtimeSurfaceStandard?.failureCode ?? '',
  )};

export const RTC_RUNTIME_SURFACE_STANDARD = freezeRtcRuntimeValue({
  methodTerms: RTC_RUNTIME_SURFACE_METHODS,
  failureCode: RTC_RUNTIME_SURFACE_FAILURE_CODE,
} as const);
`;
}

function renderTypeScriptRuntimeImmutability(assembly) {
  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM = ${renderStringLiteral(
    assembly.runtimeImmutabilityStandard?.frozenTerm ?? '',
  )};

export const RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM = ${renderStringLiteral(
    assembly.runtimeImmutabilityStandard?.snapshotTerm ?? '',
  )};

export const RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM = ${renderStringLiteral(
    assembly.runtimeImmutabilityStandard?.controllerContextTerm ?? '',
  )};

export const RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM = ${renderStringLiteral(
    assembly.runtimeImmutabilityStandard?.nativeClientTerm ?? '',
  )};

export const RTC_RUNTIME_IMMUTABILITY_STANDARD = freezeRtcRuntimeValue({
  frozenTerm: RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM,
  snapshotTerm: RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM,
  controllerContextTerm: RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM,
  nativeClientTerm: RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM,
} as const);
`;
}

function renderTypeScriptRootPublicSurface(assembly) {
  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.rootPublicSurfaceStandard?.typescriptProviderNeutralExportPaths ?? [],
  )});

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.rootPublicSurfaceStandard?.typescriptBuiltinProviderExportPaths ?? [],
  )});

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.rootPublicSurfaceStandard?.typescriptInlineHelperNames ?? [],
  )});

export const RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.rootPublicSurfaceStandard?.reservedSurfaceFamilies ?? [],
  )});

export const RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS = freezeRtcRuntimeValue(${renderReadonlyStringRecord(
    assembly.rootPublicSurfaceStandard?.reservedEntryPointKinds ?? {},
  )} as const);

export const RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM = ${renderStringLiteral(
    assembly.rootPublicSurfaceStandard?.builtinProviderExposureTerm ?? '',
  )};

export const RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM = ${renderStringLiteral(
    assembly.rootPublicSurfaceStandard?.nonBuiltinProviderExposureTerm ?? '',
  )};

export {
  RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS,
  RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS,
  RTC_LOOKUP_HELPER_NAMING_STANDARD,
} from './lookup-helper-naming.js';

export const RTC_ROOT_PUBLIC_SURFACE_STANDARD = freezeRtcRuntimeValue({
  typescriptProviderNeutralExportPaths:
    RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
  typescriptBuiltinProviderExportPaths:
    RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS,
  typescriptInlineHelperNames: RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES,
  reservedSurfaceFamilies: RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES,
  reservedEntryPointKinds: RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS,
  builtinProviderExposureTerm: RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM,
  nonBuiltinProviderExposureTerm: RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM,
} as const);
`;
}

function renderTypeScriptLookupHelperNaming(assembly) {
  const profiles = Object.entries(assembly.lookupHelperNamingStandard?.profiles ?? {})
    .map(
      ([profileKey, profile]) => `  ${JSON.stringify(profileKey)}: freezeRtcRuntimeValue({
    languages: freezeRtcRuntimeValue(${renderReadonlyStringArray(profile.languages ?? [])}),
    helpers: freezeRtcRuntimeValue(${renderReadonlyStringRecord(profile.helpers ?? {})} as const),
  } as const),`,
    )
    .join('\n');

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.lookupHelperNamingStandard?.profileTerms ?? [],
  )});

export const RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.lookupHelperNamingStandard?.familyTerms ?? [],
  )});

export const RTC_LOOKUP_HELPER_NAMING_STANDARD = freezeRtcRuntimeValue({
  profileTerms: RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS,
  familyTerms: RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS,
  profiles: freezeRtcRuntimeValue({
${profiles}
  } as const),
} as const);
`;
}

function renderTypeScriptPackageContract(contract) {
  return `{
    packageName: ${renderStringLiteral(contract.packageName)},
    sourceModule: ${renderStringLiteral(contract.sourceModule)},
    driverFactory: ${renderStringLiteral(contract.driverFactory)},
    metadataSymbol: ${renderStringLiteral(contract.metadataSymbol)},
    moduleSymbol: ${renderStringLiteral(contract.moduleSymbol)},
    rootPublic: ${contract.rootPublic ? 'true' : 'false'},
  }`;
}

function getReferenceTypeScriptAdapterContract(assembly) {
  return (
    assembly.typescriptAdapterStandard?.referenceContract ??
    (assembly.providers ?? []).find((provider) => provider.providerKey === assembly.defaults?.providerKey)
      ?.typescriptAdapter ??
    (assembly.providers ?? [])[0]?.typescriptAdapter ??
    DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT
  );
}

function getExecutableLanguageRuntimeBaseline(assembly, language) {
  const languageEntry = (assembly.languages ?? []).find((entry) => entry.language === language);

  if (!languageEntry) {
    throw new Error(`Missing executable language workspace definition for ${language}`);
  }

  if (!languageEntry.runtimeBaseline) {
    throw new Error(`Language workspace ${language} must declare runtimeBaseline metadata`);
  }

  return {
    languageEntry,
    runtimeBaseline: languageEntry.runtimeBaseline,
  };
}

function renderTypeScriptWorkspaceManifest(assembly) {
  const { languageEntry } = getExecutableLanguageRuntimeBaseline(
    assembly,
    'typescript',
  );

  const packageJson = {
    name: languageEntry.publicPackage,
    version: '0.1.1',
    description:
      'Provider-neutral RTC media SDK with JDBC-style provider package loading',
    type: 'module',
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
        default: './dist/index.js',
      },
    },
    sideEffects: false,
    files: ['dist'],
    scripts: {
      clean:
        'call "%npm_node_execpath%" ./bin/package-task.mjs clean || "$npm_node_execpath" ./bin/package-task.mjs clean || node ./bin/package-task.mjs clean',
      build:
        'call "%npm_node_execpath%" ./bin/package-task.mjs build || "$npm_node_execpath" ./bin/package-task.mjs build || node ./bin/package-task.mjs build',
      test:
        'call "%npm_node_execpath%" ./bin/package-task.mjs test || "$npm_node_execpath" ./bin/package-task.mjs test || node ./bin/package-task.mjs test',
      smoke:
        'call "%npm_node_execpath%" ./bin/package-task.mjs smoke || "$npm_node_execpath" ./bin/package-task.mjs smoke || node ./bin/package-task.mjs smoke',
    },
  };

  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

function renderTypeScriptBuildTsconfig() {
  return `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        rootDir: './src',
        outDir: './dist',
        declaration: true,
        strict: true,
        skipLibCheck: true,
        verbatimModuleSyntax: true,
      },
      include: ['src/**/*.ts'],
    },
    null,
    2,
  )}\n`;
}

function renderTypeScriptRootEntrypoint(assembly) {
  const exportPaths = [
    ...(assembly.rootPublicSurfaceStandard?.typescriptProviderNeutralExportPaths ?? []),
    ...(assembly.rootPublicSurfaceStandard?.typescriptBuiltinProviderExportPaths ?? []),
  ];
  const helperNames = assembly.rootPublicSurfaceStandard?.typescriptInlineHelperNames ?? [];

  if (helperNames.length > 0) {
    throw new Error(
      `TypeScript root inline helpers are not supported by the plugin-only RTC root: ${helperNames.join(', ')}`,
    );
  }

  return `${exportPaths.map((exportPath) => `export * from '${exportPath}';`).join('\n')}\n`;
}

function writeIfChanged(workspaceRoot, filePath, nextContent, changedFiles) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const currentContent = existsSync(filePath) ? readUtf8File(filePath) : null;
  if (currentContent !== nextContent) {
    writeUtf8File(filePath, nextContent);
    changedFiles.push(path.relative(workspaceRoot, filePath).replace(/\\/g, '/'));
  }
}

function removeIfExists(workspaceRoot, filePath, changedFiles) {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
    changedFiles.push(path.relative(workspaceRoot, filePath).replace(/\\/g, '/'));
  }
}

function renderRoleHighlights(roleHighlights) {
  return (roleHighlights ?? []).map((item) => `- ${item}`).join('\n');
}

function renderReservedLanguagePackageScaffold(languageEntry) {
  if (!languageEntry.packageScaffold || !languageEntry.contractScaffold) {
    return '';
  }

  return `
Package scaffold:

- build system: ${languageEntry.packageScaffold.buildSystem}
- manifest: \`${languageEntry.packageScaffold.manifestRelativePath}\`
- contract scaffold: \`${languageEntry.contractScaffold.relativePath}\`
`;
}

function renderReservedLanguageMetadataScaffold(languageEntry) {
  if (!languageEntry.metadataScaffold) {
    return '';
  }

  return `
Metadata scaffold:

- provider catalog: \`${languageEntry.metadataScaffold.providerCatalogRelativePath}\`
- provider package catalog: \`${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}\`
- provider activation catalog: \`${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}\`
- capability catalog: \`${languageEntry.metadataScaffold.capabilityCatalogRelativePath}\`
- provider extension catalog: \`${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}\`
- provider selection: \`${languageEntry.metadataScaffold.providerSelectionRelativePath}\`
- lookup helper naming contract: \`lookupHelperNamingStandard\`
- lookup helper naming profiles: \`lower-camel-rtc\`, \`upper-camel-rtc\`, \`snake-case-rtc\`
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, provider URL parsing,
  provider selection resolution, provider support resolution, provider package loading, and
  language workspace by language
- helper naming stays language-idiomatic while preserving the same semantics:
  \`getRtc...\` for Flutter/Java/Swift/Kotlin, \`GetRtc...\` for C#/Go, and \`get_rtc...\` for Rust/Python
`;
}

function renderReservedLanguageResolutionScaffold(languageEntry) {
  if (!languageEntry.resolutionScaffold) {
    return '';
  }

  return `
Resolution scaffold:

- driver manager: \`${languageEntry.resolutionScaffold.driverManagerRelativePath}\`
- data source: \`${languageEntry.resolutionScaffold.dataSourceRelativePath}\`
- provider support: \`${languageEntry.resolutionScaffold.providerSupportRelativePath}\`
- provider package loader: \`${languageEntry.resolutionScaffold.providerPackageLoaderRelativePath}\`
`;
}

function renderReservedLanguageProviderPackageScaffold(languageEntry) {
  if (!languageEntry.providerPackageScaffold) {
    return '';
  }

  const providerPackageScaffoldNote =
    languageEntry.runtimeBridge
      ? '- this scaffold remains reserved for future extracted provider packages; the current executable runtime stays in the root workspace baseline\n'
      : '';

  return `
Provider package scaffold:

- scaffold: \`${languageEntry.providerPackageScaffold.relativePath}\`
- directory pattern: \`${languageEntry.providerPackageScaffold.directoryPattern}\`
- package pattern: \`${languageEntry.providerPackageScaffold.packagePattern}\`
- manifest file name: \`${languageEntry.providerPackageScaffold.manifestFileName}\`
- readme file name: \`${languageEntry.providerPackageScaffold.readmeFileName}\`
- source file pattern: \`${languageEntry.providerPackageScaffold.sourceFilePattern}\`
- source symbol pattern: \`${languageEntry.providerPackageScaffold.sourceSymbolPattern}\`
- template tokens: ${renderMarkdownCodeList(languageEntry.providerPackageScaffold.templateTokens)}
- source template tokens: ${renderMarkdownCodeList(languageEntry.providerPackageScaffold.sourceTemplateTokens)}
- status: \`${languageEntry.providerPackageScaffold.status}\`
- runtime bridge status: \`${languageEntry.providerPackageScaffold.runtimeBridgeStatus}\`
- root public exposure: \`${languageEntry.providerPackageScaffold.rootPublic}\`
${providerPackageScaffoldNote}`;
}

function renderLanguageWorkspaceProviderPackageBoundary(languageEntry) {
  if (!languageEntry.providerPackageBoundary) {
    return '';
  }

  const providerPackageBoundaryNote =
    languageEntry.runtimeBridge && languageEntry.providerPackageScaffold
      ? '- these terms describe future extracted provider packages, not the runnable root workspace baseline\n'
      : '';

  return `
Provider package boundary:

- mode: \`${languageEntry.providerPackageBoundary.mode}\`
- root public policy: \`${languageEntry.providerPackageBoundary.rootPublicPolicy}\`
- lifecycle status terms: ${renderMarkdownCodeList(
    languageEntry.providerPackageBoundary.lifecycleStatusTerms,
  )}
- runtime bridge status terms: ${renderMarkdownCodeList(
    languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms,
  )}
${providerPackageBoundaryNote}`;
}

function renderLanguageWorkspaceDefaultProviderContract(languageEntry, assembly) {
  const defaults = assembly.defaults ?? {};
  if (
    typeof defaults.providerKey !== 'string' ||
    typeof defaults.pluginId !== 'string' ||
    typeof defaults.driverId !== 'string'
  ) {
    return '';
  }

  if (languageEntry.language === 'typescript') {
    return `
Default provider contract:

- Web/browser default provider key: \`${defaults.providerKey}\`
- Web/browser default plugin id: \`${defaults.pluginId}\`
- Web/browser default driver id: \`${defaults.driverId}\`
- the TypeScript provider catalog must keep \`DEFAULT_RTC_PROVIDER_KEY\`,
  \`DEFAULT_RTC_PROVIDER_PLUGIN_ID\`, and \`DEFAULT_RTC_PROVIDER_DRIVER_ID\`
  aligned to that assembly default
- \`resolveRtcProviderSelection()\` falls back to \`DEFAULT_RTC_PROVIDER_KEY\`
  when web callers do not override providerUrl, providerKey, tenant override, or deployment profile
- \`RtcDataSource\` and \`RtcDriverManager\` therefore resolve the web default provider to
  \`${defaults.providerKey}\` unless the caller explicitly selects a different provider
`;
  }

  if (languageEntry.language === 'flutter') {
    return `
Default provider contract:

- Flutter/mobile default provider key: \`${defaults.providerKey}\`
- Flutter/mobile default plugin id: \`${defaults.pluginId}\`
- Flutter/mobile default driver id: \`${defaults.driverId}\`
- \`RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY\` must stay aligned to that assembly default
- \`resolveRtcProviderSelection()\` in \`${languageEntry.metadataScaffold.providerSelectionRelativePath}\`
  falls back to \`RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY\` when Flutter callers do not
  provide providerUrl, providerKey, tenant override, or deployment profile values
- \`RtcDataSourceOptions.defaultProviderKey\` and \`RtcDataSource.describeSelection()\`
  therefore keep the Flutter/mobile default provider on \`${defaults.providerKey}\`
  until a caller explicitly overrides it
`;
  }

  return `
Default provider contract:

- default provider key: \`${defaults.providerKey}\`
- default plugin id: \`${defaults.pluginId}\`
- default driver id: \`${defaults.driverId}\`
- language metadata and selection scaffolds must preserve that assembly-driven default
  provider identity for future runtime bridge landings
`;
}

function buildTypeScriptProviderActivationCatalogEntries(assembly) {
  const typescriptLanguage = (assembly.languages ?? []).find(
    (languageEntry) => languageEntry.language === 'typescript',
  );
  if (!typescriptLanguage) {
    return [];
  }

  return buildLanguageProviderActivationCatalogEntries(typescriptLanguage, assembly.providers);
}

function buildTypeScriptProviderPackageCatalogEntries(assembly) {
  return (assembly.providers ?? []).map((provider) => ({
    providerKey: provider.providerKey,
    pluginId: provider.pluginId,
    driverId: provider.driverId,
    packageIdentity: provider.typescriptPackage.packageName,
    manifestPath: `providers/rtc-sdk-provider-${provider.providerKey}/package.json`,
    readmePath: `providers/rtc-sdk-provider-${provider.providerKey}/README.md`,
    sourcePath: `providers/rtc-sdk-provider-${provider.providerKey}/index.js`,
    declarationPath: `providers/rtc-sdk-provider-${provider.providerKey}/index.d.ts`,
    sourceSymbol: provider.typescriptPackage.moduleSymbol,
    sourceModule: provider.typescriptPackage.sourceModule,
    driverFactory: provider.typescriptPackage.driverFactory,
    metadataSymbol: provider.typescriptPackage.metadataSymbol,
    moduleSymbol: provider.typescriptPackage.moduleSymbol,
    builtin: provider.builtin === true,
    rootPublic: provider.typescriptPackage.rootPublic === true,
    status: 'package_reference_boundary',
    runtimeBridgeStatus: provider.typescriptAdapter.runtimeBridgeStatus,
    requiredCapabilities: [...(provider.requiredCapabilities ?? [])],
    optionalCapabilities: [...(provider.optionalCapabilities ?? [])],
    extensionKeys: [...(provider.extensionKeys ?? [])],
  }));
}

function buildLanguageWorkspaceCatalogEntries(assembly) {
  const defaultProviderContract =
    typeof assembly.defaults?.providerKey === 'string' &&
    typeof assembly.defaults?.pluginId === 'string' &&
    typeof assembly.defaults?.driverId === 'string'
      ? {
          providerKey: assembly.defaults.providerKey,
          pluginId: assembly.defaults.pluginId,
          driverId: assembly.defaults.driverId,
        }
      : undefined;
  const providerSelectionContract =
    Array.isArray(assembly.providerSelectionStandard?.sourceTerms) &&
    Array.isArray(assembly.providerSelectionStandard?.precedence) &&
    typeof assembly.providerSelectionStandard?.defaultSource === 'string'
      ? {
          sourceTerms: [...assembly.providerSelectionStandard.sourceTerms],
          precedence: [...assembly.providerSelectionStandard.precedence],
          defaultSource: assembly.providerSelectionStandard.defaultSource,
        }
      : undefined;
  const providerSupportContract = Array.isArray(assembly.providerSupportStandard?.statusTerms)
    ? {
        statusTerms: [...assembly.providerSupportStandard.statusTerms],
      }
    : undefined;
  const providerActivationContract = Array.isArray(assembly.providerActivationStandard?.statusTerms)
    ? {
        statusTerms: [...assembly.providerActivationStandard.statusTerms],
      }
    : undefined;
  const providerPackageBoundaryContract =
    Array.isArray(assembly.providerPackageBoundaryStandard?.modeTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.rootPublicPolicyTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.lifecycleStatusTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.runtimeBridgeStatusTerms)
      ? {
          modeTerms: [...assembly.providerPackageBoundaryStandard.modeTerms],
          rootPublicPolicyTerms: [...assembly.providerPackageBoundaryStandard.rootPublicPolicyTerms],
          lifecycleStatusTerms: [...assembly.providerPackageBoundaryStandard.lifecycleStatusTerms],
          runtimeBridgeStatusTerms: [
            ...assembly.providerPackageBoundaryStandard.runtimeBridgeStatusTerms,
          ],
        }
      : undefined;

  return (assembly.languages ?? []).map((languageEntry) => ({
    language: languageEntry.language,
    workspace: languageEntry.workspace,
    workspaceCatalogRelativePath: languageEntry.workspaceCatalogRelativePath,
    displayName: languageEntry.displayName,
    publicPackage: languageEntry.publicPackage,
    maturityTier: languageEntry.maturityTier,
    controlSdk: languageEntry.controlSdk === true,
    runtimeBridge: languageEntry.runtimeBridge === true,
    currentRole: languageEntry.currentRole,
    workspaceSummary: languageEntry.workspaceSummary,
    roleHighlights: [...(languageEntry.roleHighlights ?? [])],
    defaultProviderContract,
    providerSelectionContract,
    providerSupportContract,
    providerActivationContract,
    runtimeBaseline: languageEntry.runtimeBaseline
      ? {
          vendorSdkPackage: languageEntry.runtimeBaseline.vendorSdkPackage,
          vendorSdkImportPath: languageEntry.runtimeBaseline.vendorSdkImportPath,
          recommendedEntrypoint: languageEntry.runtimeBaseline.recommendedEntrypoint,
          smokeCommand: languageEntry.runtimeBaseline.smokeCommand,
          smokeMode: languageEntry.runtimeBaseline.smokeMode,
          smokeVariants: [...languageEntry.runtimeBaseline.smokeVariants],
        }
      : undefined,
    metadataScaffold: languageEntry.metadataScaffold
      ? {
          providerCatalogRelativePath: languageEntry.metadataScaffold.providerCatalogRelativePath,
          capabilityCatalogRelativePath: languageEntry.metadataScaffold.capabilityCatalogRelativePath,
          providerExtensionCatalogRelativePath:
            languageEntry.metadataScaffold.providerExtensionCatalogRelativePath,
          providerPackageCatalogRelativePath:
            languageEntry.metadataScaffold.providerPackageCatalogRelativePath,
          providerActivationCatalogRelativePath:
            languageEntry.metadataScaffold.providerActivationCatalogRelativePath,
          providerSelectionRelativePath:
            languageEntry.metadataScaffold.providerSelectionRelativePath,
        }
      : undefined,
    resolutionScaffold: languageEntry.resolutionScaffold
      ? {
          driverManagerRelativePath: languageEntry.resolutionScaffold.driverManagerRelativePath,
          dataSourceRelativePath: languageEntry.resolutionScaffold.dataSourceRelativePath,
          providerSupportRelativePath: languageEntry.resolutionScaffold.providerSupportRelativePath,
          providerPackageLoaderRelativePath:
            languageEntry.resolutionScaffold.providerPackageLoaderRelativePath,
        }
      : undefined,
    providerPackageBoundaryContract,
    providerPackageBoundary: languageEntry.providerPackageBoundary
      ? {
          mode: languageEntry.providerPackageBoundary.mode,
          rootPublicPolicy: languageEntry.providerPackageBoundary.rootPublicPolicy,
          lifecycleStatusTerms: [...(languageEntry.providerPackageBoundary.lifecycleStatusTerms ?? [])],
          runtimeBridgeStatusTerms: [
            ...(languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms ?? []),
          ],
        }
      : undefined,
    providerPackageScaffold: languageEntry.providerPackageScaffold
      ? {
          relativePath: languageEntry.providerPackageScaffold.relativePath,
          directoryPattern: languageEntry.providerPackageScaffold.directoryPattern,
          packagePattern: languageEntry.providerPackageScaffold.packagePattern,
          manifestFileName: languageEntry.providerPackageScaffold.manifestFileName,
          readmeFileName: languageEntry.providerPackageScaffold.readmeFileName,
          sourceFilePattern: languageEntry.providerPackageScaffold.sourceFilePattern,
          sourceSymbolPattern: languageEntry.providerPackageScaffold.sourceSymbolPattern,
          templateTokens: [...(languageEntry.providerPackageScaffold.templateTokens ?? [])],
          sourceTemplateTokens: [
            ...(languageEntry.providerPackageScaffold.sourceTemplateTokens ?? []),
          ],
          referenceProviderKey: languageEntry.providerPackageScaffold.referenceProviderKey,
          referenceStatus: languageEntry.providerPackageScaffold.referenceStatus,
          referenceRuntimeBridgeStatus:
            languageEntry.providerPackageScaffold.referenceRuntimeBridgeStatus,
          referenceVendorSdkPackage:
            languageEntry.providerPackageScaffold.referenceVendorSdkPackage,
          referenceVendorSdkVersion:
            languageEntry.providerPackageScaffold.referenceVendorSdkVersion,
          runtimeBridgeStatus: languageEntry.providerPackageScaffold.runtimeBridgeStatus,
          rootPublic: languageEntry.providerPackageScaffold.rootPublic === true,
          status: languageEntry.providerPackageScaffold.status,
        }
      : undefined,
  }));
}

function renderLanguageWorkspaceCatalogSection(languageEntry) {
  if (typeof languageEntry.workspaceCatalogRelativePath !== 'string') {
    return '';
  }

  return `
Language workspace catalog:

- workspace catalog: \`${languageEntry.workspaceCatalogRelativePath}\`
- workspace catalog entries also keep \`workspaceCatalogRelativePath\`,
  \`defaultProviderContract\`, \`providerSelectionContract\`, \`providerSupportContract\`,
  \`providerActivationContract\`, any declared \`runtimeBaseline\`,
  \`providerPackageBoundaryContract\`, and any declared
  \`metadataScaffold\`, \`resolutionScaffold\`, \`providerPackageBoundary\`, and
  \`providerPackageScaffold\` boundaries so consumers can inspect official assembly-driven module
  locations, workspace-wide default provider identity, selection precedence, support-status
  vocabulary, activation-status vocabulary, runtime-baseline integration details, and
  package-boundary vocabulary without rereading the
  assembly.
`;
}

function renderLanguageWorkspaceRuntimeBaselineSection(languageEntry) {
  if (!languageEntry.runtimeBaseline) {
    return '';
  }

  return `
Runtime baseline contract:

- vendor SDK package: \`${languageEntry.runtimeBaseline.vendorSdkPackage}\`
- vendor SDK import path: \`${languageEntry.runtimeBaseline.vendorSdkImportPath}\`
- recommended entrypoint: \`${languageEntry.runtimeBaseline.recommendedEntrypoint}\`
- smoke command: \`${languageEntry.runtimeBaseline.smokeCommand}\`
- smoke mode: \`${languageEntry.runtimeBaseline.smokeMode}\`
- smoke variants: ${renderMarkdownCodeNaturalList(languageEntry.runtimeBaseline.smokeVariants)}
`;
}

function renderTypeScriptLanguageWorkspaceMetadataScaffold(metadataScaffold) {
  if (!metadataScaffold) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    providerCatalogRelativePath: ${renderStringLiteral(metadataScaffold.providerCatalogRelativePath)},
    capabilityCatalogRelativePath: ${renderStringLiteral(metadataScaffold.capabilityCatalogRelativePath)},
    providerExtensionCatalogRelativePath: ${renderStringLiteral(metadataScaffold.providerExtensionCatalogRelativePath)},
    providerPackageCatalogRelativePath: ${renderStringLiteral(metadataScaffold.providerPackageCatalogRelativePath)},
    providerActivationCatalogRelativePath: ${renderStringLiteral(metadataScaffold.providerActivationCatalogRelativePath)},
    providerSelectionRelativePath: ${renderStringLiteral(metadataScaffold.providerSelectionRelativePath)},
  })`;
}

function renderTypeScriptLanguageWorkspaceResolutionScaffold(resolutionScaffold) {
  if (!resolutionScaffold) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    driverManagerRelativePath: ${renderStringLiteral(resolutionScaffold.driverManagerRelativePath)},
    dataSourceRelativePath: ${renderStringLiteral(resolutionScaffold.dataSourceRelativePath)},
    providerSupportRelativePath: ${renderStringLiteral(resolutionScaffold.providerSupportRelativePath)},
    providerPackageLoaderRelativePath: ${renderStringLiteral(resolutionScaffold.providerPackageLoaderRelativePath)},
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderPackageBoundary(providerPackageBoundary) {
  if (!providerPackageBoundary) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    mode: ${renderStringLiteral(providerPackageBoundary.mode)},
    rootPublicPolicy: ${renderStringLiteral(providerPackageBoundary.rootPublicPolicy)},
    lifecycleStatusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundary.lifecycleStatusTerms)}),
    runtimeBridgeStatusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundary.runtimeBridgeStatusTerms)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderPackageScaffold(providerPackageScaffold) {
  if (!providerPackageScaffold) {
    return 'undefined';
  }

  const referenceFields = [
    ['referenceProviderKey', providerPackageScaffold.referenceProviderKey],
    ['referenceStatus', providerPackageScaffold.referenceStatus],
    ['referenceRuntimeBridgeStatus', providerPackageScaffold.referenceRuntimeBridgeStatus],
    ['referenceVendorSdkPackage', providerPackageScaffold.referenceVendorSdkPackage],
    ['referenceVendorSdkVersion', providerPackageScaffold.referenceVendorSdkVersion],
  ]
    .filter(([, value]) => typeof value === 'string')
    .map(([key, value]) => `    ${key}: ${renderStringLiteral(value)},`)
    .join('\n');

  return `freezeRtcRuntimeValue({
    relativePath: ${renderStringLiteral(providerPackageScaffold.relativePath)},
    directoryPattern: ${renderStringLiteral(providerPackageScaffold.directoryPattern)},
    packagePattern: ${renderStringLiteral(providerPackageScaffold.packagePattern)},
    manifestFileName: ${renderStringLiteral(providerPackageScaffold.manifestFileName)},
    readmeFileName: ${renderStringLiteral(providerPackageScaffold.readmeFileName)},
    sourceFilePattern: ${renderStringLiteral(providerPackageScaffold.sourceFilePattern)},
    sourceSymbolPattern: ${renderStringLiteral(providerPackageScaffold.sourceSymbolPattern)},
    templateTokens: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageScaffold.templateTokens)}),
    sourceTemplateTokens: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageScaffold.sourceTemplateTokens)}),
${referenceFields ? `${referenceFields}\n` : ''}    runtimeBridgeStatus: ${renderStringLiteral(providerPackageScaffold.runtimeBridgeStatus)},
    rootPublic: ${providerPackageScaffold.rootPublic ? 'true' : 'false'},
    status: ${renderStringLiteral(providerPackageScaffold.status)},
  })`;
}

function renderTypeScriptLanguageWorkspaceDefaultProviderContract(defaultProviderContract) {
  if (!defaultProviderContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    providerKey: ${renderStringLiteral(defaultProviderContract.providerKey)},
    pluginId: ${renderStringLiteral(defaultProviderContract.pluginId)},
    driverId: ${renderStringLiteral(defaultProviderContract.driverId)},
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderSelectionContract(
  providerSelectionContract,
) {
  if (!providerSelectionContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    sourceTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerSelectionContract.sourceTerms)}),
    precedence: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerSelectionContract.precedence)}),
    defaultSource: ${renderStringLiteral(providerSelectionContract.defaultSource)},
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderSupportContract(
  providerSupportContract,
) {
  if (!providerSupportContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    statusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerSupportContract.statusTerms)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderActivationContract(
  providerActivationContract,
) {
  if (!providerActivationContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    statusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerActivationContract.statusTerms)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceRuntimeBaseline(runtimeBaseline) {
  if (!runtimeBaseline) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    vendorSdkPackage: ${renderStringLiteral(runtimeBaseline.vendorSdkPackage)},
    vendorSdkImportPath: ${renderStringLiteral(runtimeBaseline.vendorSdkImportPath)},
    recommendedEntrypoint: ${renderStringLiteral(runtimeBaseline.recommendedEntrypoint)},
    smokeCommand: ${renderStringLiteral(runtimeBaseline.smokeCommand)},
    smokeMode: ${renderStringLiteral(runtimeBaseline.smokeMode)},
    smokeVariants: freezeRtcRuntimeValue(${renderReadonlyStringArray(runtimeBaseline.smokeVariants)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderPackageBoundaryContract(
  providerPackageBoundaryContract,
) {
  if (!providerPackageBoundaryContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    modeTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundaryContract.modeTerms)}),
    rootPublicPolicyTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundaryContract.rootPublicPolicyTerms)}),
    lifecycleStatusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundaryContract.lifecycleStatusTerms)}),
    runtimeBridgeStatusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundaryContract.runtimeBridgeStatusTerms)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceCatalog(assembly) {
  const entries = buildLanguageWorkspaceCatalogEntries(assembly);

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcLanguageWorkspaceCatalogEntry } from './types.js';

export const OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    entries.map((entry) => entry.language),
  )});

${entries
  .map((entry) => {
    const constantName = `${toUpperSnakeCase(entry.language)}_RTC_LANGUAGE_WORKSPACE_ENTRY`;

    return `export const ${constantName}: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: ${renderStringLiteral(entry.language)},
  workspace: ${renderStringLiteral(entry.workspace)},
  workspaceCatalogRelativePath: ${renderStringLiteral(entry.workspaceCatalogRelativePath)},
  displayName: ${renderStringLiteral(entry.displayName)},
  publicPackage: ${renderStringLiteral(entry.publicPackage)},
  maturityTier: ${renderStringLiteral(entry.maturityTier)},
  controlSdk: ${entry.controlSdk ? 'true' : 'false'},
  runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'},
  currentRole: ${renderStringLiteral(entry.currentRole)},
  workspaceSummary: ${renderStringLiteral(entry.workspaceSummary)},
  roleHighlights: freezeRtcRuntimeValue(${renderReadonlyStringArray(entry.roleHighlights)}),
  defaultProviderContract: ${renderTypeScriptLanguageWorkspaceDefaultProviderContract(entry.defaultProviderContract)},
  providerSelectionContract: ${renderTypeScriptLanguageWorkspaceProviderSelectionContract(entry.providerSelectionContract)},
  providerSupportContract: ${renderTypeScriptLanguageWorkspaceProviderSupportContract(entry.providerSupportContract)},
  providerActivationContract: ${renderTypeScriptLanguageWorkspaceProviderActivationContract(entry.providerActivationContract)},
  runtimeBaseline: ${renderTypeScriptLanguageWorkspaceRuntimeBaseline(entry.runtimeBaseline)},
  metadataScaffold: ${renderTypeScriptLanguageWorkspaceMetadataScaffold(entry.metadataScaffold)},
  resolutionScaffold: ${renderTypeScriptLanguageWorkspaceResolutionScaffold(entry.resolutionScaffold)},
  providerPackageBoundaryContract: ${renderTypeScriptLanguageWorkspaceProviderPackageBoundaryContract(entry.providerPackageBoundaryContract)},
  providerPackageBoundary: ${renderTypeScriptLanguageWorkspaceProviderPackageBoundary(entry.providerPackageBoundary)},
  providerPackageScaffold: ${renderTypeScriptLanguageWorkspaceProviderPackageScaffold(entry.providerPackageScaffold)},
});`;
  })
  .join('\n\n')}

export const RTC_LANGUAGE_WORKSPACE_CATALOG: readonly RtcLanguageWorkspaceCatalogEntry[] = freezeRtcRuntimeValue([
  ${entries
    .map((entry) => `${toUpperSnakeCase(entry.language)}_RTC_LANGUAGE_WORKSPACE_ENTRY`)
    .join(',\n  ')}
]);

const RTC_LANGUAGE_WORKSPACE_BY_KEY = new Map<string, RtcLanguageWorkspaceCatalogEntry>(
  RTC_LANGUAGE_WORKSPACE_CATALOG.map((entry) => [entry.language, entry]),
);

export function getRtcLanguageWorkspaceCatalog(): readonly RtcLanguageWorkspaceCatalogEntry[] {
  return RTC_LANGUAGE_WORKSPACE_CATALOG;
}

export function getRtcLanguageWorkspaceByLanguage(
  language: string,
): RtcLanguageWorkspaceCatalogEntry | undefined {
  return RTC_LANGUAGE_WORKSPACE_BY_KEY.get(language);
}

export function getRtcLanguageWorkspace(
  language: string,
): RtcLanguageWorkspaceCatalogEntry | undefined {
  return getRtcLanguageWorkspaceByLanguage(language);
}
`;
}

function renderTypeScriptWorkspaceReadme(languageEntry, assembly) {
  const typeScriptAdapter = getReferenceTypeScriptAdapterContract(assembly);
  const roleHighlights = [
    languageEntry.currentRole,
    ...(languageEntry.roleHighlights ?? []),
    'assembly-driven language workspace catalog at src/language-workspace-catalog.ts',
    'standard provider selection helpers at src/provider-selection.ts',
    'standard capability negotiation helpers at src/capability-negotiation.ts',
    'standard provider support helpers at src/provider-support.ts',
    'standard media runtime helpers for provider-neutral join, publish, mute, and leave flows',
    'assembly-driven provider package catalog at src/provider-package-catalog.ts',
    'standard provider package loader and installer SPI at src/provider-package-loader.ts',
    'assembly-driven provider activation catalog at src/provider-activation-catalog.ts',
    `TypeScript runtime bridge baseline: ${typeScriptAdapter.runtimeBridgeStatus}`,
    `TypeScript runtime bridge requires an official vendor SDK: ${typeScriptAdapter.officialVendorSdkRequirement}`,
    `TypeScript provider adapters remain ${typeScriptAdapter.sdkProvisioning}, bind through ${typeScriptAdapter.bindingStrategy}, and ${typeScriptAdapter.bundlePolicy} vendor SDKs`,
  ];

  return `# SDKWork RTC SDK ${languageEntry.displayName} Workspace

Language: \`${languageEntry.language}\`

Planned public package:

- \`${languageEntry.publicPackage}\`

Current boundary:

- control SDK support: ${languageEntry.controlSdk ? 'yes' : 'no'}
- runtime bridge support: ${languageEntry.runtimeBridge ? 'yes' : 'reserved'}
- maturity tier: ${languageEntry.maturityTier}

Current role:

${renderRoleHighlights(roleHighlights)}

${languageEntry.workspaceSummary}
This workspace does not bundle vendor SDK implementations. Provider adapters wrap caller-supplied
native client factories and expose vendor escape hatches through \`unwrap()\`.
The shared runtime-surface module at \`src/runtime-surface.ts\` materializes
\`runtimeSurfaceStandard\` into \`RTC_RUNTIME_SURFACE_METHODS\`,
\`RTC_RUNTIME_SURFACE_FAILURE_CODE\`, and \`RTC_RUNTIME_SURFACE_STANDARD\` so the provider-neutral
runtime method vocabulary and missing-runtime failure semantics stay assembly-governed.
The shared runtime-immutability module at \`src/runtime-immutability.ts\` materializes
\`runtimeImmutabilityStandard\` into \`RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM\`,
\`RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM\`,
\`RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM\`,
\`RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM\`, and
\`RTC_RUNTIME_IMMUTABILITY_STANDARD\` so runtime-frozen metadata, immutable snapshot contracts,
shallow-immutable runtime-controller contexts, and mutable native-client preservation stay
assembly-governed.
The shared root-public-surface module at \`src/root-public-surface.ts\` materializes
\`rootPublicSurfaceStandard\` into
\`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS\`,
\`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS\`,
\`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES\`,
\`RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES\`,
\`RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS\`, and
\`RTC_ROOT_PUBLIC_SURFACE_STANDARD\` so the TypeScript root export graph, builtin-provider
root exposure, and reserved single-entrypoint families stay assembly-governed.
The shared lookup-helper-naming module at \`src/lookup-helper-naming.ts\` materializes
\`lookupHelperNamingStandard\` into \`RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS\`,
\`RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS\`, and \`RTC_LOOKUP_HELPER_NAMING_STANDARD\` so the
\`lower-camel-rtc\`, \`upper-camel-rtc\`, and \`snake-case-rtc\` helper profiles stay
assembly-governed across the web/browser baseline and the reserved mobile/server language
workspaces.
${renderLanguageWorkspaceDefaultProviderContract(languageEntry, assembly)}
${renderLanguageWorkspaceCatalogSection(languageEntry)}
${renderLanguageWorkspaceRuntimeBaselineSection(languageEntry)}
${renderLanguageWorkspaceProviderPackageBoundary(languageEntry)}

Local runtime verification:

- \`npm run smoke\`
- \`npm run test\`
- \`npm run build\`
- RTC remains a provider/media runtime bridge; IM-owned packages handle business conversation
  delivery, invitations, and lifecycle state

Standards references:

- \`../docs/provider-adapter-standard.md\`
- \`../docs/multilanguage-capability-matrix.md\`
`;
}

function renderLanguageWorkspaceReadme(languageEntry, assembly) {
  if (languageEntry.language === 'typescript') {
    return renderTypeScriptWorkspaceReadme(languageEntry, assembly);
  }

  return `# SDKWork RTC SDK ${languageEntry.displayName} Workspace

Language: \`${languageEntry.language}\`

Planned public package:

- \`${languageEntry.publicPackage}\`

Current boundary:

- control SDK support: ${languageEntry.controlSdk ? 'yes' : 'no'}
- runtime bridge support: ${languageEntry.runtimeBridge ? 'yes' : 'reserved'}
- maturity tier: ${languageEntry.maturityTier}

Current role:

${renderRoleHighlights([languageEntry.currentRole, ...(languageEntry.roleHighlights ?? [])])}

${languageEntry.workspaceSummary}
${renderLanguageWorkspaceDefaultProviderContract(languageEntry, assembly)}
${renderLanguageWorkspaceCatalogSection(languageEntry)}
${renderLanguageWorkspaceRuntimeBaselineSection(languageEntry)}
${renderLanguageWorkspaceProviderPackageBoundary(languageEntry)}
${renderReservedLanguagePackageScaffold(languageEntry)}
${renderReservedLanguageMetadataScaffold(languageEntry)}
${renderReservedLanguageResolutionScaffold(languageEntry)}
${renderReservedLanguageProviderPackageScaffold(languageEntry)}${languageEntry.language === 'flutter'
  ? `\n${renderReservedLanguageRuntimeUsage(languageEntry)}`
  : ''}

Standards references:

- \`../docs/provider-adapter-standard.md\`
- \`../docs/multilanguage-capability-matrix.md\`
`;
}

function renderReservedLanguageRuntimeUsage(languageEntry) {
  if (languageEntry.language !== 'flutter') {
    return '';
  }

  return `Provider plugin boundary:

- Flutter/mobile root stays provider-neutral and ships no concrete provider adapter
- provider plugins such as \`rtc_sdk_provider_volcengine\` are installed only by applications that select them
- \`RtcDriverManager\` does not auto-register provider drivers from the root package
- \`RtcDataSource()\` resolves metadata but requires an explicitly registered provider driver before connecting
- business invitations, lifecycle state, and conversation delivery are supplied by IM-owned SDKs

Quick start:

\`\`\`dart
import 'package:rtc_sdk/rtc_sdk.dart';

void inspectProviderPluginPackage() {
  final target = resolveRtcProviderPackageLoadTarget(
    const RtcProviderPackageLoadRequest(providerKey: 'volcengine'),
  );

  assert(target.packageEntry.packageIdentity == 'rtc_sdk_provider_volcengine');
}
\`\`\`

Runtime notes:

- provider-specific native config types belong to the selected provider plugin package
- \`RtcJoinOptions.token\` is supplied by the application or IM layer, not hardcoded in RTC callers
- \`RtcPublishOptions\` remains provider-neutral and supports standard audio and video publishing
- \`RtcDataSource\` keeps the provider-neutral runtime boundary stable across native SDK adapters
- IM-owned services decide who should join, which provider room to use, and when the media runtime
  should leave`;
}

function renderCapabilityMatrix(assembly) {
  const capabilityCatalogRows = (assembly.capabilityCatalog ?? [])
    .map(
      (descriptor) =>
        `| \`${descriptor.capabilityKey}\` | \`${descriptor.category}\` | \`${descriptor.surface}\` |`,
    )
    .join('\n');
  const providerExtensionRows = (assembly.providerExtensionCatalog ?? [])
    .map(
      (descriptor) =>
        `| \`${descriptor.extensionKey}\` | \`${descriptor.providerKey}\` | ${descriptor.displayName} | \`${descriptor.surface}\` | \`${descriptor.access}\` | \`${descriptor.status}\` |`,
    )
    .join('\n');
  const typeScriptRuntimeRows = (assembly.providers ?? [])
    .map(
      (provider) =>
        `| \`${provider.providerKey}\` | \`${provider.typescriptAdapter.runtimeBridgeStatus}\` | \`${provider.typescriptAdapter.officialVendorSdkRequirement}\` | \`${provider.typescriptAdapter.sdkProvisioning}\` | \`${provider.typescriptAdapter.bindingStrategy}\` | \`${provider.typescriptAdapter.bundlePolicy}\` |`,
    )
    .join('\n');
  const providerRows = (assembly.providers ?? [])
    .map(
      (provider) =>
        `| \`${provider.providerKey}\` | \`${provider.tier}\` | ${provider.builtin ? 'Yes' : 'No'} | ${provider.defaultSelected ? 'Yes' : 'No'} | ${provider.displayName} |`,
    )
    .join('\n');
  const providerCapabilityRows = (assembly.providers ?? [])
    .map(
      (provider) =>
        `| \`${provider.providerKey}\` | ${renderMarkdownCodeList(provider.requiredCapabilities ?? [])} | ${renderMarkdownCodeList(provider.optionalCapabilities ?? [])} |`,
    )
    .join('\n');
  const languageRows = (assembly.languages ?? [])
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.publicPackage}\` | ${languageEntry.controlSdk ? 'Yes' : 'No'} | ${languageEntry.runtimeBridge ? 'Yes' : 'No'} | \`${languageEntry.maturityTier}\` | ${languageEntry.currentRole} |`,
    )
    .join('\n');
  const languageWorkspaceCatalogRows = (assembly.languages ?? [])
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.workspaceCatalogRelativePath}\` | \`${languageEntry.publicPackage}\` | ${languageEntry.controlSdk ? 'Yes' : 'No'} | ${languageEntry.runtimeBridge ? 'Yes' : 'No'} | \`${languageEntry.maturityTier}\` |`,
    )
    .join('\n');
  const languageProviderPackageBoundaryRows = (assembly.languages ?? [])
    .map((languageEntry) => {
      const scaffoldPath = languageEntry.providerPackageScaffold?.relativePath ?? '<none>';

      return `| ${languageEntry.displayName} | \`${languageEntry.providerPackageBoundary.mode}\` | \`${languageEntry.providerPackageBoundary.rootPublicPolicy}\` | ${renderMarkdownCodeList(languageEntry.providerPackageBoundary.lifecycleStatusTerms)} | ${renderMarkdownCodeList(languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms)} | \`${scaffoldPath}\` |`;
    })
    .join('\n');
  const languageProviderActivationRows = (assembly.languages ?? [])
    .flatMap((languageEntry) =>
      (languageEntry.providerActivations ?? []).map((providerActivation) => {
        const activationDetails = describeProviderActivationStatus(providerActivation.activationStatus);
        return `| ${languageEntry.displayName} | \`${providerActivation.providerKey}\` | \`${providerActivation.activationStatus}\` | ${activationDetails.runtimeBridge ? 'Yes' : 'No'} | ${activationDetails.rootPublic ? 'Yes' : 'No'} | ${activationDetails.packageBoundary ? 'Yes' : 'No'} |`;
      }),
    )
    .join('\n');
  const reservedLanguagePackageScaffoldRows = (assembly.languages ?? [])
    .filter((languageEntry) => languageEntry.language !== 'typescript')
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.packageScaffold.buildSystem}\` | \`${languageEntry.packageScaffold.manifestRelativePath}\` | \`${languageEntry.contractScaffold.relativePath}\` |`,
    )
    .join('\n');
  const reservedLanguageMetadataScaffoldRows = (assembly.languages ?? [])
    .filter((languageEntry) => languageEntry.language !== 'typescript')
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.metadataScaffold.providerCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.capabilityCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.providerSelectionRelativePath}\` |`,
    )
    .join('\n');
  const reservedLanguageResolutionScaffoldRows = (assembly.languages ?? [])
    .filter((languageEntry) => languageEntry.language !== 'typescript')
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.resolutionScaffold.driverManagerRelativePath}\` | \`${languageEntry.resolutionScaffold.dataSourceRelativePath}\` | \`${languageEntry.resolutionScaffold.providerSupportRelativePath}\` | \`${languageEntry.resolutionScaffold.providerPackageLoaderRelativePath}\` |`,
    )
    .join('\n');
  const reservedLanguageProviderPackageScaffoldRows = (assembly.languages ?? [])
    .filter((languageEntry) => languageEntry.language !== 'typescript')
    .map(
      (languageEntry) => {
        const defaultProviderKey = assembly.defaults?.providerKey ?? DEFAULT_RTC_PROVIDER_KEY;
        const defaultExample = materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.packagePattern,
          defaultProviderKey,
        );
        const defaultDirectory = materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.directoryPattern,
          defaultProviderKey,
        );
        const defaultManifestPath = `${defaultDirectory}/${materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.manifestFileName,
          defaultProviderKey,
        )}`;
        const defaultReadmePath = `${defaultDirectory}/${languageEntry.providerPackageScaffold.readmeFileName}`;
        const defaultSourcePath = `${defaultDirectory}/${materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.sourceFilePattern,
          defaultProviderKey,
        )}`;
        const defaultSourceSymbol = materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.sourceSymbolPattern,
          defaultProviderKey,
        );

        return `| ${languageEntry.displayName} | \`${languageEntry.providerPackageScaffold.relativePath}\` | \`${languageEntry.providerPackageScaffold.directoryPattern}\` | \`${languageEntry.providerPackageScaffold.packagePattern}\` | \`${languageEntry.providerPackageScaffold.manifestFileName}\` | \`${languageEntry.providerPackageScaffold.readmeFileName}\` | \`${languageEntry.providerPackageScaffold.sourceFilePattern}\` | \`${languageEntry.providerPackageScaffold.sourceSymbolPattern}\` | ${renderMarkdownCodeList(languageEntry.providerPackageScaffold.templateTokens)} | ${renderMarkdownCodeList(languageEntry.providerPackageScaffold.sourceTemplateTokens)} | \`${languageEntry.providerPackageScaffold.status}\` | \`${languageEntry.providerPackageScaffold.runtimeBridgeStatus}\` | \`${languageEntry.providerPackageScaffold.rootPublic}\` | \`${defaultExample}\` | \`${defaultManifestPath}\` | \`${defaultReadmePath}\` | \`${defaultSourcePath}\` | \`${defaultSourceSymbol}\` |`;
      },
    )
    .join('\n');
  const tierSummaryLines = Object.entries(assembly.providerTierStandard?.tierSummaries ?? {})
    .map(([tier, summary]) => `- \`${tier}\`: ${summary}`)
    .join('\n');
  const languageMaturitySummaryLines = Object.entries(
    assembly.languageMaturityStandard?.tierSummaries ?? {},
  )
    .map(([tier, summary]) => `- \`${tier}\`: ${summary}`)
    .join('\n');
  const capabilityStandardLines = [
    `- \`capabilityStandard.categoryTerms\`: ${renderMarkdownCodeList(
      assembly.capabilityStandard?.categoryTerms ?? [],
    )}`,
    `- \`capabilityStandard.surfaceTerms\`: ${renderMarkdownCodeList(
      assembly.capabilityStandard?.surfaceTerms ?? [],
    )}`,
  ].join('\n');
  const capabilityNegotiationStandardLines = [
    `- \`capabilityNegotiationStandard.statusTerms\`: ${renderMarkdownCodeList(
      assembly.capabilityNegotiationStandard?.statusTerms ?? [],
    )}`,
    `- \`capabilityNegotiationStandard.statusRules.supported\`: \`${assembly.capabilityNegotiationStandard?.statusRules?.supported ?? ''}\``,
    `- \`capabilityNegotiationStandard.statusRules.degraded\`: \`${assembly.capabilityNegotiationStandard?.statusRules?.degraded ?? ''}\``,
    `- \`capabilityNegotiationStandard.statusRules.unsupported\`: \`${assembly.capabilityNegotiationStandard?.statusRules?.unsupported ?? ''}\``,
  ].join('\n');
  const runtimeSurfaceStandardLines = [
    `- \`runtimeSurfaceStandard.methodTerms\`: ${renderMarkdownCodeList(
      assembly.runtimeSurfaceStandard?.methodTerms ?? [],
    )}`,
    `- \`runtimeSurfaceStandard.failureCode\`: \`${assembly.runtimeSurfaceStandard?.failureCode ?? ''}\``,
    '- TypeScript root public constants: `RTC_RUNTIME_SURFACE_METHODS`, `RTC_RUNTIME_SURFACE_FAILURE_CODE`',
  ].join('\n');
  const runtimeImmutabilityStandardLines = [
    `- \`runtimeImmutabilityStandard.frozenTerm\`: \`${assembly.runtimeImmutabilityStandard?.frozenTerm ?? ''}\``,
    `- \`runtimeImmutabilityStandard.snapshotTerm\`: \`${assembly.runtimeImmutabilityStandard?.snapshotTerm ?? ''}\``,
    `- \`runtimeImmutabilityStandard.controllerContextTerm\`: \`${assembly.runtimeImmutabilityStandard?.controllerContextTerm ?? ''}\``,
    `- \`runtimeImmutabilityStandard.nativeClientTerm\`: \`${assembly.runtimeImmutabilityStandard?.nativeClientTerm ?? ''}\``,
    '- TypeScript root public constants: `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`, `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`, `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`, `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, `RTC_RUNTIME_IMMUTABILITY_STANDARD`',
  ].join('\n');
  const rootPublicSurfaceStandardLines = [
    `- \`rootPublicSurfaceStandard.typescriptProviderNeutralExportPaths\`: ${renderMarkdownCodeList(
      assembly.rootPublicSurfaceStandard?.typescriptProviderNeutralExportPaths ?? [],
    )}`,
    `- \`rootPublicSurfaceStandard.typescriptBuiltinProviderExportPaths\`: ${renderMarkdownCodeList(
      assembly.rootPublicSurfaceStandard?.typescriptBuiltinProviderExportPaths ?? [],
    )}`,
    `- \`rootPublicSurfaceStandard.typescriptInlineHelperNames\`: ${renderMarkdownCodeList(
      assembly.rootPublicSurfaceStandard?.typescriptInlineHelperNames ?? [],
    )}`,
    `- \`rootPublicSurfaceStandard.reservedSurfaceFamilies\`: ${renderMarkdownCodeList(
      assembly.rootPublicSurfaceStandard?.reservedSurfaceFamilies ?? [],
    )}`,
    `- \`rootPublicSurfaceStandard.reservedEntryPointKinds.flutter\`: \`${assembly.rootPublicSurfaceStandard?.reservedEntryPointKinds?.flutter ?? ''}\``,
    `- \`rootPublicSurfaceStandard.reservedEntryPointKinds.python\`: \`${assembly.rootPublicSurfaceStandard?.reservedEntryPointKinds?.python ?? ''}\``,
    `- \`rootPublicSurfaceStandard.builtinProviderExposureTerm\`: \`${assembly.rootPublicSurfaceStandard?.builtinProviderExposureTerm ?? ''}\``,
    `- \`rootPublicSurfaceStandard.nonBuiltinProviderExposureTerm\`: \`${assembly.rootPublicSurfaceStandard?.nonBuiltinProviderExposureTerm ?? ''}\``,
    '- TypeScript root public module: `sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`',
    '- TypeScript root public constants: `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`, `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`, `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`, `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`, `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, `RTC_ROOT_PUBLIC_SURFACE_STANDARD`',
  ].join('\n');
  const lookupHelperNamingStandardLines = [
    `- \`lookupHelperNamingStandard.profileTerms\`: ${renderMarkdownCodeList(
      assembly.lookupHelperNamingStandard?.profileTerms ?? [],
    )}`,
    `- \`lookupHelperNamingStandard.familyTerms\`: ${renderMarkdownCodeList(
      assembly.lookupHelperNamingStandard?.familyTerms ?? [],
    )}`,
    '- TypeScript root public module: `sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts`',
    '- TypeScript root public constants: `RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`, `RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, `RTC_LOOKUP_HELPER_NAMING_STANDARD`',
  ].join('\n');
  const errorCodeStandardLines = [
    `- \`errorCodeStandard.codeTerms\`: ${renderMarkdownCodeList(
      assembly.errorCodeStandard?.codeTerms ?? [],
    )}`,
    `- \`errorCodeStandard.fallbackCode\`: \`${assembly.errorCodeStandard?.fallbackCode ?? ''}\``,
  ].join('\n');
  const providerExtensionStandardLines = [
    `- \`providerExtensionStandard.accessTerms\`: ${renderMarkdownCodeList(
      assembly.providerExtensionStandard?.accessTerms ?? [],
    )}`,
    `- \`providerExtensionStandard.statusTerms\`: ${renderMarkdownCodeList(
      assembly.providerExtensionStandard?.statusTerms ?? [],
    )}`,
  ].join('\n');
  const typeScriptAdapterStandardLines = [
    `- \`typescriptAdapterStandard.sdkProvisioningTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.sdkProvisioningTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.bindingStrategyTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.bindingStrategyTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.bundlePolicyTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.bundlePolicyTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.runtimeBridgeStatusTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.runtimeBridgeStatusTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.officialVendorSdkRequirementTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.officialVendorSdkRequirementTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.referenceContract.sdkProvisioning\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.sdkProvisioning ?? ''}\``,
    `- \`typescriptAdapterStandard.referenceContract.bindingStrategy\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.bindingStrategy ?? ''}\``,
    `- \`typescriptAdapterStandard.referenceContract.bundlePolicy\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.bundlePolicy ?? ''}\``,
    `- \`typescriptAdapterStandard.referenceContract.runtimeBridgeStatus\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.runtimeBridgeStatus ?? ''}\``,
    `- \`typescriptAdapterStandard.referenceContract.officialVendorSdkRequirement\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.officialVendorSdkRequirement ?? ''}\``,
  ].join('\n');
  const typeScriptPackageStandardLines = [
    `- \`typescriptPackageStandard.packageNamePattern\`: \`${assembly.typescriptPackageStandard?.packageNamePattern ?? ''}\``,
    `- \`typescriptPackageStandard.sourceModulePattern\`: \`${assembly.typescriptPackageStandard?.sourceModulePattern ?? ''}\``,
    `- \`typescriptPackageStandard.driverFactoryPattern\`: \`${assembly.typescriptPackageStandard?.driverFactoryPattern ?? ''}\``,
    `- \`typescriptPackageStandard.metadataSymbolPattern\`: \`${assembly.typescriptPackageStandard?.metadataSymbolPattern ?? ''}\``,
    `- \`typescriptPackageStandard.moduleSymbolPattern\`: \`${assembly.typescriptPackageStandard?.moduleSymbolPattern ?? ''}\``,
    `- \`typescriptPackageStandard.rootPublicRule\`: \`${assembly.typescriptPackageStandard?.rootPublicRule ?? ''}\``,
  ].join('\n');

  return `# RTC SDK Multilanguage Capability Matrix

This matrix is materialized from \`sdk-manifest.json\` so the official provider tiers, language
support boundaries, and maturity tiers stay exact and verifiable.

## Provider Tier Semantics

${tierSummaryLines}

## Language Maturity Semantics

${languageMaturitySummaryLines}

## Capability Standard

${capabilityStandardLines}

## Capability Negotiation Standard

${capabilityNegotiationStandardLines}

## Runtime Surface Standard

${runtimeSurfaceStandardLines}

## Runtime Immutability Standard

${runtimeImmutabilityStandardLines}

## Root Public Surface Standard

${rootPublicSurfaceStandardLines}

## Lookup Helper Naming Standard

${lookupHelperNamingStandardLines}

## Error Code Standard

${errorCodeStandardLines}

## Provider Extension Standard

${providerExtensionStandardLines}

## TypeScript Adapter Standard

${typeScriptAdapterStandardLines}

## TypeScript Package Standard

${typeScriptPackageStandardLines}

## Capability Catalog

| Capability key | Category | Surface |
| --- | --- | --- |
${capabilityCatalogRows}

## Provider Extension Catalog

| Extension key | Provider key | Display name | Surface | Access | Status |
| --- | --- | --- | --- | --- | --- |
${providerExtensionRows}

## Provider Matrix

| Provider key | Tier | Builtin | Default selected | Display name |
| --- | --- | --- | --- | --- |
${providerRows}

## Provider Capability Matrix

| Provider key | Required capabilities | Optional capabilities |
| --- | --- | --- |
${providerCapabilityRows}

## TypeScript Provider Runtime Baseline

| Provider key | Runtime bridge status | Vendor SDK requirement | SDK provisioning | Binding strategy | Bundle policy |
| --- | --- | --- | --- | --- | --- |
${typeScriptRuntimeRows}

## Language Matrix

| Language | Public package | Control SDK | Runtime bridge | Maturity tier | Current role |
| --- | --- | --- | --- | --- | --- |
${languageRows}

## Language Workspace Catalog Matrix

| Language | Workspace catalog | Public package | Control SDK | Runtime bridge | Maturity tier |
| --- | --- | --- | --- | --- | --- |
${languageWorkspaceCatalogRows}

## Language Provider Package Boundary Matrix

| Language | Mode | Root public policy | Lifecycle status terms | Runtime bridge status terms | Concrete scaffold path |
| --- | --- | --- | --- | --- | --- |
${languageProviderPackageBoundaryRows}

## Reserved Language Package Scaffold Matrix

| Language | Build system | Manifest path | Contract scaffold |
| --- | --- | --- | --- |
${reservedLanguagePackageScaffoldRows}

## Reserved Language Metadata Scaffold Matrix

| Language | Provider catalog | Provider package catalog | Provider activation catalog | Capability catalog | Provider extension catalog | Provider selection |
| --- | --- | --- | --- | --- | --- | --- |
${reservedLanguageMetadataScaffoldRows}

## Reserved Language Resolution Scaffold Matrix

| Language | Driver manager | Data source | Provider support | Provider package loader |
| --- | --- | --- | --- | --- |
${reservedLanguageResolutionScaffoldRows}

## Reserved Language Provider Package Scaffold Matrix

| Language | Scaffold path | Directory pattern | Package pattern | Manifest file name | Readme file name | Source file pattern | Source symbol pattern | Template tokens | Source template tokens | Status | Runtime bridge status | Root public | Default provider package identity | Default provider manifest path | Default provider README path | Default provider source path | Default provider source symbol |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${reservedLanguageProviderPackageScaffoldRows}

## Language Provider Activation Matrix

| Language | Provider key | Activation status | Runtime bridge | Root public | Package boundary |
| --- | --- | --- | --- | --- | --- |
${languageProviderActivationRows}

## Reading Rules

- ${renderExecutableLandingSummary(assembly)}
- The remaining official language workspaces are materialized reserved boundaries so the standard stays explicit.
- A provider package boundary may stay reserved even when the root workspace already has a verified runtime bridge.
- A workspace or provider package must not advertise runtime bridge support until it has a verified native bridge.
`;
}

function renderProviderPackageManifest(provider) {
  const packageContract = provider.typescriptPackage;
  const hasReferenceRuntimeBridge =
    provider.typescriptAdapter.runtimeBridgeStatus === 'reference-baseline';
  const peerDependencies = {
    '@sdkwork/rtc-sdk': '^0.1.1',
  };
  const peerDependenciesMeta = {};
  if (provider.providerKey === 'volcengine' && hasReferenceRuntimeBridge) {
    peerDependencies['@volcengine/rtc'] = '^4.68.3';
    peerDependenciesMeta['@volcengine/rtc'] = {
      optional: true,
    };
  }
  if (provider.providerKey === 'tencent' && hasReferenceRuntimeBridge) {
    peerDependencies['trtc-sdk-v5'] = '^5.18.0';
    peerDependenciesMeta['trtc-sdk-v5'] = {
      optional: true,
    };
  }
  const boundaryDescription = hasReferenceRuntimeBridge
    ? `Reference TypeScript provider boundary for ${provider.displayName} within sdkwork-rtc-sdk`
    : `Reserved TypeScript provider boundary for ${provider.displayName} within sdkwork-rtc-sdk`;

  const packageJson = {
    name: packageContract.packageName,
    version: '0.1.0',
    private: true,
    description: boundaryDescription,
    type: 'module',
    main: './index.js',
    types: './index.d.ts',
    exports: {
      '.': {
        types: './index.d.ts',
        import: './index.js',
        default: './index.js',
      },
    },
    sideEffects: false,
    files: ['index.js', 'index.d.ts', 'README.md'],
    peerDependencies,
    peerDependenciesMeta,
    devDependencies: {
      '@sdkwork/rtc-sdk': 'workspace:*',
    },
    sdkworkRtcProvider: {
      providerKey: provider.providerKey,
      displayName: provider.displayName,
      tier: provider.tier,
      builtin: provider.builtin,
      status: 'package_reference_boundary',
      registrationContract: 'RtcProviderModule',
      sourceModule: packageContract.sourceModule,
      driverFactory: packageContract.driverFactory,
      metadataSymbol: packageContract.metadataSymbol,
      moduleSymbol: packageContract.moduleSymbol,
      rootPublic: packageContract.rootPublic,
      requiredCapabilities: provider.requiredCapabilities ?? [],
      optionalCapabilities: provider.optionalCapabilities ?? [],
      extensionKeys: provider.extensionKeys ?? [],
      typescriptAdapter: {
        sdkProvisioning: provider.typescriptAdapter.sdkProvisioning,
        bindingStrategy: provider.typescriptAdapter.bindingStrategy,
        bundlePolicy: provider.typescriptAdapter.bundlePolicy,
        runtimeBridgeStatus: provider.typescriptAdapter.runtimeBridgeStatus,
        officialVendorSdkRequirement: provider.typescriptAdapter.officialVendorSdkRequirement,
      },
    },
  };

  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

function renderProviderPackageImportPrelude(symbols) {
  return `import {
  ${symbols.join(',\n  ')},
} from '@sdkwork/rtc-sdk';
`;
}

function renderGenericProviderPackageEntrypoint(provider) {
  const packageContract = provider.typescriptPackage;
  const catalogSymbol = `${toUpperSnakeCase(provider.providerKey)}_RTC_PROVIDER_CATALOG_ENTRY`;

  return `${renderProviderPackageImportPrelude([
    catalogSymbol,
    'createRtcProviderDriver',
    'createRtcProviderModule',
  ])}

export const ${packageContract.metadataSymbol} = ${catalogSymbol};

export function ${packageContract.driverFactory}(options = {}) {
  return createRtcProviderDriver({
    metadata: ${packageContract.metadataSymbol},
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const ${packageContract.moduleSymbol} = createRtcProviderModule({
  packageName: ${packageContract.metadataSymbol}.typescriptPackage.packageName,
  metadata: ${packageContract.metadataSymbol},
  builtin: ${catalogSymbol}.builtin,
  createDriver: ${packageContract.driverFactory},
});
`;
}

function renderVolcengineProviderPackageEntrypoint(provider) {
  const packageContract = provider.typescriptPackage;
  const catalogSymbol = 'VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY';

  return `${renderProviderPackageImportPrelude([
    catalogSymbol,
    'RtcSdkException',
    'createRtcProviderDriver',
    'createRtcProviderModule',
  ])}

export const ${packageContract.metadataSymbol} = ${catalogSymbol};

async function defaultLoadVolcengineWebSdk() {
  try {
    return await import('@volcengine/rtc');
  } catch (error) {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Volcengine Web RTC SDK package "@volcengine/rtc" is not available.',
      providerKey: ${packageContract.metadataSymbol}.providerKey,
      pluginId: ${packageContract.metadataSymbol}.pluginId,
      details: {
        packageName: '@volcengine/rtc',
      },
      cause: error,
    });
  }
}

function resolveNativeConfig(config) {
  const nativeConfig = config.nativeConfig ?? {};

  if (
    nativeConfig === null ||
    typeof nativeConfig !== 'object' ||
    Array.isArray(nativeConfig)
  ) {
    throw new RtcSdkException({
      code: 'invalid_native_config',
      message: 'RTC nativeConfig must be an object for the official Volcengine Web bridge.',
      providerKey: ${packageContract.metadataSymbol}.providerKey,
      pluginId: ${packageContract.metadataSymbol}.pluginId,
    });
  }

  return nativeConfig;
}

function assertRequiredVolcengineConfig(nativeConfig) {
  if (nativeConfig.appId) {
    return;
  }

  throw new RtcSdkException({
    code: 'invalid_native_config',
    message: 'Official Volcengine Web RTC runtime requires nativeConfig.appId.',
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      missingConfigKeys: ['appId'],
    },
  });
}

function resolveVolcengineWebSdkModule(sdkModule) {
  const candidate =
    sdkModule &&
    typeof sdkModule === 'object' &&
    typeof sdkModule.createEngine !== 'function'
      ? sdkModule.default
      : sdkModule;

  if (
    !candidate ||
    typeof candidate.createEngine !== 'function' ||
    typeof candidate.destroyEngine !== 'function'
  ) {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Volcengine Web RTC SDK package "@volcengine/rtc" did not expose createEngine and destroyEngine.',
      providerKey: ${packageContract.metadataSymbol}.providerKey,
      pluginId: ${packageContract.metadataSymbol}.pluginId,
      details: {
        packageName: '@volcengine/rtc',
        expectedExports: ['createEngine', 'destroyEngine'],
      },
    });
  }

  return candidate;
}

async function ensureEngine(context) {
  const nativeConfig = resolveNativeConfig(context.nativeClient.resolvedConfig);
  assertRequiredVolcengineConfig(nativeConfig);

  if (!context.nativeClient.sdkModule) {
    context.nativeClient.sdkModule = resolveVolcengineWebSdkModule(
      await context.nativeClient.loadSdk(),
    );
  }

  if (!context.nativeClient.engine) {
    context.nativeClient.engine = context.nativeClient.sdkModule.createEngine(
      nativeConfig.appId,
      nativeConfig.engineConfig,
    );
  }

  return {
    nativeConfig,
    sdkModule: context.nativeClient.sdkModule,
    engine: context.nativeClient.engine,
  };
}

function buildRtcSessionDescriptor(options) {
  return {
    sessionId: options.sessionId,
    roomId: options.roomId,
    participantId: options.participantId,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    connectionState: 'joined',
  };
}

function buildUserInfo(options, nativeConfig) {
  const mergedExtraInfo = {
    ...(nativeConfig.userExtraInfo ?? {}),
    ...(options.metadata ?? {}),
  };

  return {
    userId: options.participantId,
    extraInfo:
      Object.keys(mergedExtraInfo).length > 0
        ? JSON.stringify(mergedExtraInfo)
        : undefined,
  };
}

async function publishMediaKind(engine, nativeConfig, kind) {
  if (kind === 'audio') {
    await engine.startAudioCapture(nativeConfig.capture?.audioDeviceId);
    await engine.publishStream('audio');
    return;
  }

  if (kind === 'screen-share') {
    await engine.startScreenCapture(nativeConfig.capture?.screen);
    await engine.publishScreen();
    return;
  }

  await engine.startVideoCapture(nativeConfig.capture?.videoDeviceId);
  await engine.publishStream('video');
}

async function unpublishMediaKind(engine, kind) {
  if (kind === 'screen-share') {
    await engine.unpublishScreen();
    await engine.stopScreenCapture();
    return;
  }

  await engine.unpublishStream(kind);
  if (kind === 'audio') {
    await engine.stopAudioCapture();
    return;
  }

  await engine.stopVideoCapture();
}

async function muteMediaKind(engine, nativeConfig, kind, muted) {
  if (kind === 'audio') {
    if (muted) {
      await engine.stopAudioCapture();
      await engine.unpublishStream('audio');
    } else {
      await engine.startAudioCapture(nativeConfig.capture?.audioDeviceId);
      await engine.publishStream('audio');
    }

    return {
      kind: 'audio',
      muted,
    };
  }

  if (muted) {
    await engine.stopVideoCapture();
    await engine.unpublishStream('video');
  } else {
    await engine.startVideoCapture(nativeConfig.capture?.videoDeviceId);
    await engine.publishStream('video');
  }

  return {
    kind: 'video',
    muted,
  };
}

function isLocalMediaKind(kind) {
  return kind === 'audio' || kind === 'video';
}

function hasPublishedMediaKind(nativeClient, kind) {
  for (const publishedKind of nativeClient.publishedTracks.values()) {
    if (publishedKind === kind) {
      return true;
    }
  }

  return false;
}

function hasOtherPublishedMediaKind(nativeClient, trackId, kind) {
  for (const [publishedTrackId, publishedKind] of nativeClient.publishedTracks.entries()) {
    if (publishedTrackId !== trackId && publishedKind === kind) {
      return true;
    }
  }

  return false;
}

function markMediaKindActive(nativeClient, kind) {
  if (isLocalMediaKind(kind)) {
    nativeClient.mutedMediaKinds.delete(kind);
  }
}

function markMediaKindMuted(nativeClient, kind, muted) {
  if (!isLocalMediaKind(kind)) {
    return;
  }

  if (muted) {
    nativeClient.mutedMediaKinds.add(kind);
    return;
  }

  nativeClient.mutedMediaKinds.delete(kind);
}

function forgetPublishedTrack(nativeClient, trackId, kind) {
  nativeClient.publishedTracks.delete(trackId);
  if (isLocalMediaKind(kind) && !hasPublishedMediaKind(nativeClient, kind)) {
    nativeClient.mutedMediaKinds.delete(kind);
  }
}

function shouldApplyMute(nativeClient, kind, muted) {
  if (!hasPublishedMediaKind(nativeClient, kind)) {
    return false;
  }

  return nativeClient.mutedMediaKinds.has(kind) !== muted;
}

function resolveTrackPublicationMuted(nativeClient, kind) {
  return isLocalMediaKind(kind) && nativeClient.mutedMediaKinds.has(kind);
}

function shouldPublishNativeMedia(nativeClient, kind) {
  return !hasPublishedMediaKind(nativeClient, kind);
}

function shouldUnpublishNativeMedia(nativeClient, trackId, kind) {
  if (kind === 'screen-share') {
    return true;
  }

  return (
    !nativeClient.mutedMediaKinds.has(kind) &&
    !hasOtherPublishedMediaKind(nativeClient, trackId, kind)
  );
}

function assertTrackKindReusable(nativeClient, trackId, kind) {
  const existingKind = nativeClient.publishedTracks.get(trackId);
  if (!existingKind || existingKind === kind) {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: \`RTC track id "\${trackId}" is already published as "\${existingKind}" and cannot be republished as "\${kind}".\`,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      trackId,
      existingKind,
      requestedKind: kind,
    },
  });
}

function getActiveScreenShareTrackId(nativeClient) {
  for (const [publishedTrackId, publishedKind] of nativeClient.publishedTracks.entries()) {
    if (publishedKind === 'screen-share') {
      return publishedTrackId;
    }
  }

  return undefined;
}

function assertScreenShareTrackAvailable(nativeClient, trackId) {
  const activeTrackId = getActiveScreenShareTrackId(nativeClient);
  if (!activeTrackId || activeTrackId === trackId) {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: \`RTC screen share is already active on track "\${activeTrackId}" and cannot be started as "\${trackId}".\`,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      activeTrackId,
      requestedTrackId: trackId,
      kind: 'screen-share',
    },
  });
}

function assertTrackPublishable(nativeClient, trackId, kind) {
  assertTrackKindReusable(nativeClient, trackId, kind);
  if (kind === 'screen-share') {
    assertScreenShareTrackAvailable(nativeClient, trackId);
  }
}

function assertJoined(nativeClient, operation) {
  const currentState = nativeClient.joinedSession?.connectionState ?? 'left';
  if (currentState === 'joined') {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: \`RTC operation "\${operation}" requires a joined room before local media can be controlled.\`,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      operation,
      requiredState: 'joined',
      currentState,
    },
  });
}

async function drainPublishedMedia(engine, nativeClient) {
  for (const [trackId, mediaKind] of Array.from(nativeClient.publishedTracks.entries())) {
    if (!nativeClient.publishedTracks.has(trackId)) {
      continue;
    }

    if (shouldUnpublishNativeMedia(nativeClient, trackId, mediaKind)) {
      await unpublishMediaKind(engine, mediaKind);
    }
    forgetPublishedTrack(nativeClient, trackId, mediaKind);
  }

  nativeClient.publishedTracks.clear();
  nativeClient.mutedMediaKinds.clear();
}

function resolvePublishedMediaKind(options) {
  if (
    options.kind === 'audio' ||
    options.kind === 'video' ||
    options.kind === 'screen-share'
  ) {
    return options.kind;
  }

  throw new RtcSdkException({
    code: 'capability_not_supported',
    message: \`Official Volcengine Web bridge does not support publishing track kind "\${options.kind}" through the standard runtime surface.\`,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      kind: options.kind,
    },
  });
}

const OFFICIAL_VOLCENGINE_WEB_RUNTIME_CONTROLLER = {
  async join(options, context) {
    const { nativeConfig, engine } = await ensureEngine(context);
    await engine.joinRoom(
      options.token ?? null,
      options.roomId,
      buildUserInfo(options, nativeConfig),
      nativeConfig.roomConfig,
    );

    const sessionDescriptor = buildRtcSessionDescriptor(options);
    context.nativeClient.joinedSession = sessionDescriptor;
    return sessionDescriptor;
  },
  async leave(context) {
    if (!context.nativeClient.engine) {
      return (
        context.nativeClient.joinedSession ?? {
          sessionId: '',
          roomId: '',
          participantId: '',
          providerKey: ${packageContract.metadataSymbol}.providerKey,
          connectionState: 'left',
        }
      );
    }

    const engine = context.nativeClient.engine;
    await drainPublishedMedia(engine, context.nativeClient);
    await engine.leaveRoom();
    context.nativeClient.sdkModule?.destroyEngine(engine);
    const joinedSession = context.nativeClient.joinedSession;
    context.nativeClient.engine = undefined;
    context.nativeClient.joinedSession = undefined;
    context.nativeClient.publishedTracks.clear();
    context.nativeClient.mutedMediaKinds.clear();

    return {
      sessionId: joinedSession?.sessionId ?? '',
      roomId: joinedSession?.roomId ?? '',
      participantId: joinedSession?.participantId ?? '',
      providerKey: ${packageContract.metadataSymbol}.providerKey,
      connectionState: 'left',
    };
  },
  async publish(options, context) {
    assertJoined(context.nativeClient, 'publish');
    const mediaKind = resolvePublishedMediaKind(options);
    assertTrackPublishable(context.nativeClient, options.trackId, mediaKind);
    const { nativeConfig, engine } = await ensureEngine(context);
    const shouldPublish = shouldPublishNativeMedia(context.nativeClient, mediaKind);
    if (shouldPublish) {
      await publishMediaKind(engine, nativeConfig, mediaKind);
    }
    context.nativeClient.publishedTracks.set(options.trackId, mediaKind);
    if (shouldPublish) {
      markMediaKindActive(context.nativeClient, mediaKind);
    }
    return {
      trackId: options.trackId,
      kind: options.kind,
      muted: resolveTrackPublicationMuted(context.nativeClient, mediaKind),
    };
  },
  async unpublish(trackId, context) {
    const mediaKind = context.nativeClient.publishedTracks.get(trackId);
    if (!mediaKind) {
      return;
    }

    if (shouldUnpublishNativeMedia(context.nativeClient, trackId, mediaKind)) {
      const { engine } = await ensureEngine(context);
      await unpublishMediaKind(engine, mediaKind);
    }
    forgetPublishedTrack(context.nativeClient, trackId, mediaKind);
  },
  async startScreenShare(options, context) {
    assertJoined(context.nativeClient, 'startScreenShare');
    assertTrackPublishable(context.nativeClient, options.trackId, 'screen-share');
    const { nativeConfig, engine } = await ensureEngine(context);
    const shouldPublish = shouldPublishNativeMedia(context.nativeClient, 'screen-share');
    if (shouldPublish) {
      await publishMediaKind(engine, nativeConfig, 'screen-share');
    }
    context.nativeClient.publishedTracks.set(options.trackId, 'screen-share');
    return {
      trackId: options.trackId,
      kind: 'screen-share',
      muted: false,
    };
  },
  async stopScreenShare(trackId, context) {
    const mediaKind = context.nativeClient.publishedTracks.get(trackId);
    if (mediaKind !== 'screen-share') {
      return;
    }

    const { engine } = await ensureEngine(context);
    await unpublishMediaKind(engine, 'screen-share');
    context.nativeClient.publishedTracks.delete(trackId);
  },
  async muteAudio(muted, context) {
    assertJoined(context.nativeClient, 'muteAudio');
    if (!shouldApplyMute(context.nativeClient, 'audio', muted)) {
      return {
        kind: 'audio',
        muted,
      };
    }

    const { nativeConfig, engine } = await ensureEngine(context);
    const muteState = await muteMediaKind(engine, nativeConfig, 'audio', muted);
    markMediaKindMuted(context.nativeClient, 'audio', muted);
    return muteState;
  },
  async muteVideo(muted, context) {
    assertJoined(context.nativeClient, 'muteVideo');
    if (!shouldApplyMute(context.nativeClient, 'video', muted)) {
      return {
        kind: 'video',
        muted,
      };
    }

    const { nativeConfig, engine } = await ensureEngine(context);
    const muteState = await muteMediaKind(engine, nativeConfig, 'video', muted);
    markMediaKindMuted(context.nativeClient, 'video', muted);
    return muteState;
  },
};

export function createOfficialVolcengineWebRtcDriver(options = {}) {
  const loadSdk = options.loadSdk ?? defaultLoadVolcengineWebSdk;

  return createRtcProviderDriver({
    metadata: ${packageContract.metadataSymbol},
    nativeFactory(config) {
      return {
        resolvedConfig: config,
        loadSdk,
        publishedTracks: new Map(),
        mutedMediaKinds: new Set(),
      };
    },
    runtimeController: OFFICIAL_VOLCENGINE_WEB_RUNTIME_CONTROLLER,
  });
}

export function ${packageContract.driverFactory}(options = {}) {
  if (!options.nativeFactory && !options.runtimeController) {
    return createOfficialVolcengineWebRtcDriver({
      loadSdk: options.loadSdk,
    });
  }

  return createRtcProviderDriver({
    metadata: ${packageContract.metadataSymbol},
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const ${packageContract.moduleSymbol} = createRtcProviderModule({
  packageName: ${packageContract.metadataSymbol}.typescriptPackage.packageName,
  metadata: ${packageContract.metadataSymbol},
  builtin: ${catalogSymbol}.builtin,
  createDriver: ${packageContract.driverFactory},
});
`;
}

function renderTencentProviderPackageEntrypoint(provider) {
  const packageContract = provider.typescriptPackage;
  const catalogSymbol = 'TENCENT_RTC_PROVIDER_CATALOG_ENTRY';

  return `${renderProviderPackageImportPrelude([
    catalogSymbol,
    'RtcSdkException',
    'createRtcProviderDriver',
    'createRtcProviderModule',
  ])}

export const ${packageContract.metadataSymbol} = ${catalogSymbol};

async function defaultLoadTencentWebSdk() {
  try {
    return await import('trtc-sdk-v5');
  } catch (error) {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Tencent TRTC Web SDK package "trtc-sdk-v5" is not available.',
      providerKey: ${packageContract.metadataSymbol}.providerKey,
      pluginId: ${packageContract.metadataSymbol}.pluginId,
      details: {
        packageName: 'trtc-sdk-v5',
      },
      cause: error,
    });
  }
}

function resolveNativeConfig(config) {
  const nativeConfig = config.nativeConfig ?? {};

  if (
    nativeConfig === null ||
    typeof nativeConfig !== 'object' ||
    Array.isArray(nativeConfig)
  ) {
    throw new RtcSdkException({
      code: 'invalid_native_config',
      message: 'RTC nativeConfig must be an object for the official Tencent Web bridge.',
      providerKey: ${packageContract.metadataSymbol}.providerKey,
      pluginId: ${packageContract.metadataSymbol}.pluginId,
    });
  }

  return nativeConfig;
}

function assertRequiredTencentConfig(nativeConfig) {
  const missingConfigKeys = [];
  if (!nativeConfig.sdkAppId) {
    missingConfigKeys.push('sdkAppId');
  }
  if (!nativeConfig.userSig) {
    missingConfigKeys.push('userSig');
  }

  if (missingConfigKeys.length === 0) {
    return;
  }

  throw new RtcSdkException({
    code: 'invalid_native_config',
    message: 'Official Tencent Web RTC runtime requires nativeConfig.sdkAppId and nativeConfig.userSig.',
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      missingConfigKeys,
    },
  });
}

function resolveTencentWebSdkModule(sdkModule) {
  const candidate =
    sdkModule &&
    typeof sdkModule === 'object' &&
    typeof sdkModule.create !== 'function'
      ? sdkModule.default
      : sdkModule;

  if (!candidate || typeof candidate.create !== 'function') {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Tencent TRTC Web SDK package "trtc-sdk-v5" did not expose create.',
      providerKey: ${packageContract.metadataSymbol}.providerKey,
      pluginId: ${packageContract.metadataSymbol}.pluginId,
      details: {
        packageName: 'trtc-sdk-v5',
        expectedExports: ['create'],
      },
    });
  }

  return candidate;
}

async function ensureTrtc(context) {
  const nativeConfig = resolveNativeConfig(context.nativeClient.resolvedConfig);
  assertRequiredTencentConfig(nativeConfig);

  if (!context.nativeClient.sdkModule) {
    context.nativeClient.sdkModule = resolveTencentWebSdkModule(
      await context.nativeClient.loadSdk(),
    );
  }

  if (!context.nativeClient.trtc) {
    context.nativeClient.trtc = context.nativeClient.sdkModule.create();
  }

  return {
    nativeConfig,
    sdkModule: context.nativeClient.sdkModule,
    trtc: context.nativeClient.trtc,
  };
}

function buildRtcSessionDescriptor(options) {
  return {
    sessionId: options.sessionId,
    roomId: options.roomId,
    participantId: options.participantId,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    connectionState: 'joined',
  };
}

function resolveTencentRoomId(roomId) {
  const normalizedRoomId = String(roomId).trim();
  if (/^\\d+$/.test(normalizedRoomId)) {
    return Number(normalizedRoomId);
  }

  return roomId;
}

function buildEnterRoomOptions(options, nativeConfig) {
  return {
    sdkAppId: Number(nativeConfig.sdkAppId),
    roomId: resolveTencentRoomId(options.roomId),
    userId: options.participantId,
    userSig: nativeConfig.userSig,
    ...(nativeConfig.scene ? { scene: nativeConfig.scene } : {}),
    ...(nativeConfig.role ? { role: nativeConfig.role } : {}),
    ...(nativeConfig.privateMapKey ? { privateMapKey: nativeConfig.privateMapKey } : {}),
  };
}

async function publishMediaKind(trtc, nativeConfig, kind) {
  if (kind === 'audio') {
    await trtc.startLocalAudio(nativeConfig.audio);
    return;
  }

  if (kind === 'screen-share') {
    await trtc.startScreenShare(nativeConfig.screen);
    return;
  }

  await trtc.startLocalVideo(nativeConfig.video);
}

async function unpublishMediaKind(trtc, kind) {
  if (kind === 'audio') {
    await trtc.stopLocalAudio();
    return;
  }

  if (kind === 'screen-share') {
    await trtc.stopScreenShare();
    return;
  }

  await trtc.stopLocalVideo();
}

async function muteMediaKind(trtc, nativeConfig, kind, muted) {
  if (muted) {
    await unpublishMediaKind(trtc, kind);
  } else {
    await publishMediaKind(trtc, nativeConfig, kind);
  }

  return {
    kind,
    muted,
  };
}

function isLocalMediaKind(kind) {
  return kind === 'audio' || kind === 'video';
}

function hasPublishedMediaKind(nativeClient, kind) {
  for (const publishedKind of nativeClient.publishedTracks.values()) {
    if (publishedKind === kind) {
      return true;
    }
  }

  return false;
}

function hasOtherPublishedMediaKind(nativeClient, trackId, kind) {
  for (const [publishedTrackId, publishedKind] of nativeClient.publishedTracks.entries()) {
    if (publishedTrackId !== trackId && publishedKind === kind) {
      return true;
    }
  }

  return false;
}

function markMediaKindActive(nativeClient, kind) {
  if (isLocalMediaKind(kind)) {
    nativeClient.mutedMediaKinds.delete(kind);
  }
}

function markMediaKindMuted(nativeClient, kind, muted) {
  if (!isLocalMediaKind(kind)) {
    return;
  }

  if (muted) {
    nativeClient.mutedMediaKinds.add(kind);
    return;
  }

  nativeClient.mutedMediaKinds.delete(kind);
}

function forgetPublishedTrack(nativeClient, trackId, kind) {
  nativeClient.publishedTracks.delete(trackId);
  if (isLocalMediaKind(kind) && !hasPublishedMediaKind(nativeClient, kind)) {
    nativeClient.mutedMediaKinds.delete(kind);
  }
}

function shouldApplyMute(nativeClient, kind, muted) {
  if (!hasPublishedMediaKind(nativeClient, kind)) {
    return false;
  }

  return nativeClient.mutedMediaKinds.has(kind) !== muted;
}

function resolveTrackPublicationMuted(nativeClient, kind) {
  return isLocalMediaKind(kind) && nativeClient.mutedMediaKinds.has(kind);
}

function shouldPublishNativeMedia(nativeClient, kind) {
  return !hasPublishedMediaKind(nativeClient, kind);
}

function shouldUnpublishNativeMedia(nativeClient, trackId, kind) {
  if (kind === 'screen-share') {
    return true;
  }

  return (
    !nativeClient.mutedMediaKinds.has(kind) &&
    !hasOtherPublishedMediaKind(nativeClient, trackId, kind)
  );
}

function assertTrackKindReusable(nativeClient, trackId, kind) {
  const existingKind = nativeClient.publishedTracks.get(trackId);
  if (!existingKind || existingKind === kind) {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: \`RTC track id "\${trackId}" is already published as "\${existingKind}" and cannot be republished as "\${kind}".\`,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      trackId,
      existingKind,
      requestedKind: kind,
    },
  });
}

function getActiveScreenShareTrackId(nativeClient) {
  for (const [publishedTrackId, publishedKind] of nativeClient.publishedTracks.entries()) {
    if (publishedKind === 'screen-share') {
      return publishedTrackId;
    }
  }

  return undefined;
}

function assertScreenShareTrackAvailable(nativeClient, trackId) {
  const activeTrackId = getActiveScreenShareTrackId(nativeClient);
  if (!activeTrackId || activeTrackId === trackId) {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: \`RTC screen share is already active on track "\${activeTrackId}" and cannot be started as "\${trackId}".\`,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      activeTrackId,
      requestedTrackId: trackId,
      kind: 'screen-share',
    },
  });
}

function assertTrackPublishable(nativeClient, trackId, kind) {
  assertTrackKindReusable(nativeClient, trackId, kind);
  if (kind === 'screen-share') {
    assertScreenShareTrackAvailable(nativeClient, trackId);
  }
}

function assertJoined(nativeClient, operation) {
  const currentState = nativeClient.joinedSession?.connectionState ?? 'left';
  if (currentState === 'joined') {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: \`RTC operation "\${operation}" requires a joined room before local media can be controlled.\`,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      operation,
      requiredState: 'joined',
      currentState,
    },
  });
}

async function drainPublishedMedia(trtc, nativeClient) {
  for (const [trackId, mediaKind] of Array.from(nativeClient.publishedTracks.entries())) {
    if (!nativeClient.publishedTracks.has(trackId)) {
      continue;
    }

    if (shouldUnpublishNativeMedia(nativeClient, trackId, mediaKind)) {
      await unpublishMediaKind(trtc, mediaKind);
    }
    forgetPublishedTrack(nativeClient, trackId, mediaKind);
  }

  nativeClient.publishedTracks.clear();
  nativeClient.mutedMediaKinds.clear();
}

function resolvePublishedMediaKind(options) {
  if (
    options.kind === 'audio' ||
    options.kind === 'video' ||
    options.kind === 'screen-share'
  ) {
    return options.kind;
  }

  throw new RtcSdkException({
    code: 'capability_not_supported',
    message: \`Official Tencent Web bridge does not support publishing track kind "\${options.kind}" through the standard runtime surface.\`,
    providerKey: ${packageContract.metadataSymbol}.providerKey,
    pluginId: ${packageContract.metadataSymbol}.pluginId,
    details: {
      kind: options.kind,
    },
  });
}

const OFFICIAL_TENCENT_WEB_RUNTIME_CONTROLLER = {
  async join(options, context) {
    const { nativeConfig, trtc } = await ensureTrtc(context);
    await trtc.enterRoom(buildEnterRoomOptions(options, nativeConfig));

    const sessionDescriptor = buildRtcSessionDescriptor(options);
    context.nativeClient.joinedSession = sessionDescriptor;
    return sessionDescriptor;
  },
  async leave(context) {
    if (!context.nativeClient.trtc) {
      return (
        context.nativeClient.joinedSession ?? {
          sessionId: '',
          roomId: '',
          participantId: '',
          providerKey: ${packageContract.metadataSymbol}.providerKey,
          connectionState: 'left',
        }
      );
    }

    const trtc = context.nativeClient.trtc;
    await drainPublishedMedia(trtc, context.nativeClient);
    await trtc.exitRoom();
    await trtc.destroy?.();
    const joinedSession = context.nativeClient.joinedSession;
    context.nativeClient.trtc = undefined;
    context.nativeClient.joinedSession = undefined;
    context.nativeClient.publishedTracks.clear();
    context.nativeClient.mutedMediaKinds.clear();

    return {
      sessionId: joinedSession?.sessionId ?? '',
      roomId: joinedSession?.roomId ?? '',
      participantId: joinedSession?.participantId ?? '',
      providerKey: ${packageContract.metadataSymbol}.providerKey,
      connectionState: 'left',
    };
  },
  async publish(options, context) {
    assertJoined(context.nativeClient, 'publish');
    const mediaKind = resolvePublishedMediaKind(options);
    assertTrackPublishable(context.nativeClient, options.trackId, mediaKind);
    const { nativeConfig, trtc } = await ensureTrtc(context);
    const shouldPublish = shouldPublishNativeMedia(context.nativeClient, mediaKind);
    if (shouldPublish) {
      await publishMediaKind(trtc, nativeConfig, mediaKind);
    }
    context.nativeClient.publishedTracks.set(options.trackId, mediaKind);
    if (shouldPublish) {
      markMediaKindActive(context.nativeClient, mediaKind);
    }
    return {
      trackId: options.trackId,
      kind: options.kind,
      muted: resolveTrackPublicationMuted(context.nativeClient, mediaKind),
    };
  },
  async unpublish(trackId, context) {
    const mediaKind = context.nativeClient.publishedTracks.get(trackId);
    if (!mediaKind) {
      return;
    }

    if (shouldUnpublishNativeMedia(context.nativeClient, trackId, mediaKind)) {
      const { trtc } = await ensureTrtc(context);
      await unpublishMediaKind(trtc, mediaKind);
    }
    forgetPublishedTrack(context.nativeClient, trackId, mediaKind);
  },
  async startScreenShare(options, context) {
    assertJoined(context.nativeClient, 'startScreenShare');
    assertTrackPublishable(context.nativeClient, options.trackId, 'screen-share');
    const { nativeConfig, trtc } = await ensureTrtc(context);
    const shouldPublish = shouldPublishNativeMedia(context.nativeClient, 'screen-share');
    if (shouldPublish) {
      await publishMediaKind(trtc, nativeConfig, 'screen-share');
    }
    context.nativeClient.publishedTracks.set(options.trackId, 'screen-share');
    return {
      trackId: options.trackId,
      kind: 'screen-share',
      muted: false,
    };
  },
  async stopScreenShare(trackId, context) {
    const mediaKind = context.nativeClient.publishedTracks.get(trackId);
    if (mediaKind !== 'screen-share') {
      return;
    }

    const { trtc } = await ensureTrtc(context);
    await unpublishMediaKind(trtc, 'screen-share');
    context.nativeClient.publishedTracks.delete(trackId);
  },
  async muteAudio(muted, context) {
    assertJoined(context.nativeClient, 'muteAudio');
    if (!shouldApplyMute(context.nativeClient, 'audio', muted)) {
      return {
        kind: 'audio',
        muted,
      };
    }

    const { nativeConfig, trtc } = await ensureTrtc(context);
    const muteState = await muteMediaKind(trtc, nativeConfig, 'audio', muted);
    markMediaKindMuted(context.nativeClient, 'audio', muted);
    return muteState;
  },
  async muteVideo(muted, context) {
    assertJoined(context.nativeClient, 'muteVideo');
    if (!shouldApplyMute(context.nativeClient, 'video', muted)) {
      return {
        kind: 'video',
        muted,
      };
    }

    const { nativeConfig, trtc } = await ensureTrtc(context);
    const muteState = await muteMediaKind(trtc, nativeConfig, 'video', muted);
    markMediaKindMuted(context.nativeClient, 'video', muted);
    return muteState;
  },
};

export function createOfficialTencentWebRtcDriver(options = {}) {
  const loadSdk = options.loadSdk ?? defaultLoadTencentWebSdk;

  return createRtcProviderDriver({
    metadata: ${packageContract.metadataSymbol},
    nativeFactory(config) {
      return {
        resolvedConfig: config,
        loadSdk,
        publishedTracks: new Map(),
        mutedMediaKinds: new Set(),
      };
    },
    runtimeController: OFFICIAL_TENCENT_WEB_RUNTIME_CONTROLLER,
  });
}

export function ${packageContract.driverFactory}(options = {}) {
  if (!options.nativeFactory && !options.runtimeController) {
    return createOfficialTencentWebRtcDriver({
      loadSdk: options.loadSdk,
    });
  }

  return createRtcProviderDriver({
    metadata: ${packageContract.metadataSymbol},
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const ${packageContract.moduleSymbol} = createRtcProviderModule({
  packageName: ${packageContract.metadataSymbol}.typescriptPackage.packageName,
  metadata: ${packageContract.metadataSymbol},
  builtin: ${catalogSymbol}.builtin,
  createDriver: ${packageContract.driverFactory},
});
`;
}

function renderProviderPackageEntrypoint(provider) {
  if (provider.providerKey === 'volcengine') {
    return renderVolcengineProviderPackageEntrypoint(provider);
  }

  if (provider.providerKey === 'tencent') {
    return renderTencentProviderPackageEntrypoint(provider);
  }

  return renderGenericProviderPackageEntrypoint(provider);
}

function renderProviderPackageDeclarationEntrypoint(provider) {
  const packageContract = provider.typescriptPackage;

  if (provider.providerKey === 'volcengine') {
    return `import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
  RtcResolvedClientConfig,
  RtcSessionDescriptor,
} from '@sdkwork/rtc-sdk';

export interface RtcVolcengineWebSdkModule {
  createEngine(appId: string, config?: Record<string, unknown>): RtcVolcengineWebEngineLike;
  destroyEngine(engine: RtcVolcengineWebEngineLike): void;
}

export interface RtcVolcengineWebSdkModuleNamespace {
  default?: RtcVolcengineWebSdkModule;
}

export type RtcVolcengineWebSdkModuleLoadResult =
  | RtcVolcengineWebSdkModule
  | RtcVolcengineWebSdkModuleNamespace;

export interface RtcVolcengineWebEngineLike {
  joinRoom(
    token: string | null,
    roomId: string,
    userInfo: {
      userId: string;
      extraInfo?: string;
    },
    roomConfig?: Record<string, unknown>,
  ): Promise<void>;
  leaveRoom(waitAck?: boolean): Promise<void>;
  publishStream(mediaType: 'audio' | 'video'): Promise<void>;
  unpublishStream(mediaType: 'audio' | 'video'): Promise<void>;
  startScreenCapture(config?: Record<string, unknown>): Promise<unknown>;
  stopScreenCapture(): Promise<void>;
  publishScreen(): Promise<void>;
  unpublishScreen(): Promise<void>;
  startVideoCapture(deviceId?: string): Promise<unknown>;
  stopVideoCapture(): Promise<void>;
  startAudioCapture(deviceId?: string): Promise<unknown>;
  stopAudioCapture(): Promise<void>;
}

export interface RtcVolcengineWebNativeConfig {
  appId?: string;
  engineConfig?: Record<string, unknown>;
  roomConfig?: Record<string, unknown>;
  userExtraInfo?: Record<string, unknown>;
  capture?: {
    audioDeviceId?: string;
    videoDeviceId?: string;
    screen?: Record<string, unknown>;
  };
}

export interface RtcVolcengineOfficialWebNativeClient {
  readonly resolvedConfig: RtcResolvedClientConfig;
  readonly loadSdk: () => Promise<RtcVolcengineWebSdkModuleLoadResult>;
  sdkModule?: RtcVolcengineWebSdkModule;
  engine?: RtcVolcengineWebEngineLike;
  joinedSession?: RtcSessionDescriptor;
  publishedTracks: Map<string, 'audio' | 'video' | 'screen-share'>;
  mutedMediaKinds: Set<'audio' | 'video'>;
}

export interface CreateOfficialVolcengineWebRtcDriverOptions {
  loadSdk?: () => Promise<RtcVolcengineWebSdkModuleLoadResult>;
}

export const ${packageContract.metadataSymbol}: RtcProviderCatalogEntry;

export function createOfficialVolcengineWebRtcDriver(
  options?: CreateOfficialVolcengineWebRtcDriverOptions,
): RtcProviderDriver<RtcVolcengineOfficialWebNativeClient>;

export type CreateVolcengineRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
> &
  CreateOfficialVolcengineWebRtcDriverOptions;

export function ${packageContract.driverFactory}<TNativeClient = unknown>(
  options?: CreateVolcengineRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient | RtcVolcengineOfficialWebNativeClient>;

export const ${packageContract.moduleSymbol}: RtcProviderModule;
`;
  }

  if (provider.providerKey === 'tencent') {
    return `import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
  RtcResolvedClientConfig,
  RtcSessionDescriptor,
} from '@sdkwork/rtc-sdk';

export interface RtcTencentWebSdkModule {
  create(): RtcTencentWebTrtcLike;
}

export interface RtcTencentWebSdkModuleNamespace {
  default?: RtcTencentWebSdkModule;
}

export type RtcTencentWebSdkModuleLoadResult =
  | RtcTencentWebSdkModule
  | RtcTencentWebSdkModuleNamespace;

export interface RtcTencentWebTrtcLike {
  enterRoom(options: RtcTencentWebEnterRoomOptions): Promise<void>;
  exitRoom(): Promise<void>;
  destroy?(): Promise<void> | void;
  startLocalAudio(options?: RtcTencentWebAudioOptions): Promise<void>;
  stopLocalAudio(): Promise<void>;
  startLocalVideo(options?: RtcTencentWebVideoOptions): Promise<void>;
  stopLocalVideo(): Promise<void>;
  startScreenShare(options?: RtcTencentWebScreenShareOptions): Promise<void>;
  stopScreenShare(): Promise<void>;
}

export interface RtcTencentWebEnterRoomOptions {
  sdkAppId: number;
  roomId: number | string;
  userId: string;
  userSig: string;
  scene?: string;
  role?: string;
  privateMapKey?: string;
}

export interface RtcTencentWebAudioOptions {
  microphoneId?: string;
  profile?: string;
  [key: string]: unknown;
}

export interface RtcTencentWebVideoOptions {
  cameraId?: string;
  view?: unknown;
  profile?: string;
  [key: string]: unknown;
}

export interface RtcTencentWebScreenShareOptions {
  option?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RtcTencentWebNativeConfig {
  sdkAppId?: number | string;
  userSig?: string;
  scene?: string;
  role?: string;
  privateMapKey?: string;
  audio?: RtcTencentWebAudioOptions;
  video?: RtcTencentWebVideoOptions;
  screen?: RtcTencentWebScreenShareOptions;
}

export interface RtcTencentOfficialWebNativeClient {
  readonly resolvedConfig: RtcResolvedClientConfig;
  readonly loadSdk: () => Promise<RtcTencentWebSdkModuleLoadResult>;
  sdkModule?: RtcTencentWebSdkModule;
  trtc?: RtcTencentWebTrtcLike;
  joinedSession?: RtcSessionDescriptor;
  publishedTracks: Map<string, 'audio' | 'video' | 'screen-share'>;
  mutedMediaKinds: Set<'audio' | 'video'>;
}

export interface CreateOfficialTencentWebRtcDriverOptions {
  loadSdk?: () => Promise<RtcTencentWebSdkModuleLoadResult>;
}

export const ${packageContract.metadataSymbol}: RtcProviderCatalogEntry;

export function createOfficialTencentWebRtcDriver(
  options?: CreateOfficialTencentWebRtcDriverOptions,
): RtcProviderDriver<RtcTencentOfficialWebNativeClient>;

export type CreateTencentRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
> &
  CreateOfficialTencentWebRtcDriverOptions;

export function ${packageContract.driverFactory}<TNativeClient = unknown>(
  options?: CreateTencentRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient | RtcTencentOfficialWebNativeClient>;

export const ${packageContract.moduleSymbol}: RtcProviderModule;
`;
  }

  return `import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
} from '@sdkwork/rtc-sdk';

export const ${packageContract.metadataSymbol}: RtcProviderCatalogEntry;

export type Create${toPascalCase(provider.providerKey)}RtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export function ${packageContract.driverFactory}<TNativeClient = unknown>(
  options?: Create${toPascalCase(provider.providerKey)}RtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient>;

export const ${packageContract.moduleSymbol}: RtcProviderModule;
`;
}

function renderProviderPackageReadme(provider) {
  const packageStatus = 'package_reference_boundary';
  const hasReferenceRuntimeBridge =
    provider.typescriptAdapter.runtimeBridgeStatus === 'reference-baseline';
  const boundaryLabel = hasReferenceRuntimeBridge
    ? 'Reference TypeScript provider package boundary'
    : 'Reserved TypeScript provider package boundary';
  const boundarySummary = hasReferenceRuntimeBridge
    ? `Reference TypeScript provider package boundary for ${provider.displayName}.`
    : `Reserved TypeScript provider package boundary for ${provider.displayName}.`;
  const bridgeRules = hasReferenceRuntimeBridge
    ? [
        '- wraps the official vendor SDK instead of re-implementing media runtime',
        '- declares the official vendor SDK as an optional peer dependency and loads it only when this provider package is installed',
      ]
    : [
        '- reserves the official provider plugin boundary until a verified official runtime bridge is implemented',
        '- accepts consumer-supplied `nativeFactory` and `runtimeController` hooks for application-owned bridge injection',
        '- does not declare vendor SDK peer dependencies or expose an official bridge factory until the package owns a verified bridge',
      ];
  const extensionKeys =
    (provider.extensionKeys ?? []).length === 0
      ? '`<none>`'
      : (provider.extensionKeys ?? []).map((extensionKey) => `\`${extensionKey}\``).join(', ');
  const requiredCapabilities =
    (provider.requiredCapabilities ?? []).length === 0
      ? '`<none>`'
      : (provider.requiredCapabilities ?? [])
          .map((capabilityKey) => `\`${capabilityKey}\``)
          .join(', ');
  const optionalCapabilities =
    (provider.optionalCapabilities ?? []).length === 0
      ? '`<none>`'
      : (provider.optionalCapabilities ?? [])
          .map((capabilityKey) => `\`${capabilityKey}\``)
          .join(', ');

  return `# ${provider.typescriptPackage.packageName}

${boundarySummary}

- provider key: \`${provider.providerKey}\`
- tier: \`${provider.tier}\`
- builtin: \`${provider.builtin}\`
- status: \`${packageStatus}\`
- vendor sdk provisioning: \`${provider.typescriptAdapter.sdkProvisioning}\`
- binding strategy: \`${provider.typescriptAdapter.bindingStrategy}\`
- bundle policy: \`${provider.typescriptAdapter.bundlePolicy}\`
- runtime bridge status: \`${provider.typescriptAdapter.runtimeBridgeStatus}\`
- official vendor sdk requirement: \`${provider.typescriptAdapter.officialVendorSdkRequirement}\`
- required capabilities: ${requiredCapabilities}
- optional capabilities: ${optionalCapabilities}
- provider extension keys: ${extensionKeys}

Rules:

- ${boundaryLabel}
${bridgeRules.join('\n')}
- depends on the core \`@sdkwork/rtc-sdk\` contracts
- registers through the \`RtcProviderModule\` adapter contract
- ships executable \`index.js\` and \`index.d.ts\` entrypoints
- declares \`exports\` so \`import\` and \`default\` resolve to \`index.js\` and \`types\` resolve
  to \`index.d.ts\`
- driver factories and provider module symbols live only behind this provider package boundary
- the root \`@sdkwork/rtc-sdk\` package exposes provider-neutral SPI, catalogs, loader, manager, and
  data-source contracts but does not re-export this provider implementation
`;
}

function renderTypeScriptProviderCatalogEntry(provider) {
  const constantName = `${toUpperSnakeCase(provider.providerKey)}_RTC_PROVIDER_CATALOG_ENTRY`;

  return `export const ${constantName}: RtcProviderCatalogEntry = {
  providerKey: ${renderStringLiteral(provider.providerKey)},
  pluginId: ${renderStringLiteral(provider.pluginId)},
  driverId: ${renderStringLiteral(provider.driverId)},
  displayName: ${renderStringLiteral(provider.displayName)},
  defaultSelected: ${provider.defaultSelected ? 'true' : 'false'},
  urlSchemes: ${renderReadonlyStringArray(provider.urlSchemes ?? [])},
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ${renderReadonlyStringArray(provider.optionalCapabilities ?? [])},
  extensionKeys: ${renderReadonlyStringArray(provider.extensionKeys ?? [])},
  tier: ${renderStringLiteral(provider.tier)},
  builtin: ${provider.builtin ? 'true' : 'false'},
  typescriptAdapter: ${renderTypeScriptAdapterContract(provider.typescriptAdapter)},
  typescriptPackage: ${renderTypeScriptPackageContract(provider.typescriptPackage)},
};`;
}

function renderTypeScriptProviderExtensionCatalogDescriptor(descriptor) {
  const constantName = `${toUpperSnakeCase(descriptor.extensionKey)}_RTC_PROVIDER_EXTENSION_DESCRIPTOR`;

  return `export const ${constantName}: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = {
  extensionKey: ${renderStringLiteral(descriptor.extensionKey)},
  providerKey: ${renderStringLiteral(descriptor.providerKey)},
  displayName: ${renderStringLiteral(descriptor.displayName)},
  surface: ${renderStringLiteral(descriptor.surface)},
  access: ${renderStringLiteral(descriptor.access)},
  status: ${renderStringLiteral(descriptor.status)},
};`;
}

function renderTypeScriptCapabilityCatalogDescriptor(descriptor) {
  const constantName = `${toUpperSnakeCase(descriptor.capabilityKey)}_RTC_CAPABILITY_DESCRIPTOR`;

  return `export const ${constantName}: RtcCapabilityDescriptor<RtcCapabilityKey> = {
  capabilityKey: ${renderStringLiteral(descriptor.capabilityKey)},
  category: ${renderStringLiteral(descriptor.category)},
  surface: ${renderStringLiteral(descriptor.surface)},
};`;
}

function renderTypeScriptCapabilityCatalog(assembly) {
  const descriptors = assembly.capabilityCatalog ?? [];
  const requiredCapabilities = descriptors
    .filter((descriptor) => descriptor.category === 'required-baseline')
    .map((descriptor) => descriptor.capabilityKey);
  const optionalCapabilities = descriptors
    .filter((descriptor) => descriptor.category === 'optional-advanced')
    .map((descriptor) => descriptor.capabilityKey);

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcCapabilityDescriptor } from './types.js';

export const REQUIRED_RTC_CAPABILITIES = freezeRtcRuntimeValue(${renderReadonlyStringArray(requiredCapabilities)});
export const OPTIONAL_RTC_CAPABILITIES = freezeRtcRuntimeValue(${renderReadonlyStringArray(optionalCapabilities)});

export type RtcRequiredCapability = (typeof REQUIRED_RTC_CAPABILITIES)[number];
export type RtcOptionalCapability = (typeof OPTIONAL_RTC_CAPABILITIES)[number];
export type RtcCapabilityKey = RtcRequiredCapability | RtcOptionalCapability;

${descriptors
  .map((descriptor) =>
    renderTypeScriptCapabilityCatalogDescriptor(descriptor).replace(
      ' = {',
      ' = freezeRtcRuntimeValue({',
    ).replace('\n};', '\n});'),
  )
  .join('\n\n')}

export const RTC_CAPABILITY_CATALOG: readonly RtcCapabilityDescriptor<RtcCapabilityKey>[] = freezeRtcRuntimeValue([
  ${descriptors
    .map((descriptor) => `${toUpperSnakeCase(descriptor.capabilityKey)}_RTC_CAPABILITY_DESCRIPTOR`)
    .join(',\n  ')}
]);

const RTC_CAPABILITY_DESCRIPTOR_BY_KEY = new Map<
  RtcCapabilityKey,
  RtcCapabilityDescriptor<RtcCapabilityKey>
>(RTC_CAPABILITY_CATALOG.map((descriptor) => [descriptor.capabilityKey, descriptor]));

export function getRtcCapabilityCatalog(): readonly RtcCapabilityDescriptor<RtcCapabilityKey>[] {
  return RTC_CAPABILITY_CATALOG;
}

export function getRtcCapabilityDescriptor(
  capabilityKey: RtcCapabilityKey,
): RtcCapabilityDescriptor<RtcCapabilityKey> | undefined {
  return RTC_CAPABILITY_DESCRIPTOR_BY_KEY.get(capabilityKey);
}
`;
}

function renderTypeScriptProviderExtensionCatalog(assembly) {
  const descriptors = assembly.providerExtensionCatalog ?? [];
  const providerKeys = [...new Set(descriptors.map((descriptor) => descriptor.providerKey))];

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderExtensionDescriptor } from './types.js';

export const RTC_PROVIDER_EXTENSION_KEYS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    descriptors.map((descriptor) => descriptor.extensionKey),
  )});
export type RtcKnownProviderExtensionKey = (typeof RTC_PROVIDER_EXTENSION_KEYS)[number];

${descriptors
  .map((descriptor) =>
    renderTypeScriptProviderExtensionCatalogDescriptor(descriptor).replace(
      ' = {',
      ' = freezeRtcRuntimeValue({',
    ).replace('\n};', '\n});'),
  )
  .join('\n\n')}

export const RTC_PROVIDER_EXTENSION_CATALOG: readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] = freezeRtcRuntimeValue([
  ${descriptors
    .map(
      (descriptor) =>
        `${toUpperSnakeCase(descriptor.extensionKey)}_RTC_PROVIDER_EXTENSION_DESCRIPTOR`,
    )
    .join(',\n  ')}
]);

const RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY = new Map<
  string,
  RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>
>(RTC_PROVIDER_EXTENSION_CATALOG.map((descriptor) => [descriptor.extensionKey, descriptor]));

const EMPTY_RTC_PROVIDER_EXTENSIONS = freezeRtcRuntimeValue([] as const);

const RTC_PROVIDER_EXTENSIONS_BY_PROVIDER_KEY = new Map<
  string,
  readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[]
>([
${providerKeys
  .map((providerKey) => {
    const descriptorConstants = descriptors
      .filter((descriptor) => descriptor.providerKey === providerKey)
      .map(
        (descriptor) =>
          `${toUpperSnakeCase(descriptor.extensionKey)}_RTC_PROVIDER_EXTENSION_DESCRIPTOR`,
      )
      .join(',\n    ');

    return `  [${renderStringLiteral(providerKey)}, freezeRtcRuntimeValue([\n    ${descriptorConstants}\n  ])],`;
  })
  .join('\n')}
]);

export function getRtcProviderExtensionCatalog(): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  return RTC_PROVIDER_EXTENSION_CATALOG;
}

export function getRtcProviderExtensionDescriptor(
  extensionKey: string,
): RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> | undefined {
  return RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.get(extensionKey);
}

export function getRtcProviderExtensionsForProvider(
  providerKey: string,
): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  return RTC_PROVIDER_EXTENSIONS_BY_PROVIDER_KEY.get(providerKey) ?? EMPTY_RTC_PROVIDER_EXTENSIONS;
}

export function getRtcProviderExtensions(
  extensionKeys: readonly string[],
): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  const descriptors: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] = [];

  for (const extensionKey of extensionKeys) {
    const descriptor = RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.get(extensionKey);
    if (descriptor) {
      descriptors.push(descriptor);
    }
  }

  return freezeRtcRuntimeValue(descriptors);
}

export function hasRtcProviderExtension(
  extensionKeys: readonly string[],
  extensionKey: string,
): boolean {
  for (const providerExtensionKey of extensionKeys) {
    if (
      providerExtensionKey === extensionKey &&
      RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.has(extensionKey)
    ) {
      return true;
    }
  }

  return false;
}
`;
}

function renderTypeScriptProviderActivationCatalog(assembly) {
  const activationEntries = buildTypeScriptProviderActivationCatalogEntries(assembly);

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderActivationEntry } from './types.js';

export const RTC_PROVIDER_ACTIVATION_STATUSES = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    PROVIDER_ACTIVATION_STATUSES,
  )});

${activationEntries
  .map((entry) => {
    const constantName = `${toUpperSnakeCase(entry.providerKey)}_RTC_PROVIDER_ACTIVATION_ENTRY`;

    return `export const ${constantName}: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: ${renderStringLiteral(entry.providerKey)},
  pluginId: ${renderStringLiteral(entry.pluginId)},
  driverId: ${renderStringLiteral(entry.driverId)},
  activationStatus: ${renderStringLiteral(entry.activationStatus)},
  runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'},
  rootPublic: ${entry.rootPublic ? 'true' : 'false'},
  packageBoundary: ${entry.packageBoundary ? 'true' : 'false'},
  builtin: ${entry.builtin ? 'true' : 'false'},
  packageIdentity: ${renderStringLiteral(entry.packageIdentity)},
});`;
  })
  .join('\n\n')}

export const RTC_PROVIDER_ACTIVATION_CATALOG: readonly RtcProviderActivationEntry[] = freezeRtcRuntimeValue([
  ${activationEntries
    .map((entry) => `${toUpperSnakeCase(entry.providerKey)}_RTC_PROVIDER_ACTIVATION_ENTRY`)
    .join(',\n  ')}
]);

const RTC_PROVIDER_ACTIVATION_BY_PROVIDER_KEY = new Map<
  string,
  RtcProviderActivationEntry
>(RTC_PROVIDER_ACTIVATION_CATALOG.map((entry) => [entry.providerKey, entry]));

export function getRtcProviderActivationCatalog(): readonly RtcProviderActivationEntry[] {
  return RTC_PROVIDER_ACTIVATION_CATALOG;
}

export function getRtcProviderActivationByProviderKey(
  providerKey: string,
): RtcProviderActivationEntry | undefined {
  return RTC_PROVIDER_ACTIVATION_BY_PROVIDER_KEY.get(providerKey);
}

export function getRtcProviderActivation(
  providerKey: string,
): RtcProviderActivationEntry | undefined {
  return getRtcProviderActivationByProviderKey(providerKey);
}
`;
}

function renderTypeScriptProviderPackageCatalog(assembly) {
  const packageEntries = buildTypeScriptProviderPackageCatalogEntries(assembly);

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderPackageCatalogEntry } from './types.js';

export const RTC_PROVIDER_PACKAGE_STATUSES = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
  )});

${packageEntries
  .map((entry) => {
    const constantName = `${toUpperSnakeCase(entry.providerKey)}_RTC_PROVIDER_PACKAGE_ENTRY`;

    return `export const ${constantName}: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: ${renderStringLiteral(entry.providerKey)},
  pluginId: ${renderStringLiteral(entry.pluginId)},
  driverId: ${renderStringLiteral(entry.driverId)},
  packageIdentity: ${renderStringLiteral(entry.packageIdentity)},
  manifestPath: ${renderStringLiteral(entry.manifestPath)},
  readmePath: ${renderStringLiteral(entry.readmePath)},
  sourcePath: ${renderStringLiteral(entry.sourcePath)},
  declarationPath: ${renderStringLiteral(entry.declarationPath)},
  sourceSymbol: ${renderStringLiteral(entry.sourceSymbol)},
  sourceModule: ${renderStringLiteral(entry.sourceModule)},
  driverFactory: ${renderStringLiteral(entry.driverFactory)},
  metadataSymbol: ${renderStringLiteral(entry.metadataSymbol)},
  moduleSymbol: ${renderStringLiteral(entry.moduleSymbol)},
  builtin: ${entry.builtin ? 'true' : 'false'},
  rootPublic: ${entry.rootPublic ? 'true' : 'false'},
  status: ${renderStringLiteral(entry.status)},
  runtimeBridgeStatus: ${renderStringLiteral(entry.runtimeBridgeStatus)},
  requiredCapabilities: freezeRtcRuntimeValue(${renderReadonlyStringArray(entry.requiredCapabilities)}),
  optionalCapabilities: freezeRtcRuntimeValue(${renderReadonlyStringArray(entry.optionalCapabilities)}),
  extensionKeys: freezeRtcRuntimeValue(${renderReadonlyStringArray(entry.extensionKeys)}),
});`;
  })
  .join('\n\n')}

export const RTC_PROVIDER_PACKAGE_CATALOG: readonly RtcProviderPackageCatalogEntry[] = freezeRtcRuntimeValue([
  ${packageEntries
    .map((entry) => `${toUpperSnakeCase(entry.providerKey)}_RTC_PROVIDER_PACKAGE_ENTRY`)
    .join(',\n  ')}
]);

const RTC_PROVIDER_PACKAGE_BY_PROVIDER_KEY = new Map<string, RtcProviderPackageCatalogEntry>(
  RTC_PROVIDER_PACKAGE_CATALOG.map((entry) => [entry.providerKey, entry]),
);

const RTC_PROVIDER_PACKAGE_BY_PACKAGE_IDENTITY = new Map<string, RtcProviderPackageCatalogEntry>(
  RTC_PROVIDER_PACKAGE_CATALOG.map((entry) => [entry.packageIdentity, entry]),
);

export function getRtcProviderPackageCatalog(): readonly RtcProviderPackageCatalogEntry[] {
  return RTC_PROVIDER_PACKAGE_CATALOG;
}

export function getRtcProviderPackageByProviderKey(
  providerKey: string,
): RtcProviderPackageCatalogEntry | undefined {
  return RTC_PROVIDER_PACKAGE_BY_PROVIDER_KEY.get(providerKey);
}

export function getRtcProviderPackageByPackageIdentity(
  packageIdentity: string,
): RtcProviderPackageCatalogEntry | undefined {
  return RTC_PROVIDER_PACKAGE_BY_PACKAGE_IDENTITY.get(packageIdentity);
}

export function getRtcProviderPackage(
  providerKey: string,
): RtcProviderPackageCatalogEntry | undefined {
  return getRtcProviderPackageByProviderKey(providerKey);
}
`;
}

function renderTypeScriptProviderCatalog(assembly) {
  const providers = assembly.providers ?? [];
  const builtinProviders = providers.filter((provider) => provider.builtin);
  const defaults = assembly.defaults ?? {};

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import { REQUIRED_RTC_CAPABILITIES } from './capability-catalog.js';
import type { RtcProviderCatalogEntry } from './types.js';

export const DEFAULT_RTC_PROVIDER_KEY = ${renderStringLiteral(defaults.providerKey)};
export const DEFAULT_RTC_PROVIDER_PLUGIN_ID = ${renderStringLiteral(defaults.pluginId)};
export const DEFAULT_RTC_PROVIDER_DRIVER_ID = ${renderStringLiteral(defaults.driverId)};
export const BUILTIN_RTC_PROVIDER_KEYS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
  builtinProviders.map((provider) => provider.providerKey),
)});
export const OFFICIAL_RTC_PROVIDER_KEYS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
  providers.map((provider) => provider.providerKey),
)});

${providers
  .map((provider) =>
    renderTypeScriptProviderCatalogEntry(provider).replace(
      ' = {',
      ' = freezeRtcRuntimeValue({',
    ).replace('\n};', '\n});'),
  )
  .join('\n\n')}

export const BUILTIN_RTC_PROVIDER_CATALOG: readonly RtcProviderCatalogEntry[] = freezeRtcRuntimeValue([
  ${builtinProviders
    .map((provider) => `${toUpperSnakeCase(provider.providerKey)}_RTC_PROVIDER_CATALOG_ENTRY`)
    .join(',\n  ')}
]);

export const OFFICIAL_RTC_PROVIDER_CATALOG: readonly RtcProviderCatalogEntry[] = freezeRtcRuntimeValue([
  ${providers
    .map((provider) => `${toUpperSnakeCase(provider.providerKey)}_RTC_PROVIDER_CATALOG_ENTRY`)
    .join(',\n  ')}
]);

const BUILTIN_RTC_PROVIDER_BY_KEY = new Map<string, RtcProviderCatalogEntry>(
  BUILTIN_RTC_PROVIDER_CATALOG.map((provider) => [provider.providerKey, provider]),
);

const OFFICIAL_RTC_PROVIDER_BY_KEY = new Map<string, RtcProviderCatalogEntry>(
  OFFICIAL_RTC_PROVIDER_CATALOG.map((provider) => [provider.providerKey, provider]),
);

export function getBuiltinRtcProviderMetadata(): readonly RtcProviderCatalogEntry[] {
  return BUILTIN_RTC_PROVIDER_CATALOG;
}

export function getBuiltinRtcProviderMetadataByKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return BUILTIN_RTC_PROVIDER_BY_KEY.get(providerKey);
}

export function getOfficialRtcProviderMetadata(): readonly RtcProviderCatalogEntry[] {
  return OFFICIAL_RTC_PROVIDER_CATALOG;
}

export function getOfficialRtcProviderMetadataByKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return OFFICIAL_RTC_PROVIDER_BY_KEY.get(providerKey);
}

export function getRtcProviderByProviderKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return getOfficialRtcProviderMetadataByKey(providerKey);
}
`;
}

export function materializeRtcSdkWorkspace(workspaceRoot) {
  const changedFiles = [];

  for (const entry of buildRtcSdkMaterializationPlan(workspaceRoot)) {
    writeIfChanged(
      workspaceRoot,
      path.join(workspaceRoot, entry.relativePath),
      entry.content,
      changedFiles,
    );
  }

  for (const relativePath of RTC_SDK_STALE_MATERIALIZED_FILES) {
    removeIfExists(workspaceRoot, path.join(workspaceRoot, relativePath), changedFiles);
  }

  return { changedFiles };
}

export function buildRtcSdkMaterializationPlan(workspaceRoot) {
  const assemblyPath = path.join(workspaceRoot, 'sdk-manifest.json');
  const assembly = readJsonFile(assemblyPath);
  assertRtcAssemblyWorkspaceBaseline(assembly);

  const entries = [
    ...RTC_TEMPLATE_MATERIALIZATION_ASSETS.map((asset) => ({
      relativePath: asset.materializedRelativePath,
      content: renderMaterializedTemplateContent(workspaceRoot, asset.templateRelativePath, assembly),
    })),
    {
      relativePath: 'docs/multilanguage-capability-matrix.md',
      content: renderCapabilityMatrix(assembly),
    },
    {
      relativePath: 'docs/usage-guide.md',
      content: renderUsageGuide(assembly),
    },
    {
      relativePath: 'docs/typescript-volcengine-runtime-usage.md',
      content: renderTypeScriptRuntimeUsageDoc(assembly),
    },
    {
      relativePath: 'docs/flutter-volcengine-runtime-usage.md',
      content: renderFlutterRuntimeUsageDoc(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/package.json',
      content: renderTypeScriptWorkspaceManifest(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/tsconfig.build.json',
      content: renderTypeScriptBuildTsconfig(),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/index.ts',
      content: renderTypeScriptRootEntrypoint(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/capability-catalog.ts',
      content: renderTypeScriptCapabilityCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts',
      content: renderTypeScriptLanguageWorkspaceCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts',
      content: renderTypeScriptProviderExtensionCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/runtime-surface.ts',
      content: renderTypeScriptRuntimeSurface(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/runtime-immutability.ts',
      content: renderTypeScriptRuntimeImmutability(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/root-public-surface.ts',
      content: renderTypeScriptRootPublicSurface(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts',
      content: renderTypeScriptLookupHelperNaming(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts',
      content: renderTypeScriptProviderPackageCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts',
      content: renderTypeScriptProviderActivationCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/provider-catalog.ts',
      content: renderTypeScriptProviderCatalog(assembly),
    },
  ];

  for (const languageEntry of assembly.languages ?? []) {
    entries.push({
      relativePath: `${languageEntry.workspace}/README.md`,
      content: renderLanguageWorkspaceReadme(languageEntry, assembly),
    });

    if (languageEntry.language !== 'typescript') {
      entries.push(...buildReservedLanguageMaterializationPlan(languageEntry, assembly));
    }
  }

  for (const provider of assembly.providers ?? []) {
    const providerPackageDir = path.posix.join(
      'sdkwork-rtc-sdk-typescript',
      'providers',
      `rtc-sdk-provider-${provider.providerKey}`,
    );

    entries.push({
      relativePath: `${providerPackageDir}/package.json`,
      content: renderProviderPackageManifest(provider),
    });
    entries.push({
      relativePath: `${providerPackageDir}/index.js`,
      content: renderProviderPackageEntrypoint(provider),
    });
    entries.push({
      relativePath: `${providerPackageDir}/index.d.ts`,
      content: renderProviderPackageDeclarationEntrypoint(provider),
    });
    entries.push({
      relativePath: `${providerPackageDir}/README.md`,
      content: renderProviderPackageReadme(provider),
    });
  }

  return entries;
}

const workspaceRoot = resolveRtcSdkWorkspaceRoot(import.meta.url);
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
const isCliEntry = invokedPath === import.meta.url;

if (isCliEntry) {
  const result = materializeRtcSdkWorkspace(workspaceRoot);
  if (result.changedFiles.length === 0) {
    console.log('[sdkwork-rtc-sdk] materialization already up to date');
  } else {
    console.log('[sdkwork-rtc-sdk] materialized standard assets:');
    for (const changedFile of result.changedFiles) {
      console.log(`- ${changedFile}`);
    }
  }
}
