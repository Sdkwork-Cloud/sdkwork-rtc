#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const APP_ID = 'sdkwork-rtc';
const SERVER_BINARIES = ['sdkwork-api-rtc-standalone-gateway', 'sdkwork-rtc-reconcile'];
const SERVER_PROFILE = 'server';
const DEFAULT_DEPLOYMENT_PROFILE = 'standalone';
const SUPPORTED_FORMAT = 'tar.gz';

const scriptPath = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(scriptPath), '..');

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const context = await createPackageContext(options);

  if (command === 'package') {
    await packageServer(context);
    return;
  }
  if (command === 'validate') {
    await validateArchive(context);
    return;
  }
  if (command === 'help') {
    printHelp();
    return;
  }
  throw new Error(`Unsupported command: ${command}`);
}

function printHelp() {
  console.log(`Usage: node scripts/package-server.mjs <package|validate> [options]

Options:
  --version <value>             Package version. Defaults to SDKWORK_PACKAGE_VERSION or package.json.
  --platform <value>            Package platform. Defaults to SDKWORK_PACKAGE_PLATFORM or host platform.
  --arch <value>                Package architecture. Defaults to SDKWORK_PACKAGE_ARCHITECTURE or host arch.
  --format <value>              Package format. Only tar.gz is supported.
  --deployment-profile <value>  Deployment profile (standalone or cloud). Defaults to standalone.
  --package-id <value>          Package id. Defaults to SDKWORK_PACKAGE_ID or canonical id.
  --rust-target <value>         Optional cargo --target triple for cross-builds.
  --skip-build                  Reuse existing release binaries.
`);
}

function parseArgs(argv) {
  const hasExplicitCommand = argv[0] && !argv[0].startsWith('-');
  const command = hasExplicitCommand ? argv[0] : 'package';
  const options = {};
  const start = hasExplicitCommand ? 1 : 0;

  for (let index = start; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--version':
        options.version = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--platform':
        options.platform = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--arch':
      case '--architecture':
        options.architecture = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--format':
        options.format = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--deployment-profile':
        options.deploymentProfile = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--package-id':
        options.packageId = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--rust-target':
        options.rustTarget = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unsupported option: ${arg}`);
    }
  }

  return {
    command: options.help ? 'help' : command,
    options,
  };
}

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

async function createPackageContext(options) {
  const packageJson = JSON.parse(await readFile(path.join(appRoot, 'package.json'), 'utf8'));
  const hostPlatform = normalizeHostPlatform(process.platform);
  const hostArchitecture = normalizeHostArchitecture(process.arch);
  const platform = normalizePackagePlatform(
    options.platform ?? process.env.SDKWORK_PACKAGE_PLATFORM ?? hostPlatform,
  );
  const architecture = normalizePackageArchitecture(
    options.architecture ?? process.env.SDKWORK_PACKAGE_ARCHITECTURE ?? hostArchitecture,
  );
  const format = options.format ?? process.env.SDKWORK_PACKAGE_FORMAT ?? SUPPORTED_FORMAT;
  const deploymentProfile = normalizeDeploymentProfile(
    options.deploymentProfile ??
      process.env.SDKWORK_PACKAGE_DEPLOYMENT_PROFILE ??
      DEFAULT_DEPLOYMENT_PROFILE,
  );
  const version = normalizeVersion(
    options.version ?? process.env.SDKWORK_PACKAGE_VERSION ?? packageJson.version ?? '0.1.0',
  );
  const packageId =
    options.packageId ??
    process.env.SDKWORK_PACKAGE_ID ??
    `${platform}-${architecture}-${deploymentProfile}-${SERVER_PROFILE}-tar-gz`;
  const rustTarget = options.rustTarget ?? process.env.SDKWORK_RUST_TARGET ?? '';

  if (format !== SUPPORTED_FORMAT) {
    throw new Error(`Unsupported server package format ${format}; expected ${SUPPORTED_FORMAT}`);
  }
  if (!rustTarget && (platform !== hostPlatform || architecture !== hostArchitecture)) {
    throw new Error(
      `Refusing to label a native ${hostPlatform}/${hostArchitecture} build as ${platform}/${architecture}; pass --rust-target for cross-builds.`,
    );
  }

  const distRoot = path.join(appRoot, 'artifacts', 'release', SERVER_PROFILE);
  const stageName = `${APP_ID}-${version}-${platform}-${architecture}-${SERVER_PROFILE}`;
  const stageRoot = path.join(distRoot, stageName);
  const archivePath = path.join(distRoot, `${stageName}.${SUPPORTED_FORMAT}`);
  const releaseDir = rustTarget
    ? path.join(appRoot, 'target', rustTarget, 'release')
    : path.join(appRoot, 'target', 'release');
  const binaryPaths = Object.fromEntries(
    SERVER_BINARIES.map((binaryName) => {
      const fileName = platform === 'windows' ? `${binaryName}.exe` : binaryName;
      return [binaryName, path.join(releaseDir, fileName)];
    }),
  );

  return {
    architecture,
    archivePath,
    binaryPaths,
    deploymentProfile,
    distRoot,
    format,
    hostArchitecture,
    hostPlatform,
    packageId,
    platform,
    rustTarget,
    skipBuild: options.skipBuild === true,
    stageName,
    stageRoot,
    version,
  };
}

function normalizeVersion(value) {
  const text = String(value ?? '').trim();
  const normalized = text.startsWith('refs/tags/') ? text.slice('refs/tags/'.length) : text;
  const withoutPrefix =
    normalized.startsWith('v') && /^[0-9]/u.test(normalized.slice(1))
      ? normalized.slice(1)
      : normalized;
  if (!/^[0-9A-Za-z][0-9A-Za-z._+-]*$/u.test(withoutPrefix)) {
    throw new Error(`Invalid package version: ${value}`);
  }
  return withoutPrefix;
}

function normalizeHostPlatform(value) {
  if (value === 'win32') {
    return 'windows';
  }
  if (value === 'darwin') {
    return 'macos';
  }
  if (value === 'linux') {
    return 'linux';
  }
  throw new Error(`Unsupported host platform: ${value}`);
}

function normalizePackagePlatform(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (['linux', 'windows', 'macos'].includes(text)) {
    return text;
  }
  throw new Error(`Unsupported server package platform: ${value}`);
}

function normalizeHostArchitecture(value) {
  if (value === 'x64') {
    return 'x64';
  }
  if (value === 'arm64') {
    return 'arm64';
  }
  if (value === 'arm') {
    return 'armv7';
  }
  throw new Error(`Unsupported host architecture: ${value}`);
}

function normalizePackageArchitecture(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (['x64', 'arm64', 'armv7'].includes(text)) {
    return text;
  }
  throw new Error(`Unsupported server package architecture: ${value}`);
}

function normalizeDeploymentProfile(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (text === 'standalone' || text === 'cloud') {
    return text;
  }
  throw new Error(`Unsupported deployment profile: ${value}`);
}

async function packageServer(context) {
  if (!context.skipBuild) {
    runCargoBuild(context);
  }
  for (const [binaryName, binaryPath] of Object.entries(context.binaryPaths)) {
    if (!existsSync(binaryPath)) {
      throw new Error(`Missing release binary ${binaryName}: ${binaryPath}`);
    }
  }

  await assertPathInside(context.stageRoot, context.distRoot);
  await rm(context.stageRoot, { recursive: true, force: true });
  await rm(context.archivePath, { force: true });
  await mkdir(path.join(context.stageRoot, 'bin'), { recursive: true });
  await mkdir(path.join(context.stageRoot, 'config'), { recursive: true });
  await mkdir(path.join(context.stageRoot, 'deployments', 'systemd'), { recursive: true });

  for (const [binaryName, binaryPath] of Object.entries(context.binaryPaths)) {
    const fileName = context.platform === 'windows' ? `${binaryName}.exe` : binaryName;
    await copyFile(binaryPath, path.join(context.stageRoot, 'bin', fileName));
  }

  await copyPackageAssets(context.stageRoot);
  await copyIfExists('README.md', path.join(context.stageRoot, 'README.md'));
  await writeFile(path.join(context.stageRoot, 'INSTALL.md'), renderInstallGuide(context), 'utf8');
  await writeFile(
    path.join(context.stageRoot, 'install-manifest.json'),
    `${JSON.stringify(createInstallManifest(context), null, 2)}\n`,
    'utf8',
  );
  await writeChecksums(context.stageRoot);
  await createArchive(context);
  await validateArchive(context);

  console.log(`[sdkwork-rtc] packaged ${path.relative(appRoot, context.archivePath)}`);
}

function runCargoBuild(context) {
  const args = ['build', '--release', '-p', 'sdkwork-api-rtc-standalone-gateway'];
  if (context.rustTarget) {
    args.push('--target', context.rustTarget);
  }
  run('cargo', args, {
    cwd: appRoot,
    env: { ...process.env, CARGO_INCREMENTAL: '0' },
  });
}

async function copyPackageAssets(stageRoot) {
  const copies = [
    ['deployments/templates/server.env.example', 'config/server.env.example'],
    ['etc/examples/rtc-runtime.env.example', 'config/rtc-runtime.env.example'],
    ['etc/topology/cloud.production.env', 'config/cloud.production.env'],
    ['deployments/systemd/sdkwork-api-rtc-standalone-gateway.service', 'deployments/systemd/sdkwork-api-rtc-standalone-gateway.service'],
    ['deployments/systemd/sdkwork-rtc-reconcile.service', 'deployments/systemd/sdkwork-rtc-reconcile.service'],
    ['deployments/systemd/sdkwork-rtc-reconcile.timer', 'deployments/systemd/sdkwork-rtc-reconcile.timer'],
  ];
  for (const [sourceRelative, destinationRelative] of copies) {
    const source = path.join(appRoot, sourceRelative);
    if (!existsSync(source)) {
      throw new Error(`Missing package asset: ${sourceRelative}`);
    }
    const destination = path.join(stageRoot, destinationRelative);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
}

async function copyIfExists(relativeSource, destination) {
  const source = path.join(appRoot, relativeSource);
  if (existsSync(source)) {
    await copyFile(source, destination);
  }
}

function renderInstallGuide(context) {
  const apiBinary =
    context.platform === 'windows'
      ? '.\\bin\\sdkwork-api-rtc-standalone-gateway.exe'
      : './bin/sdkwork-api-rtc-standalone-gateway';
  const reconcileBinary =
    context.platform === 'windows'
      ? '.\\bin\\sdkwork-rtc-reconcile.exe'
      : './bin/sdkwork-rtc-reconcile';
  return `# SDKWork RTC Server Package

Package: ${context.packageId}
Version: ${context.version}
Target: ${context.platform}/${context.architecture}

## Install layout

- \`bin/sdkwork-api-rtc-standalone-gateway\` — RTC app/backend HTTP API
- \`bin/sdkwork-rtc-reconcile\` — session reconciliation worker
- \`config/server.env.example\` — production environment template
- \`deployments/systemd/\` — optional systemd units

## Start API server

\`\`\`sh
export $(grep -v '^#' config/server.env.example | xargs)
${apiBinary}
\`\`\`

## Run reconciliation once

\`\`\`sh
${reconcileBinary}
\`\`\`

## Health checks

\`\`\`sh
curl http://127.0.0.1:18088/healthz
curl http://127.0.0.1:18088/readyz
\`\`\`

Production deployments must provide database credentials and provider secrets through a protected
environment file or secret manager. Never commit live secrets into \`config/\`.
`;
}

function createInstallManifest(context) {
  return {
    schemaVersion: 1,
    appId: APP_ID,
    packageId: context.packageId,
    profile: SERVER_PROFILE,
    deploymentProfile: context.deploymentProfile,
    platform: context.platform,
    architecture: context.architecture,
    format: context.format,
    version: context.version,
    binaries: SERVER_BINARIES.map((binaryName) => ({
      name: binaryName,
      path: `bin/${context.platform === 'windows' ? `${binaryName}.exe` : binaryName}`,
    })),
    configExamples: [
      'config/server.env.example',
      'config/rtc-runtime.env.example',
      'config/cloud.production.env',
    ],
    healthPath: '/healthz',
    readinessPath: '/readyz',
    reconcileBinary: 'bin/sdkwork-rtc-reconcile',
  };
}

async function writeChecksums(stageRoot) {
  const entries = [];
  for (const filePath of await listFiles(stageRoot)) {
    const relativePath = toPosixPath(path.relative(stageRoot, filePath));
    if (relativePath === 'checksums.sha256') {
      continue;
    }
    const digest = createHash('sha256').update(await readFile(filePath)).digest('hex');
    entries.push(`${digest}  ${relativePath}`);
  }
  await writeFile(path.join(stageRoot, 'checksums.sha256'), `${entries.sort().join('\n')}\n`, 'utf8');
}

async function listFiles(root) {
  const result = [];
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await listFiles(entryPath)));
    } else if (entry.isFile()) {
      result.push(entryPath);
    }
  }
  return result;
}

async function createArchive(context) {
  await mkdir(context.distRoot, { recursive: true });
  run('tar', ['-czf', context.archivePath, '-C', context.distRoot, context.stageName], {
    cwd: appRoot,
  });
}

async function validateArchive(context) {
  if (!existsSync(context.archivePath)) {
    throw new Error(`Missing server archive: ${context.archivePath}`);
  }
  const archiveStats = await stat(context.archivePath);
  if (archiveStats.size <= 0) {
    throw new Error(`Server archive is empty: ${context.archivePath}`);
  }

  const listing = run('tar', ['-tzf', context.archivePath], { cwd: appRoot, capture: true });
  const requiredEntries = [
  `${context.stageName}/bin/sdkwork-api-rtc-standalone-gateway`,
  `${context.stageName}/bin/sdkwork-rtc-reconcile`,
  `${context.stageName}/config/server.env.example`,
  `${context.stageName}/install-manifest.json`,
  `${context.stageName}/checksums.sha256`,
  `${context.stageName}/INSTALL.md`,
  ];
  if (context.platform === 'windows') {
    requiredEntries[0] = `${context.stageName}/bin/sdkwork-api-rtc-standalone-gateway.exe`;
    requiredEntries[1] = `${context.stageName}/bin/sdkwork-rtc-reconcile.exe`;
  }

  for (const entry of requiredEntries) {
    if (!listing.includes(entry)) {
      throw new Error(`Server archive missing ${entry}`);
    }
  }
  console.log(`[sdkwork-rtc] validated ${path.relative(appRoot, context.archivePath)}`);
}

function run(command, args, { cwd, capture = false, env } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: env ?? process.env,
    shell: false,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}${output ? `\n${output}` : ''}`,
    );
  }
  return capture ? String(result.stdout ?? '') : '';
}

async function assertPathInside(targetPath, parentPath) {
  const relativePath = path.relative(parentPath, targetPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to write outside ${parentPath}: ${targetPath}`);
  }
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

main().catch((error) => {
  console.error(`[sdkwork-rtc] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
