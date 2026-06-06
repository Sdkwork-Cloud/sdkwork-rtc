#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  assertRtcAssemblyWorkspaceBaseline,
  getRtcDefaultCallSmokeLanguage,
  getRtcExecutableLanguageEntries,
  getRtcExecutableLanguageEntriesBySmokeMode,
} from './rtc-standard-assembly-baseline.mjs';
import {
  renderRtcRootCallSmokeCommand,
  renderRtcRootCallSmokeCommandVariants,
} from './rtc-call-smoke-standard.mjs';
import {
  readJsonFile,
  readUtf8File,
  resolveRtcSdkWorkspaceRoot,
  writeUtf8File,
} from './rtc-standard-file-helpers.mjs';
import {
  buildReservedLanguageMaterializationPlan,
  resolveFlutterRuntimeBaselineDependencyLines,
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
  'sdkwork-rtc-sdk-typescript/src/providers/catalog.ts',
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
  return (values ?? []).map((value) => `\`${value}\``).join(', ');
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

  const defaultLanguage = getRtcDefaultCallSmokeLanguage(assembly);
  const languageSummary = renderMarkdownCodeNaturalList(executableLanguages);
  if (executableLanguages.length === 1) {
    return `Current implemented target is ${languageSummary}. The default root smoke dispatch resolves to \`${defaultLanguage}\`.`;
  }

  return `Current implemented targets are ${languageSummary}. The default root smoke dispatch resolves to \`${defaultLanguage}\`, and every additional executable language is selected through \`--language <language>\`.`;
}

function renderTemplateFastCallSmokeCommands(assembly) {
  return getExecutableRuntimeLanguageEntries(assembly)
    .flatMap((languageEntry) =>
      renderRtcRootCallSmokeCommandVariants(assembly, languageEntry.language),
    )
    .join('\n');
}

function renderTemplateRequiredCallSmokeSteps(assembly) {
  const requiredEntries = getRtcExecutableLanguageEntriesBySmokeMode(assembly, 'runtime-backed');
  if (requiredEntries.length === 0) {
    return '- none currently declared in assembly';
  }

  return requiredEntries
    .flatMap((languageEntry) =>
      renderRtcRootCallSmokeCommandVariants(assembly, languageEntry.language).map(
        (command) => `- \`${command}\``,
      ),
    )
    .join('\n');
}

function renderTemplateOptionalCallSmokeSteps(assembly) {
  const optionalEntries = getRtcExecutableLanguageEntriesBySmokeMode(assembly, 'analysis-backed');
  if (optionalEntries.length === 0) {
    return '- none currently declared in assembly';
  }

  return optionalEntries
    .flatMap((languageEntry) =>
      renderRtcRootCallSmokeCommandVariants(assembly, languageEntry.language).map(
        (command) => `- \`${command}\``,
      ),
    )
    .join('\n');
}

function renderUsageGuideLocalVerificationCommands(assembly) {
  const commandLines = [
    'node .\\bin\\materialize-sdk.mjs',
    'node .\\test\\verify-sdk-automation.test.mjs',
    'node .\\bin\\verify-sdk.mjs',
    ...getExecutableRuntimeLanguageEntries(assembly).flatMap((languageEntry) =>
      renderRtcRootCallSmokeCommandVariants(assembly, languageEntry.language),
    ),
    'node .\\bin\\smoke-sdk.mjs',
  ];

  return commandLines.join('\n');
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
    ['{{RTC_FAST_CALL_SMOKE_COMMANDS}}', renderTemplateFastCallSmokeCommands(assembly)],
    ['{{RTC_REQUIRED_CALL_SMOKE_STEPS}}', renderTemplateRequiredCallSmokeSteps(assembly)],
    ['{{RTC_OPTIONAL_CALL_SMOKE_STEPS}}', renderTemplateOptionalCallSmokeSteps(assembly)],
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
- signaling SDK package: \`${languageEntry.runtimeBaseline.signalingSdkPackage}\`
- signaling SDK import path: \`${languageEntry.runtimeBaseline.signalingSdkImportPath}\`
${(languageEntry.language === 'typescript' || languageEntry.language === 'flutter')
  ? '- signaling live receive path: RTC transport/liveConnection over WebSocket'
  : ''}
- standard call/session entrypoint: \`StandardRtcCallController\`
- recommended quick-start entrypoint: \`${languageEntry.runtimeBaseline.recommendedEntrypoint}\`
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

function renderUsageGuideWebSocketAuthStandard() {
  return lines(`
## 7. WebSocket Signaling And Auth Standard

Executable baselines keep RTC signaling on the RTC live WebSocket path and never expose polling
fallback controls.

The assembly-driven \`signalingTransportStandard\` is materialized into
\`sdkwork-rtc-sdk-typescript/src/signaling-transport.ts\`, the Flutter root-public module
\`sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart\`, and the root-public
\`RTC_SIGNALING_TRANSPORT_STANDARD\` plus \`rtcSignalingTransportStandard\` contracts.

Cross-language rules:

- RTC \`deviceId\` is top-level and authoritative across the standard stack
- \`connectOptions.deviceId\` stays optional and must match the top-level \`deviceId\` when both
  are supplied
- \`connectOptions.webSocketAuth\` is passed through the caller-supplied RTC signaling adapter;
  RTC does not introduce provider-specific auth shims
- standard auth modes are \`automatic\`, \`queryBearer\`, \`headerBearer\`, and \`none\`
- \`automatic\` remains the recommended default; browser WebSocket paths can resolve to
  query-bearer while native or custom-socket paths can resolve to header-bearer when headers are
  available
- prefer \`credentialProvider\` with short-lived realtime tickets instead of long-lived access
  tokens, especially when query-parameter auth is required
- if the application already owns one shared RTC live connection, pass \`liveConnection\`; RTC keeps
  subscription sync on that same socket instead of opening a second connection
- auth failure should fail fast on the WebSocket connect path; the RTC standard does not downgrade
  to polling
`);
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
  const executableSignalingImports = executableLanguageEntries
    .map((languageEntry) => `\`${languageEntry.runtimeBaseline.signalingSdkImportPath}\``)
    .join(', ');
  const executableLanguageLabels = renderMarkdownCodeNaturalList(
    executableLanguageEntries.map((languageEntry) => languageEntry.language),
  );

  return lines(`
# SDKWork RTC SDK Usage Guide

This document is the entrypoint for adopting \`sdkwork-rtc-sdk\`.

It focuses on the standardized provider model, current runnable baselines, default \`${defaultProviderKey}\`
selection contract, and the recommended runtime-specific guides.

## 1. Positioning

\`sdkwork-rtc-sdk\` is not a reimplementation of vendor media engines.

Its responsibility is to provide one provider-neutral RTC standard:

- JDBC-style \`DriverManager\` / \`DataSource\` / \`Client\` contracts
- standardized provider selection and default-provider resolution
- standardized capability negotiation, error semantics, and extension metadata
- pluggable provider integration through official catalogs and package boundaries
- one consistent runtime surface across web, mobile, and future language workspaces

The standard intentionally keeps vendor SDK ownership on the application side:

- official vendor SDKs remain consumer-supplied
- \`sdkwork-rtc-sdk\` provides the standard contracts and adapter boundaries
- runtime bridges map vendor behavior into the standard surface instead of hiding vendor engines

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
- signaling adapters map application-supplied RTC transport semantics into the RTC call/session standard
- executable baselines keep signaling WebSocket-first through RTC transport/liveConnection; the RTC standard
  does not expose polling controls
- executable baselines surface WebSocket auth policy through \`connectOptions.webSocketAuth\`
- executable baselines can reuse one app-owned RTC live connection through \`liveConnection\`
  instead of opening a second RTC-specific socket

For the current runnable baselines, this boundary is already materialized:

${renderUsageGuideExecutableIntegrationBindings(assembly)}
- executable baselines compose RTC-owned signaling through ${executableSignalingImports}
- executable baselines publish call invites over conversation-scoped RTC signals and reconcile remote
  accept, reject, end, SDP, and ICE events through the standard \`CallController\`

${renderUsageGuideWebSocketAuthStandard()}

## 8. Non-Builtin Provider Packages

For providers such as ${renderMarkdownCodeList(nonBuiltinProviderKeys)},
the standard path is package-boundary integration instead of deep root-entrypoint coupling.

That contract stays:

- official provider metadata remains assembly-driven
- package identity, manifest path, README path, and source symbol stay standardized
- runtime code is loaded through the provider-package loader SPI
- runtime bridge ownership stays with the integrating application or provider package

## 9. Error Semantics

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
- \`signaling_not_available\`
- \`call_state_invalid\`
- \`vendor_error\`

The two most important runtime distinctions are:

- \`provider_not_supported\`: the provider exists in the official catalog but no runnable driver is
  registered in the current runtime
- \`native_sdk_not_available\`: the standard surface exists but the actual vendor runtime bridge is
  missing or misconfigured

## 10. Local Verification

Use the following commands in the workspace root:

\`\`\`powershell
${renderUsageGuideLocalVerificationCommands(assembly)}
\`\`\`

Verification intent:

- \`materialize-sdk.mjs\` keeps generated catalogs, READMEs, matrices, and this usage guide aligned to the assembly
- \`verify-sdk-automation.test.mjs\` protects standard assets and materialization behavior
- \`verify-sdk.mjs\` validates assembly contracts and generated output
${renderUsageGuideExecutableSmokeNotes(assembly)}
- \`smoke-sdk.mjs\` runs the repository regression entrypoint, including
  the default and shared-\`liveConnection\` call-smoke variants for executable languages, plus
  \`flutter analyze ./bin/sdk-call-smoke.dart\` and \`flutter analyze\` when the Flutter toolchain
  is available

## 11. Practical Adoption Guidance

Use this rule of thumb:

${renderUsageGuideAdoptionGuidance(assembly)}

Current reality is straightforward:

- \`${defaultProviderKey}\` is the default provider
- executable language baselines are ${executableLanguageLabels}
- the RTC signaling adapter is the standard path for invite discovery, RTC lifecycle, and WebRTC
  signal exchange in the current end-to-end call flow
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
# SDKWork RTC SDK TypeScript Usage

This document describes the current executable TypeScript baseline of \`sdkwork-rtc-sdk\`.

## Current Runnable Baseline

- Default media provider: \`${defaultProviderKey}\`
- Default web runtime package: official \`${runtimeBaseline.vendorSdkPackage}\`
- Default web runtime import path: \`${runtimeBaseline.vendorSdkImportPath}\`
- Default signaling adapter package: \`${runtimeBaseline.signalingSdkPackage}\`
- Default signaling adapter import path: \`${runtimeBaseline.signalingSdkImportPath}\`
- Standard media entrypoint: \`RtcDataSource\`
- Standard call/session entrypoint: \`StandardRtcCallController\`
- Recommended quick-start entrypoint: \`${runtimeBaseline.recommendedEntrypoint}\`
- Smoke command: \`${runtimeBaseline.smokeCommand}\`
- Smoke mode: \`${runtimeBaseline.smokeMode}\`
- Smoke variants: ${renderMarkdownCodeNaturalList(runtimeBaseline.smokeVariants)}

## Install

\`\`\`bash
npm install ${languageEntry.publicPackage} ${runtimeBaseline.vendorSdkPackage}
\`\`\`

## Fast Smoke Verification

Run the public TypeScript smoke command inside \`${languageEntry.workspace}\` when you want to validate the
default provider entrypoint without depending on a live signaling service or a real vendor credential:

\`\`\`bash
${runtimeBaseline.smokeCommand}
\`\`\`

The smoke CLI runs the public \`${languageEntry.publicPackage}\` surface against a mocked RTC signaling
adapter and a mocked official \`${runtimeBaseline.vendorSdkPackage}\` module, then prints the resolved provider,
runtime calls, signaling calls, and final controller states.
The JSON summary also includes a \`signalingTransport\` descriptor so maintainers can verify the
resolved auth mode, authoritative \`deviceId\`, matching \`connectOptions.deviceId\`, shared
\`liveConnection\` reuse flag, and no-polling contract at the CLI boundary.
Add \`--reuse-live-connection\` when you want the smoke to verify RTC reuses an app-owned RTC
WebSocket live connection instead of opening another one.

## WebSocket Auth Standard

RTC delegates live signaling auth to the caller-supplied RTC signaling transport or shared
live connection. Prefer typed transport options instead of provider-specific auth shims.

- \`{ mode: 'automatic' }\` is the recommended default; on the standard browser
  \`WebSocket\` path it resolves to query-bearer auth
- \`{ mode: 'queryBearer' }\` is the explicit browser/gateway override when the upstream
  only accepts query-parameter auth
- \`{ mode: 'headerBearer' }\` is the explicit Node or custom-socket override when
  headers are available
- \`{ mode: 'none' }\` is reserved for trusted internal links or pre-signed socket
  URLs
- prefer \`credentialProvider\` with a short-lived realtime ticket; avoid putting long-lived access
  tokens on the WebSocket URL
- keep \`deviceId\` at the RTC stack top level; \`connectOptions.deviceId\` is optional and must
  match when supplied
- when the application already owns a shared RTC socket, pass \`liveConnection\` so RTC syncs
  subscriptions on that same WebSocket instead of opening another one
- call \`describeRtcSignalingTransport(...)\` when the host needs one immutable runtime snapshot of
  the resolved auth mode, authoritative \`deviceId\`, shared-\`liveConnection\` reuse flag, and
  fail-fast/no-polling guarantees before opening the RTC signaling path

\`\`\`ts
import {
  createRtcAppHttpClient,
  describeRtcSignalingTransport,
  ${runtimeBaseline.recommendedEntrypoint},
} from '${languageEntry.publicPackage}';

const transport = createRtcAppHttpClient({
  baseUrl: 'https://rtc.example.com',
  authToken: 'app-token',
});

const rtc = await ${runtimeBaseline.recommendedEntrypoint}({
  transport,
  deviceId: 'device-1',
  connectOptions: {
    webSocketAuth: { mode: 'automatic' },
  },
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});

const signalingTransport = describeRtcSignalingTransport({
  deviceId: 'device-1',
  connectOptions: {
    webSocketAuth: { mode: 'automatic' },
  },
});

console.log(signalingTransport.authMode);
console.log(signalingTransport.usesSharedLiveConnection);
\`\`\`

## Media Runtime Only

Use this path when the app already has its own session/token orchestration and only needs the RTC
media runtime.

\`\`\`ts
import {
  createRtcCallTrackId,
  RtcDataSource,
  createBuiltinRtcDriverManager,
} from '${languageEntry.publicPackage}';

const dataSource = new RtcDataSource({
  driverManager: createBuiltinRtcDriverManager(),
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
  sessionId: 'rtc-session-1',
  roomId: 'room-1',
  participantId: 'user-1',
  token: 'provider-issued-token',
});

await rtcClient.publish({
  trackId: createRtcCallTrackId('rtc-session-1', 'audio'),
  kind: 'audio',
});

await rtcClient.publish({
  trackId: createRtcCallTrackId('rtc-session-1', 'video'),
  kind: 'video',
});
\`\`\`

### Required Native Config

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

## Complete Call Flow With RTC Signaling

Use this path when the app wants one standard session that combines:

- RTC session creation/invite/accept/reject/end through the signaling adapter
- conversation-scoped incoming call discovery through \`${runtimeBaseline.signalingSdkPackage}\`
- realtime session signal delivery through \`${runtimeBaseline.signalingSdkPackage}\`
- provider participant credential issuance
- Volcengine media join and auto publish
- typed offer/answer/ice signaling over the RTC session stream

\`\`\`ts
import {
  createRtcAppHttpClient,
  ${runtimeBaseline.recommendedEntrypoint},
  RTC_CALL_OFFER_SIGNAL_TYPE,
} from '${languageEntry.publicPackage}';

const transport = createRtcAppHttpClient({
  baseUrl: 'https://rtc.example.com',
  authToken: 'app-token',
});

const liveConnection = await transport.connect?.({
  deviceId: 'device-1',
  subscriptions: {
    conversations: ['conversation-1'],
  },
  webSocketAuth: { mode: 'automatic' },
});
if (!liveConnection) {
  throw new Error('Provide transport.connect() or a shared liveConnection when watching incoming RTC calls.');
}

const rtc = await ${runtimeBaseline.recommendedEntrypoint}({
  transport,
  deviceId: 'device-1',
  liveConnection,
  connectOptions: {
    webSocketAuth: { mode: 'automatic' },
  },
  watchConversationIds: ['conversation-1'],
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});

rtc.callController.onEvent((event) => {
  if (event.type === 'incoming_invitation') {
    void rtc.callController.acceptIncoming({
      rtcSessionId: event.invitation.rtcSessionId,
      participantId: 'user-1',
      autoPublish: {
        audio: true,
        video: true,
      },
    });
  }

  if (event.type === 'signal' && event.signal.signalType === RTC_CALL_OFFER_SIGNAL_TYPE) {
    console.log('remote offer', event.signal.payload);
  }
});

await rtc.callController.startOutgoing({
  rtcSessionId: 'rtc-session-1',
  conversationId: 'conversation-1',
  rtcMode: 'video_call',
  roomId: 'room-1',
  participantId: 'user-1',
  signalingStreamId: 'rtc-signal-1',
  autoPublish: {
    audio: true,
    video: true,
  },
});

await rtc.callController.sendOffer({
  sdp: 'offer-sdp',
});

await rtc.callController.sendIceCandidate({
  candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
});

await rtc.callController.end();
\`\`\`

## Reuse Existing RTC WebSocket

When the application already owns one shared RTC live connection, reuse it so RTC does not open a
second WebSocket:

\`\`\`ts
const liveConnection = await transport.connect({
  deviceId: 'device-1',
  subscriptions: {
    conversations: ['conversation-1'],
  },
  webSocketAuth: { mode: 'automatic' },
});

const rtc = await ${runtimeBaseline.recommendedEntrypoint}({
  transport,
  deviceId: 'device-1',
  liveConnection,
  watchConversationIds: ['conversation-1'],
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});
\`\`\`

## Signaling Contract Mapping

\`createRtcSignalingAdapter(...)\` maps the caller-supplied RTC signaling transport to the RTC
standard call/signaling contract:

- \`transport.createSession(...)\` -> \`createSession(...)\`
- \`transport.inviteSession(...)\` -> \`inviteSession(...)\`
- \`transport.acceptSession(...)\` -> \`acceptSession(...)\`
- \`transport.rejectSession(...)\` -> \`rejectSession(...)\`
- \`transport.endSession(...)\` -> \`endSession(...)\`
- \`transport.postJsonSignal(...)\` -> \`sendSignal(...)\`
- \`transport.issueParticipantCredential(...)\` -> \`issueParticipantCredential(...)\`
- shared \`RtcSignalingRealtimeDispatcher\` -> one RTC WebSocket connection for both
  \`liveConnection.signals.onRtcSession(...)\` and
  \`liveConnection.messages.onConversation(...)\`
- optional \`transport.createSignalMessage(...)\` + \`transport.send(...)\` or
  \`transport.messages.createSignal(...)\` + \`transport.messages.send(...)\` ->
  conversation-scoped invite publication
- optional \`transport.realtime.replaceSubscriptions(...)\` -> live subscription sync without
  opening a second realtime connection

## Runtime Guarantees

- \`${runtimeBaseline.recommendedEntrypoint}(...)\` returns \`driverManager\`, \`dataSource\`,
  \`mediaClient\`, \`signaling\`, \`callSession\`, \`realtimeDispatcher\`, and \`callController\`
  as one explicit standard bundle
- \`createRtcCallTrackId(rtcSessionId, kind)\` is the standard cross-language track id helper and
  yields canonical ids such as \`rtc-session-1-audio\`
- TypeScript now defaults \`subscribeSignals\` to \`true\`, aligned with Flutter/mobile
- \`createBuiltinRtcDriverManager()\` defaults to \`${defaultProviderKey}\`
- Volcengine Web runtime loading is lazy
- official vendor SDKs are not bundled into the RTC standard package
- RTC signaling is WebSocket-first; the TypeScript RTC standard does not expose polling controls
- \`connectOptions.webSocketAuth\` is passed through to \`${runtimeBaseline.signalingSdkPackage}\`
  so browser gateways can prefer query-bearer WebSocket auth while non-browser callers can keep
  header-bearer mode
- \`liveConnection\` lets the TypeScript RTC standard reuse an app-owned shared RTC WebSocket live
  connection instead of opening a second RTC-specific socket
- \`deviceId\` remains the authoritative RTC realtime identity; when
  \`connectOptions.deviceId\` is provided it must match the RTC stack \`deviceId\`
- signal payloads are exposed as parsed JSON when possible and as raw strings otherwise
- the call/session layer does not leak application transport DTOs into the RTC public standard
- \`StandardRtcCallController\` is the default orchestration layer for invite discovery, remote
  lifecycle reconciliation, and typed offer/answer/ice signaling
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
    ...resolveFlutterRuntimeBaselineDependencyLines(languageEntry.runtimeBaseline.vendorSdkPackage),
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
# SDKWork RTC SDK Flutter Usage

This document describes the current executable Flutter/mobile baseline of \`sdkwork-rtc-sdk\`.

## Current Runnable Baseline

- Default media provider: \`${defaultProviderKey}\`
- Default mobile runtime package: official \`${runtimeBaseline.vendorSdkPackage}\`
- Default mobile runtime import path: \`${runtimeBaseline.vendorSdkImportPath}\`
- Default signaling package: \`${runtimeBaseline.signalingSdkPackage}\`
- Default signaling import path: \`${runtimeBaseline.signalingSdkImportPath}\`
- Standard media entrypoint: \`RtcDataSource\`
- Standard call/session entrypoint: \`StandardRtcCallController\`
- Recommended quick-start entrypoint: \`${runtimeBaseline.recommendedEntrypoint}\`
- Smoke command: \`${runtimeBaseline.smokeCommand}\`
- Smoke mode: \`${runtimeBaseline.smokeMode}\`

## Install

Add the standard RTC package, the official Volcengine Flutter SDK, and the RTC SDK:

\`\`\`yaml
dependencies:
${renderFlutterRuntimeUsageInstallDependencies(languageEntry)}
\`\`\`

Recommended RTC realtime rule:

- keep \`${runtimeBaseline.signalingSdkPackage}\` on the delivered RTC WebSocket
  live path
- keep \`RtcSignalingWebSocketAuthOptions.automatic()\` as the default and prefer
  \`credentialProvider\` with a short-lived realtime ticket for browser-facing gateways
- when HTTP and realtime origins are split, set \`websocketBaseUrl\` on \`RtcSignalingClient implementation\`
- when RTC needs a live-auth override, pass \`connectOptions.webSocketAuth\` on
  \`${runtimeBaseline.recommendedEntrypoint}(...)\`
- when the app already owns one shared RTC live connection, pass \`liveConnection\` on the RTC
  standard stack so RTC reuses that WebSocket instead of opening another one

## WebSocket Auth Standard

RTC delegates live signaling auth directly to \`${runtimeBaseline.signalingSdkPackage}\` and stays
WebSocket-first.

- \`RtcSignalingWebSocketAuthOptions.automatic()\` is the recommended default
- \`RtcSignalingWebSocketAuthOptions.queryBearer()\` is the explicit override for gateways that only accept
  query-parameter auth
- \`RtcSignalingWebSocketAuthOptions.headerBearer()\` is the explicit override for custom native socket
  bridges that can attach headers
- \`RtcSignalingWebSocketAuthOptions.none()\` is reserved for trusted internal sockets or pre-signed WebSocket
  URLs
- prefer \`credentialProvider\` with short-lived realtime tickets instead of long-lived access
  tokens
- keep \`deviceId\` on the RTC stack top level; \`connectOptions.deviceId\` is optional and must
  match when supplied
- if the application already owns one shared RTC live connection, pass \`liveConnection\`; RTC
  keeps subscription sync on that same socket and does not open another one
- WebSocket auth failure should fail fast; the Flutter RTC standard does not downgrade to polling
- call \`describeRtcSignalingTransport(...)\` when the host needs one immutable runtime snapshot of
  the resolved auth mode, authoritative \`deviceId\`, shared-\`liveConnection\` reuse flag, and
  fail-fast/no-polling guarantees before opening the RTC signaling path

\`\`\`dart
import '${runtimeBaseline.signalingSdkImportPath}';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> connectRtcLive(RtcSignalingClient rtcSignalingClient) async {
  final rtc = await ${runtimeBaseline.recommendedEntrypoint}<
      RtcVolcengineFlutterNativeClient>(
    CreateStandardRtcCallControllerStackOptions(
      sdk: rtcSignalingClient,
      deviceId: 'device-1',
      connectOptions: const RtcSignalingConnectOptions(
        webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
      ),
      dataSourceOptions: const RtcDataSourceOptions(
        nativeConfig: RtcVolcengineFlutterNativeConfig(
          appId: 'volc-app-id',
        ),
      ),
    ),
  );

  final signalingTransport = describeRtcSignalingTransport(
    deviceId: 'device-1',
    connectOptions: const RtcSignalingConnectOptions(
      webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
    ),
  );

  print(signalingTransport.authMode);
  print(signalingTransport.usesSharedLiveConnection);

  await rtc.close();
}
\`\`\`

## Fast Smoke Verification

Run the public Flutter smoke command inside \`${languageEntry.workspace}\` when you need to verify the default
\`${defaultProviderKey} + ${runtimeBaseline.signalingSdkPackage}\` path without live services:

\`\`\`powershell
${runtimeBaseline.smokeCommand}
\`\`\`

Add \`--reuse-live-connection\` when you want the analyze-backed Flutter smoke to validate the
shared RTC WebSocket ownership path as part of the public RTC baseline.

The executable wrapper is currently analyze-backed because the official
\`${runtimeBaseline.vendorSdkPackage}\` package crashes under Dart VM CLI compilation in the current toolchain.
It still gives one stable command for maintainers to verify the standard smoke scenario source.
Its JSON summary also includes a \`signalingTransport\` descriptor aligned with the Dart smoke
source so maintainers can verify the resolved auth mode, authoritative \`deviceId\`, shared
\`liveConnection\` reuse flag, and no-polling contract at the public command boundary.

The verified smoke surface is:

- \`${runtimeBaseline.recommendedEntrypoint}(...)\`
- the default \`${defaultProviderKey}\` provider selection path
- \`${runtimeBaseline.signalingSdkPackage}\` client composition through \`RtcSignalingClient implementation\`
- authoritative top-level \`deviceId\` plus the optional shared \`liveConnection\` stack variant
- the official Volcengine Flutter bridge smoke scenario source in \`bin/sdk-call-smoke.dart\`
- the future runtime-backed path that will be used once the vendor package is CLI-runnable in the
  active toolchain

## Media Runtime Only

Use this path when the application already owns its own session orchestration and only needs the
standard media runtime.

\`\`\`dart
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcMediaOnly() async {
  final dataSource = RtcDataSource(
    options: const RtcDataSourceOptions(
      nativeConfig: RtcVolcengineFlutterNativeConfig(
        appId: 'volc-app-id',
        room: RtcVolcengineFlutterRoomConfig(
          userId: 'user-1',
          profile: 'communication',
          scenario: 'general',
        ),
      ),
    ),
  );

  final rtcClient = await dataSource.createClient<RtcVolcengineFlutterNativeClient>();

  await rtcClient.join(
    const RtcJoinOptions(
      sessionId: 'rtc-session-1',
      roomId: 'room-1',
      participantId: 'user-1',
      token: 'provider-issued-token',
    ),
  );

  await rtcClient.publish(
    RtcPublishOptions(
      trackId: createRtcCallTrackId('rtc-session-1', RtcTrackKind.audio),
      kind: RtcTrackKind.audio,
    ),
  );

  await rtcClient.publish(
    RtcPublishOptions(
      trackId: createRtcCallTrackId('rtc-session-1', RtcTrackKind.video),
      kind: RtcTrackKind.video,
    ),
  );
}
\`\`\`

## Required Native Config

For the default Volcengine Flutter runtime, \`RtcVolcengineFlutterNativeConfig.appId\` is mandatory.
The driver fails fast before \`join()\` if it is missing.

The standard native config shape is:

\`\`\`dart
const RtcVolcengineFlutterNativeConfig(
  appId: 'volc-app-id',
  room: RtcVolcengineFlutterRoomConfig(
    userId: 'user-1',
    profile: 'communication',
    scenario: 'general',
    token: 'optional-direct-room-token',
  ),
);
\`\`\`

## Complete Call Flow With RTC Signaling

Use this path when the app wants one standard session that combines:

- RTC-side RTC session creation, invite, accept, reject, and end
- conversation-scoped incoming call discovery through \`${runtimeBaseline.signalingSdkPackage}\`
- realtime session signal delivery through \`${runtimeBaseline.signalingSdkPackage}\`
- provider participant credential issuance
- Volcengine media join and auto publish
- typed offer/answer/ice signaling over the RTC session stream

\`\`\`dart
import '${runtimeBaseline.signalingSdkImportPath}';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcCall({
  required RtcSignalingClient rtcSignalingClient,
  required String currentUserId,
}) async {
  final rtc = await ${runtimeBaseline.recommendedEntrypoint}<
      RtcVolcengineFlutterNativeClient>(
    CreateStandardRtcCallControllerStackOptions(
      sdk: rtcSignalingClient,
      deviceId: 'device-1',
      watchConversationIds: const <String>['conversation-1'],
      connectOptions: const RtcSignalingConnectOptions(
        webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
      ),
      dataSourceOptions: const RtcDataSourceOptions(
        nativeConfig: RtcVolcengineFlutterNativeConfig(
          appId: 'volc-app-id',
        ),
      ),
    ),
  );

  rtc.callController.onEvent((event) {
    if (event.type == RtcCallControllerEventType.incomingInvitation) {
      unawaited(
        rtc.callController.acceptIncoming(
          RtcCallControllerAcceptOptions(
            rtcSessionId: event.invitation!.rtcSessionId,
            participantId: currentUserId,
            autoPublish: const RtcCallAutoPublishOptions(
              audio: true,
              video: true,
            ),
          ),
        ),
      );
    }
  });

  await rtc.callController.startOutgoing(
    RtcCallControllerOutgoingOptions(
      rtcSessionId: 'rtc-session-1',
      conversationId: 'conversation-1',
      rtcMode: 'video_call',
      roomId: 'room-1',
      participantId: currentUserId,
      signalingStreamId: 'rtc-signal-1',
      autoPublish: const RtcCallAutoPublishOptions(
        audio: true,
        video: true,
      ),
    ),
  );

  await rtc.callController.sendOffer(
    const RtcCallSessionDescriptionPayload(
      sdp: 'offer-sdp',
    ),
  );

  await rtc.callController.sendIceCandidate(
    const RtcCallIceCandidatePayload(
      candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
    ),
  );

await rtc.callController.end();
}
\`\`\`

## Reuse Existing RTC WebSocket

When the application already owns one shared RTC live connection, pass that connection into the RTC
stack so signaling stays on the same WebSocket:

\`\`\`dart
final liveConnection = await rtcSignalingClient.connect(
  const RtcSignalingConnectOptions(
    deviceId: 'device-1',
    subscriptions: RtcSignalingRealtimeSubscriptionGroups(
      conversations: <String>['conversation-1'],
    ),
    webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
  ),
);

final rtc = await ${runtimeBaseline.recommendedEntrypoint}<
    RtcVolcengineFlutterNativeClient>(
  CreateStandardRtcCallControllerStackOptions(
    sdk: rtcSignalingClient,
    deviceId: 'device-1',
    liveConnection: liveConnection,
    watchConversationIds: const <String>['conversation-1'],
    connectOptions: const RtcSignalingConnectOptions(
      webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
    ),
    dataSourceOptions: const RtcDataSourceOptions(
      nativeConfig: RtcVolcengineFlutterNativeConfig(
        appId: 'volc-app-id',
      ),
    ),
  ),
);
\`\`\`

## Signaling Contract Mapping

\`createRtcSignalingAdapter(...)\` maps the \`${runtimeBaseline.signalingSdkPackage}\` composed RTC surface to the RTC
standard call/signaling contract:

- \`RtcSignalingClient.rtc.create(...)\` -> \`createSession(...)\`
- \`RtcSignalingClient.rtc.invite(...)\` -> \`inviteSession(...)\`
- \`RtcSignalingClient.rtc.accept(...)\` -> \`acceptSession(...)\`
- \`RtcSignalingClient.rtc.reject(...)\` -> \`rejectSession(...)\`
- \`RtcSignalingClient.rtc.end(...)\` -> \`endSession(...)\`
- \`RtcSignalingClient.rtc.postJsonSignal(...)\` -> \`sendSignal(...)\`
- \`RtcSignalingClient.rtc.issueParticipantCredential(...)\` -> \`issueParticipantCredential(...)\`
- \`RtcSignalingClient.connect(...)\` -> internal shared RTC realtime dispatcher live stream
- \`RtcSignalingClient.realtime.replaceSubscriptions(...)\` -> live subscription sync without opening a second
  RTC-specific socket
- \`RtcSignalingClient.conversations.postSignalMessage(...)\` -> conversation-scoped invite publication

## Runtime Guarantees

- \`${runtimeBaseline.recommendedEntrypoint}(...)\` returns \`driverManager\`, \`dataSource\`,
  \`mediaClient\`, \`signaling\`, \`callSession\`, \`realtimeDispatcher\`, and \`callController\`
  in one explicit standard bundle
- \`createRtcCallTrackId(rtcSessionId, kind)\` is the standard cross-language track id helper and
  yields canonical ids such as \`rtc-session-1-audio\`
- \`RtcDriverManager()\` auto-registers the default Volcengine Flutter driver
- \`RtcDataSource()\` defaults to \`${defaultProviderKey}\`
- the call/session layer does not leak RTC transport DTOs into the RTC public standard
- \`StandardRtcCallController\` is the default orchestration layer for invite discovery, remote
  lifecycle reconciliation, and typed offer/answer/ice signaling
- \`StandardRtcCallSession\` remains the focused single-session executor under the controller
- \`RtcJoinOptions.token\` is sourced from RTC-issued participant credentials in the standard call
  flow instead of hardcoding vendor tokens in the caller
- audio and video auto-publish are standardized through \`RtcCallAutoPublishOptions\`
- \`connectOptions.webSocketAuth\` is passed through to \`${runtimeBaseline.signalingSdkPackage}\`
  when the RTC stack establishes its shared RTC WebSocket live connection
- \`liveConnection\` lets the RTC standard reuse an app-owned \`RtcSignalingClient.connect(...)\` live connection
  instead of opening a second RTC-specific socket
- \`deviceId\` remains the authoritative RTC realtime identity; when
  \`connectOptions.deviceId\` is provided it must match the RTC stack \`deviceId\`
- \`reconnectInterval\` is the standard Flutter RTC reconnect-backoff option for RTC live signaling;
  the public Flutter RTC standard does not expose polling controls
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

function renderTypeScriptSignalingTransport(assembly) {
  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_SIGNALING_TRANSPORT_TERM = ${renderStringLiteral(
    assembly.signalingTransportStandard?.transportTerm ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH = ${renderStringLiteral(
    assembly.signalingTransportStandard?.authConfigPath ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM = ${renderStringLiteral(
    assembly.signalingTransportStandard?.authPassThroughTerm ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.signalingTransportStandard?.authModeTerms ?? [],
  )});

export type RtcSignalingTransportAuthMode =
  (typeof RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS)[number];

export const RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE: RtcSignalingTransportAuthMode = ${renderStringLiteral(
    assembly.signalingTransportStandard?.recommendedAuthMode ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM = ${renderStringLiteral(
    assembly.signalingTransportStandard?.deviceIdAuthorityTerm ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM = ${renderStringLiteral(
    assembly.signalingTransportStandard?.connectOptionsDeviceIdRuleTerm ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM = ${renderStringLiteral(
    assembly.signalingTransportStandard?.liveConnectionTerm ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM = ${renderStringLiteral(
    assembly.signalingTransportStandard?.pollingFallbackTerm ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM = ${renderStringLiteral(
    assembly.signalingTransportStandard?.authFailureTerm ?? '',
  )};

export const RTC_SIGNALING_TRANSPORT_STANDARD = freezeRtcRuntimeValue({
  transportTerm: RTC_SIGNALING_TRANSPORT_TERM,
  authConfigPath: RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH,
  authPassThroughTerm: RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM,
  authModeTerms: RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS,
  recommendedAuthMode: RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE,
  deviceIdAuthorityTerm: RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM,
  connectOptionsDeviceIdRuleTerm:
    RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM,
  liveConnectionTerm: RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM,
  pollingFallbackTerm: RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM,
  authFailureTerm: RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM,
} as const);

export interface RtcSignalingTransportAuthOptionsLike {
  readonly mode?: RtcSignalingTransportAuthMode;
}

export interface RtcSignalingTransportConnectOptionsLike {
  readonly deviceId?: string | number;
  readonly webSocketAuth?: RtcSignalingTransportAuthOptionsLike;
}

export interface DescribeRtcSignalingTransportOptions {
  readonly deviceId: string | number;
  readonly connectOptions?: RtcSignalingTransportConnectOptionsLike;
  readonly liveConnection?: unknown;
}

export interface RtcSignalingTransportDescriptor {
  readonly deviceId: string;
  readonly connectOptionsDeviceId?: string;
  readonly authMode: RtcSignalingTransportAuthMode;
  readonly usesSharedLiveConnection: boolean;
  readonly transportTerm: typeof RTC_SIGNALING_TRANSPORT_TERM;
  readonly authConfigPath: typeof RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH;
  readonly authPassThroughTerm: typeof RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM;
  readonly recommendedAuthMode: RtcSignalingTransportAuthMode;
  readonly deviceIdAuthorityTerm: typeof RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM;
  readonly connectOptionsDeviceIdRuleTerm:
    typeof RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM;
  readonly liveConnectionTerm: typeof RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM;
  readonly pollingFallbackTerm: typeof RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM;
  readonly authFailureTerm: typeof RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM;
}

function normalizeRtcSignalingTransportDeviceId(deviceId: string | number): string {
  const normalized = String(deviceId).trim();
  if (!normalized) {
    throw new TypeError('RTC signaling deviceId must not be empty.');
  }
  return normalized;
}

function isRtcSignalingTransportAuthMode(
  value: string,
): value is RtcSignalingTransportAuthMode {
  return (RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS as readonly string[]).includes(value);
}

function resolveRtcSignalingTransportAuthMode(
  connectOptions?: RtcSignalingTransportConnectOptionsLike,
): RtcSignalingTransportAuthMode {
  const mode = connectOptions?.webSocketAuth?.mode;
  if (mode === undefined) {
    return RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE;
  }

  if (!isRtcSignalingTransportAuthMode(mode)) {
    throw new TypeError(\`Unsupported RTC signaling auth mode: \${mode}\`);
  }

  return mode;
}

export function describeRtcSignalingTransport(
  options: DescribeRtcSignalingTransportOptions,
): RtcSignalingTransportDescriptor {
  const deviceId = normalizeRtcSignalingTransportDeviceId(options.deviceId);
  const connectOptionsDeviceId = options.connectOptions?.deviceId === undefined
    ? undefined
    : normalizeRtcSignalingTransportDeviceId(options.connectOptions.deviceId);

  if (connectOptionsDeviceId !== undefined && connectOptionsDeviceId !== deviceId) {
    throw new TypeError(
      'RTC signaling deviceId must match connectOptions.deviceId when both are provided.',
    );
  }

  return freezeRtcRuntimeValue({
    deviceId,
    connectOptionsDeviceId,
    authMode: resolveRtcSignalingTransportAuthMode(options.connectOptions),
    usesSharedLiveConnection: options.liveConnection !== undefined,
    transportTerm: RTC_SIGNALING_TRANSPORT_TERM,
    authConfigPath: RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH,
    authPassThroughTerm: RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM,
    recommendedAuthMode: RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE,
    deviceIdAuthorityTerm: RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM,
    connectOptionsDeviceIdRuleTerm:
      RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM,
    liveConnectionTerm: RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM,
    pollingFallbackTerm: RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM,
    authFailureTerm: RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM,
  });
}
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

function resolveTypeScriptRuntimeBaselinePeerDependencyRange(packageName) {
  switch (packageName) {
    case '@volcengine/rtc':
      return '^4.68.3';
    default:
      throw new Error(
        `Unsupported TypeScript runtime baseline peer dependency. Extend the manifest renderer for ${packageName}.`,
      );
  }
}

function renderTypeScriptWorkspaceManifest(assembly) {
  const { languageEntry, runtimeBaseline } = getExecutableLanguageRuntimeBaseline(
    assembly,
    'typescript',
  );

  const peerDependencies = Object.fromEntries(
    [runtimeBaseline.vendorSdkPackage]
      .filter((packageName) => packageName !== languageEntry.publicPackage)
      .map((packageName) => [
        packageName,
        resolveTypeScriptRuntimeBaselinePeerDependencyRange(packageName),
      ]),
  );

  const peerDependenciesMeta = Object.fromEntries(
    Object.keys(peerDependencies).map((packageName) => [packageName, { optional: true }]),
  );

  const packageJson = {
    name: languageEntry.publicPackage,
    version: '0.1.1',
    description:
      'JDBC-style RTC provider standard SDK with built-in driver management and provider adapters',
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
    peerDependencies,
    peerDependenciesMeta,
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
    status: provider.builtin
      ? 'root_public_reference_boundary'
      : 'package_reference_boundary',
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
          signalingSdkPackage: languageEntry.runtimeBaseline.signalingSdkPackage,
          signalingSdkImportPath: languageEntry.runtimeBaseline.signalingSdkImportPath,
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
- signaling SDK package: \`${languageEntry.runtimeBaseline.signalingSdkPackage}\`
- signaling SDK import path: \`${languageEntry.runtimeBaseline.signalingSdkImportPath}\`
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
    runtimeBridgeStatus: ${renderStringLiteral(providerPackageScaffold.runtimeBridgeStatus)},
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
    signalingSdkPackage: ${renderStringLiteral(runtimeBaseline.signalingSdkPackage)},
    signalingSdkImportPath: ${renderStringLiteral(runtimeBaseline.signalingSdkImportPath)},
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
    'standard call-stack composition helper at src/standard-call-stack.ts for default Volcengine plus sdkwork-rtc-sdk signaling',
    'shared RTC WebSocket realtime dispatcher at src/signaling-adapter.ts for unified RTC session and conversation invite subscriptions',
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
The shared signaling-transport module at \`src/signaling-transport.ts\` materializes
\`signalingTransportStandard\` into \`RTC_SIGNALING_TRANSPORT_TERM\`,
\`RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH\`,
\`RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM\`,
\`RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS\`,
\`RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE\`,
\`RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM\`,
\`RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM\`,
\`RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM\`,
\`RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM\`,
\`RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM\`, and
\`RTC_SIGNALING_TRANSPORT_STANDARD\` so the WebSocket-only signaling contract, auth pass-through
boundary, authoritative \`deviceId\` rule, shared \`liveConnection\` reuse, no-polling policy,
and fail-fast auth semantics stay assembly-governed.
The Flutter/mobile counterpart at \`../sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart\`
keeps \`rtcSignalingTransportTerm\`, \`rtcSignalingTransportAuthConfigPath\`,
\`rtcSignalingTransportAuthPassThroughTerm\`, \`rtcSignalingTransportAuthModeTerms\`,
\`rtcSignalingTransportRecommendedAuthMode\`, \`rtcSignalingTransportDeviceIdAuthorityTerm\`,
\`rtcSignalingTransportConnectOptionsDeviceIdRuleTerm\`, \`rtcSignalingTransportLiveConnectionTerm\`,
\`rtcSignalingTransportPollingFallbackTerm\`, \`rtcSignalingTransportAuthFailureTerm\`, and
\`rtcSignalingTransportStandard\` aligned to the same assembly-driven contract so the executable
web/browser and mobile baselines cannot drift.
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

Local smoke CLI:

- \`bin/sdk-call-smoke.mjs\` verifies the public TypeScript call stack against mocked
  \`sdkwork-rtc-sdk\` signaling and a mocked official Volcengine Web SDK module
- \`npm run smoke\`
- \`node ./bin/sdk-call-smoke.mjs --json\`
- \`node ./bin/sdk-call-smoke.mjs --json --reuse-live-connection\`
- signaling uses one shared RTC WebSocket realtime dispatcher, and \`connectOptions.webSocketAuth\`
  remains part of the public TypeScript RTC baseline
- \`liveConnection\` is also part of the public TypeScript RTC baseline when the application wants
  RTC to reuse an existing shared RTC WebSocket live connection

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

  return `Executable baseline:

- Flutter/mobile now ships a runnable default adapter for \`volcengine\`
- media runtime delegates to the official \`volc_engine_rtc\` package
- signaling delegates to \`sdkwork-rtc-sdk\` through \`package:rtc_sdk/rtc_sdk.dart\`
- \`RtcDriverManager\` auto-registers \`createVolcengineRtcDriver()\`
- \`RtcDataSource()\` therefore resolves to \`volcengine\` by default with no extra provider selection
- \`createStandardRtcCallControllerStack(...)\` is the recommended quick-start entrypoint for the
  default Volcengine plus \`sdkwork-rtc-sdk\` call flow
- \`StandardRtcCallController\` is the default orchestration layer for invite discovery, RTC
  lifecycle reconciliation, and typed offer/answer/ice signaling
- \`StandardRtcCallSession\` remains the focused single-session executor under the controller

Quick start:

\`\`\`dart
import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcCall({
  required RtcSignalingClient rtcSignalingClient,
  required String currentUserId,
}) async {
  final rtc =
      await createStandardRtcCallControllerStack<RtcVolcengineFlutterNativeClient>(
    CreateStandardRtcCallControllerStackOptions(
      sdk: rtcSignalingClient,
      deviceId: 'current-device-id',
      connectOptions: const RtcSignalingConnectOptions(
        webSocketAuth: RtcSignalingWebSocketAuthOptions.automatic(),
      ),
      dataSourceOptions: const RtcDataSourceOptions(
        nativeConfig: RtcVolcengineFlutterNativeConfig(
          appId: 'your-volcengine-app-id',
        ),
      ),
    ),
  );

  await rtc.callController.startOutgoing(
    RtcCallControllerOutgoingOptions(
      rtcSessionId: 'rtc-session-001',
      conversationId: 'conversation-001',
      rtcMode: 'video_call',
      participantId: currentUserId,
      autoPublish: const RtcCallAutoPublishOptions(
        audio: true,
        video: true,
      ),
    ),
  );
}
\`\`\`

Runtime notes:

- \`createStandardRtcCallControllerStack(...)\` returns \`driverManager\`, \`dataSource\`,
  \`mediaClient\`, \`signaling\`, \`callSession\`, \`realtimeDispatcher\`, and \`callController\`
  so callers can keep the standard pieces explicit
- \`RtcVolcengineFlutterNativeConfig.appId\` is mandatory; join will fail fast without it
- \`RtcJoinOptions.token\` is filled from \`sdkwork-rtc-sdk\` issued participant credentials, not by
  hardcoding vendor tokens in the caller
- \`RtcPublishOptions\` supports standard audio and video publishing through the Volcengine adapter
- signaling subscriptions are multiplexed through one shared RTC realtime dispatcher backed by
  \`rtc_sdk.connect(...)\` WebSocket live receive, so multiple RTC sessions do not overwrite each
  other at the subscription layer
- \`connectOptions.webSocketAuth\` is forwarded to the shared RTC live connection when the RTC stack
  establishes its own WebSocket
- \`liveConnection\` lets the Flutter RTC standard reuse an app-owned shared RTC WebSocket live
  connection instead of creating another one
- \`deviceId\` remains the authoritative RTC realtime identity; if \`connectOptions.deviceId\` is
  provided it must match the RTC stack \`deviceId\`
- \`reconnectInterval\` is the standard RTC live signaling reconnect-backoff option for the shared
  WebSocket live connection; the Flutter RTC standard does not expose polling controls`;
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
  const signalingTransportStandardLines = [
    `- \`signalingTransportStandard.transportTerm\`: \`${assembly.signalingTransportStandard?.transportTerm ?? ''}\``,
    `- \`signalingTransportStandard.authConfigPath\`: \`${assembly.signalingTransportStandard?.authConfigPath ?? ''}\``,
    `- \`signalingTransportStandard.authPassThroughTerm\`: \`${assembly.signalingTransportStandard?.authPassThroughTerm ?? ''}\``,
    `- \`signalingTransportStandard.authModeTerms\`: ${renderMarkdownCodeList(
      assembly.signalingTransportStandard?.authModeTerms ?? [],
    )}`,
    `- \`signalingTransportStandard.recommendedAuthMode\`: \`${assembly.signalingTransportStandard?.recommendedAuthMode ?? ''}\``,
    `- \`signalingTransportStandard.deviceIdAuthorityTerm\`: \`${assembly.signalingTransportStandard?.deviceIdAuthorityTerm ?? ''}\``,
    `- \`signalingTransportStandard.connectOptionsDeviceIdRuleTerm\`: \`${assembly.signalingTransportStandard?.connectOptionsDeviceIdRuleTerm ?? ''}\``,
    `- \`signalingTransportStandard.liveConnectionTerm\`: \`${assembly.signalingTransportStandard?.liveConnectionTerm ?? ''}\``,
    `- \`signalingTransportStandard.pollingFallbackTerm\`: \`${assembly.signalingTransportStandard?.pollingFallbackTerm ?? ''}\``,
    `- \`signalingTransportStandard.authFailureTerm\`: \`${assembly.signalingTransportStandard?.authFailureTerm ?? ''}\``,
    '- TypeScript root public module: `sdkwork-rtc-sdk-typescript/src/signaling-transport.ts`',
    '- TypeScript root public constants: `RTC_SIGNALING_TRANSPORT_TERM`, `RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH`, `RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM`, `RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS`, `RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE`, `RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM`, `RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM`, `RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM`, `RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM`, `RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM`, `RTC_SIGNALING_TRANSPORT_STANDARD`',
    '- Flutter root public module: `sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart`',
    '- Flutter root public constants: `rtcSignalingTransportTerm`, `rtcSignalingTransportAuthConfigPath`, `rtcSignalingTransportAuthPassThroughTerm`, `rtcSignalingTransportAuthModeTerms`, `rtcSignalingTransportRecommendedAuthMode`, `rtcSignalingTransportDeviceIdAuthorityTerm`, `rtcSignalingTransportConnectOptionsDeviceIdRuleTerm`, `rtcSignalingTransportLiveConnectionTerm`, `rtcSignalingTransportPollingFallbackTerm`, `rtcSignalingTransportAuthFailureTerm`, `rtcSignalingTransportStandard`',
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

This matrix is materialized from \`.sdkwork-assembly.json\` so the official provider tiers, language
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

## Signaling Transport Standard

${signalingTransportStandardLines}

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
  const packageJson = {
    name: packageContract.packageName,
    version: '0.1.0',
    private: true,
    description: `Reference TypeScript provider boundary for ${provider.displayName} within sdkwork-rtc-sdk`,
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
    sdkworkRtcProvider: {
      providerKey: provider.providerKey,
      displayName: provider.displayName,
      tier: provider.tier,
      builtin: provider.builtin,
      status: provider.builtin
        ? 'root_public_reference_boundary'
        : 'package_reference_boundary',
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

function renderProviderPackageEntrypoint(provider) {
  const packageContract = provider.typescriptPackage;

  return `export {
  ${packageContract.driverFactory},
  ${packageContract.metadataSymbol},
  ${packageContract.moduleSymbol},
} from '../../dist/providers/${provider.providerKey}.js';
`;
}

function renderProviderPackageDeclarationEntrypoint(provider) {
  const packageContract = provider.typescriptPackage;

  return `export {
  ${packageContract.driverFactory},
  ${packageContract.metadataSymbol},
  ${packageContract.moduleSymbol},
} from '../../dist/providers/${provider.providerKey}.js';
`;
}

function renderProviderPackageReadme(provider) {
  const rootExposureRule = provider.builtin
    ? '- the driver factory and provider module symbol may be re-exported from the root `@sdkwork/rtc-sdk` entrypoint because this provider is builtin'
    : '- the driver factory and provider module symbol are not re-exported from the root `@sdkwork/rtc-sdk` entrypoint because this provider is not builtin';
  const packageStatus = provider.builtin
    ? 'root_public_reference_boundary'
    : 'package_reference_boundary';
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

Reference TypeScript provider package boundary for ${provider.displayName}.

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

- wraps the official vendor SDK instead of re-implementing media runtime
- depends on the core \`@sdkwork/rtc-sdk\` contracts
- registers through the \`RtcProviderModule\` adapter contract
- ships executable \`index.js\` and \`index.d.ts\` entrypoints
- declares \`exports\` so \`import\` and \`default\` resolve to \`index.js\` and \`types\` resolve
  to \`index.d.ts\`
${rootExposureRule}
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
  const assemblyPath = path.join(workspaceRoot, '.sdkwork-assembly.json');
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
      relativePath: 'docs/typescript-volcengine-signaling-usage.md',
      content: renderTypeScriptRuntimeUsageDoc(assembly),
    },
    {
      relativePath: 'docs/flutter-volcengine-signaling-usage.md',
      content: renderFlutterRuntimeUsageDoc(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/package.json',
      content: renderTypeScriptWorkspaceManifest(assembly),
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
      relativePath: 'sdkwork-rtc-sdk-typescript/src/signaling-transport.ts',
      content: renderTypeScriptSignalingTransport(assembly),
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
