#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  API_GATEWAY_REPO,
  DEFAULT_DEV_PROFILE_ID,
  listHealthSurfaces,
  listOrchestrationProcesses,
  loadProfile,
  mergeRuntimeEnv,
  REPO_ROOT,
  resolveCloudGatewayConfigPath,
  resolveDevProfileId,
  resolveGatewayBind,
  resolveIamDevEnv,
  resolveSurfaceHttpUrl,
  shouldAutostartGateway,
  waitForHttpHealthy,
  IAM_APPLICATION_BOOTSTRAP_ENV,
} from './lib/rtc-topology.mjs';
import { mergeRepoDevBootstrapAccessTokenEnv } from '../../sdkwork-iam/scripts/dev/create-dev-bootstrap-access-token-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HEALTH_TIMEOUT_MS = 2000;
const STARTUP_WAIT_MS = 500;
const MAX_STARTUP_ATTEMPTS = 60;

function cargoCommand() {
  return process.platform === 'win32' ? 'cargo.exe' : 'cargo';
}

function pnpmCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function flutterCommand() {
  return process.platform === 'win32' ? 'flutter.bat' : 'flutter';
}

function toTopologyHosting(deploymentProfile) {
  const normalized = String(deploymentProfile ?? '').trim().toLowerCase();
  if (normalized === 'standalone' || normalized === 'self-hosted') {
    return 'self-hosted';
  }
  if (normalized === 'cloud' || normalized === 'cloud-hosted') {
    return 'cloud-hosted';
  }
  throw new Error(
    `deployment-profile must be standalone or cloud, received: ${deploymentProfile}`,
  );
}

function parseArgs(argv) {
  const settings = {
    deploymentProfile: 'standalone',
    serviceLayout: 'split-services',
    target: 'pc',
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      settings.help = true;
      continue;
    }
    if (arg === '--deployment-profile') {
      settings.deploymentProfile = argv[index + 1] ?? settings.deploymentProfile;
      index += 1;
      continue;
    }
    if (arg === '--hosting') {
      throw new Error(
        '--hosting is retired; use --deployment-profile standalone|cloud',
      );
    }
    if (arg === '--service-layout') {
      settings.serviceLayout = argv[index + 1] ?? settings.serviceLayout;
      index += 1;
      continue;
    }
    if (arg === '--target') {
      settings.target = argv[index + 1] ?? settings.target;
      index += 1;
      continue;
    }
    if (arg === '--topology') {
      throw new Error(
        '--topology is retired; use --deployment-profile standalone|cloud',
      );
    }
    if (arg === '--dry-run') {
      settings.dryRun = true;
    }
  }

  settings.hosting = toTopologyHosting(settings.deploymentProfile);
  return settings;
}

function printHelp() {
  console.log(`Usage: node scripts/rtc-dev.mjs [options]

Topology-aware RTC dev entry. Loads configs/topology profile env via @sdkwork/app-topology.

Options:
  --deployment-profile <standalone|cloud>             Default: standalone
  --service-layout <unified-process|split-services>   Default: split-services
  --target <pc|h5|flutter|server>                     Default: pc
  --dry-run                                           Print plan without executing
  --help, -h
`);
}

function healthPathForSurface(surfaceId) {
  if (surfaceId === 'application.public-ingress') {
    return '/health';
  }
  return '/healthz';
}

function createPlatformGatewayProcess(env) {
  const hosting = env.SDKWORK_RTC_HOSTING ?? 'self-hosted';
  const bind = resolveGatewayBind(env, hosting);
  const gatewayConfig = resolveCloudGatewayConfigPath(env, 'development');
  return {
    label: 'sdkwork-api-cloud-gateway',
    command: cargoCommand(),
    args: [
      'run',
      '-p',
      'sdkwork-api-cloud-gateway-api-server',
      '--bin',
      'sdkwork-api-cloud-gateway',
      '--',
      '--config',
      gatewayConfig,
    ],
    cwd: API_GATEWAY_REPO,
    env: {
      ...env,
      SDKWORK_API_CLOUD_GATEWAY_BIND: bind,
      SDKWORK_API_CLOUD_GATEWAY_CONFIG: gatewayConfig,
    },
  };
}

function createRtcApiServerProcess(env) {
  return {
    label: 'sdkwork-rtc-api-server',
    command: cargoCommand(),
    args: ['run', '-p', 'sdkwork-rtc-api-server'],
    cwd: REPO_ROOT,
    env,
  };
}

function buildDartDefineArgs(env) {
  const keys = [
    'SDKWORK_RTC_APPLICATION_PUBLIC_HTTP_URL',
    'SDKWORK_RTC_APP_API_BASE_URL',
    'SDKWORK_RTC_BACKEND_API_BASE_URL',
    'SDKWORK_RTC_PLATFORM_API_GATEWAY_HTTP_URL',
  ];
  const args = [];
  for (const key of keys) {
    const value = env[key];
    if (value) {
      args.push('--dart-define', `${key}=${value}`);
    }
  }
  return args;
}

function createClientProcess(target, env) {
  if (target === 'server') {
    return undefined;
  }
  if (target === 'h5') {
    return {
      label: 'sdkwork-rtc-h5',
      command: pnpmCommand(),
      args: ['--dir', 'apps/sdkwork-rtc-h5', 'dev'],
      cwd: REPO_ROOT,
      env,
    };
  }
  if (target === 'flutter') {
    return {
      label: 'sdkwork-rtc-flutter-mobile',
      command: flutterCommand(),
      args: ['run', ...buildDartDefineArgs(env)],
      cwd: path.join(REPO_ROOT, 'apps/sdkwork-rtc-flutter-mobile'),
      env,
    };
  }
  return {
    label: 'sdkwork-rtc-pc',
    command: pnpmCommand(),
    args: ['--dir', 'apps/sdkwork-rtc-pc', 'dev'],
    cwd: REPO_ROOT,
    env,
  };
}

function buildServerProcesses(profileId, env) {
  const processes = [];

  for (const processDef of listOrchestrationProcesses(profileId)) {
    if (processDef.id === 'pc-renderer') {
      continue;
    }
    if (processDef.id === 'platform.api-gateway') {
      if (!shouldAutostartGateway(env)) {
        continue;
      }
      processes.push(createPlatformGatewayProcess(env));
      continue;
    }
    if (processDef.id === 'application.public-ingress') {
      processes.push(createRtcApiServerProcess(env));
    }
  }

  return processes;
}

async function waitForSurfaceHealth(profileId, env) {
  const surfaces = listHealthSurfaces(profileId);
  for (const surfaceId of surfaces) {
    const url = resolveSurfaceHttpUrl(env, surfaceId);
    if (!url) {
      continue;
    }
    const healthPath = healthPathForSurface(surfaceId);
    const healthUrl = `${url.replace(/\/+$/u, '')}${healthPath}`;
    let ready = false;
    for (let attempt = 0; attempt < MAX_STARTUP_ATTEMPTS; attempt += 1) {
      ready = await waitForHttpHealthy(healthUrl, HEALTH_TIMEOUT_MS);
      if (ready) {
        console.log(`[sdkwork-rtc] healthy ${surfaceId} (${healthUrl})`);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, STARTUP_WAIT_MS));
    }
    if (!ready) {
      throw new Error(`timed out waiting for ${surfaceId} health at ${healthUrl}`);
    }
  }
}

function terminateProcessTree(child) {
  if (!child?.pid) {
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }
  child.kill();
}

async function main() {
  const settings = parseArgs(process.argv.slice(2));
  if (settings.help) {
    printHelp();
    process.exit(0);
  }

  const profileId =
    resolveDevProfileId(settings.hosting, settings.serviceLayout) || DEFAULT_DEV_PROFILE_ID;
  const profileEnv = loadProfile(profileId);
  const runtimeEnv = mergeRepoDevBootstrapAccessTokenEnv({
    repoRoot: REPO_ROOT,
    manifestPath: 'apps/sdkwork-rtc-pc/sdkwork.app.config.json',
    appId: 'sdkwork-rtc-pc',
    env: mergeRuntimeEnv(process.env, profileEnv, resolveIamDevEnv(process.env), IAM_APPLICATION_BOOTSTRAP_ENV, {
      SDKWORK_RTC_PROFILE_ID: profileId,
      SDKWORK_RTC_DEV_MODE: '1',
    }),
  });

  const processes = buildServerProcesses(profileId, runtimeEnv);
  const clientProcess = createClientProcess(settings.target, runtimeEnv);
  if (clientProcess) {
    processes.push(clientProcess);
  }

  if (settings.dryRun) {
    console.log(`[sdkwork-rtc] profile=${profileId}`);
    for (const entry of processes) {
      console.log(`[${entry.label}] ${entry.command} ${entry.args.join(' ')}`);
    }
    process.exit(0);
  }

  const children = [];
  let shuttingDown = false;

  function shutdown(exceptChild) {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    for (const child of children) {
      if (child !== exceptChild && child.exitCode == null && child.signalCode == null) {
        terminateProcessTree(child);
      }
    }
  }

  function attachProcessLifecycle(entry, child) {
    child.on('error', (error) => {
      process.stderr.write(
        `[${entry.label}] ${error instanceof Error ? error.message : String(error)}\n`,
      );
      shutdown(child);
      process.exitCode = 1;
    });
    child.on('exit', (code, signal) => {
      if (shuttingDown) {
        return;
      }
      if (code !== 0 && code != null) {
        process.stderr.write(`[${entry.label}] exited with code ${code}\n`);
        shutdown(child);
        process.exitCode = code;
        return;
      }
      if (signal) {
        process.stderr.write(`[${entry.label}] terminated by signal ${signal}\n`);
        shutdown(child);
        process.exitCode = 1;
      }
    });
  }

  for (const entry of processes) {
    const child = spawn(entry.command, entry.args, {
      cwd: entry.cwd ?? REPO_ROOT,
      env: entry.env,
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
    });
    children.push(child);
    attachProcessLifecycle(entry, child);
  }

  process.on('SIGINT', () => shutdown());
  process.on('SIGTERM', () => shutdown());

  await waitForSurfaceHealth(profileId, runtimeEnv);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
