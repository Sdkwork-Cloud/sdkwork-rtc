#!/usr/bin/env node
import { readdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveGeneratorModulePath } from '../../bin/generator-runtime.mjs';

function fail(message) {
  console.error(`[sdkwork-rtc-sdk-typescript] ${message}`);
  process.exit(1);
}

function run(step, args, cwd = packageRoot) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    fail(`${step} failed to start: ${result.error.message}`);
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    fail(`${step} failed with exit code ${result.status}`);
  }
  if (result.signal) {
    fail(`${step} terminated with signal ${result.signal}`);
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(packageRoot, '..');
const tscPath = resolveGeneratorModulePath(workspaceRoot, 'typescript', 'bin', 'tsc');
const task = (process.argv[2] || '').trim();

function build() {
  rmSync(path.join(packageRoot, 'dist'), { recursive: true, force: true });
  run('typescript:build', [tscPath, '-p', 'tsconfig.build.json']);
}

function test() {
  build();
  const testDir = path.join(packageRoot, 'test');
  const testFiles = readdirSync(testDir)
    .filter((entry) => entry.endsWith('.test.mjs'))
    .sort();

  for (const testFile of testFiles) {
    run(`test:${testFile}`, [path.join(testDir, testFile)]);
  }
}

function smoke() {
  build();
  run('typescript:call-smoke', [path.join(scriptDir, 'sdk-call-smoke.mjs')]);
}

switch (task) {
  case 'clean':
    rmSync(path.join(packageRoot, 'dist'), { recursive: true, force: true });
    break;
  case 'build':
    build();
    break;
  case 'test':
    test();
    break;
  case 'smoke':
    smoke();
    break;
  default:
    fail('Unsupported task. Expected one of: clean, build, test, smoke.');
}
