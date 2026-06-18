import '../models/provider_credential.dart';
import '../models/provider_profile.dart';
import '../models/provider_wizard_result.dart';
import 'provider_account_service.dart';
import 'provider_application_service.dart';
import 'provider_credential_service.dart';
import 'provider_profile_service.dart';

typedef PersistProviderWizardServices = ({
  ProviderAccountService accounts,
  ProviderApplicationService applications,
  ProviderCredentialService credentials,
  ProviderProfileService profiles,
});

Future<PersistProviderWizardResult> persistProviderWizard(
  PersistProviderWizardServices services,
  ProviderWizardResult result,
) async {
  final account = await services.accounts.create(result.account);
  if (account == null) {
    throw StateError('Failed to create provider account');
  }

  final application = await services.applications.create(account.id, result.application);
  if (application == null) {
    throw StateError('Failed to create provider application');
  }

  final credentials = <ProviderCredential>[];
  for (final command in result.credentials) {
    final credential = await services.credentials.create(application.id, command);
    if (credential != null) {
      credentials.add(credential);
    }
  }

  final primaryCredential = credentials.isNotEmpty ? credentials.first : null;
  final profile = await services.profiles.create(
    ProviderProfileCommand(
      provider: result.profile.provider,
      code: result.profile.code,
      name: result.profile.name,
      status: result.profile.status,
      isDefault: result.profile.isDefault,
      priority: result.profile.priority,
      environment: result.profile.environment,
      region: result.profile.region,
      providerAppId: application.providerApplicationId,
      endpoint: result.profile.endpoint,
      credentialRef: primaryCredential?.credentialRef ?? result.profile.credentialRef,
      webhookSecretRef: result.profile.webhookSecretRef,
      capabilities: result.profile.capabilities,
      configSnapshot: result.profile.configSnapshot,
    ),
  );
  if (profile == null) {
    throw StateError('Failed to create provider profile');
  }

  return PersistProviderWizardResult(
    account: account,
    application: application,
    credentials: credentials,
    profile: profile,
  );
}
