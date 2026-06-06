#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRtcSdkWorkspaceRoot } from './rtc-standard-file-helpers.mjs';

function fail(message) {
  throw new Error(message);
}

function readWorkspaceText(workspaceRoot, relativePath) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`Required Flutter RTC signaling file is missing: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf8');
}

export function verifyFlutterRtcSignalingBoundary(
  workspaceRoot = resolveRtcSdkWorkspaceRoot(import.meta.url),
) {
  const requiredFiles = [
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_adapter.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_codec.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_message.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_protocol.dart',
    'sdkwork-rtc-sdk-flutter/test/rtc_signaling_adapter_test.dart',
  ];
  const forbiddenFiles = [
    `sdkwork-rtc-sdk-flutter/lib/src/rtc_${'im'}_signaling.dart`,
    `sdkwork-rtc-sdk-flutter/lib/src/rtc_${'im'}_signaling_codec.dart`,
    `sdkwork-rtc-sdk-flutter/lib/src/rtc_${'im'}_signaling_message.dart`,
    `sdkwork-rtc-sdk-flutter/test/rtc_${'im'}_signaling_test.dart`,
  ];

  for (const relativePath of requiredFiles) {
    readWorkspaceText(workspaceRoot, relativePath);
  }

  for (const relativePath of forbiddenFiles) {
    const absolutePath = path.join(workspaceRoot, relativePath);
    if (existsSync(absolutePath)) {
      fail(`Retired Flutter legacy signaling file must not exist: ${relativePath}`);
    }
  }

  const rootBarrel = readWorkspaceText(
    workspaceRoot,
    'sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart',
  );
  if (!rootBarrel.includes("export 'src/rtc_signaling_adapter.dart';")) {
    fail('Flutter root barrel must export src/rtc_signaling_adapter.dart.');
  }
  if (!rootBarrel.includes("export 'src/rtc_signaling_protocol.dart';")) {
    fail('Flutter root barrel must export src/rtc_signaling_protocol.dart.');
  }
  if (rootBarrel.includes(`rtc_${'im'}_signaling`)) {
    fail('Flutter root barrel must not export retired legacy signaling files.');
  }

  const checkedFiles = [
    ...requiredFiles,
    'sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_call_controller.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_call_controller_message.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_call_controller_models.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_call_controller_subscription.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_standard_call_stack.dart',
    'sdkwork-rtc-sdk-flutter/lib/src/rtc_signaling_transport.dart',
  ];
  const forbiddenPatterns = [
    new RegExp(`package:${'im'}_sdk/${'im'}_sdk\\.dart`),
    new RegExp(`sdkwork-${'im'}-sdk`),
    new RegExp(`@sdkwork/${'im'}-sdk`),
    new RegExp(`\\b${'Im'}SdkClient\\b`),
    new RegExp(`\\b${'Im'}ConnectOptions\\b`),
    new RegExp(`\\b${'Im'}LiveConnection\\b`),
    new RegExp(`\\bRtc${'Im'}RealtimeDispatcher\\b`),
    new RegExp(`\\bCreate${'Im'}RtcSignalingAdapterOptions\\b`),
    new RegExp(`\\bcreate${'Im'}RtcSignalingAdapter\\b`),
  ];

  for (const relativePath of checkedFiles) {
    const content = readWorkspaceText(workspaceRoot, relativePath);
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        fail(`Flutter RTC signaling boundary still contains ${pattern}: ${relativePath}`);
      }
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  verifyFlutterRtcSignalingBoundary();
  console.log('[sdkwork-rtc-sdk] Flutter RTC signaling boundary verification passed.');
}
