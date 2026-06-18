import type { ProviderWizardResult } from "../components/ProviderConfigWizard";
import type { ProviderAccount } from "../types/providerAccount";
import type { ProviderApplication } from "../types/providerApplication";
import type { ProviderCredential } from "../types/providerCredential";
import type { ProviderProfile } from "../types/providerProfile";
import type { ProviderAccountService } from "./providerAccountService";
import type { ProviderApplicationService } from "./providerApplicationService";
import type { ProviderCredentialService } from "./providerCredentialService";
import type { ProviderProfileService } from "./providerProfileService";

export interface PersistProviderWizardServices {
  accounts: ProviderAccountService;
  applications: ProviderApplicationService;
  credentials: ProviderCredentialService;
  profiles: ProviderProfileService;
}

export interface PersistProviderWizardResult {
  account: ProviderAccount;
  application: ProviderApplication;
  credentials: ProviderCredential[];
  profile: ProviderProfile;
}

export async function persistProviderWizard(
  services: PersistProviderWizardServices,
  result: ProviderWizardResult,
): Promise<PersistProviderWizardResult> {
  const account = await services.accounts.create(result.account);
  const application = await services.applications.create(account.id, result.application);
  const credentials = await Promise.all(
    result.credentials.map((command) => services.credentials.create(application.id, command)),
  );
  const primaryCredential = credentials[0];
  const profile = await services.profiles.create({
    ...result.profile,
    providerAppId: application.providerApplicationId,
    credentialRef: primaryCredential?.credentialRef ?? result.profile.credentialRef,
  });
  return { account, application, credentials, profile };
}
