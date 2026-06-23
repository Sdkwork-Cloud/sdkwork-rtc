import type { RtcProviderPackageCatalogEntry } from "@sdkwork/rtc-sdk";

type RtcProviderPackageModule = Record<string, unknown>;

const PROVIDER_PACKAGE_IMPORTERS: Record<
  string,
  () => Promise<RtcProviderPackageModule>
> = {
  volcengine: () => import("@sdkwork/rtc-sdk-provider-volcengine"),
  agora: () => import("@sdkwork/rtc-sdk-provider-agora"),
  tencent: () => import("@sdkwork/rtc-sdk-provider-tencent"),
  aliyun: () => import("@sdkwork/rtc-sdk-provider-aliyun"),
  livekit: () => import("@sdkwork/rtc-sdk-provider-livekit"),
};

export async function importRtcProviderPackageModule(
  packageEntry: RtcProviderPackageCatalogEntry,
): Promise<RtcProviderPackageModule> {
  const importer = PROVIDER_PACKAGE_IMPORTERS[packageEntry.providerKey];
  if (!importer) {
    throw new Error(
      `RTC provider package '${packageEntry.providerKey}' is not bundled in this application build.`,
    );
  }
  return importer();
}

export function normalizeRtcProviderKey(providerKey: string | undefined): string {
  const normalized = providerKey?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : "volcengine";
}
