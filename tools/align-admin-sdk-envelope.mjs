#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = [
  "apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-admin-core/src/services",
  "apps/sdkwork-rtc-h5/packages/sdkwork-rtc-h5-admin-core/src/services",
];

for (const root of roots) {
  const servicesDir = path.join(workspaceRoot, root);
  for (const file of readdirSync(servicesDir).filter((entry) => entry.endsWith(".ts"))) {
    const filePath = path.join(servicesDir, file);
    let source = readFileSync(filePath, "utf8");

    if (!source.includes("readSdkWorkItem")) {
      source = source.replace(
        'import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";',
        'import { readSdkWorkItem, readSdkWorkListPage } from "../sdk/index.js";\nimport { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";',
      );
    }

    source = source.replace(
      /return \{\s*items: \(response\.data\?\.items \?\? \[\]\) as ([^,\n]+),\s*nextCursor: \(response\.data\?\.nextCursor as string \| null \| undefined\) \?\? null,\s*\};/g,
      "const page = readSdkWorkListPage<$1>(response.data);\n    return {\n      items: page.items,\n      nextCursor: page.nextCursor ?? null,\n    };",
    );

    source = source.replace(
      /return \{\s*items: \(response\.data\?\.items \?\? \[\]\) as ([^,\n]+),\s*nextCursor: \(response\.data\?\.nextCursor as string \| undefined\) \?\? undefined,\s*\};/g,
      "const page = readSdkWorkListPage<$1>(response.data);\n    return {\n      items: page.items,\n      nextCursor: page.nextCursor,\n    };",
    );

    source = source.replace(
      /return response\.data as ([^;\n]+);/g,
      "return readSdkWorkItem<$1>(response.data);",
    );

    writeFileSync(filePath, source);
    console.log(`updated ${path.relative(workspaceRoot, filePath)}`);
  }
}
