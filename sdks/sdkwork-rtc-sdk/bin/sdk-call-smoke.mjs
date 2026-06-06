#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  assertRtcAssemblyWorkspaceBaseline,
  getRtcDefaultCallSmokeLanguage,
  getRtcExecutableLanguageEntries,
} from './rtc-standard-assembly-baseline.mjs';
import { readJsonFile } from './rtc-standard-file-helpers.mjs';
import { renderRtcCallSmokeForwardedVariantHelp } from './rtc-call-smoke-standard.mjs';

function fail(message) {
  const error = new Error(message);
  error.code = 'sdk_call_smoke_dispatch_error';
  throw error;
}

function writeLine(writer, line = '') {
  writer.write(`${line}\n`);
}

export function parseSdkCallSmokeArgs(argv) {
  const parsed = {
    language: null,
    help: false,
    forwardArgs: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index]);
    if (token === '--language') {
      const value = String(argv[index + 1] ?? '').trim().toLowerCase();
      if (!value) {
        fail('Missing value for --language.');
      }
      parsed.language = value;
      index += 1;
      continue;
    }
    if (token === '--help' || token === '-h') {
      parsed.help = true;
      continue;
    }
    parsed.forwardArgs.push(token);
  }

  return parsed;
}

export function resolveRtcCallSmokeRuntimeContract(workspaceRoot) {
  const assemblyPath = path.join(workspaceRoot, '.sdkwork-assembly.json');
  if (!existsSync(assemblyPath)) {
    fail(`Missing RTC assembly descriptor: ${assemblyPath}`);
  }

  const assembly = readJsonFile(assemblyPath);
  assertRtcAssemblyWorkspaceBaseline(assembly);

  const officialLanguages = Array.isArray(assembly.officialLanguages) ? assembly.officialLanguages : [];
  const executableLanguageEntries = getRtcExecutableLanguageEntries(assembly);
  if (executableLanguageEntries.length === 0) {
    fail('Assembly does not declare any executable RTC language workspaces.');
  }

  return {
    assemblyPath,
    officialLanguages,
    executableLanguageEntries,
    executableLanguages: executableLanguageEntries.map((languageEntry) => languageEntry.language),
    defaultLanguage: getRtcDefaultCallSmokeLanguage(assembly),
  };
}

export function resolveSdkCallSmokeTarget({ workspaceRoot, language, runtimeContract }) {
  const contract = runtimeContract ?? resolveRtcCallSmokeRuntimeContract(workspaceRoot);
  const resolvedLanguage = String(language ?? contract.defaultLanguage ?? '')
    .trim()
    .toLowerCase();

  if (!resolvedLanguage) {
    fail('No sdk-call-smoke language could be resolved from CLI arguments or assembly metadata.');
  }

  if (!contract.officialLanguages.includes(resolvedLanguage)) {
    fail(
      `Unsupported language: ${resolvedLanguage}. Official languages: ${contract.officialLanguages.join(', ')}`,
    );
  }

  const languageEntry = contract.executableLanguageEntries.find(
    (entry) => entry.language === resolvedLanguage,
  );
  if (!languageEntry) {
    fail(
      `sdk-call-smoke for language "${resolvedLanguage}" is not implemented yet. Current executable languages: ${contract.executableLanguages.join(', ')}`,
    );
  }

  const relativeWorkspace = String(languageEntry.workspace ?? '').trim();
  if (!relativeWorkspace) {
    fail(`Executable language ${resolvedLanguage} is missing workspace metadata in assembly.`);
  }

  const workspacePath = path.join(workspaceRoot, relativeWorkspace);
  const scriptPath = path.join(workspacePath, 'bin', 'sdk-call-smoke.mjs');
  if (!existsSync(scriptPath)) {
    fail(`Missing sdk-call-smoke entrypoint for ${resolvedLanguage}: ${scriptPath}`);
  }

  return {
    language: resolvedLanguage,
    workspacePath,
    command: process.execPath,
    args: [scriptPath],
    runtimeBaseline: languageEntry.runtimeBaseline,
  };
}

export function getSdkCallSmokeHelpText(runtimeContract) {
  const forwardedVariantHelp = renderRtcCallSmokeForwardedVariantHelp(
    runtimeContract.executableLanguageEntries,
  );

  return [
    'SDKWork RTC SDK call smoke dispatcher',
    '',
    'Usage:',
    '  node ./bin/sdk-call-smoke.mjs [--language <language>] <language-cli-args>',
    '',
    'Behavior:',
    `  --language defaults to assembly default executable language: ${runtimeContract.defaultLanguage}`,
    '  assembly chooses the first runtime-backed executable language, falling back to the first executable language',
    '  remaining arguments are forwarded to the target language call-smoke CLI unchanged',
    ...(forwardedVariantHelp ? [forwardedVariantHelp] : []),
    '',
    `Official languages: ${runtimeContract.officialLanguages.join(', ')}`,
    `Executable today: ${runtimeContract.executableLanguages.join(', ')}`,
  ].join('\n');
}

async function defaultRun(command, args, options) {
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: options.stdio ?? 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`sdk-call-smoke child terminated with signal ${signal}.`));
        return;
      }
      resolve(code ?? 0);
    });
  });

  if (exitCode !== 0) {
    throw new Error(`sdk-call-smoke child exited with code ${exitCode}.`);
  }

  return {
    exitCode,
  };
}

export async function runSdkCallSmokeDispatcher(
  argv = process.argv.slice(2),
  deps = {},
) {
  const stdout = deps.stdout ?? process.stdout;
  const workspaceRoot =
    deps.workspaceRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const parsed = Array.isArray(argv) ? parseSdkCallSmokeArgs(argv) : argv;
  const runtimeContract = deps.runtimeContract ?? resolveRtcCallSmokeRuntimeContract(workspaceRoot);

  if (parsed.help) {
    writeLine(stdout, getSdkCallSmokeHelpText(runtimeContract));
    return {
      help: true,
      exitCode: 0,
    };
  }

  const target = resolveSdkCallSmokeTarget({
    workspaceRoot,
    language: parsed.language,
    runtimeContract,
  });
  const run = deps.run ?? defaultRun;

  return run(
    target.command,
    [...target.args, ...parsed.forwardArgs],
    {
      cwd: target.workspacePath,
      stdio: deps.stdio ?? 'inherit',
    },
  );
}

const directInvocationPath = process.argv[1] ? fileURLToPath(import.meta.url) : null;

if (directInvocationPath && path.resolve(process.argv[1]) === directInvocationPath) {
  runSdkCallSmokeDispatcher().catch((error) => {
    console.error(`[sdkwork-rtc-sdk] ${error.message}`);
    process.exit(1);
  });
}
