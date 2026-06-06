import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function readUtf8File(filePath) {
  return readFileSync(filePath, 'utf8');
}

export function writeUtf8File(filePath, content) {
  writeFileSync(filePath, content, 'utf8');
}

export function readJsonFile(filePath) {
  return JSON.parse(readUtf8File(filePath));
}

export function writePrettyJsonFile(filePath, value) {
  writeUtf8File(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function resolveRtcSdkWorkspaceRoot(importMetaUrl) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), '..');
}

export function resolveRtcSdkSdksRootFromWorkspaceRoot(workspaceRoot) {
  return path.resolve(workspaceRoot, '..');
}

export function resolveRtcSdkSdksRoot(importMetaUrl) {
  return resolveRtcSdkSdksRootFromWorkspaceRoot(resolveRtcSdkWorkspaceRoot(importMetaUrl));
}

export function resolveRtcSdkAppRootFromWorkspaceRoot(workspaceRoot) {
  return path.resolve(workspaceRoot, '..', '..');
}

export function resolveRtcSdkAppRoot(importMetaUrl) {
  return resolveRtcSdkAppRootFromWorkspaceRoot(resolveRtcSdkWorkspaceRoot(importMetaUrl));
}

export function resolveRtcSdkSdksReadmePathFromWorkspaceRoot(workspaceRoot) {
  return path.join(resolveRtcSdkSdksRootFromWorkspaceRoot(workspaceRoot), 'README.md');
}

export function resolveRtcSdkSdksReadmePath(importMetaUrl) {
  return resolveRtcSdkSdksReadmePathFromWorkspaceRoot(resolveRtcSdkWorkspaceRoot(importMetaUrl));
}
