import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("sdkwork-rtc mini program runtime bundle exports RTC helpers", () => {
  const bundlePath = path.join(root, "src/runtime/rtc-app.js");
  assert.equal(existsSync(bundlePath), true, "src/runtime/rtc-app.js must exist after build");
  const source = readFileSync(bundlePath, "utf8");
  assert.match(source, /bootstrapRtcMiniProgram/u);
  assert.match(source, /sdkwork-rtc-mini-program:session:v1/u);
  assert.match(source, /listMediaSessions/u);
  assert.match(source, /createMediaSession/u);
  assert.match(source, /getMediaSession/u);
  assert.match(source, /issueJoinCredential/u);
  assert.match(source, /joinMediaSession/u);
  assert.match(source, /leaveMediaSession/u);
});
