#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixes = [
  ["readSdkWorkListPage<>(response.data)", "readSdkWorkListPage<ProviderAccount>(response.data)"],
  ["readSdkWorkListPage<ProviderApplication[]>", "readSdkWorkListPage<ProviderApplication>"],
  ["readSdkWorkListPage<ProviderCredential[]>", "readSdkWorkListPage<ProviderCredential>"],
  ["readSdkWorkListPage<ProviderProfile[]>", "readSdkWorkListPage<ProviderProfile>"],
  ["readSdkWorkListPage<ProviderQuerySnapshot[]>", "readSdkWorkListPage<ProviderQuerySnapshot>"],
  ["readSdkWorkListPage<ProviderRoute[]>", "readSdkWorkListPage<ProviderRoute>"],
  ["readSdkWorkListPage<ProviderWebhookEvent[]>", "readSdkWorkListPage<ProviderWebhookEvent>"],
  ["readSdkWorkListPage<Room[]>", "readSdkWorkListPage<Room>"],
];

const roots = [
  "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-admin-core/src/services",
  "apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-admin-core/src/services",
];

for (const root of roots) {
  const servicesDir = path.join(workspaceRoot, root);
  for (const file of readdirSync(servicesDir).filter((entry) => entry.endsWith(".ts"))) {
    const filePath = path.join(servicesDir, file);
    let source = readFileSync(filePath, "utf8");
    let changed = false;

    if (source.includes("readSdkWorkListPage<>")) {
      const typeByFile = {
        "providerAccountService.ts": "ProviderAccount",
        "providerApplicationService.ts": "ProviderApplication",
        "providerCredentialService.ts": "ProviderCredential",
        "providerProfileService.ts": "ProviderProfile",
        "providerQueryJobService.ts": "ProviderQuerySnapshot",
        "providerRouteService.ts": "ProviderRoute",
        "providerWebhookService.ts": "ProviderWebhookEvent",
        "roomService.ts": "Room",
      }[file];
      if (typeByFile) {
        source = source.replace(
          "readSdkWorkListPage<>(response.data)",
          `readSdkWorkListPage<${typeByFile}>(response.data)`,
        );
        changed = true;
      }
    }

    for (const [from, to] of fixes) {
      if (source.includes(from)) {
        source = source.replaceAll(from, to);
        changed = true;
      }
    }

    if (changed) {
      writeFileSync(filePath, source);
      console.log(`fixed ${path.relative(workspaceRoot, filePath)}`);
    }
  }
}
