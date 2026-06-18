import 'provider_account.dart';
import 'provider_application.dart';
import 'provider_credential.dart';
import 'provider_profile.dart';

class ProviderWizardResult {
  final ProviderAccountCommand account;
  final ProviderApplicationCommand application;
  final List<ProviderCredentialCommand> credentials;
  final ProviderProfileCommand profile;

  ProviderWizardResult({
    required this.account,
    required this.application,
    required this.credentials,
    required this.profile,
  });
}

class PersistProviderWizardResult {
  final ProviderAccount account;
  final ProviderApplication application;
  final List<ProviderCredential> credentials;
  final ProviderProfile profile;

  PersistProviderWizardResult({
    required this.account,
    required this.application,
    required this.credentials,
    required this.profile,
  });
}
