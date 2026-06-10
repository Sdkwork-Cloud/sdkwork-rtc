import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resolveGeneratorRoot } from '../bin/generator-runtime.mjs';

test('generator runtime resolves sibling sdkwork-sdk-generator roots', () => {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'rtc-generator-runtime-'));
  try {
    const workspaceRoot = path.join(fixtureRoot, 'sdkwork-rtc', 'sdks', 'sdkwork-rtc-sdk');
    const generatorRoot = path.join(fixtureRoot, 'sdkwork-sdk-generator');
    mkdirSync(workspaceRoot, { recursive: true });
    mkdirSync(generatorRoot, { recursive: true });

    assert.equal(resolveGeneratorRoot(workspaceRoot), generatorRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
