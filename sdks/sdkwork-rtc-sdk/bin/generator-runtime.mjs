import { existsSync } from 'node:fs';
import path from 'node:path';

function resolveWorkspaceProbe(workspaceRoot, probeSegments, errorMessage) {
  let current = path.resolve(workspaceRoot);

  while (true) {
    const candidate = path.join(current, ...probeSegments);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error(errorMessage(workspaceRoot));
}

export function resolveGeneratorRoot(workspaceRoot) {
  if (process.env.SDKWORK_GENERATOR_ROOT) {
    const explicitRoot = path.resolve(process.env.SDKWORK_GENERATOR_ROOT);
    if (existsSync(explicitRoot)) {
      return explicitRoot;
    }
  }

  return resolveWorkspaceProbe(
    workspaceRoot,
    ['sdk', 'sdkwork-sdk-generator'],
    (root) =>
      `Unable to locate sdkwork-sdk-generator from workspace root ${root}. ` +
      'Set SDKWORK_GENERATOR_ROOT to an explicit path.',
  );
}

export function resolveGeneratorModulePath(workspaceRoot, ...segments) {
  const generatorRoot = resolveGeneratorRoot(workspaceRoot);
  const workspacePackageRoot = resolveWorkspacePackageRoot(process.cwd());
  const pathNodeModulesRoots = resolveNodeModulesRootsFromPath();
  const candidates = [
    path.join(generatorRoot, 'node_modules', ...segments),
    path.join(generatorRoot, 'node_modules', '.pnpm', 'node_modules', ...segments),
    path.join(workspacePackageRoot, 'node_modules', ...segments),
    path.join(workspacePackageRoot, 'node_modules', '.pnpm', 'node_modules', ...segments),
    ...pathNodeModulesRoots.flatMap((nodeModulesRoot) => [
      path.join(nodeModulesRoot, ...segments),
      path.join(nodeModulesRoot, '.pnpm', 'node_modules', ...segments),
    ]),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to locate generator module ${segments.join('/')} from ${generatorRoot}. ` +
    `Tried: ${candidates.join(', ')}`,
  );
}

function resolveWorkspacePackageRoot(startDirectory) {
  let current = path.resolve(startDirectory);

  while (true) {
    if (existsSync(path.join(current, 'pnpm-workspace.yaml')) || existsSync(path.join(current, 'pnpm-lock.yaml'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDirectory);
    }
    current = parent;
  }
}

function resolveNodeModulesRootsFromPath() {
  const roots = [];

  for (const pathEntry of (process.env.PATH || '').split(path.delimiter)) {
    const normalizedPathEntry = pathEntry.replace(/^"+|"+$/g, '').trim();
    if (!normalizedPathEntry) {
      continue;
    }

    const binPath = path.resolve(normalizedPathEntry);
    if (path.basename(binPath).toLowerCase() !== '.bin') {
      continue;
    }

    const nodeModulesRoot = path.dirname(binPath);
    if (path.basename(nodeModulesRoot).toLowerCase() !== 'node_modules') {
      continue;
    }

    if (!roots.includes(nodeModulesRoot)) {
      roots.push(nodeModulesRoot);
    }
  }

  return roots;
}
