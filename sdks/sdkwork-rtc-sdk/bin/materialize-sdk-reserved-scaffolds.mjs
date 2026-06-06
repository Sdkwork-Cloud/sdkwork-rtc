import {
  buildLanguageProviderActivationCatalogEntries,
  buildProviderPackageManifestPath,
  buildProviderPackageReadmePath,
  buildProviderPackageSourcePath,
  buildProviderPackageSourceRelativePath,
  buildProviderPackageSourceRoot,
  buildProviderPackageSourceSymbol,
  buildReservedProviderPackageCatalogEntries,
  materializeProviderPackagePattern,
  toPascalCase,
} from './rtc-standard-shared-helpers.mjs';
import {
  RTC_PROVIDER_ACTIVATION_STATUSES as PROVIDER_ACTIVATION_STATUSES,
  RTC_PROVIDER_SELECTION_SOURCES as PROVIDER_SELECTION_SOURCES,
  RTC_PROVIDER_SUPPORT_STATUSES as PROVIDER_SUPPORT_STATUSES,
} from './rtc-standard-contract-constants.mjs';
function q(value) {
  return JSON.stringify(String(value));
}

function lines(value) {
  return `${value.trim()}\n`;
}

function renderTemplateTokenList(tokens) {
  return (tokens ?? []).map((token) => `\`${token}\``).join(', ');
}

export function resolveFlutterRuntimeBaselineDependencyLines(packageName) {
  switch (packageName) {
    case 'rtc_sdk':
      return [];
    case 'volc_engine_rtc':
      return ['  volc_engine_rtc: ^3.60.3'];
    default:
      throw new Error(
        `Unsupported Flutter runtime baseline dependency. Extend the reserved scaffold renderer for ${packageName}.`,
      );
  }
}

function renderFlutterRuntimeBaselineDependencies(languageEntry) {
  if (!languageEntry.runtimeBaseline) {
    throw new Error('Flutter language workspace must declare runtimeBaseline metadata');
  }

  return [
    '  flutter:',
    '    sdk: flutter',
    ...resolveFlutterRuntimeBaselineDependencyLines(languageEntry.runtimeBaseline.vendorSdkPackage),
  ].join('\n');
}

function renderReservedLanguageProviderCatalogLookupHelper(language) {
  switch (language) {
    case 'flutter':
      return lines(`
RtcProviderCatalogEntry? getRtcProviderByProviderKey(String providerKey) {
  for (final entry in RtcProviderCatalog.entries) {
    if (entry.providerKey == providerKey) {
      return entry;
    }
  }

  return null;
}
`);
    case 'rust':
      return lines(`
pub fn get_rtc_provider_by_provider_key(
    provider_key: &str,
) -> Option<&'static RtcProviderCatalogEntry> {
    OFFICIAL_RTC_PROVIDERS
        .iter()
        .find(|entry| entry.providerKey == provider_key)
}
`);
    case 'java':
      return lines(`
  public static Optional<Entry> getRtcProviderByProviderKey(String providerKey) {
    for (var entry : ENTRIES) {
      if (entry.providerKey().equals(providerKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }
`);
    case 'csharp':
      return lines(`
    public static RtcProviderCatalogEntry? GetRtcProviderByProviderKey(string providerKey) =>
        Entries.FirstOrDefault(entry => entry.providerKey == providerKey);
`);
    case 'swift':
      return lines(`
    public static func getRtcProviderByProviderKey(_ providerKey: String) -> RtcProviderCatalogEntry? {
        entries.first { $0.providerKey == providerKey }
    }
`);
    case 'kotlin':
      return lines(`
    fun getRtcProviderByProviderKey(providerKey: String): RtcProviderCatalogEntry? =
        entries.firstOrNull { it.providerKey == providerKey }
`);
    case 'go':
      return lines(`
func GetRtcProviderByProviderKey(providerKey string) *RtcProviderCatalogEntry {
    for index := range OFFICIAL_RTC_PROVIDERS {
        if OFFICIAL_RTC_PROVIDERS[index].ProviderKey == providerKey {
            return &OFFICIAL_RTC_PROVIDERS[index]
        }
    }

    return nil
}
`);
    case 'python':
      return lines(`
def get_rtc_provider_by_provider_key(provider_key: str) -> Optional[RtcProviderCatalogEntry]:
    for entry in RtcProviderCatalog.entries:
        if entry.providerKey == provider_key:
            return entry

    return None
`);
    default:
      return '';
  }
}

function renderReservedLanguageProviderPackageLookupHelper(language) {
  switch (language) {
    case 'flutter':
      return lines(`
RtcProviderPackageCatalogEntry? getRtcProviderPackageByProviderKey(String providerKey) {
  for (final entry in RtcProviderPackageCatalog.entries) {
    if (entry.providerKey == providerKey) {
      return entry;
    }
  }

  return null;
}

RtcProviderPackageCatalogEntry? getRtcProviderPackageByPackageIdentity(String packageIdentity) {
  for (final entry in RtcProviderPackageCatalog.entries) {
    if (entry.packageIdentity == packageIdentity) {
      return entry;
    }
  }

  return null;
}
`);
    case 'rust':
      return lines(`
pub fn get_rtc_provider_package_by_provider_key(
    provider_key: &str,
) -> Option<&'static RtcProviderPackageCatalogEntry> {
    OFFICIAL_RTC_PROVIDER_PACKAGES
        .iter()
        .find(|entry| entry.providerKey == provider_key)
}

pub fn get_rtc_provider_package_by_package_identity(
    package_identity: &str,
) -> Option<&'static RtcProviderPackageCatalogEntry> {
    OFFICIAL_RTC_PROVIDER_PACKAGES
        .iter()
        .find(|entry| entry.packageIdentity == package_identity)
}
`);
    case 'java':
      return lines(`
  public static Optional<RtcProviderPackageCatalogEntry> getRtcProviderPackageByProviderKey(String providerKey) {
    for (var entry : ENTRIES) {
      if (entry.providerKey().equals(providerKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }

  public static Optional<RtcProviderPackageCatalogEntry> getRtcProviderPackageByPackageIdentity(String packageIdentity) {
    for (var entry : ENTRIES) {
      if (entry.packageIdentity().equals(packageIdentity)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }
`);
    case 'csharp':
      return lines(`
    public static RtcProviderPackageCatalogEntry? GetRtcProviderPackageByProviderKey(string providerKey) =>
        Entries.FirstOrDefault(entry => entry.providerKey == providerKey);

    public static RtcProviderPackageCatalogEntry? GetRtcProviderPackageByPackageIdentity(string packageIdentity) =>
        Entries.FirstOrDefault(entry => entry.packageIdentity == packageIdentity);
`);
    case 'swift':
      return lines(`
    public static func getRtcProviderPackageByProviderKey(_ providerKey: String) -> RtcProviderPackageCatalogEntry? {
        entries.first { $0.providerKey == providerKey }
    }

    public static func getRtcProviderPackageByPackageIdentity(_ packageIdentity: String) -> RtcProviderPackageCatalogEntry? {
        entries.first { $0.packageIdentity == packageIdentity }
    }
`);
    case 'kotlin':
      return lines(`
    fun getRtcProviderPackageByProviderKey(providerKey: String): RtcProviderPackageCatalogEntry? =
        entries.firstOrNull { it.providerKey == providerKey }

    fun getRtcProviderPackageByPackageIdentity(packageIdentity: String): RtcProviderPackageCatalogEntry? =
        entries.firstOrNull { it.packageIdentity == packageIdentity }
`);
    case 'go':
      return lines(`
func GetRtcProviderPackageByProviderKey(providerKey string) *RtcProviderPackageCatalogEntry {
    for index := range OFFICIAL_RTC_PROVIDER_PACKAGES {
        if OFFICIAL_RTC_PROVIDER_PACKAGES[index].ProviderKey == providerKey {
            return &OFFICIAL_RTC_PROVIDER_PACKAGES[index]
        }
    }

    return nil
}

func GetRtcProviderPackageByPackageIdentity(packageIdentity string) *RtcProviderPackageCatalogEntry {
    for index := range OFFICIAL_RTC_PROVIDER_PACKAGES {
        if OFFICIAL_RTC_PROVIDER_PACKAGES[index].PackageIdentity == packageIdentity {
            return &OFFICIAL_RTC_PROVIDER_PACKAGES[index]
        }
    }

    return nil
}
`);
    case 'python':
      return lines(`
def get_rtc_provider_package_by_provider_key(provider_key: str) -> Optional[RtcProviderPackageCatalogEntry]:
    for entry in RtcProviderPackageCatalog.entries:
        if entry.providerKey == provider_key:
            return entry

    return None


def get_rtc_provider_package_by_package_identity(package_identity: str) -> Optional[RtcProviderPackageCatalogEntry]:
    for entry in RtcProviderPackageCatalog.entries:
        if entry.packageIdentity == package_identity:
            return entry

    return None
`);
    default:
      return '';
  }
}

function renderReservedLanguageProviderActivationLookupHelper(language) {
  switch (language) {
    case 'flutter':
      return lines(`
RtcProviderActivationCatalogEntry? getRtcProviderActivationByProviderKey(String providerKey) {
  for (final entry in RtcProviderActivationCatalog.entries) {
    if (entry.providerKey == providerKey) {
      return entry;
    }
  }

  return null;
}
`);
    case 'rust':
      return lines(`
pub fn get_rtc_provider_activation_by_provider_key(
    provider_key: &str,
) -> Option<&'static RtcProviderActivationCatalogEntry> {
    OFFICIAL_RTC_PROVIDER_ACTIVATIONS
        .iter()
        .find(|entry| entry.providerKey == provider_key)
}
`);
    case 'java':
      return lines(`
  public static Optional<RtcProviderActivationCatalogEntry> getRtcProviderActivationByProviderKey(String providerKey) {
    for (var entry : ENTRIES) {
      if (entry.providerKey().equals(providerKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }
`);
    case 'csharp':
      return lines(`
    public static RtcProviderActivationCatalogEntry? GetRtcProviderActivationByProviderKey(string providerKey) =>
        Entries.FirstOrDefault(entry => entry.providerKey == providerKey);
`);
    case 'swift':
      return lines(`
    public static func getRtcProviderActivationByProviderKey(_ providerKey: String) -> RtcProviderActivationCatalogEntry? {
        entries.first { $0.providerKey == providerKey }
    }
`);
    case 'kotlin':
      return lines(`
    fun getRtcProviderActivationByProviderKey(providerKey: String): RtcProviderActivationCatalogEntry? =
        entries.firstOrNull { it.providerKey == providerKey }
`);
    case 'go':
      return lines(`
func GetRtcProviderActivationByProviderKey(providerKey string) *RtcProviderActivationCatalogEntry {
    for index := range OFFICIAL_RTC_PROVIDER_ACTIVATIONS {
        if OFFICIAL_RTC_PROVIDER_ACTIVATIONS[index].ProviderKey == providerKey {
            return &OFFICIAL_RTC_PROVIDER_ACTIVATIONS[index]
        }
    }

    return nil
}
`);
    case 'python':
      return lines(`
def get_rtc_provider_activation_by_provider_key(provider_key: str) -> Optional[RtcProviderActivationCatalogEntry]:
    for entry in RtcProviderActivationCatalog.entries:
        if entry.providerKey == provider_key:
            return entry

    return None
`);
    default:
      return '';
  }
}

function renderReservedLanguageCapabilityLookupHelper(language) {
  switch (language) {
    case 'flutter':
      return lines(`
List<RtcCapabilityCatalogEntry> getRtcCapabilityCatalog() {
  return RtcCapabilityCatalog.entries;
}

RtcCapabilityCatalogEntry? getRtcCapabilityDescriptor(String capabilityKey) {
  for (final entry in RtcCapabilityCatalog.entries) {
    if (entry.capabilityKey == capabilityKey) {
      return entry;
    }
  }

  return null;
}
`);
    case 'rust':
      return lines(`
pub fn get_rtc_capability_catalog() -> &'static [RtcCapabilityCatalogEntry] {
    &RTC_CAPABILITY_CATALOG
}

pub fn get_rtc_capability_descriptor(
    capability_key: &str,
) -> Option<&'static RtcCapabilityCatalogEntry> {
    RTC_CAPABILITY_CATALOG
        .iter()
        .find(|entry| entry.capabilityKey == capability_key)
}
`);
    case 'java':
      return lines(`
  public static List<Entry> getRtcCapabilityCatalog() {
    return ENTRIES;
  }

  public static Optional<Entry> getRtcCapabilityDescriptor(String capabilityKey) {
    for (var entry : ENTRIES) {
      if (entry.capabilityKey().equals(capabilityKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }
`);
    case 'csharp':
      return lines(`
    public static IReadOnlyList<RtcCapabilityCatalogEntry> GetRtcCapabilityCatalog() =>
        Entries;

    public static RtcCapabilityCatalogEntry? GetRtcCapabilityDescriptor(string capabilityKey) =>
        Entries.FirstOrDefault(entry => entry.capabilityKey == capabilityKey);
`);
    case 'swift':
      return lines(`
    public static func getRtcCapabilityCatalog() -> [RtcCapabilityCatalogEntry] {
        entries
    }

    public static func getRtcCapabilityDescriptor(_ capabilityKey: String) -> RtcCapabilityCatalogEntry? {
        entries.first { $0.capabilityKey == capabilityKey }
    }
`);
    case 'kotlin':
      return lines(`
    fun getRtcCapabilityCatalog(): List<RtcCapabilityCatalogEntry> = entries

    fun getRtcCapabilityDescriptor(capabilityKey: String): RtcCapabilityCatalogEntry? =
        entries.firstOrNull { it.capabilityKey == capabilityKey }
`);
    case 'go':
      return lines(`
func GetRtcCapabilityCatalog() []RtcCapabilityCatalogEntry {
    return append([]RtcCapabilityCatalogEntry(nil), RTC_CAPABILITY_CATALOG...)
}

func GetRtcCapabilityDescriptor(capabilityKey string) *RtcCapabilityCatalogEntry {
    for index := range RTC_CAPABILITY_CATALOG {
        if RTC_CAPABILITY_CATALOG[index].CapabilityKey == capabilityKey {
            return &RTC_CAPABILITY_CATALOG[index]
        }
    }

    return nil
}
`);
    case 'python':
      return lines(`
def get_rtc_capability_catalog() -> list[RtcCapabilityCatalogEntry]:
    return RtcCapabilityCatalog.entries


def get_rtc_capability_descriptor(capability_key: str) -> Optional[RtcCapabilityCatalogEntry]:
    for entry in RtcCapabilityCatalog.entries:
        if entry.capabilityKey == capability_key:
            return entry

    return None
`);
    default:
      return '';
  }
}

function renderReservedLanguageProviderExtensionLookupHelper(language) {
  switch (language) {
    case 'flutter':
      return lines(`
List<RtcProviderExtensionCatalogEntry> getRtcProviderExtensionCatalog() {
  return RtcProviderExtensionCatalog.entries;
}

RtcProviderExtensionCatalogEntry? getRtcProviderExtensionDescriptor(String extensionKey) {
  for (final entry in RtcProviderExtensionCatalog.entries) {
    if (entry.extensionKey == extensionKey) {
      return entry;
    }
  }

  return null;
}

List<RtcProviderExtensionCatalogEntry> getRtcProviderExtensionsForProvider(String providerKey) {
  return RtcProviderExtensionCatalog.entries
      .where((entry) => entry.providerKey == providerKey)
      .toList(growable: false);
}

List<RtcProviderExtensionCatalogEntry> getRtcProviderExtensions(List<String> extensionKeys) {
  final entries = <RtcProviderExtensionCatalogEntry>[];

  for (final extensionKey in extensionKeys) {
    final entry = getRtcProviderExtensionDescriptor(extensionKey);
    if (entry != null) {
      entries.add(entry);
    }
  }

  return entries.toList(growable: false);
}

bool hasRtcProviderExtension(List<String> extensionKeys, String extensionKey) {
  return extensionKeys.contains(extensionKey) &&
      getRtcProviderExtensionDescriptor(extensionKey) != null;
}
`);
    case 'rust':
      return lines(`
pub fn get_rtc_provider_extension_catalog() -> &'static [RtcProviderExtensionCatalogEntry] {
    &RTC_PROVIDER_EXTENSION_CATALOG
}

pub fn get_rtc_provider_extension_descriptor(
    extension_key: &str,
) -> Option<&'static RtcProviderExtensionCatalogEntry> {
    RTC_PROVIDER_EXTENSION_CATALOG
        .iter()
        .find(|entry| entry.extensionKey == extension_key)
}

pub fn get_rtc_provider_extensions_for_provider(
    provider_key: &str,
) -> Vec<RtcProviderExtensionCatalogEntry> {
    RTC_PROVIDER_EXTENSION_CATALOG
        .iter()
        .filter(|entry| entry.providerKey == provider_key)
        .copied()
        .collect()
}

pub fn get_rtc_provider_extensions(
    extension_keys: &[&str],
) -> Vec<RtcProviderExtensionCatalogEntry> {
    extension_keys
        .iter()
        .filter_map(|extension_key| get_rtc_provider_extension_descriptor(extension_key).copied())
        .collect()
}

pub fn has_rtc_provider_extension(extension_keys: &[&str], extension_key: &str) -> bool {
    extension_keys.iter().any(|value| *value == extension_key)
        && get_rtc_provider_extension_descriptor(extension_key).is_some()
}
`);
    case 'java':
      return lines(`
  public static List<Entry> getRtcProviderExtensionCatalog() {
    return ENTRIES;
  }

  public static Optional<Entry> getRtcProviderExtensionDescriptor(String extensionKey) {
    for (var entry : ENTRIES) {
      if (entry.extensionKey().equals(extensionKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }

  public static List<Entry> getRtcProviderExtensionsForProvider(String providerKey) {
    var resolved = new ArrayList<Entry>();
    for (var entry : ENTRIES) {
      if (entry.providerKey().equals(providerKey)) {
        resolved.add(entry);
      }
    }

    return List.copyOf(resolved);
  }

  public static List<Entry> getRtcProviderExtensions(List<String> extensionKeys) {
    var resolved = new ArrayList<Entry>();
    for (var extensionKey : extensionKeys) {
      getRtcProviderExtensionDescriptor(extensionKey).ifPresent(resolved::add);
    }

    return List.copyOf(resolved);
  }

  public static boolean hasRtcProviderExtension(List<String> extensionKeys, String extensionKey) {
    return extensionKeys.contains(extensionKey)
        && getRtcProviderExtensionDescriptor(extensionKey).isPresent();
  }
`);
    case 'csharp':
      return lines(`
    public static IReadOnlyList<RtcProviderExtensionCatalogEntry> GetRtcProviderExtensionCatalog() =>
        Entries;

    public static RtcProviderExtensionCatalogEntry? GetRtcProviderExtensionDescriptor(string extensionKey) =>
        Entries.FirstOrDefault(entry => entry.extensionKey == extensionKey);

    public static IReadOnlyList<RtcProviderExtensionCatalogEntry> GetRtcProviderExtensionsForProvider(string providerKey) =>
        Entries.Where(entry => entry.providerKey == providerKey).ToArray();

    public static IReadOnlyList<RtcProviderExtensionCatalogEntry> GetRtcProviderExtensions(IReadOnlyList<string> extensionKeys)
    {
        var entries = new List<RtcProviderExtensionCatalogEntry>();
        foreach (var extensionKey in extensionKeys)
        {
            var entry = GetRtcProviderExtensionDescriptor(extensionKey);
            if (entry is not null)
            {
                entries.Add(entry);
            }
        }

        return entries.ToArray();
    }

    public static bool HasRtcProviderExtension(IReadOnlyList<string> extensionKeys, string extensionKey) =>
        extensionKeys.Contains(extensionKey) && GetRtcProviderExtensionDescriptor(extensionKey) is not null;
`);
    case 'swift':
      return lines(`
    public static func getRtcProviderExtensionCatalog() -> [RtcProviderExtensionCatalogEntry] {
        entries
    }

    public static func getRtcProviderExtensionDescriptor(_ extensionKey: String) -> RtcProviderExtensionCatalogEntry? {
        entries.first { $0.extensionKey == extensionKey }
    }

    public static func getRtcProviderExtensionsForProvider(_ providerKey: String) -> [RtcProviderExtensionCatalogEntry] {
        entries.filter { $0.providerKey == providerKey }
    }

    public static func getRtcProviderExtensions(_ extensionKeys: [String]) -> [RtcProviderExtensionCatalogEntry] {
        var resolved: [RtcProviderExtensionCatalogEntry] = []
        for extensionKey in extensionKeys {
            if let entry = getRtcProviderExtensionDescriptor(extensionKey) {
                resolved.append(entry)
            }
        }

        return resolved
    }

    public static func hasRtcProviderExtension(_ extensionKeys: [String], _ extensionKey: String) -> Bool {
        extensionKeys.contains(extensionKey) && getRtcProviderExtensionDescriptor(extensionKey) != nil
    }
`);
    case 'kotlin':
      return lines(`
    fun getRtcProviderExtensionCatalog(): List<RtcProviderExtensionCatalogEntry> = entries

    fun getRtcProviderExtensionDescriptor(extensionKey: String): RtcProviderExtensionCatalogEntry? =
        entries.firstOrNull { it.extensionKey == extensionKey }

    fun getRtcProviderExtensionsForProvider(providerKey: String): List<RtcProviderExtensionCatalogEntry> =
        entries.filter { it.providerKey == providerKey }

    fun getRtcProviderExtensions(extensionKeys: List<String>): List<RtcProviderExtensionCatalogEntry> =
        extensionKeys.mapNotNull(::getRtcProviderExtensionDescriptor)

    fun hasRtcProviderExtension(extensionKeys: List<String>, extensionKey: String): Boolean =
        extensionKeys.contains(extensionKey) && getRtcProviderExtensionDescriptor(extensionKey) != null
`);
    case 'go':
      return lines(`
func GetRtcProviderExtensionCatalog() []RtcProviderExtensionCatalogEntry {
    return append([]RtcProviderExtensionCatalogEntry(nil), RTC_PROVIDER_EXTENSION_CATALOG...)
}

func GetRtcProviderExtensionDescriptor(extensionKey string) *RtcProviderExtensionCatalogEntry {
    for index := range RTC_PROVIDER_EXTENSION_CATALOG {
        if RTC_PROVIDER_EXTENSION_CATALOG[index].ExtensionKey == extensionKey {
            return &RTC_PROVIDER_EXTENSION_CATALOG[index]
        }
    }

    return nil
}

func GetRtcProviderExtensionsForProvider(providerKey string) []RtcProviderExtensionCatalogEntry {
    entries := make([]RtcProviderExtensionCatalogEntry, 0)
    for _, entry := range RTC_PROVIDER_EXTENSION_CATALOG {
        if entry.ProviderKey == providerKey {
            entries = append(entries, entry)
        }
    }

    return entries
}

func GetRtcProviderExtensions(extensionKeys []string) []RtcProviderExtensionCatalogEntry {
    entries := make([]RtcProviderExtensionCatalogEntry, 0)
    for _, extensionKey := range extensionKeys {
        entry := GetRtcProviderExtensionDescriptor(extensionKey)
        if entry != nil {
            entries = append(entries, *entry)
        }
    }

    return entries
}

func HasRtcProviderExtension(extensionKeys []string, extensionKey string) bool {
    if GetRtcProviderExtensionDescriptor(extensionKey) == nil {
        return false
    }

    for _, value := range extensionKeys {
        if value == extensionKey {
            return true
        }
    }

    return false
}
`);
    case 'python':
      return lines(`
def get_rtc_provider_extension_catalog() -> list[RtcProviderExtensionCatalogEntry]:
    return RtcProviderExtensionCatalog.entries


def get_rtc_provider_extension_descriptor(
    extension_key: str,
) -> Optional[RtcProviderExtensionCatalogEntry]:
    for entry in RtcProviderExtensionCatalog.entries:
        if entry.extensionKey == extension_key:
            return entry

    return None


def get_rtc_provider_extensions_for_provider(
    provider_key: str,
) -> list[RtcProviderExtensionCatalogEntry]:
    return [
        entry for entry in RtcProviderExtensionCatalog.entries if entry.providerKey == provider_key
    ]


def get_rtc_provider_extensions(
    extension_keys: list[str],
) -> list[RtcProviderExtensionCatalogEntry]:
    entries: list[RtcProviderExtensionCatalogEntry] = []
    for extension_key in extension_keys:
        entry = get_rtc_provider_extension_descriptor(extension_key)
        if entry is not None:
            entries.append(entry)

    return entries


def has_rtc_provider_extension(extension_keys: list[str], extension_key: str) -> bool:
    return extension_key in extension_keys and get_rtc_provider_extension_descriptor(extension_key) is not None
`);
    default:
      return '';
  }
}

function renderReservedLanguageWorkspaceLookupHelper(language) {
  switch (language) {
    case 'flutter':
      return lines(`
RtcLanguageWorkspaceCatalogEntry? getRtcLanguageWorkspaceByLanguage(String language) {
  for (final entry in RtcLanguageWorkspaceCatalog.entries) {
    if (entry.language == language) {
      return entry;
    }
  }

  return null;
}
`);
    case 'rust':
      return lines(`
pub fn get_rtc_language_workspace_by_language(
    language: &str,
) -> Option<&'static RtcLanguageWorkspaceCatalogEntry> {
    OFFICIAL_RTC_LANGUAGE_WORKSPACES
        .iter()
        .find(|entry| entry.language == language)
}
`);
    case 'java':
      return lines(`
  public static Optional<RtcLanguageWorkspaceCatalogEntry> getRtcLanguageWorkspaceByLanguage(String language) {
    for (var entry : ENTRIES) {
      if (entry.language().equals(language)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }
`);
    case 'csharp':
      return lines(`
    public static RtcLanguageWorkspaceCatalogEntry? GetRtcLanguageWorkspaceByLanguage(string language) =>
        Entries.FirstOrDefault(entry => entry.language == language);
`);
    case 'swift':
      return lines(`
    public static func getRtcLanguageWorkspaceByLanguage(_ language: String) -> RtcLanguageWorkspaceCatalogEntry? {
        entries.first { $0.language == language }
    }
`);
    case 'kotlin':
      return lines(`
    fun getRtcLanguageWorkspaceByLanguage(language: String): RtcLanguageWorkspaceCatalogEntry? =
        entries.firstOrNull { it.language == language }
`);
    case 'go':
      return lines(`
func GetRtcLanguageWorkspaceByLanguage(language string) *RtcLanguageWorkspaceCatalogEntry {
    for index := range OFFICIAL_RTC_LANGUAGE_WORKSPACES {
        if OFFICIAL_RTC_LANGUAGE_WORKSPACES[index].Language == language {
            return &OFFICIAL_RTC_LANGUAGE_WORKSPACES[index]
        }
    }

    return nil
}
`);
    case 'python':
      return lines(`
def get_rtc_language_workspace_by_language(language: str) -> Optional[RtcLanguageWorkspaceCatalogEntry]:
    for entry in RtcLanguageWorkspaceCatalog.entries:
        if entry.language == language:
            return entry

    return None
`);
    default:
      return '';
  }
}

function renderReservedLanguageProviderSelectionModule(language) {
  switch (language) {
    case 'flutter':
      return lines(`
import 'rtc_provider_catalog.dart';

enum RtcProviderSelectionSource {
  provider_url,
  provider_key,
  tenant_override,
  deployment_profile,
  default_provider,
}

final class ParsedRtcProviderUrl {
  const ParsedRtcProviderUrl({
    required this.providerKey,
    required this.rawUrl,
  });

  final String providerKey;
  final String rawUrl;
}

final class RtcProviderSelection {
  const RtcProviderSelection({
    required this.providerKey,
    required this.source,
  });

  final String providerKey;
  final RtcProviderSelectionSource source;
}

final class RtcProviderSelectionRequest {
  const RtcProviderSelectionRequest({
    this.providerUrl,
    this.providerKey,
    this.tenantOverrideProviderKey,
    this.deploymentProfileProviderKey,
  });

  final String? providerUrl;
  final String? providerKey;
  final String? tenantOverrideProviderKey;
  final String? deploymentProfileProviderKey;
}

const List<String> rtcProviderSelectionSources = <String>[
  'provider_url',
  'provider_key',
  'tenant_override',
  'deployment_profile',
  'default_provider',
];

const List<String> rtcProviderSelectionPrecedence = <String>[
  'provider_url',
  'provider_key',
  'tenant_override',
  'deployment_profile',
  'default_provider',
];

bool _hasRtcProviderSelectionText(String? value) =>
    value != null && value.trim().isNotEmpty;

ParsedRtcProviderUrl parseRtcProviderUrl(String providerUrl) {
  final trimmed = providerUrl.trim();
  if (!trimmed.startsWith('rtc:') || !trimmed.contains('://')) {
    throw ArgumentError.value(providerUrl, 'providerUrl', 'Invalid RTC provider URL');
  }

  return ParsedRtcProviderUrl(
    providerKey: trimmed.substring(4).split('://').first.toLowerCase(),
    rawUrl: providerUrl,
  );
}

RtcProviderSelection resolveRtcProviderSelection(
  RtcProviderSelectionRequest request, {
  String defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
}) {
  if (_hasRtcProviderSelectionText(request.providerUrl)) {
    return RtcProviderSelection(
      providerKey: parseRtcProviderUrl(request.providerUrl!).providerKey,
      source: RtcProviderSelectionSource.provider_url,
    );
  }

  if (_hasRtcProviderSelectionText(request.providerKey)) {
    return RtcProviderSelection(
      providerKey: request.providerKey!.trim(),
      source: RtcProviderSelectionSource.provider_key,
    );
  }

  if (_hasRtcProviderSelectionText(request.tenantOverrideProviderKey)) {
    return RtcProviderSelection(
      providerKey: request.tenantOverrideProviderKey!.trim(),
      source: RtcProviderSelectionSource.tenant_override,
    );
  }

  if (_hasRtcProviderSelectionText(request.deploymentProfileProviderKey)) {
    return RtcProviderSelection(
      providerKey: request.deploymentProfileProviderKey!.trim(),
      source: RtcProviderSelectionSource.deployment_profile,
    );
  }

  return RtcProviderSelection(
    providerKey: defaultProviderKey,
    source: RtcProviderSelectionSource.default_provider,
  );
}
`);
    case 'rust':
      return lines(`
use crate::provider_catalog::DEFAULT_RTC_PROVIDER_KEY;

#[allow(non_snake_case)]
pub struct ParsedRtcProviderUrl {
    pub providerKey: String,
    pub rawUrl: String,
}

#[allow(non_snake_case)]
pub struct RtcProviderSelection {
    pub providerKey: String,
    pub source: &'static str,
}

#[derive(Default)]
#[allow(non_snake_case)]
pub struct RtcProviderSelectionRequest {
    pub providerUrl: Option<String>,
    pub providerKey: Option<String>,
    pub tenantOverrideProviderKey: Option<String>,
    pub deploymentProfileProviderKey: Option<String>,
}

pub const RTC_PROVIDER_SELECTION_SOURCES: [&str; 5] = [
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
];

pub const RTC_PROVIDER_SELECTION_PRECEDENCE: [&str; 5] = [
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
];

fn has_rtc_provider_selection_text(value: &Option<String>) -> bool {
    value.as_ref().is_some_and(|entry| !entry.trim().is_empty())
}

pub fn parse_rtc_provider_url(provider_url: &str) -> ParsedRtcProviderUrl {
    let trimmed = provider_url.trim();
    if !trimmed.starts_with("rtc:") || !trimmed.contains("://") {
        panic!("Invalid RTC provider URL: {provider_url}");
    }

    let provider_key = trimmed[4..]
        .split("://")
        .next()
        .unwrap_or(DEFAULT_RTC_PROVIDER_KEY)
        .to_lowercase();

    ParsedRtcProviderUrl {
        providerKey: provider_key,
        rawUrl: provider_url.to_string(),
    }
}

pub fn resolve_rtc_provider_selection(
    request: &RtcProviderSelectionRequest,
    default_provider_key: Option<&str>,
) -> RtcProviderSelection {
    if has_rtc_provider_selection_text(&request.providerUrl) {
        return RtcProviderSelection {
            providerKey: parse_rtc_provider_url(request.providerUrl.as_deref().unwrap()).providerKey,
            source: "provider_url",
        };
    }

    if has_rtc_provider_selection_text(&request.providerKey) {
        return RtcProviderSelection {
            providerKey: request.providerKey.as_deref().unwrap().trim().to_string(),
            source: "provider_key",
        };
    }

    if has_rtc_provider_selection_text(&request.tenantOverrideProviderKey) {
        return RtcProviderSelection {
            providerKey: request
                .tenantOverrideProviderKey
                .as_deref()
                .unwrap()
                .trim()
                .to_string(),
            source: "tenant_override",
        };
    }

    if has_rtc_provider_selection_text(&request.deploymentProfileProviderKey) {
        return RtcProviderSelection {
            providerKey: request
                .deploymentProfileProviderKey
                .as_deref()
                .unwrap()
                .trim()
                .to_string(),
            source: "deployment_profile",
        };
    }

    RtcProviderSelection {
        providerKey: default_provider_key
            .unwrap_or(DEFAULT_RTC_PROVIDER_KEY)
            .to_string(),
        source: "default_provider",
    }
}
`);
    case 'java':
      return lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;

public record RtcProviderSelection(String providerKey, RtcProviderSelectionSource source) {

  public enum RtcProviderSelectionSource {
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider
  }

  public record ParsedRtcProviderUrl(String providerKey, String rawUrl) {
  }

  public record RtcProviderSelectionRequest(
      String providerUrl,
      String providerKey,
      String tenantOverrideProviderKey,
      String deploymentProfileProviderKey
  ) {
  }

  public static final List<String> RTC_PROVIDER_SELECTION_SOURCES = List.of(
      "provider_url",
      "provider_key",
      "tenant_override",
      "deployment_profile",
      "default_provider"
  );

  public static final List<String> RTC_PROVIDER_SELECTION_PRECEDENCE = List.of(
      "provider_url",
      "provider_key",
      "tenant_override",
      "deployment_profile",
      "default_provider"
  );

  public static ParsedRtcProviderUrl parseRtcProviderUrl(String providerUrl) {
    var trimmed = providerUrl.trim();
    if (!trimmed.startsWith("rtc:") || !trimmed.contains("://")) {
      throw new IllegalArgumentException("Invalid RTC provider URL: " + providerUrl);
    }

    return new ParsedRtcProviderUrl(
        trimmed.substring(4, trimmed.indexOf("://")).toLowerCase(),
        providerUrl
    );
  }

  public static RtcProviderSelection resolveRtcProviderSelection(
      RtcProviderSelectionRequest request
  ) {
    return resolveRtcProviderSelection(request, RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY);
  }

  public static RtcProviderSelection resolveRtcProviderSelection(
      RtcProviderSelectionRequest request,
      String defaultProviderKey
  ) {
    var resolvedRequest = request == null
        ? new RtcProviderSelectionRequest(null, null, null, null)
        : request;

    if (hasText(resolvedRequest.providerUrl())) {
      return new RtcProviderSelection(
          parseRtcProviderUrl(resolvedRequest.providerUrl()).providerKey(),
          RtcProviderSelectionSource.provider_url
      );
    }

    if (hasText(resolvedRequest.providerKey())) {
      return new RtcProviderSelection(
          resolvedRequest.providerKey().trim(),
          RtcProviderSelectionSource.provider_key
      );
    }

    if (hasText(resolvedRequest.tenantOverrideProviderKey())) {
      return new RtcProviderSelection(
          resolvedRequest.tenantOverrideProviderKey().trim(),
          RtcProviderSelectionSource.tenant_override
      );
    }

    if (hasText(resolvedRequest.deploymentProfileProviderKey())) {
      return new RtcProviderSelection(
          resolvedRequest.deploymentProfileProviderKey().trim(),
          RtcProviderSelectionSource.deployment_profile
      );
    }

    return new RtcProviderSelection(
        defaultProviderKey,
        RtcProviderSelectionSource.default_provider
    );
  }

  private static boolean hasText(String value) {
    return value != null && !value.trim().isEmpty();
  }
}
`);
    case 'csharp':
      return lines(`
namespace Sdkwork.Rtc.Sdk;

using System;
using System.Collections.Generic;

public enum RtcProviderSelectionSource
{
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider,
}

public sealed record ParsedRtcProviderUrl(string providerKey, string rawUrl);

public sealed record RtcProviderSelectionRequest(
    string? providerUrl = null,
    string? providerKey = null,
    string? tenantOverrideProviderKey = null,
    string? deploymentProfileProviderKey = null
);

public sealed record RtcProviderSelection(
    string providerKey,
    RtcProviderSelectionSource source
)
{
    public static readonly IReadOnlyList<string> RtcProviderSelectionSources =
    [
        "provider_url",
        "provider_key",
        "tenant_override",
        "deployment_profile",
        "default_provider",
    ];

    public static readonly IReadOnlyList<string> RtcProviderSelectionPrecedence =
    [
        "provider_url",
        "provider_key",
        "tenant_override",
        "deployment_profile",
        "default_provider",
    ];

    public static ParsedRtcProviderUrl ParseRtcProviderUrl(string providerUrl)
    {
        var trimmed = providerUrl.Trim();
        if (!trimmed.StartsWith("rtc:", StringComparison.OrdinalIgnoreCase) || !trimmed.Contains("://", StringComparison.Ordinal))
        {
            throw new ArgumentException($"Invalid RTC provider URL: {providerUrl}", nameof(providerUrl));
        }

        return new ParsedRtcProviderUrl(
            trimmed[4..trimmed.IndexOf("://", StringComparison.Ordinal)].ToLowerInvariant(),
            providerUrl
        );
    }

    public static RtcProviderSelection ResolveRtcProviderSelection(
        RtcProviderSelectionRequest? request = null,
        string defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    )
    {
        request ??= new RtcProviderSelectionRequest();

        if (HasText(request.providerUrl))
        {
            return new RtcProviderSelection(
                ParseRtcProviderUrl(request.providerUrl!).providerKey,
                RtcProviderSelectionSource.provider_url
            );
        }

        if (HasText(request.providerKey))
        {
            return new RtcProviderSelection(
                request.providerKey!.Trim(),
                RtcProviderSelectionSource.provider_key
            );
        }

        if (HasText(request.tenantOverrideProviderKey))
        {
            return new RtcProviderSelection(
                request.tenantOverrideProviderKey!.Trim(),
                RtcProviderSelectionSource.tenant_override
            );
        }

        if (HasText(request.deploymentProfileProviderKey))
        {
            return new RtcProviderSelection(
                request.deploymentProfileProviderKey!.Trim(),
                RtcProviderSelectionSource.deployment_profile
            );
        }

        return new RtcProviderSelection(
            defaultProviderKey,
            RtcProviderSelectionSource.default_provider
        );
    }

    private static bool HasText(string? value) => !string.IsNullOrWhiteSpace(value);
}
`);
    case 'swift':
      return lines(`
public enum RtcProviderSelectionSource: String {
    case provider_url = "provider_url"
    case provider_key = "provider_key"
    case tenant_override = "tenant_override"
    case deployment_profile = "deployment_profile"
    case default_provider = "default_provider"
}

public struct ParsedRtcProviderUrl {
    public let providerKey: String
    public let rawUrl: String

    public init(providerKey: String, rawUrl: String) {
        self.providerKey = providerKey
        self.rawUrl = rawUrl
    }
}

public struct RtcProviderSelectionRequest {
    public let providerUrl: String?
    public let providerKey: String?
    public let tenantOverrideProviderKey: String?
    public let deploymentProfileProviderKey: String?

    public init(
        providerUrl: String? = nil,
        providerKey: String? = nil,
        tenantOverrideProviderKey: String? = nil,
        deploymentProfileProviderKey: String? = nil
    ) {
        self.providerUrl = providerUrl
        self.providerKey = providerKey
        self.tenantOverrideProviderKey = tenantOverrideProviderKey
        self.deploymentProfileProviderKey = deploymentProfileProviderKey
    }
}

public struct RtcProviderSelection {
    public let providerKey: String
    public let source: RtcProviderSelectionSource

    public static let rtcProviderSelectionSources: [String] = [
        "provider_url",
        "provider_key",
        "tenant_override",
        "deployment_profile",
        "default_provider",
    ]

    public static let rtcProviderSelectionPrecedence: [String] = [
        "provider_url",
        "provider_key",
        "tenant_override",
        "deployment_profile",
        "default_provider",
    ]

    public static func parseRtcProviderUrl(_ providerUrl: String) -> ParsedRtcProviderUrl {
        let trimmed = providerUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.hasPrefix("rtc:"), let delimiter = trimmed.range(of: "://") else {
            fatalError("Invalid RTC provider URL: \\(providerUrl)")
        }

        return ParsedRtcProviderUrl(
            providerKey: String(trimmed[trimmed.index(trimmed.startIndex, offsetBy: 4)..<delimiter.lowerBound]).lowercased(),
            rawUrl: providerUrl
        )
    }

    public static func resolveRtcProviderSelection(
        request: RtcProviderSelectionRequest = RtcProviderSelectionRequest(),
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    ) -> RtcProviderSelection {
        if let providerUrl = request.providerUrl, hasText(providerUrl) {
            return RtcProviderSelection(
                providerKey: parseRtcProviderUrl(providerUrl).providerKey,
                source: .provider_url
            )
        }

        if let providerKey = request.providerKey, hasText(providerKey) {
            return RtcProviderSelection(
                providerKey: providerKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .provider_key
            )
        }

        if let tenantOverrideProviderKey = request.tenantOverrideProviderKey, hasText(tenantOverrideProviderKey) {
            return RtcProviderSelection(
                providerKey: tenantOverrideProviderKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .tenant_override
            )
        }

        if let deploymentProfileProviderKey = request.deploymentProfileProviderKey, hasText(deploymentProfileProviderKey) {
            return RtcProviderSelection(
                providerKey: deploymentProfileProviderKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .deployment_profile
            )
        }

        return RtcProviderSelection(
            providerKey: defaultProviderKey,
            source: .default_provider
        )
    }

    private static func hasText(_ value: String) -> Bool {
        !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
`);
    case 'kotlin':
      return lines(`
package com.sdkwork.rtc.metadata

enum class RtcProviderSelectionSource {
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider,
}

data class ParsedRtcProviderUrl(
    val providerKey: String,
    val rawUrl: String,
)

data class RtcProviderSelection(
    val providerKey: String,
    val source: RtcProviderSelectionSource,
)

data class RtcProviderSelectionRequest(
    val providerUrl: String? = null,
    val providerKey: String? = null,
    val tenantOverrideProviderKey: String? = null,
    val deploymentProfileProviderKey: String? = null,
)

val RTC_PROVIDER_SELECTION_SOURCES: List<String> = listOf(
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
)

val RTC_PROVIDER_SELECTION_PRECEDENCE: List<String> = listOf(
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
)

private fun hasRtcProviderSelectionText(value: String?): Boolean = value != null && value.isNotBlank()

fun parseRtcProviderUrl(providerUrl: String): ParsedRtcProviderUrl {
    val trimmed = providerUrl.trim()
    require(trimmed.startsWith("rtc:") && trimmed.contains("://")) {
        "Invalid RTC provider URL: $providerUrl"
    }

    return ParsedRtcProviderUrl(
        providerKey = trimmed.substring(4, trimmed.indexOf("://")).lowercase(),
        rawUrl = providerUrl,
    )
}

fun resolveRtcProviderSelection(
    request: RtcProviderSelectionRequest = RtcProviderSelectionRequest(),
    defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
): RtcProviderSelection {
    if (hasRtcProviderSelectionText(request.providerUrl)) {
        return RtcProviderSelection(
            providerKey = parseRtcProviderUrl(request.providerUrl!!).providerKey,
            source = RtcProviderSelectionSource.provider_url,
        )
    }

    if (hasRtcProviderSelectionText(request.providerKey)) {
        return RtcProviderSelection(
            providerKey = request.providerKey!!.trim(),
            source = RtcProviderSelectionSource.provider_key,
        )
    }

    if (hasRtcProviderSelectionText(request.tenantOverrideProviderKey)) {
        return RtcProviderSelection(
            providerKey = request.tenantOverrideProviderKey!!.trim(),
            source = RtcProviderSelectionSource.tenant_override,
        )
    }

    if (hasRtcProviderSelectionText(request.deploymentProfileProviderKey)) {
        return RtcProviderSelection(
            providerKey = request.deploymentProfileProviderKey!!.trim(),
            source = RtcProviderSelectionSource.deployment_profile,
        )
    }

    return RtcProviderSelection(
        providerKey = defaultProviderKey,
        source = RtcProviderSelectionSource.default_provider,
    )
}
`);
    case 'go':
      return lines(`
package rtcstandard

import "strings"

type ParsedRtcProviderUrl struct {
    ProviderKey string
    RawUrl      string
}

type RtcProviderSelection struct {
    ProviderKey string
    Source      string
}

type RtcProviderSelectionRequest struct {
    ProviderUrl                  string
    ProviderKey                  string
    TenantOverrideProviderKey    string
    DeploymentProfileProviderKey string
}

var RtcProviderSelectionSources = []string{
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
}

var RtcProviderSelectionPrecedence = []string{
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
}

func hasRtcProviderSelectionText(value string) bool {
    return strings.TrimSpace(value) != ""
}

func ParseRtcProviderUrl(providerUrl string) ParsedRtcProviderUrl {
    trimmed := strings.TrimSpace(providerUrl)
    if !strings.HasPrefix(trimmed, "rtc:") || !strings.Contains(trimmed, "://") {
        panic("Invalid RTC provider URL: " + providerUrl)
    }

    withoutPrefix := strings.TrimPrefix(trimmed, "rtc:")
    providerKey, _, _ := strings.Cut(withoutPrefix, "://")

    return ParsedRtcProviderUrl{
        ProviderKey: strings.ToLower(providerKey),
        RawUrl:      providerUrl,
    }
}

func ResolveRtcProviderSelection(
    request RtcProviderSelectionRequest,
    defaultProviderKey string,
) RtcProviderSelection {
    if hasRtcProviderSelectionText(request.ProviderUrl) {
        return RtcProviderSelection{
            ProviderKey: ParseRtcProviderUrl(request.ProviderUrl).ProviderKey,
            Source:      "provider_url",
        }
    }

    if hasRtcProviderSelectionText(request.ProviderKey) {
        return RtcProviderSelection{
            ProviderKey: strings.TrimSpace(request.ProviderKey),
            Source:      "provider_key",
        }
    }

    if hasRtcProviderSelectionText(request.TenantOverrideProviderKey) {
        return RtcProviderSelection{
            ProviderKey: strings.TrimSpace(request.TenantOverrideProviderKey),
            Source:      "tenant_override",
        }
    }

    if hasRtcProviderSelectionText(request.DeploymentProfileProviderKey) {
        return RtcProviderSelection{
            ProviderKey: strings.TrimSpace(request.DeploymentProfileProviderKey),
            Source:      "deployment_profile",
        }
    }

    resolvedDefaultProviderKey := defaultProviderKey
    if !hasRtcProviderSelectionText(resolvedDefaultProviderKey) {
        resolvedDefaultProviderKey = DEFAULT_RTC_PROVIDER_KEY
    }

    return RtcProviderSelection{
        ProviderKey: resolvedDefaultProviderKey,
        Source:      "default_provider",
    }
}
`);
    case 'python':
      return lines(`
from dataclasses import dataclass
from enum import Enum

from .provider_catalog import DEFAULT_RTC_PROVIDER_KEY


class RtcProviderSelectionSource(str, Enum):
    provider_url = "provider_url"
    provider_key = "provider_key"
    tenant_override = "tenant_override"
    deployment_profile = "deployment_profile"
    default_provider = "default_provider"


@dataclass(frozen=True)
class ParsedRtcProviderUrl:
    providerKey: str
    rawUrl: str


@dataclass(frozen=True)
class RtcProviderSelection:
    providerKey: str
    source: RtcProviderSelectionSource


@dataclass(frozen=True)
class RtcProviderSelectionRequest:
    providerUrl: str | None = None
    providerKey: str | None = None
    tenantOverrideProviderKey: str | None = None
    deploymentProfileProviderKey: str | None = None


RTC_PROVIDER_SELECTION_SOURCES = [
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
]

RTC_PROVIDER_SELECTION_PRECEDENCE = [
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
]


def _has_rtc_provider_selection_text(value: str | None) -> bool:
    return value is not None and value.strip() != ""


def parse_rtc_provider_url(provider_url: str) -> ParsedRtcProviderUrl:
    trimmed = provider_url.strip()
    if not trimmed.startswith("rtc:") or "://" not in trimmed:
        raise ValueError(f"Invalid RTC provider URL: {provider_url}")

    return ParsedRtcProviderUrl(
        providerKey=trimmed[4:].split("://", 1)[0].lower(),
        rawUrl=provider_url,
    )


def resolve_rtc_provider_selection(
    request: RtcProviderSelectionRequest | None = None,
    *,
    default_provider_key: str = DEFAULT_RTC_PROVIDER_KEY,
) -> RtcProviderSelection:
    request = request or RtcProviderSelectionRequest()

    if _has_rtc_provider_selection_text(request.providerUrl):
        return RtcProviderSelection(
            providerKey=parse_rtc_provider_url(request.providerUrl).providerKey,
            source=RtcProviderSelectionSource.provider_url,
        )

    if _has_rtc_provider_selection_text(request.providerKey):
        return RtcProviderSelection(
            providerKey=request.providerKey.strip(),
            source=RtcProviderSelectionSource.provider_key,
        )

    if _has_rtc_provider_selection_text(request.tenantOverrideProviderKey):
        return RtcProviderSelection(
            providerKey=request.tenantOverrideProviderKey.strip(),
            source=RtcProviderSelectionSource.tenant_override,
        )

    if _has_rtc_provider_selection_text(request.deploymentProfileProviderKey):
        return RtcProviderSelection(
            providerKey=request.deploymentProfileProviderKey.strip(),
            source=RtcProviderSelectionSource.deployment_profile,
        )

    return RtcProviderSelection(
        providerKey=default_provider_key,
        source=RtcProviderSelectionSource.default_provider,
    )
`);
    default:
      return '';
  }
}

function renderReservedLanguageProviderSupportModule(language) {
  switch (language) {
    case 'flutter':
      return lines(`
enum RtcProviderSupportStatus {
  builtin_registered,
  official_registered,
  official_unregistered,
  unknown,
}

final class RtcProviderSupport {
  const RtcProviderSupport({
    required this.providerKey,
    required this.status,
    required this.builtin,
    required this.official,
    required this.registered,
  });

  final String providerKey;
  final RtcProviderSupportStatus status;
  final bool builtin;
  final bool official;
  final bool registered;
}

final class RtcProviderSupportStateRequest {
  const RtcProviderSupportStateRequest({
    required this.providerKey,
    required this.builtin,
    required this.official,
    required this.registered,
  });

  final String providerKey;
  final bool builtin;
  final bool official;
  final bool registered;
}

const List<String> rtcProviderSupportStatuses = <String>[
  'builtin_registered',
  'official_registered',
  'official_unregistered',
  'unknown',
];

RtcProviderSupportStatus resolveRtcProviderSupportStatus(
  RtcProviderSupportStateRequest request,
) {
  if (request.official && request.registered) {
    return request.builtin
        ? RtcProviderSupportStatus.builtin_registered
        : RtcProviderSupportStatus.official_registered;
  }

  if (request.official) {
    return RtcProviderSupportStatus.official_unregistered;
  }

  return RtcProviderSupportStatus.unknown;
}

RtcProviderSupport createRtcProviderSupportState(
  RtcProviderSupportStateRequest request,
) {
  return RtcProviderSupport(
    providerKey: request.providerKey,
    status: resolveRtcProviderSupportStatus(request),
    builtin: request.builtin,
    official: request.official,
    registered: request.registered,
  );
}
`);
    case 'rust':
      return lines(`
#[allow(non_snake_case)]
pub struct RtcProviderSupport {
    pub providerKey: String,
    pub status: &'static str,
    pub builtin: bool,
    pub official: bool,
    pub registered: bool,
}

#[allow(non_snake_case)]
pub struct RtcProviderSupportStateRequest {
    pub providerKey: String,
    pub builtin: bool,
    pub official: bool,
    pub registered: bool,
}

pub const RTC_PROVIDER_SUPPORT_STATUSES: [&str; 4] = [
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
];

pub fn resolve_rtc_provider_support_status(
    request: &RtcProviderSupportStateRequest,
) -> &'static str {
    if request.official && request.registered {
        return if request.builtin {
            "builtin_registered"
        } else {
            "official_registered"
        };
    }

    if request.official {
        return "official_unregistered";
    }

    "unknown"
}

pub fn create_rtc_provider_support_state(
    request: RtcProviderSupportStateRequest,
) -> RtcProviderSupport {
    let status = resolve_rtc_provider_support_status(&request);

    RtcProviderSupport {
        providerKey: request.providerKey,
        status,
        builtin: request.builtin,
        official: request.official,
        registered: request.registered,
    }
}
`);
    case 'java':
      return lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;

public record RtcProviderSupport(
    String providerKey,
    RtcProviderSupportStatus status,
    boolean builtin,
    boolean official,
    boolean registered
) {

  public enum RtcProviderSupportStatus {
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown
  }

  public record RtcProviderSupportStateRequest(
      String providerKey,
      boolean builtin,
      boolean official,
      boolean registered
  ) {
  }

  public static final List<String> RTC_PROVIDER_SUPPORT_STATUSES = List.of(
      "builtin_registered",
      "official_registered",
      "official_unregistered",
      "unknown"
  );

  public static RtcProviderSupportStatus resolveRtcProviderSupportStatus(
      RtcProviderSupportStateRequest request
  ) {
    if (request.official() && request.registered()) {
      return request.builtin()
          ? RtcProviderSupportStatus.builtin_registered
          : RtcProviderSupportStatus.official_registered;
    }

    if (request.official()) {
      return RtcProviderSupportStatus.official_unregistered;
    }

    return RtcProviderSupportStatus.unknown;
  }

  public static RtcProviderSupport createRtcProviderSupportState(
      RtcProviderSupportStateRequest request
  ) {
    return new RtcProviderSupport(
        request.providerKey(),
        resolveRtcProviderSupportStatus(request),
        request.builtin(),
        request.official(),
        request.registered()
    );
  }
}
`);
    case 'csharp':
      return lines(`
namespace Sdkwork.Rtc.Sdk;

using System.Collections.Generic;

public enum RtcProviderSupportStatus
{
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown,
}

public sealed record RtcProviderSupportStateRequest(
    string providerKey,
    bool builtin,
    bool official,
    bool registered
);

public sealed record RtcProviderSupport(
    string providerKey,
    RtcProviderSupportStatus status,
    bool builtin,
    bool official,
    bool registered
)
{
    public static readonly IReadOnlyList<string> RtcProviderSupportStatuses =
    [
        "builtin_registered",
        "official_registered",
        "official_unregistered",
        "unknown",
    ];

    public static RtcProviderSupportStatus ResolveRtcProviderSupportStatus(
        RtcProviderSupportStateRequest request
    )
    {
        if (request.official && request.registered)
        {
            return request.builtin
                ? RtcProviderSupportStatus.builtin_registered
                : RtcProviderSupportStatus.official_registered;
        }

        if (request.official)
        {
            return RtcProviderSupportStatus.official_unregistered;
        }

        return RtcProviderSupportStatus.unknown;
    }

    public static RtcProviderSupport CreateRtcProviderSupportState(
        RtcProviderSupportStateRequest request
    )
    {
        return new RtcProviderSupport(
            request.providerKey,
            ResolveRtcProviderSupportStatus(request),
            request.builtin,
            request.official,
            request.registered
        );
    }
}
`);
    case 'swift':
      return lines(`
public enum RtcProviderSupportStatus: String {
    case builtin_registered = "builtin_registered"
    case official_registered = "official_registered"
    case official_unregistered = "official_unregistered"
    case unknown = "unknown"
}

public struct RtcProviderSupportStateRequest {
    public let providerKey: String
    public let builtin: Bool
    public let official: Bool
    public let registered: Bool

    public init(
        providerKey: String,
        builtin: Bool,
        official: Bool,
        registered: Bool
    ) {
        self.providerKey = providerKey
        self.builtin = builtin
        self.official = official
        self.registered = registered
    }
}

public struct RtcProviderSupport {
    public let providerKey: String
    public let status: RtcProviderSupportStatus
    public let builtin: Bool
    public let official: Bool
    public let registered: Bool

    public static let rtcProviderSupportStatuses: [String] = [
        "builtin_registered",
        "official_registered",
        "official_unregistered",
        "unknown",
    ]

    public static func resolveRtcProviderSupportStatus(
        _ request: RtcProviderSupportStateRequest
    ) -> RtcProviderSupportStatus {
        if request.official && request.registered {
            return request.builtin ? .builtin_registered : .official_registered
        }

        if request.official {
            return .official_unregistered
        }

        return .unknown
    }

    public static func createRtcProviderSupportState(
        _ request: RtcProviderSupportStateRequest
    ) -> RtcProviderSupport {
        return RtcProviderSupport(
            providerKey: request.providerKey,
            status: resolveRtcProviderSupportStatus(request),
            builtin: request.builtin,
            official: request.official,
            registered: request.registered
        )
    }
}
`);
    case 'kotlin':
      return lines(`
package com.sdkwork.rtc.metadata

enum class RtcProviderSupportStatus {
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown,
}

data class RtcProviderSupport(
    val providerKey: String,
    val status: RtcProviderSupportStatus,
    val builtin: Boolean,
    val official: Boolean,
    val registered: Boolean,
)

data class RtcProviderSupportStateRequest(
    val providerKey: String,
    val builtin: Boolean,
    val official: Boolean,
    val registered: Boolean,
)

val RTC_PROVIDER_SUPPORT_STATUSES: List<String> = listOf(
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
)

fun resolveRtcProviderSupportStatus(
    request: RtcProviderSupportStateRequest,
): RtcProviderSupportStatus {
    if (request.official && request.registered) {
        return if (request.builtin) {
            RtcProviderSupportStatus.builtin_registered
        } else {
            RtcProviderSupportStatus.official_registered
        }
    }

    if (request.official) {
        return RtcProviderSupportStatus.official_unregistered
    }

    return RtcProviderSupportStatus.unknown
}

fun createRtcProviderSupportState(
    request: RtcProviderSupportStateRequest,
): RtcProviderSupport {
    return RtcProviderSupport(
        providerKey = request.providerKey,
        status = resolveRtcProviderSupportStatus(request),
        builtin = request.builtin,
        official = request.official,
        registered = request.registered,
    )
}
`);
    case 'go':
      return lines(`
package rtcstandard

type RtcProviderSupportStateRequest struct {
    ProviderKey string
    Builtin     bool
    Official    bool
    Registered  bool
}

type RtcProviderSupport struct {
    ProviderKey string
    Status      string
    Builtin     bool
    Official    bool
    Registered  bool
}

var RtcProviderSupportStatuses = []string{
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
}

func ResolveRtcProviderSupportStatus(request RtcProviderSupportStateRequest) string {
    if request.Official && request.Registered {
        if request.Builtin {
            return "builtin_registered"
        }
        return "official_registered"
    }

    if request.Official {
        return "official_unregistered"
    }

    return "unknown"
}

func CreateRtcProviderSupportState(
    request RtcProviderSupportStateRequest,
) RtcProviderSupport {
    return RtcProviderSupport{
        ProviderKey: request.ProviderKey,
        Status:      ResolveRtcProviderSupportStatus(request),
        Builtin:     request.Builtin,
        Official:    request.Official,
        Registered:  request.Registered,
    }
}
`);
    case 'python':
      return lines(`
from dataclasses import dataclass
from enum import Enum


class RtcProviderSupportStatus(str, Enum):
    builtin_registered = "builtin_registered"
    official_registered = "official_registered"
    official_unregistered = "official_unregistered"
    unknown = "unknown"


@dataclass(frozen=True)
class RtcProviderSupport:
    providerKey: str
    status: RtcProviderSupportStatus
    builtin: bool
    official: bool
    registered: bool


@dataclass(frozen=True)
class RtcProviderSupportStateRequest:
    providerKey: str
    builtin: bool
    official: bool
    registered: bool


RTC_PROVIDER_SUPPORT_STATUSES = [
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
]


def resolve_rtc_provider_support_status(
    request: RtcProviderSupportStateRequest,
) -> RtcProviderSupportStatus:
    if request.official and request.registered:
        return (
            RtcProviderSupportStatus.builtin_registered
            if request.builtin
            else RtcProviderSupportStatus.official_registered
        )

    if request.official:
        return RtcProviderSupportStatus.official_unregistered

    return RtcProviderSupportStatus.unknown


def create_rtc_provider_support_state(
    request: RtcProviderSupportStateRequest,
) -> RtcProviderSupport:
    return RtcProviderSupport(
        providerKey=request.providerKey,
        status=resolve_rtc_provider_support_status(request),
        builtin=request.builtin,
        official=request.official,
        registered=request.registered,
    )
`);
    default:
      return '';
  }
}

function renderReservedLanguageProviderPackageLoaderModule(language) {
  switch (language) {
    case 'flutter':
      return lines(`
import 'rtc_provider_package_catalog.dart';

final class RtcProviderPackageLoaderException implements Exception {
  const RtcProviderPackageLoaderException(this.code, this.message);

  final String code;
  final String message;

  @override
  String toString() => 'RtcProviderPackageLoaderException($code): $message';
}

final class RtcProviderPackageLoadRequest {
  const RtcProviderPackageLoadRequest({
    this.providerKey,
    this.packageIdentity,
  });

  final String? providerKey;
  final String? packageIdentity;
}

final class RtcResolvedProviderPackageLoadTarget {
  const RtcResolvedProviderPackageLoadTarget({
    required this.packageEntry,
  });

  final RtcProviderPackageCatalogEntry packageEntry;
}

typedef RtcProviderModuleNamespace = Object?;
typedef RtcProviderPackageImportFn = RtcProviderModuleNamespace Function(
  RtcResolvedProviderPackageLoadTarget target,
);
typedef RtcProviderPackageLoader = RtcProviderModuleNamespace Function(
  RtcProviderPackageLoadRequest request,
);

final class RtcProviderPackageInstallRequest {
  const RtcProviderPackageInstallRequest({
    required this.driverManager,
    required this.loadRequest,
  });

  final Object driverManager;
  final RtcProviderPackageLoadRequest loadRequest;
}

RtcResolvedProviderPackageLoadTarget resolveRtcProviderPackageLoadTarget(
  RtcProviderPackageLoadRequest request,
) {
  final packageByProviderKey = request.providerKey == null
      ? null
      : getRtcProviderPackageByProviderKey(request.providerKey!);
  final packageByIdentity = request.packageIdentity == null
      ? null
      : getRtcProviderPackageByPackageIdentity(request.packageIdentity!);

  if (packageByProviderKey != null &&
      packageByIdentity != null &&
      packageByProviderKey.packageIdentity != packageByIdentity.packageIdentity) {
    throw const RtcProviderPackageLoaderException(
      'provider_package_identity_mismatch',
      'providerKey and packageIdentity must resolve to the same provider package boundary.',
    );
  }

  final resolvedPackage = packageByProviderKey ?? packageByIdentity;
  if (resolvedPackage == null) {
    throw const RtcProviderPackageLoaderException(
      'provider_package_not_found',
      'No official provider package matches the requested provider boundary.',
    );
  }

  return RtcResolvedProviderPackageLoadTarget(packageEntry: resolvedPackage);
}

RtcProviderPackageLoader createRtcProviderPackageLoader({
  required RtcProviderPackageImportFn importPackage,
}) {
  return (request) => loadRtcProviderModule(
        request,
        importPackage: importPackage,
      );
}

RtcProviderModuleNamespace loadRtcProviderModule(
  RtcProviderPackageLoadRequest request, {
  required RtcProviderPackageImportFn importPackage,
}) {
  final target = resolveRtcProviderPackageLoadTarget(request);

  try {
    final namespace = importPackage(target);
    if (namespace == null) {
      throw const RtcProviderPackageLoaderException(
        'provider_module_export_missing',
        'Reserved provider package loader scaffold requires an executable provider module namespace.',
      );
    }

    return namespace;
  } on RtcProviderPackageLoaderException {
    rethrow;
  } catch (error) {
    throw RtcProviderPackageLoaderException(
      'provider_package_load_failed',
      'Reserved provider package loader scaffold could not load ${'$'}{target.packageEntry.packageIdentity}: ${'$'}error',
    );
  }
}

void installRtcProviderPackage(
  RtcProviderPackageInstallRequest request, {
  required RtcProviderPackageImportFn importPackage,
}) {
  loadRtcProviderModule(
    request.loadRequest,
    importPackage: importPackage,
  );

  throw const RtcProviderPackageLoaderException(
    'provider_package_load_failed',
    'Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.',
  );
}

void installRtcProviderPackages(
  Iterable<RtcProviderPackageInstallRequest> requests, {
  required RtcProviderPackageImportFn importPackage,
}) {
  final materializedRequests = requests.toList(growable: false);
  for (final request in materializedRequests) {
    loadRtcProviderModule(
      request.loadRequest,
      importPackage: importPackage,
    );
  }

  if (materializedRequests.isNotEmpty) {
    throw const RtcProviderPackageLoaderException(
      'provider_package_load_failed',
      'Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.',
    );
  }
}
`);
    case 'rust':
      return lines(`
use std::collections::BTreeMap;

use crate::provider_package_catalog::{
    get_rtc_provider_package_by_package_identity, get_rtc_provider_package_by_provider_key,
    RtcProviderPackageCatalogEntry,
};

#[derive(Debug, Clone)]
pub struct RtcProviderPackageLoaderError {
    pub code: &'static str,
    pub message: String,
}

impl RtcProviderPackageLoaderError {
    pub fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

#[derive(Debug, Clone, Default)]
#[allow(non_snake_case)]
pub struct RtcProviderPackageLoadRequest {
    pub providerKey: Option<String>,
    pub packageIdentity: Option<String>,
}

#[allow(non_snake_case)]
pub struct RtcResolvedProviderPackageLoadTarget {
    pub packageEntry: &'static RtcProviderPackageCatalogEntry,
}

pub type RtcProviderModuleNamespace = BTreeMap<String, String>;
pub type RtcProviderPackageImportFn =
    fn(&RtcResolvedProviderPackageLoadTarget) -> Result<RtcProviderModuleNamespace, RtcProviderPackageLoaderError>;
pub type RtcProviderPackageLoader = Box<
    dyn Fn(RtcProviderPackageLoadRequest) -> Result<RtcProviderModuleNamespace, RtcProviderPackageLoaderError>,
>;

#[allow(non_snake_case)]
pub struct RtcProviderPackageInstallRequest<TDriverManager> {
    pub driverManager: TDriverManager,
    pub loadRequest: RtcProviderPackageLoadRequest,
}

pub fn resolve_rtc_provider_package_load_target(
    request: &RtcProviderPackageLoadRequest,
) -> Result<RtcResolvedProviderPackageLoadTarget, RtcProviderPackageLoaderError> {
    let package_by_provider_key = request
        .providerKey
        .as_deref()
        .and_then(get_rtc_provider_package_by_provider_key);
    let package_by_identity = request
        .packageIdentity
        .as_deref()
        .and_then(get_rtc_provider_package_by_package_identity);

    if let (Some(provider_key_entry), Some(package_identity_entry)) =
        (package_by_provider_key, package_by_identity)
    {
        if provider_key_entry.packageIdentity != package_identity_entry.packageIdentity {
            return Err(RtcProviderPackageLoaderError::new(
                "provider_package_identity_mismatch",
                "providerKey and packageIdentity must resolve to the same provider package boundary.",
            ));
        }
    }

    let resolved_package = package_by_provider_key.or(package_by_identity).ok_or_else(|| {
        RtcProviderPackageLoaderError::new(
            "provider_package_not_found",
            "No official provider package matches the requested provider boundary.",
        )
    })?;

    Ok(RtcResolvedProviderPackageLoadTarget {
        packageEntry: resolved_package,
    })
}

pub fn create_rtc_provider_package_loader(
    import_package: RtcProviderPackageImportFn,
) -> RtcProviderPackageLoader {
    Box::new(move |request| load_rtc_provider_module(&request, import_package))
}

pub fn load_rtc_provider_module(
    request: &RtcProviderPackageLoadRequest,
    import_package: RtcProviderPackageImportFn,
) -> Result<RtcProviderModuleNamespace, RtcProviderPackageLoaderError> {
    let target = resolve_rtc_provider_package_load_target(request)?;
    let namespace = import_package(&target).map_err(|error| {
        if error.code == "provider_package_load_failed" || error.code == "provider_module_export_missing" {
            error
        } else {
            RtcProviderPackageLoaderError::new(
                "provider_package_load_failed",
                format!(
                    "Reserved provider package loader scaffold could not load {}: {}",
                    target.packageEntry.packageIdentity, error.message
                ),
            )
        }
    })?;

    if namespace.is_empty() {
        return Err(RtcProviderPackageLoaderError::new(
            "provider_module_export_missing",
            "Reserved provider package loader scaffold requires an executable provider module namespace.",
        ));
    }

    Ok(namespace)
}

pub fn install_rtc_provider_package<TDriverManager>(
    request: &RtcProviderPackageInstallRequest<TDriverManager>,
    import_package: RtcProviderPackageImportFn,
) -> Result<(), RtcProviderPackageLoaderError> {
    let _namespace = load_rtc_provider_module(&request.loadRequest, import_package)?;

    Err(RtcProviderPackageLoaderError::new(
        "provider_package_load_failed",
        "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
    ))
}

pub fn install_rtc_provider_packages<TDriverManager>(
    requests: &[RtcProviderPackageInstallRequest<TDriverManager>],
    import_package: RtcProviderPackageImportFn,
) -> Result<(), RtcProviderPackageLoaderError> {
    for request in requests {
        let _namespace = load_rtc_provider_module(&request.loadRequest, import_package)?;
    }

    if !requests.is_empty() {
        return Err(RtcProviderPackageLoaderError::new(
            "provider_package_load_failed",
            "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
        ));
    }

    Ok(())
}
`);
    case 'java':
      return lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcProviderPackageLoader {

  public static final String PROVIDER_PACKAGE_NOT_FOUND = "provider_package_not_found";
  public static final String PROVIDER_PACKAGE_IDENTITY_MISMATCH = "provider_package_identity_mismatch";
  public static final String PROVIDER_PACKAGE_LOAD_FAILED = "provider_package_load_failed";
  public static final String PROVIDER_MODULE_EXPORT_MISSING = "provider_module_export_missing";

  public record RtcProviderPackageLoadRequest(
      String providerKey,
      String packageIdentity
  ) {
  }

  public record RtcResolvedProviderPackageLoadTarget(
      RtcProviderPackageCatalog.RtcProviderPackageCatalogEntry packageEntry
  ) {
  }

  @FunctionalInterface
  public interface RtcProviderPackageImportFn {
    Object importPackage(RtcResolvedProviderPackageLoadTarget target);
  }

  @FunctionalInterface
  public interface RtcProviderPackageLoaderFn {
    Object load(RtcProviderPackageLoadRequest request);
  }

  public record RtcProviderPackageInstallRequest(
      Object driverManager,
      RtcProviderPackageLoadRequest loadRequest
  ) {
  }

  public static RtcResolvedProviderPackageLoadTarget resolveRtcProviderPackageLoadTarget(
      RtcProviderPackageLoadRequest request
  ) {
    var resolvedRequest = request == null
        ? new RtcProviderPackageLoadRequest(null, null)
        : request;
    var packageByProviderKey = Optional.ofNullable(resolvedRequest.providerKey())
        .flatMap(RtcProviderPackageCatalog::getRtcProviderPackageByProviderKey);
    var packageByIdentity = Optional.ofNullable(resolvedRequest.packageIdentity())
        .flatMap(RtcProviderPackageCatalog::getRtcProviderPackageByPackageIdentity);

    if (packageByProviderKey.isPresent() && packageByIdentity.isPresent()
        && !packageByProviderKey.get().packageIdentity().equals(packageByIdentity.get().packageIdentity())) {
      throw new RtcProviderPackageLoaderException(
          PROVIDER_PACKAGE_IDENTITY_MISMATCH,
          "providerKey and packageIdentity must resolve to the same provider package boundary."
      );
    }

    var resolvedPackage = packageByProviderKey.or(() -> packageByIdentity).orElseThrow(() ->
        new RtcProviderPackageLoaderException(
            PROVIDER_PACKAGE_NOT_FOUND,
            "No official provider package matches the requested provider boundary."
        )
    );

    return new RtcResolvedProviderPackageLoadTarget(resolvedPackage);
  }

  public static RtcProviderPackageLoaderFn createRtcProviderPackageLoader(
      RtcProviderPackageImportFn importPackage
  ) {
    return request -> loadRtcProviderModule(request, importPackage);
  }

  public static Object loadRtcProviderModule(
      RtcProviderPackageLoadRequest request,
      RtcProviderPackageImportFn importPackage
  ) {
    var target = resolveRtcProviderPackageLoadTarget(request);

    try {
      var namespace = importPackage.importPackage(target);
      if (namespace == null) {
        throw new RtcProviderPackageLoaderException(
            PROVIDER_MODULE_EXPORT_MISSING,
            "Reserved provider package loader scaffold requires an executable provider module namespace."
        );
      }

      return namespace;
    } catch (RtcProviderPackageLoaderException error) {
      throw error;
    } catch (RuntimeException error) {
      throw new RtcProviderPackageLoaderException(
          PROVIDER_PACKAGE_LOAD_FAILED,
          "Reserved provider package loader scaffold could not load "
              + target.packageEntry().packageIdentity()
              + ": "
              + error.getMessage()
      );
    }
  }

  public static void installRtcProviderPackage(
      RtcProviderPackageInstallRequest request,
      RtcProviderPackageImportFn importPackage
  ) {
    loadRtcProviderModule(request.loadRequest(), importPackage);

    throw new RtcProviderPackageLoaderException(
        PROVIDER_PACKAGE_LOAD_FAILED,
        "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
    );
  }

  public static void installRtcProviderPackages(
      List<RtcProviderPackageInstallRequest> requests,
      RtcProviderPackageImportFn importPackage
  ) {
    for (var request : requests) {
      loadRtcProviderModule(request.loadRequest(), importPackage);
    }

    if (!requests.isEmpty()) {
      throw new RtcProviderPackageLoaderException(
          PROVIDER_PACKAGE_LOAD_FAILED,
          "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
      );
    }
  }

  public static final class RtcProviderPackageLoaderException extends RuntimeException {
    private final String code;

    public RtcProviderPackageLoaderException(String code, String message) {
      super(message);
      this.code = code;
    }

    public String code() {
      return code;
    }
  }

  private RtcProviderPackageLoader() {
  }
}
`);
    case 'csharp':
      return lines(`
namespace Sdkwork.Rtc.Sdk;

using System;
using System.Collections.Generic;
using System.Linq;

public sealed class RtcProviderPackageLoaderException : Exception
{
    public RtcProviderPackageLoaderException(string code, string message)
        : base(message)
    {
        this.code = code;
    }

    public string code { get; }
}

public sealed record RtcProviderPackageLoadRequest(
    string? providerKey = null,
    string? packageIdentity = null
);

public sealed record RtcResolvedProviderPackageLoadTarget(
    RtcProviderPackageCatalogEntry packageEntry
);

public delegate object? RtcProviderPackageImportFn(RtcResolvedProviderPackageLoadTarget target);
public delegate object? RtcProviderPackageLoaderFn(RtcProviderPackageLoadRequest request);

public sealed record RtcProviderPackageInstallRequest(
    object driverManager,
    RtcProviderPackageLoadRequest loadRequest
);

public static class RtcProviderPackageLoader
{
    public const string ProviderPackageNotFound = "provider_package_not_found";
    public const string ProviderPackageIdentityMismatch = "provider_package_identity_mismatch";
    public const string ProviderPackageLoadFailed = "provider_package_load_failed";
    public const string ProviderModuleExportMissing = "provider_module_export_missing";

    public static RtcResolvedProviderPackageLoadTarget ResolveRtcProviderPackageLoadTarget(
        RtcProviderPackageLoadRequest? request
    )
    {
        request ??= new RtcProviderPackageLoadRequest();
        var packageByProviderKey = string.IsNullOrWhiteSpace(request.providerKey)
            ? null
            : RtcProviderPackageCatalog.GetRtcProviderPackageByProviderKey(request.providerKey!);
        var packageByIdentity = string.IsNullOrWhiteSpace(request.packageIdentity)
            ? null
            : RtcProviderPackageCatalog.GetRtcProviderPackageByPackageIdentity(request.packageIdentity!);

        if (packageByProviderKey is not null
            && packageByIdentity is not null
            && !string.Equals(packageByProviderKey.packageIdentity, packageByIdentity.packageIdentity, StringComparison.Ordinal))
        {
            throw new RtcProviderPackageLoaderException(
                ProviderPackageIdentityMismatch,
                "providerKey and packageIdentity must resolve to the same provider package boundary."
            );
        }

        var resolvedPackage = packageByProviderKey ?? packageByIdentity;
        if (resolvedPackage is null)
        {
            throw new RtcProviderPackageLoaderException(
                ProviderPackageNotFound,
                "No official provider package matches the requested provider boundary."
            );
        }

        return new RtcResolvedProviderPackageLoadTarget(resolvedPackage);
    }

    public static RtcProviderPackageLoaderFn CreateRtcProviderPackageLoader(
        RtcProviderPackageImportFn importPackage
    ) => request => LoadRtcProviderModule(request, importPackage);

    public static object? LoadRtcProviderModule(
        RtcProviderPackageLoadRequest request,
        RtcProviderPackageImportFn importPackage
    )
    {
        var target = ResolveRtcProviderPackageLoadTarget(request);

        try
        {
            var providerModule = importPackage(target);
            if (providerModule is null)
            {
                throw new RtcProviderPackageLoaderException(
                    ProviderModuleExportMissing,
                    "Reserved provider package loader scaffold requires an executable provider module namespace."
                );
            }

            return providerModule;
        }
        catch (RtcProviderPackageLoaderException)
        {
            throw;
        }
        catch (Exception error)
        {
            throw new RtcProviderPackageLoaderException(
                ProviderPackageLoadFailed,
                $"Reserved provider package loader scaffold could not load {target.packageEntry.packageIdentity}: {error.Message}"
            );
        }
    }

    public static void InstallRtcProviderPackage(
        RtcProviderPackageInstallRequest request,
        RtcProviderPackageImportFn importPackage
    )
    {
        _ = LoadRtcProviderModule(request.loadRequest, importPackage);

        throw new RtcProviderPackageLoaderException(
            ProviderPackageLoadFailed,
            "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
        );
    }

    public static void InstallRtcProviderPackages(
        IReadOnlyList<RtcProviderPackageInstallRequest> requests,
        RtcProviderPackageImportFn importPackage
    )
    {
        foreach (var request in requests)
        {
            _ = LoadRtcProviderModule(request.loadRequest, importPackage);
        }

        if (requests.Count > 0)
        {
            throw new RtcProviderPackageLoaderException(
                ProviderPackageLoadFailed,
                "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
            );
        }
    }
}
`);
    case 'swift':
      return lines(`
public struct RtcProviderPackageLoaderException: Error {
    public let code: String
    public let message: String

    public init(code: String, message: String) {
        self.code = code
        self.message = message
    }
}

public struct RtcProviderPackageLoadRequest {
    public let providerKey: String?
    public let packageIdentity: String?

    public init(providerKey: String? = nil, packageIdentity: String? = nil) {
        self.providerKey = providerKey
        self.packageIdentity = packageIdentity
    }
}

public struct RtcResolvedProviderPackageLoadTarget {
    public let packageEntry: RtcProviderPackageCatalogEntry

    public init(packageEntry: RtcProviderPackageCatalogEntry) {
        self.packageEntry = packageEntry
    }
}

public typealias RtcProviderModuleNamespace = [String: String]
public typealias RtcProviderPackageImportFn = (RtcResolvedProviderPackageLoadTarget) throws -> RtcProviderModuleNamespace
public typealias RtcProviderPackageLoader = (RtcProviderPackageLoadRequest) throws -> RtcProviderModuleNamespace

public struct RtcProviderPackageInstallRequest {
    public let driverManager: Any
    public let loadRequest: RtcProviderPackageLoadRequest

    public init(driverManager: Any, loadRequest: RtcProviderPackageLoadRequest) {
        self.driverManager = driverManager
        self.loadRequest = loadRequest
    }
}

public func resolveRtcProviderPackageLoadTarget(
    _ request: RtcProviderPackageLoadRequest
) throws -> RtcResolvedProviderPackageLoadTarget {
    let packageByProviderKey = request.providerKey.flatMap(RtcProviderPackageCatalog.getRtcProviderPackageByProviderKey)
    let packageByIdentity = request.packageIdentity.flatMap(RtcProviderPackageCatalog.getRtcProviderPackageByPackageIdentity)

    if let providerKeyEntry = packageByProviderKey,
       let packageIdentityEntry = packageByIdentity,
       providerKeyEntry.packageIdentity != packageIdentityEntry.packageIdentity {
        throw RtcProviderPackageLoaderException(
            code: "provider_package_identity_mismatch",
            message: "providerKey and packageIdentity must resolve to the same provider package boundary."
        )
    }

    guard let resolvedPackage = packageByProviderKey ?? packageByIdentity else {
        throw RtcProviderPackageLoaderException(
            code: "provider_package_not_found",
            message: "No official provider package matches the requested provider boundary."
        )
    }

    return RtcResolvedProviderPackageLoadTarget(packageEntry: resolvedPackage)
}

public func createRtcProviderPackageLoader(
    importPackage: @escaping RtcProviderPackageImportFn
) -> RtcProviderPackageLoader {
    return { request in
        try loadRtcProviderModule(request, importPackage: importPackage)
    }
}

public func loadRtcProviderModule(
    _ request: RtcProviderPackageLoadRequest,
    importPackage: RtcProviderPackageImportFn
) throws -> RtcProviderModuleNamespace {
    let target = try resolveRtcProviderPackageLoadTarget(request)

    do {
        let namespace = try importPackage(target)
        if namespace.isEmpty {
            throw RtcProviderPackageLoaderException(
                code: "provider_module_export_missing",
                message: "Reserved provider package loader scaffold requires an executable provider module namespace."
            )
        }

        return namespace
    } catch let error as RtcProviderPackageLoaderException {
        throw error
    } catch {
        throw RtcProviderPackageLoaderException(
            code: "provider_package_load_failed",
            message: "Reserved provider package loader scaffold could not load \\(target.packageEntry.packageIdentity): \\(error)"
        )
    }
}

public func installRtcProviderPackage(
    _ request: RtcProviderPackageInstallRequest,
    importPackage: RtcProviderPackageImportFn
) throws {
    _ = try loadRtcProviderModule(request.loadRequest, importPackage: importPackage)

    throw RtcProviderPackageLoaderException(
        code: "provider_package_load_failed",
        message: "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
    )
}

public func installRtcProviderPackages(
    _ requests: [RtcProviderPackageInstallRequest],
    importPackage: RtcProviderPackageImportFn
) throws {
    for request in requests {
        _ = try loadRtcProviderModule(request.loadRequest, importPackage: importPackage)
    }

    if !requests.isEmpty {
        throw RtcProviderPackageLoaderException(
            code: "provider_package_load_failed",
            message: "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
        )
    }
}
`);
    case 'kotlin':
      return lines(`
package com.sdkwork.rtc.metadata

class RtcProviderPackageLoaderException(
    val code: String,
    override val message: String,
) : RuntimeException(message)

data class RtcProviderPackageLoadRequest(
    val providerKey: String? = null,
    val packageIdentity: String? = null,
)

data class RtcResolvedProviderPackageLoadTarget(
    val packageEntry: RtcProviderPackageCatalogEntry,
)

typealias RtcProviderModuleNamespace = Map<String, String>
typealias RtcProviderPackageImportFn = (RtcResolvedProviderPackageLoadTarget) -> RtcProviderModuleNamespace
typealias RtcProviderPackageLoader = (RtcProviderPackageLoadRequest) -> RtcProviderModuleNamespace

data class RtcProviderPackageInstallRequest(
    val driverManager: Any,
    val loadRequest: RtcProviderPackageLoadRequest,
)

fun resolveRtcProviderPackageLoadTarget(
    request: RtcProviderPackageLoadRequest,
): RtcResolvedProviderPackageLoadTarget {
    val packageByProviderKey = request.providerKey?.let { RtcProviderPackageCatalog.getRtcProviderPackageByProviderKey(it) }
    val packageByIdentity = request.packageIdentity?.let { RtcProviderPackageCatalog.getRtcProviderPackageByPackageIdentity(it) }

    if (packageByProviderKey != null
        && packageByIdentity != null
        && packageByProviderKey.packageIdentity != packageByIdentity.packageIdentity
    ) {
        throw RtcProviderPackageLoaderException(
            code = "provider_package_identity_mismatch",
            message = "providerKey and packageIdentity must resolve to the same provider package boundary.",
        )
    }

    val resolvedPackage = packageByProviderKey ?: packageByIdentity
        ?: throw RtcProviderPackageLoaderException(
            code = "provider_package_not_found",
            message = "No official provider package matches the requested provider boundary.",
        )

    return RtcResolvedProviderPackageLoadTarget(packageEntry = resolvedPackage)
}

fun createRtcProviderPackageLoader(
    importPackage: RtcProviderPackageImportFn,
): RtcProviderPackageLoader = { request ->
    loadRtcProviderModule(request, importPackage)
}

fun loadRtcProviderModule(
    request: RtcProviderPackageLoadRequest,
    importPackage: RtcProviderPackageImportFn,
): RtcProviderModuleNamespace {
    val target = resolveRtcProviderPackageLoadTarget(request)

    return try {
        val namespace = importPackage(target)
        if (namespace.isEmpty()) {
            throw RtcProviderPackageLoaderException(
                code = "provider_module_export_missing",
                message = "Reserved provider package loader scaffold requires an executable provider module namespace.",
            )
        }

        namespace
    } catch (error: RtcProviderPackageLoaderException) {
        throw error
    } catch (error: RuntimeException) {
        throw RtcProviderPackageLoaderException(
            code = "provider_package_load_failed",
            message = "Reserved provider package loader scaffold could not load ${'$'}{target.packageEntry.packageIdentity}: ${'$'}{error.message}",
        )
    }
}

fun installRtcProviderPackage(
    request: RtcProviderPackageInstallRequest,
    importPackage: RtcProviderPackageImportFn,
) {
    loadRtcProviderModule(request.loadRequest, importPackage)

    throw RtcProviderPackageLoaderException(
        code = "provider_package_load_failed",
        message = "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
    )
}

fun installRtcProviderPackages(
    requests: Iterable<RtcProviderPackageInstallRequest>,
    importPackage: RtcProviderPackageImportFn,
) {
    val materializedRequests = requests.toList()
    materializedRequests.forEach { request ->
        loadRtcProviderModule(request.loadRequest, importPackage)
    }

    if (materializedRequests.isNotEmpty()) {
        throw RtcProviderPackageLoaderException(
            code = "provider_package_load_failed",
            message = "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
        )
    }
}
`);
    case 'go':
      return lines(`
package rtcstandard

import "fmt"

type RtcProviderPackageLoaderError struct {
	Code    string
	Message string
}

func (e RtcProviderPackageLoaderError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

type RtcProviderPackageLoadRequest struct {
	ProviderKey     string
	PackageIdentity string
}

type RtcResolvedProviderPackageLoadTarget struct {
	PackageEntry RtcProviderPackageCatalogEntry
}

type RtcProviderModuleNamespace map[string]string
type RtcProviderPackageImportFn func(RtcResolvedProviderPackageLoadTarget) (RtcProviderModuleNamespace, error)
type RtcProviderPackageLoader func(RtcProviderPackageLoadRequest) (RtcProviderModuleNamespace, error)

type RtcProviderPackageInstallRequest struct {
	DriverManager any
	LoadRequest   RtcProviderPackageLoadRequest
}

func ResolveRtcProviderPackageLoadTarget(
	request RtcProviderPackageLoadRequest,
) (RtcResolvedProviderPackageLoadTarget, error) {
	var packageByProviderKey *RtcProviderPackageCatalogEntry
	if request.ProviderKey != "" {
		packageByProviderKey = GetRtcProviderPackageByProviderKey(request.ProviderKey)
	}

	var packageByIdentity *RtcProviderPackageCatalogEntry
	if request.PackageIdentity != "" {
		packageByIdentity = GetRtcProviderPackageByPackageIdentity(request.PackageIdentity)
	}

	if packageByProviderKey != nil && packageByIdentity != nil && packageByProviderKey.PackageIdentity != packageByIdentity.PackageIdentity {
		return RtcResolvedProviderPackageLoadTarget{}, RtcProviderPackageLoaderError{
			Code:    "provider_package_identity_mismatch",
			Message: "providerKey and packageIdentity must resolve to the same provider package boundary.",
		}
	}

	resolvedPackage := packageByProviderKey
	if resolvedPackage == nil {
		resolvedPackage = packageByIdentity
	}

	if resolvedPackage == nil {
		return RtcResolvedProviderPackageLoadTarget{}, RtcProviderPackageLoaderError{
			Code:    "provider_package_not_found",
			Message: "No official provider package matches the requested provider boundary.",
		}
	}

	return RtcResolvedProviderPackageLoadTarget{PackageEntry: *resolvedPackage}, nil
}

func CreateRtcProviderPackageLoader(importPackage RtcProviderPackageImportFn) RtcProviderPackageLoader {
	return func(request RtcProviderPackageLoadRequest) (RtcProviderModuleNamespace, error) {
		return LoadRtcProviderModule(request, importPackage)
	}
}

func LoadRtcProviderModule(
	request RtcProviderPackageLoadRequest,
	importPackage RtcProviderPackageImportFn,
) (RtcProviderModuleNamespace, error) {
	target, err := ResolveRtcProviderPackageLoadTarget(request)
	if err != nil {
		return nil, err
	}

	namespace, err := importPackage(target)
	if err != nil {
		return nil, RtcProviderPackageLoaderError{
			Code:    "provider_package_load_failed",
			Message: fmt.Sprintf("Reserved provider package loader scaffold could not load %s: %v", target.PackageEntry.PackageIdentity, err),
		}
	}

	if len(namespace) == 0 {
		return nil, RtcProviderPackageLoaderError{
			Code:    "provider_module_export_missing",
			Message: "Reserved provider package loader scaffold requires an executable provider module namespace.",
		}
	}

	return namespace, nil
}

func InstallRtcProviderPackage(
	request RtcProviderPackageInstallRequest,
	importPackage RtcProviderPackageImportFn,
) error {
	if _, err := LoadRtcProviderModule(request.LoadRequest, importPackage); err != nil {
		return err
	}

	return RtcProviderPackageLoaderError{
		Code:    "provider_package_load_failed",
		Message: "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
	}
}

func InstallRtcProviderPackages(
	requests []RtcProviderPackageInstallRequest,
	importPackage RtcProviderPackageImportFn,
) error {
	for _, request := range requests {
		if _, err := LoadRtcProviderModule(request.LoadRequest, importPackage); err != nil {
			return err
		}
	}

	if len(requests) > 0 {
		return RtcProviderPackageLoaderError{
			Code:    "provider_package_load_failed",
			Message: "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
		}
	}

	return nil
}
`);
    case 'python':
      return lines(`
from dataclasses import dataclass
from typing import Any, Callable

from .provider_package_catalog import (
    RtcProviderPackageCatalogEntry,
    get_rtc_provider_package_by_package_identity,
    get_rtc_provider_package_by_provider_key,
)


class RtcProviderPackageLoaderException(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class RtcProviderPackageLoadRequest:
    providerKey: str | None = None
    packageIdentity: str | None = None


@dataclass(frozen=True)
class RtcResolvedProviderPackageLoadTarget:
    packageEntry: RtcProviderPackageCatalogEntry


RtcProviderModuleNamespace = dict[str, str]
RtcProviderPackageImportFn = Callable[
    [RtcResolvedProviderPackageLoadTarget],
    RtcProviderModuleNamespace,
]
RtcProviderPackageLoader = Callable[
    [RtcProviderPackageLoadRequest],
    RtcProviderModuleNamespace,
]


@dataclass(frozen=True)
class RtcProviderPackageInstallRequest:
    driverManager: Any
    loadRequest: RtcProviderPackageLoadRequest


def resolve_rtc_provider_package_load_target(
    request: RtcProviderPackageLoadRequest,
) -> RtcResolvedProviderPackageLoadTarget:
    package_by_provider_key = (
        get_rtc_provider_package_by_provider_key(request.providerKey)
        if request.providerKey
        else None
    )
    package_by_identity = (
        get_rtc_provider_package_by_package_identity(request.packageIdentity)
        if request.packageIdentity
        else None
    )

    if (
        package_by_provider_key is not None
        and package_by_identity is not None
        and package_by_provider_key.packageIdentity
        != package_by_identity.packageIdentity
    ):
        raise RtcProviderPackageLoaderException(
            "provider_package_identity_mismatch",
            "providerKey and packageIdentity must resolve to the same provider package boundary.",
        )

    resolved_package = package_by_provider_key or package_by_identity
    if resolved_package is None:
        raise RtcProviderPackageLoaderException(
            "provider_package_not_found",
            "No official provider package matches the requested provider boundary.",
        )

    return RtcResolvedProviderPackageLoadTarget(packageEntry=resolved_package)


def create_rtc_provider_package_loader(
    import_package: RtcProviderPackageImportFn,
) -> RtcProviderPackageLoader:
    def _loader(request: RtcProviderPackageLoadRequest) -> RtcProviderModuleNamespace:
        return load_rtc_provider_module(request, import_package)

    return _loader


def load_rtc_provider_module(
    request: RtcProviderPackageLoadRequest,
    import_package: RtcProviderPackageImportFn,
) -> RtcProviderModuleNamespace:
    target = resolve_rtc_provider_package_load_target(request)

    try:
        namespace = import_package(target)
    except RtcProviderPackageLoaderException:
        raise
    except Exception as error:  # pragma: no cover - scaffold-only failure wrapper
        raise RtcProviderPackageLoaderException(
            "provider_package_load_failed",
            f"Reserved provider package loader scaffold could not load {target.packageEntry.packageIdentity}: {error}",
        ) from error

    if not namespace:
        raise RtcProviderPackageLoaderException(
            "provider_module_export_missing",
            "Reserved provider package loader scaffold requires an executable provider module namespace.",
        )

    return namespace


def install_rtc_provider_package(
    request: RtcProviderPackageInstallRequest,
    import_package: RtcProviderPackageImportFn,
) -> None:
    load_rtc_provider_module(request.loadRequest, import_package)
    raise RtcProviderPackageLoaderException(
        "provider_package_load_failed",
        "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
    )


def install_rtc_provider_packages(
    requests: list[RtcProviderPackageInstallRequest],
    import_package: RtcProviderPackageImportFn,
) -> None:
    for request in requests:
        load_rtc_provider_module(request.loadRequest, import_package)

    if requests:
        raise RtcProviderPackageLoaderException(
            "provider_package_load_failed",
            "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
        )
`);
    default:
      return '';
  }
}

function renderReservedLanguageDriverManagerModule(language) {
  switch (language) {
    case 'flutter':
      return lines(`
import 'rtc_errors.dart';
import 'rtc_provider_activation_catalog.dart';
import 'rtc_provider_catalog.dart';
import 'rtc_provider_metadata.dart';
import 'rtc_provider_selection.dart';
import 'rtc_provider_support.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';
import 'providers/volcengine.dart';

final class RtcDriverManager {
  RtcDriverManager({
    this.defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    Iterable<RtcProviderDriver<dynamic>> drivers =
        const <RtcProviderDriver<dynamic>>[],
    bool registerDefaultDrivers = true,
  }) {
    if (registerDefaultDrivers) {
      register(createVolcengineRtcDriver());
    }

    registerAll(drivers);
  }

  final String defaultProviderKey;
  final Map<String, RtcProviderDriver<dynamic>> _drivers =
      <String, RtcProviderDriver<dynamic>>{};

  RtcProviderSelection resolveSelection(
    RtcProviderSelectionRequest request, {
    String? defaultProviderKey,
  }) {
    return resolveRtcProviderSelection(
      request,
      defaultProviderKey: defaultProviderKey ?? this.defaultProviderKey,
    );
  }

  RtcProviderMetadata getMetadata([
    RtcClientConfig config = const RtcClientConfig(),
  ]) {
    final selection = _resolveClientSelection(config);
    final catalogEntry = getRtcProviderByProviderKey(selection.providerKey);
    final driver = _drivers[selection.providerKey];
    if (driver != null) {
      return driver.metadata;
    }

    final officialMetadata =
        catalogEntry == null
            ? null
            : getOfficialRtcProviderMetadataByKey(catalogEntry.providerKey);
    if (officialMetadata != null) {
      return officialMetadata;
    }

    throw RtcSdkException(
      code: 'driver_not_found',
      message: 'No RTC driver registered for provider: \${selection.providerKey}',
      providerKey: selection.providerKey,
    );
  }

  RtcProviderMetadata getDefaultMetadata() {
    return getMetadata(
      RtcClientConfig(defaultProviderKey: defaultProviderKey),
    );
  }

  void register<TNativeClient>(RtcProviderDriver<TNativeClient> driver) {
    _assertCanRegister(driver);
    _drivers[driver.metadata.providerKey] = driver;
  }

  void registerAll(Iterable<RtcProviderDriver<dynamic>> drivers) {
    final plannedProviderKeys = <String>{};

    for (final driver in drivers) {
      _assertCanRegister(
        driver,
        plannedProviderKeys: plannedProviderKeys,
      );
      plannedProviderKeys.add(driver.metadata.providerKey);
    }

    for (final driver in drivers) {
      _drivers[driver.metadata.providerKey] = driver;
    }
  }

  bool hasDriver(String providerKey) => _drivers.containsKey(providerKey);

  RtcProviderDriver<dynamic> resolveDriver(String providerKey) {
    final driver = _drivers[providerKey];
    if (driver != null) {
      return driver;
    }

    throw RtcSdkException(
      code: 'driver_not_found',
      message: 'No RTC driver registered for provider: $providerKey',
      providerKey: providerKey,
    );
  }

  RtcProviderSupport describeProviderSupport(String providerKey) {
    final catalogEntry = getRtcProviderByProviderKey(providerKey);
    final activationEntry = getRtcProviderActivationByProviderKey(providerKey);
    final registered = _drivers.containsKey(providerKey);

    return createRtcProviderSupportState(
      RtcProviderSupportStateRequest(
        providerKey: providerKey,
        builtin: activationEntry?.builtin ?? false,
        official: catalogEntry != null && activationEntry != null,
        registered: registered,
      ),
    );
  }

  List<RtcProviderSupport> listProviderSupport() {
    return RtcProviderCatalog.entries
        .map((entry) => describeProviderSupport(entry.providerKey))
        .toList(growable: false);
  }

  Future<RtcClient<dynamic>> connect([
    RtcClientConfig config = const RtcClientConfig(),
  ]) async {
    final selection = _resolveClientSelection(config);
    final driver = _drivers[selection.providerKey];

    if (driver == null) {
      final catalogEntry = getRtcProviderByProviderKey(selection.providerKey);
      final activationEntry = getRtcProviderActivationByProviderKey(
        selection.providerKey,
      );

      if (catalogEntry != null && activationEntry != null) {
        throw RtcSdkException(
          code: 'provider_not_supported',
          message: 'RTC provider is officially defined but not registered in this runtime: \${selection.providerKey}',
          providerKey: selection.providerKey,
        );
      }

      throw RtcSdkException(
        code: 'driver_not_found',
        message: 'No RTC driver registered for provider: \${selection.providerKey}',
        providerKey: selection.providerKey,
      );
    }

    return driver.connect(
      RtcResolvedClientConfig(
        providerUrl: config.providerUrl,
        providerKey: selection.providerKey,
        tenantOverrideProviderKey: config.tenantOverrideProviderKey,
        deploymentProfileProviderKey: config.deploymentProfileProviderKey,
        defaultProviderKey: config.defaultProviderKey ?? defaultProviderKey,
        nativeConfig: config.nativeConfig,
        selectionSource: selection.source,
      ),
    );
  }

  RtcProviderSelection _resolveClientSelection(RtcClientConfig config) {
    return resolveSelection(
      RtcProviderSelectionRequest(
        providerUrl: config.providerUrl,
        providerKey: config.providerKey,
        tenantOverrideProviderKey: config.tenantOverrideProviderKey,
        deploymentProfileProviderKey: config.deploymentProfileProviderKey,
      ),
      defaultProviderKey: config.defaultProviderKey,
    );
  }

  void _assertCanRegister(
    RtcProviderDriver<dynamic> driver, {
    Set<String> plannedProviderKeys = const <String>{},
  }) {
    final providerKey = driver.metadata.providerKey;
    final catalogEntry = getRtcProviderByProviderKey(providerKey);
    final activationEntry = getRtcProviderActivationByProviderKey(providerKey);
    final officialMetadata = getOfficialRtcProviderMetadataByKey(providerKey);

    if (
      catalogEntry == null ||
      activationEntry == null ||
      officialMetadata == null
    ) {
      throw RtcSdkException(
        code: 'provider_not_official',
        message: 'RTC driver registration requires an official provider catalog entry: $providerKey',
        providerKey: providerKey,
        pluginId: driver.metadata.pluginId,
      );
    }

    if (!_sameProviderMetadata(driver.metadata, officialMetadata)) {
      throw RtcSdkException(
        code: 'provider_metadata_mismatch',
        message: 'RTC driver metadata must match the official provider catalog: $providerKey',
        providerKey: providerKey,
        pluginId: driver.metadata.pluginId,
        details: <String, Object?>{
          'expectedMetadata': officialMetadata.toDebugMap(),
          'receivedMetadata': driver.metadata.toDebugMap(),
        },
      );
    }

    if (_drivers.containsKey(providerKey) || plannedProviderKeys.contains(providerKey)) {
      throw RtcSdkException(
        code: 'driver_already_registered',
        message: 'RTC driver already registered for provider: $providerKey',
        providerKey: providerKey,
        pluginId: driver.metadata.pluginId,
      );
    }
  }

  bool _sameProviderMetadata(
    RtcProviderMetadata actual,
    RtcProviderMetadata expected,
  ) {
    return actual.providerKey == expected.providerKey &&
        actual.pluginId == expected.pluginId &&
        actual.driverId == expected.driverId &&
        actual.displayName == expected.displayName &&
        actual.defaultSelected == expected.defaultSelected &&
        _sameStringList(actual.requiredCapabilities, expected.requiredCapabilities) &&
        _sameStringList(actual.optionalCapabilities, expected.optionalCapabilities) &&
        _sameStringList(actual.extensionKeys, expected.extensionKeys);
  }

  bool _sameStringList(List<String> actual, List<String> expected) {
    if (actual.length != expected.length) {
      return false;
    }

    for (var index = 0; index < actual.length; index += 1) {
      if (actual[index] != expected[index]) {
        return false;
      }
    }

    return true;
  }
}
`);
    case 'rust':
      return lines(`
use crate::provider_activation_catalog::get_rtc_provider_activation_by_provider_key;
use crate::provider_catalog::{get_rtc_provider_by_provider_key, OFFICIAL_RTC_PROVIDERS};
use crate::provider_selection::{
    resolve_rtc_provider_selection, RtcProviderSelection, RtcProviderSelectionRequest,
};
use crate::provider_support::{
    create_rtc_provider_support_state, RtcProviderSupport, RtcProviderSupportStateRequest,
};

pub struct RtcDriverManager;

impl RtcDriverManager {
    #[allow(non_snake_case)]
    pub fn resolveSelection(
        &self,
        request: &RtcProviderSelectionRequest,
        defaultProviderKey: Option<&str>,
    ) -> RtcProviderSelection {
        resolve_rtc_provider_selection(request, defaultProviderKey)
    }

    #[allow(non_snake_case)]
    pub fn describeProviderSupport(&self, providerKey: &str) -> RtcProviderSupport {
        let official = get_rtc_provider_by_provider_key(providerKey).is_some();
        let activation = get_rtc_provider_activation_by_provider_key(providerKey);

        create_rtc_provider_support_state(RtcProviderSupportStateRequest {
            providerKey: providerKey.to_string(),
            builtin: activation.is_some_and(|entry| entry.builtin),
            official,
            registered: activation.is_some_and(|entry| entry.runtimeBridge),
        })
    }

    #[allow(non_snake_case)]
    pub fn listProviderSupport(&self) -> Vec<RtcProviderSupport> {
        OFFICIAL_RTC_PROVIDERS
            .iter()
            .map(|entry| self.describeProviderSupport(entry.providerKey))
            .collect()
    }
}
`);
    case 'java':
      return lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;

public final class RtcDriverManager {

  public RtcProviderSelection resolveSelection(
      RtcProviderSelection.RtcProviderSelectionRequest request
  ) {
    return resolveSelection(request, RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY);
  }

  public RtcProviderSelection resolveSelection(
      RtcProviderSelection.RtcProviderSelectionRequest request,
      String defaultProviderKey
  ) {
    return RtcProviderSelection.resolveRtcProviderSelection(request, defaultProviderKey);
  }

  public RtcProviderSupport describeProviderSupport(String providerKey) {
    var official = RtcProviderCatalog.getRtcProviderByProviderKey(providerKey).isPresent();
    var activation = RtcProviderActivationCatalog.getRtcProviderActivationByProviderKey(providerKey);

    return RtcProviderSupport.createRtcProviderSupportState(
        new RtcProviderSupport.RtcProviderSupportStateRequest(
            providerKey,
            activation
                .map(RtcProviderActivationCatalog.RtcProviderActivationCatalogEntry::builtin)
                .orElse(false),
            official,
            activation
                .map(RtcProviderActivationCatalog.RtcProviderActivationCatalogEntry::runtimeBridge)
                .orElse(false)
        )
    );
  }

  public List<RtcProviderSupport> listProviderSupport() {
    return RtcProviderCatalog.ENTRIES.stream()
        .map(entry -> describeProviderSupport(entry.providerKey()))
        .toList();
  }
}
`);
    case 'csharp':
      return lines(`
namespace Sdkwork.Rtc.Sdk;

using System.Linq;

public sealed class RtcDriverManager
{
    public RtcProviderSelection ResolveSelection(
        RtcProviderSelectionRequest? request = null,
        string defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    )
    {
        return RtcProviderSelection.ResolveRtcProviderSelection(request, defaultProviderKey);
    }

    public RtcProviderSupport DescribeProviderSupport(string providerKey)
    {
        var official = RtcProviderCatalog.GetRtcProviderByProviderKey(providerKey) is not null;
        var activation = RtcProviderActivationCatalog.GetRtcProviderActivationByProviderKey(providerKey);

        return RtcProviderSupport.CreateRtcProviderSupportState(
            new RtcProviderSupportStateRequest(
                providerKey,
                activation?.builtin ?? false,
                official,
                activation?.runtimeBridge ?? false
            )
        );
    }

    public IReadOnlyList<RtcProviderSupport> ListProviderSupport()
    {
        return RtcProviderCatalog.Entries
            .Select(entry => DescribeProviderSupport(entry.providerKey))
            .ToArray();
    }
}
`);
    case 'swift':
      return lines(`
public struct RtcDriverManager {
    public init() {}

    public func resolveSelection(
        request: RtcProviderSelectionRequest = RtcProviderSelectionRequest(),
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    ) -> RtcProviderSelection {
        return RtcProviderSelection.resolveRtcProviderSelection(
            request: request,
            defaultProviderKey: defaultProviderKey
        )
    }

    public func describeProviderSupport(providerKey: String) -> RtcProviderSupport {
        let official = RtcProviderCatalog.getRtcProviderByProviderKey(providerKey) != nil
        let activation = RtcProviderActivationCatalog.getRtcProviderActivationByProviderKey(providerKey)

        return RtcProviderSupport.createRtcProviderSupportState(
            .init(
                providerKey: providerKey,
                builtin: activation?.builtin ?? false,
                official: official,
                registered: activation?.runtimeBridge ?? false
            )
        )
    }

    public func listProviderSupport() -> [RtcProviderSupport] {
        RtcProviderCatalog.entries.map { describeProviderSupport(providerKey: $0.providerKey) }
    }
}
`);
    case 'kotlin':
      return lines(`
package com.sdkwork.rtc.metadata

class RtcDriverManager {
    fun resolveSelection(
        request: RtcProviderSelectionRequest = RtcProviderSelectionRequest(),
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    ): RtcProviderSelection {
        return resolveRtcProviderSelection(request, defaultProviderKey)
    }

    fun describeProviderSupport(providerKey: String): RtcProviderSupport {
        val official = getRtcProviderByProviderKey(providerKey) != null
        val activation = getRtcProviderActivationByProviderKey(providerKey)

        return createRtcProviderSupportState(
            RtcProviderSupportStateRequest(
                providerKey = providerKey,
                builtin = activation?.builtin ?: false,
                official = official,
                registered = activation?.runtimeBridge ?: false,
            )
        )
    }

    fun listProviderSupport(): List<RtcProviderSupport> {
        return RtcProviderCatalog.entries.map { describeProviderSupport(it.providerKey) }
    }
}
`);
    case 'go':
      return lines(`
package rtcstandard

type RtcDriverManager struct{}

func (manager RtcDriverManager) resolveSelection(request RtcProviderSelectionRequest, defaultProviderKey string) RtcProviderSelection {
    return ResolveRtcProviderSelection(request, defaultProviderKey)
}

func (manager RtcDriverManager) ResolveSelection(request RtcProviderSelectionRequest, defaultProviderKey string) RtcProviderSelection {
    return manager.resolveSelection(request, defaultProviderKey)
}

func (manager RtcDriverManager) describeProviderSupport(providerKey string) RtcProviderSupport {
    official := GetRtcProviderByProviderKey(providerKey) != nil
    activation := GetRtcProviderActivationByProviderKey(providerKey)

    return CreateRtcProviderSupportState(RtcProviderSupportStateRequest{
        ProviderKey: providerKey,
        Builtin:     activation != nil && activation.Builtin,
        Official:    official,
        Registered:  activation != nil && activation.RuntimeBridge,
    })
}

func (manager RtcDriverManager) DescribeProviderSupport(providerKey string) RtcProviderSupport {
    return manager.describeProviderSupport(providerKey)
}

func (manager RtcDriverManager) listProviderSupport() []RtcProviderSupport {
    supports := make([]RtcProviderSupport, 0, len(OFFICIAL_RTC_PROVIDERS))
    for _, entry := range OFFICIAL_RTC_PROVIDERS {
        supports = append(supports, manager.describeProviderSupport(entry.ProviderKey))
    }
    return supports
}

func (manager RtcDriverManager) ListProviderSupport() []RtcProviderSupport {
    return manager.listProviderSupport()
}
`);
    case 'python':
      return lines(`
from .provider_activation_catalog import get_rtc_provider_activation_by_provider_key
from .provider_catalog import (
    DEFAULT_RTC_PROVIDER_KEY,
    RtcProviderCatalog,
    get_rtc_provider_by_provider_key,
)
from .provider_selection import (
    RtcProviderSelection,
    RtcProviderSelectionRequest,
    resolve_rtc_provider_selection,
)
from .provider_support import (
    RtcProviderSupport,
    RtcProviderSupportStateRequest,
    create_rtc_provider_support_state,
)


class RtcDriverManager:
    def resolveSelection(
        self,
        request: RtcProviderSelectionRequest | None = None,
        *,
        defaultProviderKey: str = DEFAULT_RTC_PROVIDER_KEY,
    ) -> RtcProviderSelection:
        return resolve_rtc_provider_selection(
            request,
            default_provider_key=defaultProviderKey,
        )

    def describeProviderSupport(self, providerKey: str) -> RtcProviderSupport:
        official = get_rtc_provider_by_provider_key(providerKey) is not None
        activation = get_rtc_provider_activation_by_provider_key(providerKey)

        return create_rtc_provider_support_state(
            RtcProviderSupportStateRequest(
                providerKey=providerKey,
                builtin=activation.builtin if activation is not None else False,
                official=official,
                registered=activation.runtimeBridge if activation is not None else False,
            )
        )

    def listProviderSupport(self) -> list[RtcProviderSupport]:
        return [
            self.describeProviderSupport(entry.providerKey)
            for entry in RtcProviderCatalog.entries
        ]
`);
    default:
      return '';
  }
}

function renderReservedLanguageDataSourceModule(language) {
  switch (language) {
    case 'flutter':
      return lines(`
import 'rtc_driver_manager.dart';
import 'rtc_provider_catalog.dart';
import 'rtc_provider_selection.dart';
import 'rtc_provider_support.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';

final class RtcDataSourceOptions extends RtcClientConfig {
  const RtcDataSourceOptions({
    super.providerUrl,
    super.providerKey,
    super.tenantOverrideProviderKey,
    super.deploymentProfileProviderKey,
    super.defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    super.nativeConfig,
  });
}

RtcDataSourceOptions _mergeOptions(
  RtcDataSourceOptions base,
  RtcDataSourceOptions? overrides,
) {
  if (overrides == null) {
    return base;
  }

  return RtcDataSourceOptions(
    providerUrl: overrides.providerUrl ?? base.providerUrl,
    providerKey: overrides.providerKey ?? base.providerKey,
    tenantOverrideProviderKey:
        overrides.tenantOverrideProviderKey ?? base.tenantOverrideProviderKey,
    deploymentProfileProviderKey:
        overrides.deploymentProfileProviderKey ?? base.deploymentProfileProviderKey,
    defaultProviderKey: overrides.defaultProviderKey ?? base.defaultProviderKey,
    nativeConfig: overrides.nativeConfig ?? base.nativeConfig,
  );
}

final class RtcDataSource {
  RtcDataSource({
    RtcDataSourceOptions? options,
    RtcDriverManager? driverManager,
  })  : options = options ?? const RtcDataSourceOptions(),
        driverManager = driverManager ?? RtcDriverManager();

  final RtcDataSourceOptions options;
  final RtcDriverManager driverManager;

  RtcProviderMetadata describe([RtcDataSourceOptions? overrides]) {
    return driverManager.getMetadata(
      _mergeOptions(options, overrides),
    );
  }

  RtcProviderSelection describeSelection([RtcDataSourceOptions? overrides]) {
    final merged = _mergeOptions(options, overrides);
    return driverManager.resolveSelection(
      RtcProviderSelectionRequest(
        providerUrl: merged.providerUrl,
        providerKey: merged.providerKey,
        tenantOverrideProviderKey: merged.tenantOverrideProviderKey,
        deploymentProfileProviderKey: merged.deploymentProfileProviderKey,
      ),
      defaultProviderKey: merged.defaultProviderKey,
    );
  }

  RtcProviderSupport describeProviderSupport([RtcDataSourceOptions? overrides]) {
    final selection = describeSelection(overrides);
    return driverManager.describeProviderSupport(selection.providerKey);
  }

  List<RtcProviderSupport> listProviderSupport() {
    return driverManager.listProviderSupport();
  }

  bool supportsCapability(
    String capability, [
    RtcDataSourceOptions? overrides,
  ]) {
    final metadata = describe(overrides);
    return metadata.requiredCapabilities.contains(capability) ||
        metadata.optionalCapabilities.contains(capability);
  }

  bool supportsProviderExtension(
    String extensionKey, [
    RtcDataSourceOptions? overrides,
  ]) {
    return describe(overrides).extensionKeys.contains(extensionKey);
  }

  Future<RtcClient<TNativeClient>> createClient<TNativeClient>([
    RtcDataSourceOptions? overrides,
  ]) async {
    return await driverManager.connect(
          _mergeOptions(options, overrides),
        )
        as RtcClient<TNativeClient>;
  }
}
`);
    case 'rust':
      return '';
    case 'java':
      return lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;

final class RtcDataSourceOptions {

  public final String providerUrl;
  public final String providerKey;
  public final String tenantOverrideProviderKey;
  public final String deploymentProfileProviderKey;
  public final String defaultProviderKey;

  public RtcDataSourceOptions() {
    this(null, null, null, null, RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY);
  }

  public RtcDataSourceOptions(
      String providerUrl,
      String providerKey,
      String tenantOverrideProviderKey,
      String deploymentProfileProviderKey,
      String defaultProviderKey
  ) {
    this.providerUrl = providerUrl;
    this.providerKey = providerKey;
    this.tenantOverrideProviderKey = tenantOverrideProviderKey;
    this.deploymentProfileProviderKey = deploymentProfileProviderKey;
    this.defaultProviderKey = defaultProviderKey;
  }
}

public final class RtcDataSource {

  private final RtcDataSourceOptions options;
  private final RtcDriverManager driverManager;

  public RtcDataSource() {
    this(new RtcDataSourceOptions(), new RtcDriverManager());
  }

  public RtcDataSource(
      RtcDataSourceOptions options,
      RtcDriverManager driverManager
  ) {
    this.options = options == null ? new RtcDataSourceOptions() : options;
    this.driverManager = driverManager == null ? new RtcDriverManager() : driverManager;
  }

  public RtcProviderSelection describeSelection() {
    return describeSelection(null);
  }

  public RtcProviderSelection describeSelection(RtcDataSourceOptions overrides) {
    var merged = merge(options, overrides);
    return driverManager.resolveSelection(
        new RtcProviderSelection.RtcProviderSelectionRequest(
            merged.providerUrl,
            merged.providerKey,
            merged.tenantOverrideProviderKey,
            merged.deploymentProfileProviderKey
        ),
        merged.defaultProviderKey
    );
  }

  public RtcProviderSupport describeProviderSupport() {
    return describeProviderSupport(null);
  }

  public RtcProviderSupport describeProviderSupport(RtcDataSourceOptions overrides) {
    return driverManager.describeProviderSupport(describeSelection(overrides).providerKey());
  }

  public List<RtcProviderSupport> listProviderSupport() {
    return driverManager.listProviderSupport();
  }

  private static RtcDataSourceOptions merge(
      RtcDataSourceOptions base,
      RtcDataSourceOptions overrides
  ) {
    if (overrides == null) {
      return base;
    }

    return new RtcDataSourceOptions(
        overrides.providerUrl != null ? overrides.providerUrl : base.providerUrl,
        overrides.providerKey != null ? overrides.providerKey : base.providerKey,
        overrides.tenantOverrideProviderKey != null
            ? overrides.tenantOverrideProviderKey
            : base.tenantOverrideProviderKey,
        overrides.deploymentProfileProviderKey != null
            ? overrides.deploymentProfileProviderKey
            : base.deploymentProfileProviderKey,
        overrides.defaultProviderKey == null || overrides.defaultProviderKey.isBlank()
            ? base.defaultProviderKey
            : overrides.defaultProviderKey
    );
  }
}
`);
    case 'csharp':
      return lines(`
namespace Sdkwork.Rtc.Sdk;

public sealed record RtcDataSourceOptions(
    string? providerUrl = null,
    string? providerKey = null,
    string? tenantOverrideProviderKey = null,
    string? deploymentProfileProviderKey = null,
    string defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
);

public sealed class RtcDataSource
{
    private readonly RtcDataSourceOptions _options;
    private readonly RtcDriverManager _driverManager;

    public RtcDataSource(
        RtcDataSourceOptions? options = null,
        RtcDriverManager? driverManager = null
    )
    {
        _options = options ?? new RtcDataSourceOptions();
        _driverManager = driverManager ?? new RtcDriverManager();
    }

    public RtcProviderSelection DescribeSelection(RtcDataSourceOptions? overrides = null)
    {
        var merged = merge(_options, overrides);
        return _driverManager.ResolveSelection(
            new RtcProviderSelectionRequest(
                merged.providerUrl,
                merged.providerKey,
                merged.tenantOverrideProviderKey,
                merged.deploymentProfileProviderKey
            ),
            merged.defaultProviderKey
        );
    }

    public RtcProviderSupport DescribeProviderSupport(RtcDataSourceOptions? overrides = null)
    {
        return _driverManager.DescribeProviderSupport(DescribeSelection(overrides).providerKey);
    }

    public IReadOnlyList<RtcProviderSupport> ListProviderSupport()
    {
        return _driverManager.ListProviderSupport();
    }

    private static RtcDataSourceOptions merge(
        RtcDataSourceOptions baseOptions,
        RtcDataSourceOptions? overrides
    )
    {
        if (overrides is null)
        {
            return baseOptions;
        }

        return new RtcDataSourceOptions(
            overrides.providerUrl ?? baseOptions.providerUrl,
            overrides.providerKey ?? baseOptions.providerKey,
            overrides.tenantOverrideProviderKey ?? baseOptions.tenantOverrideProviderKey,
            overrides.deploymentProfileProviderKey ?? baseOptions.deploymentProfileProviderKey,
            string.IsNullOrWhiteSpace(overrides.defaultProviderKey)
                ? baseOptions.defaultProviderKey
                : overrides.defaultProviderKey
        );
    }
}
`);
    case 'swift':
      return lines(`
public struct RtcDataSourceOptions {
    public let providerUrl: String?
    public let providerKey: String?
    public let tenantOverrideProviderKey: String?
    public let deploymentProfileProviderKey: String?
    public let defaultProviderKey: String

    public init(
        providerUrl: String? = nil,
        providerKey: String? = nil,
        tenantOverrideProviderKey: String? = nil,
        deploymentProfileProviderKey: String? = nil,
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    ) {
        self.providerUrl = providerUrl
        self.providerKey = providerKey
        self.tenantOverrideProviderKey = tenantOverrideProviderKey
        self.deploymentProfileProviderKey = deploymentProfileProviderKey
        self.defaultProviderKey = defaultProviderKey
    }
}

public struct RtcDataSource {
    public let options: RtcDataSourceOptions
    public let driverManager: RtcDriverManager

    public init(
        options: RtcDataSourceOptions = RtcDataSourceOptions(),
        driverManager: RtcDriverManager = RtcDriverManager()
    ) {
        self.options = options
        self.driverManager = driverManager
    }

    public func describeSelection(_ overrides: RtcDataSourceOptions? = nil) -> RtcProviderSelection {
        let merged = merge(options, overrides)
        return driverManager.resolveSelection(
            request: RtcProviderSelectionRequest(
                providerUrl: merged.providerUrl,
                providerKey: merged.providerKey,
                tenantOverrideProviderKey: merged.tenantOverrideProviderKey,
                deploymentProfileProviderKey: merged.deploymentProfileProviderKey
            ),
            defaultProviderKey: merged.defaultProviderKey
        )
    }

    public func describeProviderSupport(_ overrides: RtcDataSourceOptions? = nil) -> RtcProviderSupport {
        let selection = describeSelection(overrides)
        return driverManager.describeProviderSupport(providerKey: selection.providerKey)
    }

    public func listProviderSupport() -> [RtcProviderSupport] {
        driverManager.listProviderSupport()
    }

    private func merge(_ base: RtcDataSourceOptions, _ overrides: RtcDataSourceOptions?) -> RtcDataSourceOptions {
        guard let overrides else {
            return base
        }

        return RtcDataSourceOptions(
            providerUrl: overrides.providerUrl ?? base.providerUrl,
            providerKey: overrides.providerKey ?? base.providerKey,
            tenantOverrideProviderKey: overrides.tenantOverrideProviderKey ?? base.tenantOverrideProviderKey,
            deploymentProfileProviderKey: overrides.deploymentProfileProviderKey ?? base.deploymentProfileProviderKey,
            defaultProviderKey: overrides.defaultProviderKey.isEmpty ? base.defaultProviderKey : overrides.defaultProviderKey
        )
    }
}
`);
    case 'kotlin':
      return lines(`
package com.sdkwork.rtc.metadata

data class RtcDataSourceOptions(
    val providerUrl: String? = null,
    val providerKey: String? = null,
    val tenantOverrideProviderKey: String? = null,
    val deploymentProfileProviderKey: String? = null,
    val defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
)

class RtcDataSource(
    private val options: RtcDataSourceOptions = RtcDataSourceOptions(),
    private val driverManager: RtcDriverManager = RtcDriverManager(),
) {
    fun describeSelection(overrides: RtcDataSourceOptions? = null): RtcProviderSelection {
        val merged = merge(options, overrides)
        return driverManager.resolveSelection(
            request = RtcProviderSelectionRequest(
                providerUrl = merged.providerUrl,
                providerKey = merged.providerKey,
                tenantOverrideProviderKey = merged.tenantOverrideProviderKey,
                deploymentProfileProviderKey = merged.deploymentProfileProviderKey,
            ),
            defaultProviderKey = merged.defaultProviderKey,
        )
    }

    fun describeProviderSupport(overrides: RtcDataSourceOptions? = null): RtcProviderSupport {
        return driverManager.describeProviderSupport(describeSelection(overrides).providerKey)
    }

    fun listProviderSupport(): List<RtcProviderSupport> {
        return driverManager.listProviderSupport()
    }

    private fun merge(
        base: RtcDataSourceOptions,
        overrides: RtcDataSourceOptions?,
    ): RtcDataSourceOptions {
        if (overrides == null) {
            return base
        }

        return RtcDataSourceOptions(
            providerUrl = overrides.providerUrl ?: base.providerUrl,
            providerKey = overrides.providerKey ?: base.providerKey,
            tenantOverrideProviderKey = overrides.tenantOverrideProviderKey ?: base.tenantOverrideProviderKey,
            deploymentProfileProviderKey = overrides.deploymentProfileProviderKey ?: base.deploymentProfileProviderKey,
            defaultProviderKey = overrides.defaultProviderKey.ifBlank { base.defaultProviderKey },
        )
    }
}
`);
    case 'go':
      return lines(`
package rtcstandard

type RtcDataSourceOptions struct {
    ProviderUrl                  string
    ProviderKey                  string
    TenantOverrideProviderKey    string
    DeploymentProfileProviderKey string
    DefaultProviderKey           string
}

type RtcDataSource struct {
    options       RtcDataSourceOptions
    driverManager RtcDriverManager
}

func NewRtcDataSourceOptions() RtcDataSourceOptions {
    return RtcDataSourceOptions{
        DefaultProviderKey: DEFAULT_RTC_PROVIDER_KEY,
    }
}

func NewRtcDataSource(options RtcDataSourceOptions, driverManager RtcDriverManager) RtcDataSource {
    if !hasText(options.DefaultProviderKey) {
        options.DefaultProviderKey = DEFAULT_RTC_PROVIDER_KEY
    }

    return RtcDataSource{
        options:       options,
        driverManager: driverManager,
    }
}

func mergeRtcDataSourceOptions(base RtcDataSourceOptions, overrides *RtcDataSourceOptions) RtcDataSourceOptions {
    if overrides == nil {
        return base
    }

    merged := base
    if overrides.ProviderUrl != "" {
        merged.ProviderUrl = overrides.ProviderUrl
    }
    if overrides.ProviderKey != "" {
        merged.ProviderKey = overrides.ProviderKey
    }
    if overrides.TenantOverrideProviderKey != "" {
        merged.TenantOverrideProviderKey = overrides.TenantOverrideProviderKey
    }
    if overrides.DeploymentProfileProviderKey != "" {
        merged.DeploymentProfileProviderKey = overrides.DeploymentProfileProviderKey
    }
    if overrides.DefaultProviderKey != "" {
        merged.DefaultProviderKey = overrides.DefaultProviderKey
    }

    return merged
}

func (dataSource RtcDataSource) describeSelection(overrides *RtcDataSourceOptions) RtcProviderSelection {
    merged := mergeRtcDataSourceOptions(dataSource.options, overrides)
    return dataSource.driverManager.resolveSelection(
        RtcProviderSelectionRequest{
            ProviderUrl:                  merged.ProviderUrl,
            ProviderKey:                  merged.ProviderKey,
            TenantOverrideProviderKey:    merged.TenantOverrideProviderKey,
            DeploymentProfileProviderKey: merged.DeploymentProfileProviderKey,
        },
        merged.DefaultProviderKey,
    )
}

func (dataSource RtcDataSource) DescribeSelection(overrides *RtcDataSourceOptions) RtcProviderSelection {
    return dataSource.describeSelection(overrides)
}

func (dataSource RtcDataSource) describeProviderSupport(overrides *RtcDataSourceOptions) RtcProviderSupport {
    selection := dataSource.describeSelection(overrides)
    return dataSource.driverManager.describeProviderSupport(selection.ProviderKey)
}

func (dataSource RtcDataSource) DescribeProviderSupport(overrides *RtcDataSourceOptions) RtcProviderSupport {
    return dataSource.describeProviderSupport(overrides)
}

func (dataSource RtcDataSource) listProviderSupport() []RtcProviderSupport {
    return dataSource.driverManager.listProviderSupport()
}

func (dataSource RtcDataSource) ListProviderSupport() []RtcProviderSupport {
    return dataSource.listProviderSupport()
}
`);
    case 'python':
      return '';
    default:
      return '';
  }
}

function splitPackageIdentity(packageIdentity) {
  if (!String(packageIdentity).includes(':')) {
    return {
      groupId: null,
      artifactId: String(packageIdentity),
    };
  }

  const [groupId, artifactId] = String(packageIdentity).split(':', 2);
  return { groupId, artifactId };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderReservedLanguageProviderPackageScaffoldPlan(languageEntry, assembly) {
  if (!languageEntry.providerPackageScaffold) {
    return [];
  }

  const providers = assembly.providers ?? [];
  const providerPackageScaffold = languageEntry.providerPackageScaffold;
  const packageRows = providers
    .map(
      (provider) => {
        const providerPascal = toPascalCase(provider.providerKey);
        const packageIdentity = materializeProviderPackagePattern(
          providerPackageScaffold.packagePattern,
          provider.providerKey,
        );
        const directoryPath = materializeProviderPackagePattern(
          providerPackageScaffold.directoryPattern,
          provider.providerKey,
        );
        const manifestPath = buildProviderPackageManifestPath(
          providerPackageScaffold,
          provider.providerKey,
        );
        const readmePath = buildProviderPackageReadmePath(
          providerPackageScaffold,
          provider.providerKey,
        );
        const sourcePath = buildProviderPackageSourcePath(
          providerPackageScaffold,
          provider.providerKey,
        );
        const sourceSymbol = buildProviderPackageSourceSymbol(
          providerPackageScaffold,
          provider.providerKey,
        );

        return `| \`${provider.providerKey}\` | \`${providerPascal}\` | \`${packageIdentity}\` | \`${directoryPath}\` | \`${manifestPath}\` | \`${readmePath}\` | \`${sourcePath}\` | \`${sourceSymbol}\` |`;
      },
    )
    .join('\n');

  return [
    {
      relativePath: `${languageEntry.workspace}/${providerPackageScaffold.relativePath}`,
      content: lines(`
# ${languageEntry.displayName} Provider Package Scaffold

Reserved provider package scaffold for future ${languageEntry.displayName} RTC adapters.

- directory pattern: \`${providerPackageScaffold.directoryPattern}\`
- package pattern: \`${providerPackageScaffold.packagePattern}\`
- manifest file name: \`${providerPackageScaffold.manifestFileName}\`
- readme file name: \`${providerPackageScaffold.readmeFileName}\`
- source file pattern: \`${providerPackageScaffold.sourceFilePattern}\`
- source symbol pattern: \`${providerPackageScaffold.sourceSymbolPattern}\`
- template tokens: ${renderTemplateTokenList(providerPackageScaffold.templateTokens)}
- source template tokens: ${renderTemplateTokenList(providerPackageScaffold.sourceTemplateTokens)}
- status: \`${providerPackageScaffold.status}\`
- runtime bridge status: \`${providerPackageScaffold.runtimeBridgeStatus}\`
- root public exposure: \`${providerPackageScaffold.rootPublic}\`

Rules:

- one provider per package boundary
- bind each package to one official providerKey from the assembly-driven provider catalog
- preserve providerKey, pluginId, and driverId alignment with the official provider catalog
- wrap the official vendor SDK instead of re-implementing media runtime
- materialize one metadata-only source stub per provider package boundary before runtime bridge work lands
- keep the package outside the workspace root public API until a verified runtime bridge lands
- keep the status fixed at \`${providerPackageScaffold.status}\` until a language-specific runtime bridge is verified
- keep runtime bridge status fixed at \`${providerPackageScaffold.runtimeBridgeStatus}\` until the provider package becomes executable
- keep root public exposure fixed at \`false\` until the provider becomes a verified builtin baseline

| Provider key | Provider pascal | Package identity | Directory path | Manifest path | README path | Source path | Source symbol |
| --- | --- | --- | --- | --- | --- | --- | --- |
${packageRows}
`),
    },
  ];
}

function renderReservedProviderPackageReadme(languageEntry, provider, providerPackageScaffold) {
  const packageIdentity = materializeProviderPackagePattern(
    providerPackageScaffold.packagePattern,
    provider.providerKey,
  );
  const directoryPath = materializeProviderPackagePattern(
    providerPackageScaffold.directoryPattern,
    provider.providerKey,
  );
  const manifestPath = buildProviderPackageManifestPath(providerPackageScaffold, provider.providerKey);
  const readmePath = buildProviderPackageReadmePath(providerPackageScaffold, provider.providerKey);
  const sourcePath = buildProviderPackageSourcePath(providerPackageScaffold, provider.providerKey);
  const sourceSymbol = buildProviderPackageSourceSymbol(
    providerPackageScaffold,
    provider.providerKey,
  );

  return lines(`
# ${languageEntry.displayName} ${provider.displayName} Provider Package

Reserved ${languageEntry.displayName} provider package boundary for ${provider.displayName}.

- provider key: \`${provider.providerKey}\`
- plugin id: \`${provider.pluginId}\`
- driver id: \`${provider.driverId}\`
- package identity: \`${packageIdentity}\`
- directory path: \`${directoryPath}\`
- manifest path: \`${manifestPath}\`
- readme path: \`${readmePath}\`
- source path: \`${sourcePath}\`
- source symbol: \`${sourceSymbol}\`
- builtin provider: \`${provider.builtin}\`
- status: \`${providerPackageScaffold.status}\`
- runtime bridge status: \`${providerPackageScaffold.runtimeBridgeStatus}\`
- root public exposure: \`${providerPackageScaffold.rootPublic}\`

Rules:

- one provider per package boundary
- preserve providerKey, pluginId, and driverId alignment with the official provider catalog
- wrap the official vendor SDK instead of re-implementing media runtime
- keep the source scaffold metadata-only until a verified runtime bridge lands
- do not expose this package through the root public API in the current landing
- no runtime bridge ships in the current reserved package boundary
`);
}

function renderReservedProviderPackageManifest(languageEntry, provider, providerPackageScaffold) {
  const packageIdentity = materializeProviderPackagePattern(
    providerPackageScaffold.packagePattern,
    provider.providerKey,
  );
  const sourcePath = buildProviderPackageSourceRelativePath(
    providerPackageScaffold,
    provider.providerKey,
  );
  const sourceRoot = buildProviderPackageSourceRoot(
    providerPackageScaffold,
    provider.providerKey,
  );
  const sourceSymbol = buildProviderPackageSourceSymbol(
    providerPackageScaffold,
    provider.providerKey,
  );

  switch (languageEntry.language) {
    case 'flutter':
      return lines(`
name: ${packageIdentity}
description: >
  Reserved Flutter provider package boundary for ${provider.displayName}.
  providerKey: ${provider.providerKey}
  pluginId: ${provider.pluginId}
  driverId: ${provider.driverId}
  status: ${providerPackageScaffold.status}
  runtimeBridgeStatus: ${providerPackageScaffold.runtimeBridgeStatus}
publish_to: none
version: 0.1.0

environment:
  sdk: ">=3.4.0 <4.0.0"

sdkwork_rtc_provider:
  providerKey: ${provider.providerKey}
  pluginId: ${provider.pluginId}
  driverId: ${provider.driverId}
  packageIdentity: ${packageIdentity}
  sourcePath: ${sourcePath}
  sourceSymbol: ${sourceSymbol}
  rootPublic: ${providerPackageScaffold.rootPublic}
  status: ${providerPackageScaffold.status}
  runtimeBridgeStatus: ${providerPackageScaffold.runtimeBridgeStatus}
`);
    case 'rust':
      return lines(`
[package]
name = ${q(packageIdentity)}
version = "0.1.0"
edition = "2021"
description = ${q(`Reserved Rust provider package boundary for ${provider.displayName}`)}
license = "UNLICENSED"
publish = false

[lib]
path = ${q(sourcePath)}

[package.metadata.sdkwork-rtc-provider]
providerKey = ${q(provider.providerKey)}
pluginId = ${q(provider.pluginId)}
driverId = ${q(provider.driverId)}
packageIdentity = ${q(packageIdentity)}
sourcePath = ${q(sourcePath)}
sourceSymbol = ${q(sourceSymbol)}
rootPublic = ${providerPackageScaffold.rootPublic ? 'true' : 'false'}
status = ${q(providerPackageScaffold.status)}
runtimeBridgeStatus = ${q(providerPackageScaffold.runtimeBridgeStatus)}
`);
    case 'java': {
      const { groupId, artifactId } = splitPackageIdentity(packageIdentity);
      return lines(`
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${escapeXml(groupId ?? packageIdentity)}</groupId>
  <artifactId>${escapeXml(artifactId)}</artifactId>
  <version>0.1.0</version>
  <name>${escapeXml(packageIdentity)}</name>
  <description>${escapeXml(`Reserved Java provider package boundary for ${provider.displayName}`)}</description>

  <properties>
    <sdkwork.rtc.providerKey>${escapeXml(provider.providerKey)}</sdkwork.rtc.providerKey>
    <sdkwork.rtc.pluginId>${escapeXml(provider.pluginId)}</sdkwork.rtc.pluginId>
    <sdkwork.rtc.driverId>${escapeXml(provider.driverId)}</sdkwork.rtc.driverId>
    <sdkwork.rtc.packageIdentity>${escapeXml(packageIdentity)}</sdkwork.rtc.packageIdentity>
    <sdkwork.rtc.sourcePath>${escapeXml(sourcePath)}</sdkwork.rtc.sourcePath>
    <sdkwork.rtc.sourceSymbol>${escapeXml(sourceSymbol)}</sdkwork.rtc.sourceSymbol>
    <sdkwork.rtc.rootPublic>${escapeXml(String(providerPackageScaffold.rootPublic))}</sdkwork.rtc.rootPublic>
    <sdkwork.rtc.status>${escapeXml(providerPackageScaffold.status)}</sdkwork.rtc.status>
    <sdkwork.rtc.runtimeBridgeStatus>${escapeXml(providerPackageScaffold.runtimeBridgeStatus)}</sdkwork.rtc.runtimeBridgeStatus>
  </properties>
</project>
`);
    }
    case 'csharp':
      return lines(`
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <AssemblyName>${escapeXml(packageIdentity)}</AssemblyName>
    <RootNamespace>${escapeXml(packageIdentity)}</RootNamespace>
    <PackageId>${escapeXml(packageIdentity)}</PackageId>
    <Version>0.1.0</Version>
    <Description>${escapeXml(`Reserved C# provider package boundary for ${provider.displayName}`)}</Description>
    <IsPackable>true</IsPackable>
    <SdkworkRtcProviderKey>${escapeXml(provider.providerKey)}</SdkworkRtcProviderKey>
    <SdkworkRtcPluginId>${escapeXml(provider.pluginId)}</SdkworkRtcPluginId>
    <SdkworkRtcDriverId>${escapeXml(provider.driverId)}</SdkworkRtcDriverId>
    <SdkworkRtcSourcePath>${escapeXml(sourcePath)}</SdkworkRtcSourcePath>
    <SdkworkRtcSourceSymbol>${escapeXml(sourceSymbol)}</SdkworkRtcSourceSymbol>
    <SdkworkRtcRootPublic>${escapeXml(String(providerPackageScaffold.rootPublic))}</SdkworkRtcRootPublic>
    <SdkworkRtcStatus>${escapeXml(providerPackageScaffold.status)}</SdkworkRtcStatus>
    <SdkworkRtcRuntimeBridgeStatus>${escapeXml(providerPackageScaffold.runtimeBridgeStatus)}</SdkworkRtcRuntimeBridgeStatus>
  </PropertyGroup>
</Project>
`);
    case 'swift':
      return lines(`
// providerKey: ${provider.providerKey}
// pluginId: ${provider.pluginId}
// driverId: ${provider.driverId}
// packageIdentity: ${packageIdentity}
// sourcePath: ${sourcePath}
// sourceSymbol: ${sourceSymbol}
// rootPublic: ${providerPackageScaffold.rootPublic}
// status: ${providerPackageScaffold.status}
// runtimeBridgeStatus: ${providerPackageScaffold.runtimeBridgeStatus}

import PackageDescription

let package = Package(
    name: ${q(packageIdentity)},
    products: [
        .library(
            name: ${q(packageIdentity)},
            targets: [${q(packageIdentity)}]
        ),
    ],
    targets: [
        .target(
            name: ${q(packageIdentity)},
            path: ${q(sourceRoot)}
        ),
    ]
)
`);
    case 'kotlin': {
      const { groupId } = splitPackageIdentity(packageIdentity);
      return lines(`
group = ${q(groupId ?? 'com.sdkwork')}
version = "0.1.0"
description = ${q(`Reserved Kotlin provider package boundary for ${provider.displayName}`)}

extra["sdkworkRtcProviderKey"] = ${q(provider.providerKey)}
extra["sdkworkRtcPluginId"] = ${q(provider.pluginId)}
extra["sdkworkRtcDriverId"] = ${q(provider.driverId)}
extra["sdkworkRtcPackageIdentity"] = ${q(packageIdentity)}
extra["sdkworkRtcSourcePath"] = ${q(sourcePath)}
extra["sdkworkRtcSourceSymbol"] = ${q(sourceSymbol)}
extra["sdkworkRtcRootPublic"] = ${q(String(providerPackageScaffold.rootPublic))}
extra["sdkworkRtcStatus"] = ${q(providerPackageScaffold.status)}
extra["sdkworkRtcRuntimeBridgeStatus"] = ${q(providerPackageScaffold.runtimeBridgeStatus)}
`);
    }
    case 'go':
      return lines(`
module ${packageIdentity}

go 1.22

// providerKey: ${provider.providerKey}
// pluginId: ${provider.pluginId}
// driverId: ${provider.driverId}
// sourcePath: ${sourcePath}
// sourceSymbol: ${sourceSymbol}
// rootPublic: ${providerPackageScaffold.rootPublic}
// status: ${providerPackageScaffold.status}
// runtimeBridgeStatus: ${providerPackageScaffold.runtimeBridgeStatus}
`);
    case 'python':
      return lines(`
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = ${q(packageIdentity)}
version = "0.1.0"
description = ${q(`Reserved Python provider package boundary for ${provider.displayName}`)}
requires-python = ">=3.11"

[tool.setuptools]
packages = [${q(sourceRoot)}]

[tool.sdkwork-rtc-provider]
providerKey = ${q(provider.providerKey)}
pluginId = ${q(provider.pluginId)}
driverId = ${q(provider.driverId)}
packageIdentity = ${q(packageIdentity)}
sourcePath = ${q(sourcePath)}
sourceSymbol = ${q(sourceSymbol)}
rootPublic = ${providerPackageScaffold.rootPublic ? 'true' : 'false'}
status = ${q(providerPackageScaffold.status)}
runtimeBridgeStatus = ${q(providerPackageScaffold.runtimeBridgeStatus)}
`);
    default:
      throw new Error(`Unsupported reserved provider package manifest materialization: ${languageEntry.language}`);
  }
}

function renderReservedProviderPackageSource(languageEntry, provider, providerPackageScaffold) {
  const packageIdentity = materializeProviderPackagePattern(
    providerPackageScaffold.packagePattern,
    provider.providerKey,
  );
  const sourceSymbol = buildProviderPackageSourceSymbol(
    providerPackageScaffold,
    provider.providerKey,
  );

  switch (languageEntry.language) {
    case 'flutter':
      return lines(`
/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
final class ${sourceSymbol} {
  static const String providerKey = ${q(provider.providerKey)};
  static const String pluginId = ${q(provider.pluginId)};
  static const String driverId = ${q(provider.driverId)};
  static const String packageIdentity = ${q(packageIdentity)};
  static const String status = ${q(providerPackageScaffold.status)};
  static const String runtimeBridgeStatus = ${q(providerPackageScaffold.runtimeBridgeStatus)};
  static const bool rootPublic = ${providerPackageScaffold.rootPublic ? 'true' : 'false'};

  const ${sourceSymbol}._();
}
`);
    case 'rust':
      return lines(`
/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
pub struct ${sourceSymbol};

impl ${sourceSymbol} {
    pub const PROVIDER_KEY: &'static str = ${q(provider.providerKey)};
    pub const PLUGIN_ID: &'static str = ${q(provider.pluginId)};
    pub const DRIVER_ID: &'static str = ${q(provider.driverId)};
    pub const PACKAGE_IDENTITY: &'static str = ${q(packageIdentity)};
    pub const STATUS: &'static str = ${q(providerPackageScaffold.status)};
    pub const RUNTIME_BRIDGE_STATUS: &'static str = ${q(providerPackageScaffold.runtimeBridgeStatus)};
    pub const ROOT_PUBLIC: bool = ${providerPackageScaffold.rootPublic ? 'true' : 'false'};
}
`);
    case 'java':
      return lines(`
package com.sdkwork.rtc.provider.${provider.providerKey};

/**
 * Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
 */
public final class ${sourceSymbol} {
  public static final String PROVIDER_KEY = ${q(provider.providerKey)};
  public static final String PLUGIN_ID = ${q(provider.pluginId)};
  public static final String DRIVER_ID = ${q(provider.driverId)};
  public static final String PACKAGE_IDENTITY = ${q(packageIdentity)};
  public static final String STATUS = ${q(providerPackageScaffold.status)};
  public static final String RUNTIME_BRIDGE_STATUS = ${q(providerPackageScaffold.runtimeBridgeStatus)};
  public static final boolean ROOT_PUBLIC = ${providerPackageScaffold.rootPublic ? 'true' : 'false'};

  private ${sourceSymbol}() {
  }
}
`);
    case 'csharp':
      return lines(`
namespace ${packageIdentity};

/// <summary>
/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
/// </summary>
public static class ${sourceSymbol}
{
    public const string ProviderKey = ${q(provider.providerKey)};
    public const string PluginId = ${q(provider.pluginId)};
    public const string DriverId = ${q(provider.driverId)};
    public const string PackageIdentity = ${q(packageIdentity)};
    public const string Status = ${q(providerPackageScaffold.status)};
    public const string RuntimeBridgeStatus = ${q(providerPackageScaffold.runtimeBridgeStatus)};
    public const bool RootPublic = ${providerPackageScaffold.rootPublic ? 'true' : 'false'};
}
`);
    case 'swift':
      return lines(`
/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
public enum ${sourceSymbol} {
    public static let providerKey = ${q(provider.providerKey)}
    public static let pluginId = ${q(provider.pluginId)}
    public static let driverId = ${q(provider.driverId)}
    public static let packageIdentity = ${q(packageIdentity)}
    public static let status = ${q(providerPackageScaffold.status)}
    public static let runtimeBridgeStatus = ${q(providerPackageScaffold.runtimeBridgeStatus)}
    public static let rootPublic = ${providerPackageScaffold.rootPublic ? 'true' : 'false'}
}
`);
    case 'kotlin':
      return lines(`
package com.sdkwork.rtc.provider.${provider.providerKey}

/**
 * Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
 */
object ${sourceSymbol} {
    const val PROVIDER_KEY: String = ${q(provider.providerKey)}
    const val PLUGIN_ID: String = ${q(provider.pluginId)}
    const val DRIVER_ID: String = ${q(provider.driverId)}
    const val PACKAGE_IDENTITY: String = ${q(packageIdentity)}
    const val STATUS: String = ${q(providerPackageScaffold.status)}
    const val RUNTIME_BRIDGE_STATUS: String = ${q(providerPackageScaffold.runtimeBridgeStatus)}
    const val ROOT_PUBLIC: Boolean = ${providerPackageScaffold.rootPublic ? 'true' : 'false'}
}
`);
    case 'go':
      return lines(`
package rtcprovider

// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
type ${sourceSymbol} struct{}

const (
	${sourceSymbol}ProviderKey = ${q(provider.providerKey)}
	${sourceSymbol}PluginID = ${q(provider.pluginId)}
	${sourceSymbol}DriverID = ${q(provider.driverId)}
	${sourceSymbol}PackageIdentity = ${q(packageIdentity)}
	${sourceSymbol}Status = ${q(providerPackageScaffold.status)}
	${sourceSymbol}RuntimeBridgeStatus = ${q(providerPackageScaffold.runtimeBridgeStatus)}
)

const ${sourceSymbol}RootPublic = ${providerPackageScaffold.rootPublic ? 'true' : 'false'}
`);
    case 'python':
      return lines(`
"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class ${sourceSymbol}:
    provider_key = ${q(provider.providerKey)}
    plugin_id = ${q(provider.pluginId)}
    driver_id = ${q(provider.driverId)}
    package_identity = ${q(packageIdentity)}
    status = ${q(providerPackageScaffold.status)}
    runtime_bridge_status = ${q(providerPackageScaffold.runtimeBridgeStatus)}
    root_public = ${providerPackageScaffold.rootPublic ? 'True' : 'False'}


__all__ = [${q(sourceSymbol)}]
`);
    default:
      throw new Error(`Unsupported reserved provider package source materialization: ${languageEntry.language}`);
  }
}

function renderReservedLanguageProviderPackageBoundaryPlan(languageEntry, assembly) {
  if (!languageEntry.providerPackageScaffold) {
    return [];
  }

  return (assembly.providers ?? []).flatMap((provider) => {
    const directoryPath = materializeProviderPackagePattern(
      languageEntry.providerPackageScaffold.directoryPattern,
      provider.providerKey,
    );
    const manifestFileName = materializeProviderPackagePattern(
      languageEntry.providerPackageScaffold.manifestFileName,
      provider.providerKey,
    );

    return [
      {
        relativePath: `${languageEntry.workspace}/${directoryPath}/${languageEntry.providerPackageScaffold.readmeFileName}`,
        content: renderReservedProviderPackageReadme(
          languageEntry,
          provider,
          languageEntry.providerPackageScaffold,
        ),
      },
      {
        relativePath: `${languageEntry.workspace}/${directoryPath}/${manifestFileName}`,
        content: renderReservedProviderPackageManifest(
          languageEntry,
          provider,
          languageEntry.providerPackageScaffold,
        ),
      },
      {
        relativePath: `${languageEntry.workspace}/${buildProviderPackageSourcePath(
          languageEntry.providerPackageScaffold,
          provider.providerKey,
        )}`,
        content: renderReservedProviderPackageSource(
          languageEntry,
          provider,
          languageEntry.providerPackageScaffold,
        ),
      },
    ];
  });
}

function renderFlutterReservedLanguagePlan(languageEntry, assembly) {
  const providers = assembly.providers ?? [];
  const capabilities = assembly.capabilityCatalog ?? [];
  const extensions = assembly.providerExtensionCatalog ?? [];
  const providerPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
    languageEntry,
    providers,
  );

  const providerEntries = providers
    .map(
      (provider) => `    RtcProviderCatalogEntry(
      providerKey: ${q(provider.providerKey)},
      pluginId: ${q(provider.pluginId)},
      driverId: ${q(provider.driverId)},
      defaultSelected: ${provider.defaultSelected ? 'true' : 'false'},
    )`,
    )
    .join(',\n');

  const providerPackageEntries = providerPackageCatalogEntries
    .map(
      (entry) => `    RtcProviderPackageCatalogEntry(
      providerKey: ${q(entry.providerKey)},
      pluginId: ${q(entry.pluginId)},
      driverId: ${q(entry.driverId)},
      packageIdentity: ${q(entry.packageIdentity)},
      manifestPath: ${q(entry.manifestPath)},
      readmePath: ${q(entry.readmePath)},
      sourcePath: ${q(entry.sourcePath)},
      sourceSymbol: ${q(entry.sourceSymbol)},
      builtin: ${entry.builtin ? 'true' : 'false'},
      rootPublic: ${entry.rootPublic ? 'true' : 'false'},
      status: ${q(entry.status)},
      runtimeBridgeStatus: ${q(entry.runtimeBridgeStatus)},
    )`,
    )
    .join(',\n');

  const capabilityEntries = capabilities
    .map(
      (descriptor) => `    RtcCapabilityCatalogEntry(
      capabilityKey: ${q(descriptor.capabilityKey)},
      category: ${q(descriptor.category)},
      surface: ${q(descriptor.surface)},
    )`,
    )
    .join(',\n');

  const extensionEntries = extensions
    .map(
      (descriptor) => `        RtcProviderExtensionCatalogEntry(
          extensionKey: ${q(descriptor.extensionKey)},
          providerKey: ${q(descriptor.providerKey)},
          displayName: ${q(descriptor.displayName)},
          surface: ${q(descriptor.surface)},
          access: ${q(descriptor.access)},
          status: ${q(descriptor.status)},
        )`,
    )
    .join(',\n');

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      content: lines(`
name: ${languageEntry.publicPackage}
description: >
  ${languageEntry.runtimeBridge ? `Flutter RTC runtime baseline for ${languageEntry.publicPackage}.` : `Reserved Flutter package scaffold for ${languageEntry.publicPackage}.`}
  build system: ${languageEntry.packageScaffold.buildSystem}
publish_to: none
version: 0.1.0

environment:
  sdk: ">=3.4.0 <4.0.0"

dependencies:
${renderFlutterRuntimeBaselineDependencies(languageEntry)}

dev_dependencies:
  flutter_test:
    sdk: flutter

flutter:
  uses-material-design: false
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      content: lines(`
import 'rtc_provider_selection.dart';
import 'rtc_types.dart';

abstract interface class RtcProviderDriver<TNativeClient> {
  RtcProviderMetadata get metadata;
  Future<RtcClient<TNativeClient>> connect(RtcResolvedClientConfig config);
}

abstract interface class RtcClient<TNativeClient> {
  RtcProviderMetadata get metadata;
  RtcProviderSelection get selection;
  Future<RtcSessionDescriptor> join(RtcJoinOptions options);
  Future<RtcSessionDescriptor> leave();
  Future<RtcTrackPublication> publish(RtcPublishOptions options);
  Future<void> unpublish(String trackId);
  Future<RtcMuteState> muteAudio(bool muted);
  Future<RtcMuteState> muteVideo(bool muted);
  List<String> getProviderExtensions();
  bool supportsProviderExtension(String extensionKey);
  bool supportsCapability(String capability);
  void requireCapability(String capability);
  TNativeClient unwrap();
}

abstract interface class RtcRuntimeController<TNativeClient> {
  Future<RtcSessionDescriptor> join(
    RtcJoinOptions options,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<RtcSessionDescriptor> leave(
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<RtcTrackPublication> publish(
    RtcPublishOptions options,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<void> unpublish(
    String trackId,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<RtcMuteState> muteAudio(
    bool muted,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<RtcMuteState> muteVideo(
    bool muted,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
}

final class RtcStandardContract {
  static const String symbol = 'RtcStandardContract';
  static const List<String> jdbcStyleResolutionTypes = <String>[
    'RtcDriverManager',
    'RtcDataSource',
  ];
  static const List<String> runtimeSurfaceMethods = <String>[
    'join',
    'leave',
    'publish',
    'unpublish',
    'muteAudio',
    'muteVideo',
  ];
  static const String runtimeSurfaceFailureCode = 'native_sdk_not_available';

  const RtcStandardContract._();
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/lib/src/rtc_signaling_transport.dart`,
      content: lines(`
import 'rtc_signaling_adapter.dart';

const String rtcSignalingTransportTerm = 'websocket-only';
const String rtcSignalingTransportAuthConfigPath =
    'connectOptions.webSocketAuth';
const String rtcSignalingTransportAuthPassThroughTerm =
    'signaling-adapter-pass-through';
const List<String> rtcSignalingTransportAuthModeTerms = <String>[
  'automatic',
  'headerBearer',
  'queryBearer',
  'none',
];
const String rtcSignalingTransportRecommendedAuthMode = 'automatic';
const String rtcSignalingTransportDeviceIdAuthorityTerm =
    'top-level-device-id';
const String rtcSignalingTransportConnectOptionsDeviceIdRuleTerm =
    'must-match-top-level-device-id';
const String rtcSignalingTransportLiveConnectionTerm =
    'shared-rtc-live-connection';
const String rtcSignalingTransportPollingFallbackTerm = 'not-supported';
const String rtcSignalingTransportAuthFailureTerm = 'fail-fast';

const Map<String, Object> rtcSignalingTransportStandard = <String, Object>{
  'transportTerm': rtcSignalingTransportTerm,
  'authConfigPath': rtcSignalingTransportAuthConfigPath,
  'authPassThroughTerm': rtcSignalingTransportAuthPassThroughTerm,
  'authModeTerms': rtcSignalingTransportAuthModeTerms,
  'recommendedAuthMode': rtcSignalingTransportRecommendedAuthMode,
  'deviceIdAuthorityTerm': rtcSignalingTransportDeviceIdAuthorityTerm,
  'connectOptionsDeviceIdRuleTerm':
      rtcSignalingTransportConnectOptionsDeviceIdRuleTerm,
  'liveConnectionTerm': rtcSignalingTransportLiveConnectionTerm,
  'pollingFallbackTerm': rtcSignalingTransportPollingFallbackTerm,
  'authFailureTerm': rtcSignalingTransportAuthFailureTerm,
};

class RtcSignalingTransportDescriptor {
  const RtcSignalingTransportDescriptor({
    required this.deviceId,
    required this.connectOptionsDeviceId,
    required this.authMode,
    required this.usesSharedLiveConnection,
    required this.transportTerm,
    required this.authConfigPath,
    required this.authPassThroughTerm,
    required this.recommendedAuthMode,
    required this.deviceIdAuthorityTerm,
    required this.connectOptionsDeviceIdRuleTerm,
    required this.liveConnectionTerm,
    required this.pollingFallbackTerm,
    required this.authFailureTerm,
  });

  final String deviceId;
  final String? connectOptionsDeviceId;
  final String authMode;
  final bool usesSharedLiveConnection;
  final String transportTerm;
  final String authConfigPath;
  final String authPassThroughTerm;
  final String recommendedAuthMode;
  final String deviceIdAuthorityTerm;
  final String connectOptionsDeviceIdRuleTerm;
  final String liveConnectionTerm;
  final String pollingFallbackTerm;
  final String authFailureTerm;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'deviceId': deviceId,
      'connectOptionsDeviceId': connectOptionsDeviceId,
      'authMode': authMode,
      'usesSharedLiveConnection': usesSharedLiveConnection,
      'transportTerm': transportTerm,
      'authConfigPath': authConfigPath,
      'authPassThroughTerm': authPassThroughTerm,
      'recommendedAuthMode': recommendedAuthMode,
      'deviceIdAuthorityTerm': deviceIdAuthorityTerm,
      'connectOptionsDeviceIdRuleTerm': connectOptionsDeviceIdRuleTerm,
      'liveConnectionTerm': liveConnectionTerm,
      'pollingFallbackTerm': pollingFallbackTerm,
      'authFailureTerm': authFailureTerm,
    };
  }
}

String _normalizeRtcSignalingTransportDeviceId(String deviceId) {
  final normalized = deviceId.trim();
  if (normalized.isEmpty) {
    throw ArgumentError.value(
      deviceId,
      'deviceId',
      'RTC signaling deviceId must not be empty.',
    );
  }
  return normalized;
}

String _resolveRtcSignalingTransportAuthMode(
  RtcSignalingConnectOptions? connectOptions,
) {
  final authMode = connectOptions?.webSocketAuth?.mode.name;
  if (authMode == null) {
    return rtcSignalingTransportRecommendedAuthMode;
  }

  if (!rtcSignalingTransportAuthModeTerms.contains(authMode)) {
    throw ArgumentError.value(
      authMode,
      'connectOptions.webSocketAuth.mode',
      'Unsupported RTC signaling auth mode.',
    );
  }

  return authMode;
}

RtcSignalingTransportDescriptor describeRtcSignalingTransport({
  required String deviceId,
  RtcSignalingConnectOptions? connectOptions,
  RtcSignalingLiveConnection? liveConnection,
}) {
  final normalizedDeviceId = _normalizeRtcSignalingTransportDeviceId(deviceId);
  final connectOptionsDeviceId = connectOptions?.deviceId == null
      ? null
      : _normalizeRtcSignalingTransportDeviceId(connectOptions!.deviceId!);

  if (connectOptionsDeviceId != null &&
      connectOptionsDeviceId != normalizedDeviceId) {
    throw ArgumentError.value(
      connectOptionsDeviceId,
      'connectOptions.deviceId',
      'RTC signaling deviceId must match connectOptions.deviceId when both are provided.',
    );
  }

  return RtcSignalingTransportDescriptor(
    deviceId: normalizedDeviceId,
    connectOptionsDeviceId: connectOptionsDeviceId,
    authMode: _resolveRtcSignalingTransportAuthMode(connectOptions),
    usesSharedLiveConnection: liveConnection != null,
    transportTerm: rtcSignalingTransportTerm,
    authConfigPath: rtcSignalingTransportAuthConfigPath,
    authPassThroughTerm: rtcSignalingTransportAuthPassThroughTerm,
    recommendedAuthMode: rtcSignalingTransportRecommendedAuthMode,
    deviceIdAuthorityTerm: rtcSignalingTransportDeviceIdAuthorityTerm,
    connectOptionsDeviceIdRuleTerm:
        rtcSignalingTransportConnectOptionsDeviceIdRuleTerm,
    liveConnectionTerm: rtcSignalingTransportLiveConnectionTerm,
    pollingFallbackTerm: rtcSignalingTransportPollingFallbackTerm,
    authFailureTerm: rtcSignalingTransportAuthFailureTerm,
  );
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      content: lines(`
final class RtcProviderCatalogEntry {
  const RtcProviderCatalogEntry({
    required this.providerKey,
    required this.pluginId,
    required this.driverId,
    required this.defaultSelected,
  });

  final String providerKey;
  final String pluginId;
  final String driverId;
  final bool defaultSelected;
}

final class RtcProviderCatalog {
  static const String DEFAULT_RTC_PROVIDER_KEY = ${q(assembly.defaults?.providerKey ?? 'volcengine')};

  static const List<RtcProviderCatalogEntry> entries = <RtcProviderCatalogEntry>[
${providerEntries}
  ];

  const RtcProviderCatalog._();
}

${renderReservedLanguageProviderCatalogLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      content: lines(`
final class RtcProviderPackageCatalogEntry {
  const RtcProviderPackageCatalogEntry({
    required this.providerKey,
    required this.pluginId,
    required this.driverId,
    required this.packageIdentity,
    required this.manifestPath,
    required this.readmePath,
    required this.sourcePath,
    required this.sourceSymbol,
    required this.builtin,
    required this.rootPublic,
    required this.status,
    required this.runtimeBridgeStatus,
  });

  final String providerKey;
  final String pluginId;
  final String driverId;
  final String packageIdentity;
  final String manifestPath;
  final String readmePath;
  final String sourcePath;
  final String sourceSymbol;
  final bool builtin;
  final bool rootPublic;
  final String status;
  final String runtimeBridgeStatus;
}

final class RtcProviderPackageCatalog {
  static const List<RtcProviderPackageCatalogEntry> entries =
      <RtcProviderPackageCatalogEntry>[
${providerPackageEntries}
      ];

  const RtcProviderPackageCatalog._();
}

${renderReservedLanguageProviderPackageLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      content: lines(`
final class RtcCapabilityCatalogEntry {
  const RtcCapabilityCatalogEntry({
    required this.capabilityKey,
    required this.category,
    required this.surface,
  });

  final String capabilityKey;
  final String category;
  final String surface;
}

final class RtcCapabilityCatalog {
  static const List<RtcCapabilityCatalogEntry> entries = <RtcCapabilityCatalogEntry>[
${capabilityEntries}
  ];

  const RtcCapabilityCatalog._();
}

${renderReservedLanguageCapabilityLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      content: lines(`
final class RtcProviderExtensionCatalogEntry {
  const RtcProviderExtensionCatalogEntry({
    required this.extensionKey,
    required this.providerKey,
    required this.displayName,
    required this.surface,
    required this.access,
    required this.status,
  });

  final String extensionKey;
  final String providerKey;
  final String displayName;
  final String surface;
  final String access;
  final String status;
}

final class RtcProviderExtensionCatalog {
  static const List<String> recognizedSurfaces = <String>[
    'control-plane',
    'runtime-bridge',
    'cross-surface',
  ];

  static const List<String> recognizedAccessModes = <String>[
    'unwrap-only',
    'extension-object',
  ];

  static const List<String> recognizedStatuses = <String>[
    'reference-baseline',
    'reserved',
  ];

  static const List<RtcProviderExtensionCatalogEntry> entries =
      <RtcProviderExtensionCatalogEntry>[
${extensionEntries}
      ];

  const RtcProviderExtensionCatalog._();
}

${renderReservedLanguageProviderExtensionLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      content: lines(`
enum RtcProviderSelectionSource {
  provider_url,
  provider_key,
  tenant_override,
  deployment_profile,
  default_provider,
}

final class RtcProviderSelection {
  const RtcProviderSelection({
    required this.providerKey,
    required this.source,
  });

  final String providerKey;
  final RtcProviderSelectionSource source;
}

final class RtcProviderSelectionRequest {
  const RtcProviderSelectionRequest({
    this.providerUrl,
    this.providerKey,
    this.tenantOverrideProviderKey,
    this.deploymentProfileProviderKey,
  });

  final String? providerUrl;
  final String? providerKey;
  final String? tenantOverrideProviderKey;
  final String? deploymentProfileProviderKey;
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      content: renderReservedLanguageDriverManagerModule(languageEntry.language),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      content: lines(`
import 'rtc_driver_manager.dart';
import 'rtc_provider_catalog.dart';
import 'rtc_provider_selection.dart';
import 'rtc_provider_support.dart';

final class RtcDataSourceOptions {
  const RtcDataSourceOptions({
    this.providerUrl,
    this.providerKey,
    this.tenantOverrideProviderKey,
    this.deploymentProfileProviderKey,
    this.defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
  });

  final String? providerUrl;
  final String? providerKey;
  final String? tenantOverrideProviderKey;
  final String? deploymentProfileProviderKey;
  final String defaultProviderKey;
}

RtcDataSourceOptions _mergeOptions(
  RtcDataSourceOptions base,
  RtcDataSourceOptions? overrides,
) {
  if (overrides == null) {
    return base;
  }

  return RtcDataSourceOptions(
    providerUrl: overrides.providerUrl ?? base.providerUrl,
    providerKey: overrides.providerKey ?? base.providerKey,
    tenantOverrideProviderKey:
        overrides.tenantOverrideProviderKey ?? base.tenantOverrideProviderKey,
    deploymentProfileProviderKey:
        overrides.deploymentProfileProviderKey ?? base.deploymentProfileProviderKey,
    defaultProviderKey: overrides.defaultProviderKey,
  );
}

final class RtcDataSource {
  const RtcDataSource({
    this.options = const RtcDataSourceOptions(),
    this.driverManager = const RtcDriverManager(),
  });

  final RtcDataSourceOptions options;
  final RtcDriverManager driverManager;

  RtcProviderSelection describeSelection([RtcDataSourceOptions? overrides]) {
    final merged = _mergeOptions(options, overrides);
    return driverManager.resolveSelection(
      RtcProviderSelectionRequest(
        providerUrl: merged.providerUrl,
        providerKey: merged.providerKey,
        tenantOverrideProviderKey: merged.tenantOverrideProviderKey,
        deploymentProfileProviderKey: merged.deploymentProfileProviderKey,
      ),
      defaultProviderKey: merged.defaultProviderKey,
    );
  }

  RtcProviderSupport describeProviderSupport([RtcDataSourceOptions? overrides]) {
    final selection = describeSelection(overrides);
    return driverManager.describeProviderSupport(selection.providerKey);
  }

  List<RtcProviderSupport> listProviderSupport() {
    return driverManager.listProviderSupport();
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      content: lines(`
enum RtcProviderSupportStatus {
  builtin_registered,
  official_registered,
  official_unregistered,
  unknown,
}

final class RtcProviderSupport {
  const RtcProviderSupport({
    required this.providerKey,
    required this.status,
    required this.builtin,
    required this.official,
    required this.registered,
  });

  final String providerKey;
  final RtcProviderSupportStatus status;
  final bool builtin;
  final bool official;
  final bool registered;
}
`),
    },
  ];
}

function renderRustReservedLanguagePlan(languageEntry, assembly) {
  const providers = assembly.providers ?? [];
  const capabilities = assembly.capabilityCatalog ?? [];
  const extensions = assembly.providerExtensionCatalog ?? [];
  const providerPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
    languageEntry,
    providers,
  );

  const providerEntries = providers
    .map(
      (provider) =>
        `    RtcProviderCatalogEntry { providerKey: ${q(provider.providerKey)}, pluginId: ${q(provider.pluginId)}, driverId: ${q(provider.driverId)}, defaultSelected: ${provider.defaultSelected ? 'true' : 'false'} },`,
    )
    .join('\n');

  const providerPackageEntries = providerPackageCatalogEntries
    .map(
      (entry) =>
        `    RtcProviderPackageCatalogEntry { providerKey: ${q(entry.providerKey)}, pluginId: ${q(entry.pluginId)}, driverId: ${q(entry.driverId)}, packageIdentity: ${q(entry.packageIdentity)}, manifestPath: ${q(entry.manifestPath)}, readmePath: ${q(entry.readmePath)}, sourcePath: ${q(entry.sourcePath)}, sourceSymbol: ${q(entry.sourceSymbol)}, builtin: ${entry.builtin ? 'true' : 'false'}, rootPublic: ${entry.rootPublic ? 'true' : 'false'}, status: ${q(entry.status)}, runtimeBridgeStatus: ${q(entry.runtimeBridgeStatus)} },`,
    )
    .join('\n');

  const capabilityEntries = capabilities
    .map(
      (descriptor) =>
        `    RtcCapabilityCatalogEntry { capabilityKey: ${q(descriptor.capabilityKey)}, category: ${q(descriptor.category)}, surface: ${q(descriptor.surface)} },`,
    )
    .join('\n');

  const extensionEntries = extensions
    .map(
      (descriptor) =>
        `    RtcProviderExtensionCatalogEntry { extensionKey: ${q(descriptor.extensionKey)}, providerKey: ${q(descriptor.providerKey)}, displayName: ${q(descriptor.displayName)}, surface: ${q(descriptor.surface)}, access: ${q(descriptor.access)}, status: ${q(descriptor.status)} },`,
    )
    .join('\n');

  const selectionSources = PROVIDER_SELECTION_SOURCES.map(q).join(',\n    ');
  const supportStatuses = PROVIDER_SUPPORT_STATUSES.map(q).join(',\n    ');

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      content: lines(`
[package]
name = ${q(languageEntry.publicPackage)}
version = "0.1.0"
edition = "2021"
description = ${q(`Reserved Rust package scaffold for ${languageEntry.publicPackage} with build system: ${languageEntry.packageScaffold.buildSystem}`)}
license = "UNLICENSED"
publish = false

[lib]
path = "src/lib.rs"

[workspace]
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      content: lines(`
pub mod capability_catalog;
pub mod data_source;
pub mod driver_manager;
pub mod language_workspace_catalog;
pub mod provider_activation_catalog;
pub mod provider_catalog;
pub mod provider_package_catalog;
pub mod provider_package_loader;
pub mod provider_extension_catalog;
pub mod provider_selection;
pub mod provider_support;

pub struct RtcStandardContract;

pub trait RtcProviderDriver<TNativeClient> {
    fn provider_key(&self) -> &str;
}

pub trait RtcDriverManager<TNativeClient> {
    fn resolve_driver(&self, provider_key: &str);
}

pub trait RtcDataSource<TNativeClient> {
    fn create_client(&self);
}

pub trait RtcClient<TNativeClient> {
    fn join(&self);
    fn leave(&self);
    fn publish(&self, track_id: &str);
    fn unpublish(&self, track_id: &str);
    fn mute_audio(&self, muted: bool);
    fn mute_video(&self, muted: bool);
    fn unwrap(&self) -> Option<&TNativeClient>;
}

pub trait RtcRuntimeController<TNativeClient> {
    fn join(&self);
    fn leave(&self);
    fn publish(&self, track_id: &str);
    fn unpublish(&self, track_id: &str);
    fn mute_audio(&self, muted: bool);
    fn mute_video(&self, muted: bool);
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      content: lines(`
#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcProviderCatalogEntry {
    pub providerKey: &'static str,
    pub pluginId: &'static str,
    pub driverId: &'static str,
    pub defaultSelected: bool,
}

pub struct RtcProviderCatalog;

pub const DEFAULT_RTC_PROVIDER_KEY: &str = ${q(assembly.defaults?.providerKey ?? 'volcengine')};

pub const OFFICIAL_RTC_PROVIDERS: [RtcProviderCatalogEntry; ${providers.length}] = [
${providerEntries}
];

${renderReservedLanguageProviderCatalogLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      content: lines(`
#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcProviderPackageCatalogEntry {
    pub providerKey: &'static str,
    pub pluginId: &'static str,
    pub driverId: &'static str,
    pub packageIdentity: &'static str,
    pub manifestPath: &'static str,
    pub readmePath: &'static str,
    pub sourcePath: &'static str,
    pub sourceSymbol: &'static str,
    pub builtin: bool,
    pub rootPublic: bool,
    pub status: &'static str,
    pub runtimeBridgeStatus: &'static str,
}

pub struct RtcProviderPackageCatalog;

pub const OFFICIAL_RTC_PROVIDER_PACKAGES: [RtcProviderPackageCatalogEntry; ${providerPackageCatalogEntries.length}] = [
${providerPackageEntries}
];

${renderReservedLanguageProviderPackageLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      content: lines(`
#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcCapabilityCatalogEntry {
    pub capabilityKey: &'static str,
    pub category: &'static str,
    pub surface: &'static str,
}

pub struct RtcCapabilityCatalog;

pub const RTC_CAPABILITY_CATALOG: [RtcCapabilityCatalogEntry; ${capabilities.length}] = [
${capabilityEntries}
];

${renderReservedLanguageCapabilityLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      content: lines(`
#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcProviderExtensionCatalogEntry {
    pub extensionKey: &'static str,
    pub providerKey: &'static str,
    pub displayName: &'static str,
    pub surface: &'static str,
    pub access: &'static str,
    pub status: &'static str,
}

pub struct RtcProviderExtensionCatalog;

pub const RTC_PROVIDER_EXTENSION_SURFACES: [&str; 3] = [
    "control-plane",
    "runtime-bridge",
    "cross-surface",
];

pub const RTC_PROVIDER_EXTENSION_ACCESSES: [&str; 2] = [
    "unwrap-only",
    "extension-object",
];

pub const RTC_PROVIDER_EXTENSION_STATUSES: [&str; 2] = [
    "reference-baseline",
    "reserved",
];

pub const RTC_PROVIDER_EXTENSION_CATALOG: [RtcProviderExtensionCatalogEntry; ${extensions.length}] = [
${extensionEntries}
];

${renderReservedLanguageProviderExtensionLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      content: lines(`
#[allow(non_snake_case)]
pub struct RtcProviderSelection {
    pub providerKey: String,
    pub source: &'static str,
}

#[derive(Default)]
#[allow(non_snake_case)]
pub struct RtcProviderSelectionRequest {
    pub providerUrl: Option<String>,
    pub providerKey: Option<String>,
    pub tenantOverrideProviderKey: Option<String>,
    pub deploymentProfileProviderKey: Option<String>,
}

pub const RTC_PROVIDER_SELECTION_SOURCES: [&str; ${PROVIDER_SELECTION_SOURCES.length}] = [
    ${selectionSources}
];
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      content: lines(`
use crate::provider_catalog::{RtcProviderCatalogEntry, DEFAULT_RTC_PROVIDER_KEY, OFFICIAL_RTC_PROVIDERS};
use crate::provider_selection::{RtcProviderSelection, RtcProviderSelectionRequest};
use crate::provider_support::RtcProviderSupport;

pub struct RtcDriverManager;

fn has_text(value: &Option<String>) -> bool {
    value.as_ref().is_some_and(|entry| !entry.trim().is_empty())
}

fn parse_provider_key(provider_url: &str) -> String {
    let trimmed = provider_url.trim();
    if !trimmed.starts_with("rtc:") || !trimmed.contains("://") {
        panic!("Invalid RTC provider URL: {provider_url}");
    }

    trimmed[4..]
        .split("://")
        .next()
        .unwrap_or(DEFAULT_RTC_PROVIDER_KEY)
        .to_lowercase()
}

fn as_official_provider(provider_key: &str) -> Option<RtcProviderCatalogEntry> {
    OFFICIAL_RTC_PROVIDERS
        .iter()
        .copied()
        .find(|entry| entry.providerKey == provider_key)
}

impl RtcDriverManager {
    #[allow(non_snake_case)]
    pub fn resolveSelection(
        &self,
        request: &RtcProviderSelectionRequest,
        defaultProviderKey: Option<&str>,
    ) -> RtcProviderSelection {
        if has_text(&request.providerUrl) {
            return RtcProviderSelection {
                providerKey: parse_provider_key(request.providerUrl.as_deref().unwrap()),
                source: "provider_url",
            };
        }

        if has_text(&request.providerKey) {
            return RtcProviderSelection {
                providerKey: request.providerKey.as_deref().unwrap().trim().to_string(),
                source: "provider_key",
            };
        }

        if has_text(&request.tenantOverrideProviderKey) {
            return RtcProviderSelection {
                providerKey: request
                    .tenantOverrideProviderKey
                    .as_deref()
                    .unwrap()
                    .trim()
                    .to_string(),
                source: "tenant_override",
            };
        }

        if has_text(&request.deploymentProfileProviderKey) {
            return RtcProviderSelection {
                providerKey: request
                    .deploymentProfileProviderKey
                    .as_deref()
                    .unwrap()
                    .trim()
                    .to_string(),
                source: "deployment_profile",
            };
        }

        RtcProviderSelection {
            providerKey: defaultProviderKey.unwrap_or(DEFAULT_RTC_PROVIDER_KEY).to_string(),
            source: "default_provider",
        }
    }

    #[allow(non_snake_case)]
    pub fn describeProviderSupport(&self, providerKey: &str) -> RtcProviderSupport {
        if as_official_provider(providerKey).is_some() {
            return RtcProviderSupport {
                providerKey: providerKey.to_string(),
                status: "official_unregistered",
                builtin: false,
                official: true,
                registered: false,
            };
        }

        RtcProviderSupport {
            providerKey: providerKey.to_string(),
            status: "unknown",
            builtin: false,
            official: false,
            registered: false,
        }
    }

    #[allow(non_snake_case)]
    pub fn listProviderSupport(&self) -> Vec<RtcProviderSupport> {
        OFFICIAL_RTC_PROVIDERS
            .iter()
            .map(|entry| self.describeProviderSupport(entry.providerKey))
            .collect()
    }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      content: lines(`
use crate::driver_manager::RtcDriverManager;
use crate::provider_catalog::DEFAULT_RTC_PROVIDER_KEY;
use crate::provider_selection::{RtcProviderSelection, RtcProviderSelectionRequest};
use crate::provider_support::RtcProviderSupport;

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct RtcDataSourceOptions {
    pub providerUrl: String,
    pub providerKey: String,
    pub tenantOverrideProviderKey: String,
    pub deploymentProfileProviderKey: String,
    pub defaultProviderKey: String,
}

#[allow(non_snake_case)]
pub struct RtcDataSource {
    options: RtcDataSourceOptions,
    driverManager: RtcDriverManager,
}

impl RtcDataSourceOptions {
    pub fn new() -> Self {
        Self {
            providerUrl: String::new(),
            providerKey: String::new(),
            tenantOverrideProviderKey: String::new(),
            deploymentProfileProviderKey: String::new(),
            defaultProviderKey: DEFAULT_RTC_PROVIDER_KEY.to_string(),
        }
    }
}

impl Default for RtcDataSourceOptions {
    fn default() -> Self {
        Self::new()
    }
}

impl RtcDataSource {
    #[allow(non_snake_case)]
    pub fn new(options: RtcDataSourceOptions, driverManager: RtcDriverManager) -> Self {
        let mut resolved_options = options;
        if resolved_options.defaultProviderKey.trim().is_empty() {
          resolved_options.defaultProviderKey = DEFAULT_RTC_PROVIDER_KEY.to_string();
        }

        Self {
            options: resolved_options,
            driverManager,
        }
    }

    #[allow(non_snake_case)]
    fn mergeRtcDataSourceOptions(
        base: &RtcDataSourceOptions,
        overrides: Option<&RtcDataSourceOptions>,
    ) -> RtcDataSourceOptions {
        let mut merged = base.clone();
        if let Some(value) = overrides {
            if !value.providerUrl.trim().is_empty() {
                merged.providerUrl = value.providerUrl.clone();
            }
            if !value.providerKey.trim().is_empty() {
                merged.providerKey = value.providerKey.clone();
            }
            if !value.tenantOverrideProviderKey.trim().is_empty() {
                merged.tenantOverrideProviderKey = value.tenantOverrideProviderKey.clone();
            }
            if !value.deploymentProfileProviderKey.trim().is_empty() {
                merged.deploymentProfileProviderKey = value.deploymentProfileProviderKey.clone();
            }
            if !value.defaultProviderKey.trim().is_empty() {
                merged.defaultProviderKey = value.defaultProviderKey.clone();
            }
        }
        merged
    }

    #[allow(non_snake_case)]
    fn describeSelectionInternal(&self, overrides: Option<&RtcDataSourceOptions>) -> RtcProviderSelection {
        let merged = Self::mergeRtcDataSourceOptions(&self.options, overrides);
        self.driverManager.resolveSelection(
            &RtcProviderSelectionRequest {
                providerUrl: if merged.providerUrl.trim().is_empty() { None } else { Some(merged.providerUrl) },
                providerKey: if merged.providerKey.trim().is_empty() { None } else { Some(merged.providerKey) },
                tenantOverrideProviderKey: if merged.tenantOverrideProviderKey.trim().is_empty() { None } else { Some(merged.tenantOverrideProviderKey) },
                deploymentProfileProviderKey: if merged.deploymentProfileProviderKey.trim().is_empty() { None } else { Some(merged.deploymentProfileProviderKey) },
            },
            Some(merged.defaultProviderKey.as_str()),
        )
    }

    #[allow(non_snake_case)]
    pub fn describeSelection(&self, overrides: Option<&RtcDataSourceOptions>) -> RtcProviderSelection {
        self.describeSelectionInternal(overrides)
    }

    #[allow(non_snake_case)]
    pub fn describeProviderSupport(&self, overrides: Option<&RtcDataSourceOptions>) -> RtcProviderSupport {
        let selection = self.describeSelectionInternal(overrides);
        self.driverManager.describeProviderSupport(selection.providerKey.as_str())
    }

    #[allow(non_snake_case)]
    pub fn listProviderSupport(&self) -> Vec<RtcProviderSupport> {
        self.driverManager.listProviderSupport()
    }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      content: lines(`
#[allow(non_snake_case)]
pub struct RtcProviderSupport {
    pub providerKey: String,
    pub status: &'static str,
    pub builtin: bool,
    pub official: bool,
    pub registered: bool,
}

pub const RTC_PROVIDER_SUPPORT_STATUSES: [&str; ${PROVIDER_SUPPORT_STATUSES.length}] = [
    ${supportStatuses}
];
`),
    },
  ];
}

function renderJavaReservedLanguagePlan(languageEntry, assembly) {
  const providers = assembly.providers ?? [];
  const capabilities = assembly.capabilityCatalog ?? [];
  const extensions = assembly.providerExtensionCatalog ?? [];
  const providerPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
    languageEntry,
    providers,
  );

  const providerEntries = providers
    .map(
      (provider) =>
        `      new Entry(${q(provider.providerKey)}, ${q(provider.pluginId)}, ${q(provider.driverId)}, ${provider.defaultSelected ? 'true' : 'false'})`,
    )
    .join(',\n');

  const providerPackageEntries = providerPackageCatalogEntries
    .map(
      (entry) =>
        `      new RtcProviderPackageCatalogEntry(${q(entry.providerKey)}, ${q(entry.pluginId)}, ${q(entry.driverId)}, ${q(entry.packageIdentity)}, ${q(entry.manifestPath)}, ${q(entry.readmePath)}, ${q(entry.sourcePath)}, ${q(entry.sourceSymbol)}, ${entry.builtin ? 'true' : 'false'}, ${entry.rootPublic ? 'true' : 'false'}, ${q(entry.status)}, ${q(entry.runtimeBridgeStatus)})`,
    )
    .join(',\n');

  const capabilityEntries = capabilities
    .map(
      (descriptor) =>
        `      new Entry(${q(descriptor.capabilityKey)}, ${q(descriptor.category)}, ${q(descriptor.surface)})`,
    )
    .join(',\n');

  const extensionEntries = extensions
    .map(
      (descriptor) =>
        `      new Entry(${q(descriptor.extensionKey)}, ${q(descriptor.providerKey)}, ${q(descriptor.displayName)}, ${q(descriptor.surface)}, ${q(descriptor.access)}, ${q(descriptor.status)})`,
    )
    .join(',\n');

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      content: lines(`
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.sdkwork</groupId>
  <artifactId>rtc-sdk</artifactId>
  <version>0.1.0</version>
  <packaging>jar</packaging>
  <name>${languageEntry.publicPackage}</name>
  <description>Reserved Java package scaffold for ${languageEntry.publicPackage} with build system: ${languageEntry.packageScaffold.buildSystem}</description>
</project>
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      content: lines(`
package com.sdkwork.rtc.standard;

public final class RtcStandardContract {

  private RtcStandardContract() {
  }

  public interface RtcProviderDriver<TNativeClient> {
    String providerKey();

    RtcClient<TNativeClient> createClient();
  }

  public interface RtcDriverManager<TNativeClient> {
    RtcProviderDriver<TNativeClient> resolveDriver(String providerKey);
  }

  public interface RtcDataSource<TNativeClient> {
    RtcClient<TNativeClient> createClient();
  }

  public interface RtcClient<TNativeClient> {
    void join();

    void leave();

    void publish(String trackId);

    void unpublish(String trackId);

    void muteAudio(boolean muted);

    void muteVideo(boolean muted);

    TNativeClient unwrap();
  }

  public interface RtcRuntimeController<TNativeClient> {
    void join();

    void leave();

    void publish(String trackId);

    void unpublish(String trackId);

    void muteAudio(boolean muted);

    void muteVideo(boolean muted);
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcProviderCatalog {

  public static final String DEFAULT_RTC_PROVIDER_KEY = ${q(assembly.defaults?.providerKey ?? 'volcengine')};

  public static final List<Entry> ENTRIES = List.of(
${providerEntries}
  );

${renderReservedLanguageProviderCatalogLookupHelper(languageEntry.language)}

  private RtcProviderCatalog() {
  }

  public record Entry(String providerKey, String pluginId, String driverId, boolean defaultSelected) {
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcProviderPackageCatalog {

  public static final List<RtcProviderPackageCatalogEntry> ENTRIES = List.of(
${providerPackageEntries}
  );

${renderReservedLanguageProviderPackageLookupHelper(languageEntry.language)}

  private RtcProviderPackageCatalog() {
  }

  public record RtcProviderPackageCatalogEntry(
      String providerKey,
      String pluginId,
      String driverId,
      String packageIdentity,
      String manifestPath,
      String readmePath,
      String sourcePath,
      String sourceSymbol,
      boolean builtin,
      boolean rootPublic,
      String status,
      String runtimeBridgeStatus
  ) {
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcCapabilityCatalog {

  public static final List<Entry> ENTRIES = List.of(
${capabilityEntries}
  );

${renderReservedLanguageCapabilityLookupHelper(languageEntry.language)}

  private RtcCapabilityCatalog() {
  }

  public record Entry(String capabilityKey, String category, String surface) {
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public final class RtcProviderExtensionCatalog {

  public static final List<String> RECOGNIZED_SURFACES = List.of(
      "control-plane",
      "runtime-bridge",
      "cross-surface"
  );

  public static final List<String> RECOGNIZED_ACCESSES = List.of(
      "unwrap-only",
      "extension-object"
  );

  public static final List<String> RECOGNIZED_STATUSES = List.of(
      "reference-baseline",
      "reserved"
  );

  public static final List<Entry> ENTRIES = List.of(
${extensionEntries}
  );

${renderReservedLanguageProviderExtensionLookupHelper(languageEntry.language)}

  private RtcProviderExtensionCatalog() {
  }

  public record Entry(
      String extensionKey,
      String providerKey,
      String displayName,
      String surface,
      String access,
      String status
  ) {
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata;

public record RtcProviderSelection(String providerKey, Source source) {

  public enum Source {
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider
  }

  public record Request(
      String providerUrl,
      String providerKey,
      String tenantOverrideProviderKey,
      String deploymentProfileProviderKey
  ) {
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;

public final class RtcDriverManager {

  public RtcProviderSelection resolveSelection(RtcProviderSelection.Request request) {
    return resolveSelection(request, RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY);
  }

  public RtcProviderSelection resolveSelection(
      RtcProviderSelection.Request request,
      String defaultProviderKey
  ) {
    if (hasText(request.providerUrl())) {
      return new RtcProviderSelection(
          parseProviderKey(request.providerUrl()),
          RtcProviderSelection.Source.provider_url
      );
    }

    if (hasText(request.providerKey())) {
      return new RtcProviderSelection(
          request.providerKey().trim(),
          RtcProviderSelection.Source.provider_key
      );
    }

    if (hasText(request.tenantOverrideProviderKey())) {
      return new RtcProviderSelection(
          request.tenantOverrideProviderKey().trim(),
          RtcProviderSelection.Source.tenant_override
      );
    }

    if (hasText(request.deploymentProfileProviderKey())) {
      return new RtcProviderSelection(
          request.deploymentProfileProviderKey().trim(),
          RtcProviderSelection.Source.deployment_profile
      );
    }

    return new RtcProviderSelection(
        defaultProviderKey,
        RtcProviderSelection.Source.default_provider
    );
  }

  public RtcProviderSupport describeProviderSupport(String providerKey) {
    var officialProvider = RtcProviderCatalog.ENTRIES.stream()
        .anyMatch(entry -> entry.providerKey().equals(providerKey));

    if (officialProvider) {
      return new RtcProviderSupport(
          providerKey,
          RtcProviderSupport.Status.official_unregistered,
          false,
          true,
          false
      );
    }

    return new RtcProviderSupport(
        providerKey,
        RtcProviderSupport.Status.unknown,
        false,
        false,
        false
    );
  }

  public List<RtcProviderSupport> listProviderSupport() {
    return RtcProviderCatalog.ENTRIES.stream()
        .map(entry -> describeProviderSupport(entry.providerKey()))
        .toList();
  }

  private static boolean hasText(String value) {
    return value != null && !value.trim().isEmpty();
  }

  private static String parseProviderKey(String providerUrl) {
    var trimmed = providerUrl.trim();
    if (!trimmed.startsWith("rtc:") || !trimmed.contains("://")) {
      throw new IllegalArgumentException("Invalid RTC provider URL: " + providerUrl);
    }

    return trimmed.substring(4, trimmed.indexOf("://")).toLowerCase();
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata;

public final class RtcDataSource {

  private final RtcDataSourceOptions options;
  private final RtcDriverManager driverManager;

  public RtcDataSource() {
    this(new RtcDataSourceOptions(), new RtcDriverManager());
  }

  public RtcDataSource(RtcDataSourceOptions options, RtcDriverManager driverManager) {
    this.options = options;
    this.driverManager = driverManager;
  }

  public RtcProviderSelection describeSelection() {
    return describeSelection(null);
  }

  public RtcProviderSelection describeSelection(RtcDataSourceOptions overrides) {
    var merged = merge(options, overrides);
    return driverManager.resolveSelection(
        new RtcProviderSelection.Request(
            merged.providerUrl(),
            merged.providerKey(),
            merged.tenantOverrideProviderKey(),
            merged.deploymentProfileProviderKey()
        ),
        merged.defaultProviderKey()
    );
  }

  public RtcProviderSupport describeProviderSupport() {
    return describeProviderSupport(null);
  }

  public RtcProviderSupport describeProviderSupport(RtcDataSourceOptions overrides) {
    return driverManager.describeProviderSupport(describeSelection(overrides).providerKey());
  }

  public java.util.List<RtcProviderSupport> listProviderSupport() {
    return driverManager.listProviderSupport();
  }

  private static RtcDataSourceOptions merge(
      RtcDataSourceOptions base,
      RtcDataSourceOptions overrides
  ) {
    if (overrides == null) {
      return base;
    }

    return new RtcDataSourceOptions(
        overrides.providerUrl() != null ? overrides.providerUrl() : base.providerUrl(),
        overrides.providerKey() != null ? overrides.providerKey() : base.providerKey(),
        overrides.tenantOverrideProviderKey() != null
            ? overrides.tenantOverrideProviderKey()
            : base.tenantOverrideProviderKey(),
        overrides.deploymentProfileProviderKey() != null
            ? overrides.deploymentProfileProviderKey()
            : base.deploymentProfileProviderKey(),
        overrides.defaultProviderKey() != null && !overrides.defaultProviderKey().isBlank()
            ? overrides.defaultProviderKey()
            : base.defaultProviderKey()
    );
  }

  public record RtcDataSourceOptions(
      String providerUrl,
      String providerKey,
      String tenantOverrideProviderKey,
      String deploymentProfileProviderKey,
      String defaultProviderKey
  ) {
    public RtcDataSourceOptions() {
      this(null, null, null, null, RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY);
    }
  }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata;

public record RtcProviderSupport(
    String providerKey,
    Status status,
    boolean builtin,
    boolean official,
    boolean registered
) {

  public enum Status {
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown
  }
}
`),
    },
  ];
}

function renderCsharpReservedLanguagePlan(languageEntry, assembly) {
  const providers = assembly.providers ?? [];
  const capabilities = assembly.capabilityCatalog ?? [];
  const extensions = assembly.providerExtensionCatalog ?? [];
  const providerPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
    languageEntry,
    providers,
  );

  const providerEntries = providers
    .map(
      (provider) =>
        `        new(${q(provider.providerKey)}, ${q(provider.pluginId)}, ${q(provider.driverId)}, ${provider.defaultSelected ? 'true' : 'false'}),`,
    )
    .join('\n');

  const providerPackageEntries = providerPackageCatalogEntries
    .map(
      (entry) =>
        `        new(${q(entry.providerKey)}, ${q(entry.pluginId)}, ${q(entry.driverId)}, ${q(entry.packageIdentity)}, ${q(entry.manifestPath)}, ${q(entry.readmePath)}, ${q(entry.sourcePath)}, ${q(entry.sourceSymbol)}, ${entry.builtin ? 'true' : 'false'}, ${entry.rootPublic ? 'true' : 'false'}, ${q(entry.status)}, ${q(entry.runtimeBridgeStatus)}),`,
    )
    .join('\n');

  const capabilityEntries = capabilities
    .map(
      (descriptor) =>
        `        new(${q(descriptor.capabilityKey)}, ${q(descriptor.category)}, ${q(descriptor.surface)}),`,
    )
    .join('\n');

  const extensionEntries = extensions
    .map(
      (descriptor) =>
        `        new(${q(descriptor.extensionKey)}, ${q(descriptor.providerKey)}, ${q(descriptor.displayName)}, ${q(descriptor.surface)}, ${q(descriptor.access)}, ${q(descriptor.status)}),`,
    )
    .join('\n');

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      content: lines(`
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <PackageId>${languageEntry.publicPackage}</PackageId>
    <AssemblyName>${languageEntry.publicPackage}</AssemblyName>
    <Description>Reserved C# package scaffold for ${languageEntry.publicPackage} with build system: ${languageEntry.packageScaffold.buildSystem}</Description>
  </PropertyGroup>
</Project>
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

public static class RtcStandardContract
{
    public const string Symbol = "RtcStandardContract";
}

public interface RtcProviderDriver<TNativeClient>
{
    string ProviderKey { get; }

    RtcClient<TNativeClient> CreateClient();
}

public interface RtcDriverManager<TNativeClient>
{
    RtcProviderDriver<TNativeClient> ResolveDriver(string providerKey);
}

public interface RtcDataSource<TNativeClient>
{
    RtcClient<TNativeClient> CreateClient();
}

public interface RtcClient<TNativeClient>
{
    void Join();

    void Leave();

    void Publish(string trackId);

    void Unpublish(string trackId);

    void MuteAudio(bool muted);

    void MuteVideo(bool muted);

    TNativeClient? Unwrap();
}

public interface RtcRuntimeController<TNativeClient>
{
    void Join();

    void Leave();

    void Publish(string trackId);

    void Unpublish(string trackId);

    void MuteAudio(bool muted);

    void MuteVideo(bool muted);
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

using System.Linq;

public sealed record RtcProviderCatalogEntry(
    string providerKey,
    string pluginId,
    string driverId,
    bool defaultSelected
);

public static class RtcProviderCatalog
{
    public const string DEFAULT_RTC_PROVIDER_KEY = ${q(assembly.defaults?.providerKey ?? 'volcengine')};

    public static readonly IReadOnlyList<RtcProviderCatalogEntry> Entries =
    [
${providerEntries}
    ];

${renderReservedLanguageProviderCatalogLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

using System.Linq;

public sealed record RtcProviderPackageCatalogEntry(
    string providerKey,
    string pluginId,
    string driverId,
    string packageIdentity,
    string manifestPath,
    string readmePath,
    string sourcePath,
    string sourceSymbol,
    bool builtin,
    bool rootPublic,
    string status,
    string runtimeBridgeStatus
);

public static class RtcProviderPackageCatalog
{
    public static readonly IReadOnlyList<RtcProviderPackageCatalogEntry> Entries =
    [
${providerPackageEntries}
    ];

${renderReservedLanguageProviderPackageLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

using System.Collections.Generic;
using System.Linq;

public sealed record RtcCapabilityCatalogEntry(
    string capabilityKey,
    string category,
    string surface
);

public static class RtcCapabilityCatalog
{
    public static readonly IReadOnlyList<RtcCapabilityCatalogEntry> Entries =
    [
${capabilityEntries}
    ];

${renderReservedLanguageCapabilityLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

using System.Collections.Generic;
using System.Linq;

public sealed record RtcProviderExtensionCatalogEntry(
    string extensionKey,
    string providerKey,
    string displayName,
    string surface,
    string access,
    string status
);

public static class RtcProviderExtensionCatalog
{
    public static readonly IReadOnlyList<string> RecognizedSurfaces =
    [
        "control-plane",
        "runtime-bridge",
        "cross-surface",
    ];

    public static readonly IReadOnlyList<string> RecognizedAccessModes =
    [
        "unwrap-only",
        "extension-object",
    ];

    public static readonly IReadOnlyList<string> RecognizedStatuses =
    [
        "reference-baseline",
        "reserved",
    ];

    public static readonly IReadOnlyList<RtcProviderExtensionCatalogEntry> Entries =
    [
${extensionEntries}
    ];

${renderReservedLanguageProviderExtensionLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

public enum Source
{
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider,
}

public sealed record RtcProviderSelection(string providerKey, Source source);

public sealed record Request(
    string? providerUrl = null,
    string? providerKey = null,
    string? tenantOverrideProviderKey = null,
    string? deploymentProfileProviderKey = null
);
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

public sealed class RtcDriverManager
{
    public RtcProviderSelection ResolveSelection(
        Request? request = null,
        string defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    )
    {
        return resolveSelection(request, defaultProviderKey);
    }

    public RtcProviderSupport DescribeProviderSupport(string providerKey)
    {
        return describeProviderSupport(providerKey);
    }

    public IReadOnlyList<RtcProviderSupport> ListProviderSupport()
    {
        return listProviderSupport();
    }

    private static RtcProviderSelection resolveSelection(
        Request? request,
        string defaultProviderKey
    )
    {
        request ??= new Request();

        if (HasText(request.providerUrl))
        {
            return new RtcProviderSelection(
                parseProviderKey(request.providerUrl!),
                Source.provider_url
            );
        }

        if (HasText(request.providerKey))
        {
            return new RtcProviderSelection(request.providerKey!.Trim(), Source.provider_key);
        }

        if (HasText(request.tenantOverrideProviderKey))
        {
            return new RtcProviderSelection(
                request.tenantOverrideProviderKey!.Trim(),
                Source.tenant_override
            );
        }

        if (HasText(request.deploymentProfileProviderKey))
        {
            return new RtcProviderSelection(
                request.deploymentProfileProviderKey!.Trim(),
                Source.deployment_profile
            );
        }

        return new RtcProviderSelection(defaultProviderKey, Source.default_provider);
    }

    private static RtcProviderSupport describeProviderSupport(string providerKey)
    {
        var official = RtcProviderCatalog.Entries.Any(entry => entry.providerKey == providerKey);
        if (official)
        {
            return new RtcProviderSupport(
                providerKey,
                RtcProviderSupportStatus.official_unregistered,
                false,
                true,
                false
            );
        }

        return new RtcProviderSupport(
            providerKey,
            RtcProviderSupportStatus.unknown,
            false,
            false,
            false
        );
    }

    private static IReadOnlyList<RtcProviderSupport> listProviderSupport()
    {
        return RtcProviderCatalog.Entries
            .Select(entry => describeProviderSupport(entry.providerKey))
            .ToArray();
    }

    private static bool HasText(string? value) => !string.IsNullOrWhiteSpace(value);

    private static string parseProviderKey(string providerUrl)
    {
        var trimmed = providerUrl.Trim();
        if (!trimmed.StartsWith("rtc:", StringComparison.OrdinalIgnoreCase) || !trimmed.Contains("://", StringComparison.Ordinal))
        {
            throw new ArgumentException($"Invalid RTC provider URL: {providerUrl}", nameof(providerUrl));
        }

        return trimmed[4..trimmed.IndexOf("://", StringComparison.Ordinal)].ToLowerInvariant();
    }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

public sealed record RtcDataSourceOptions(
    string? providerUrl = null,
    string? providerKey = null,
    string? tenantOverrideProviderKey = null,
    string? deploymentProfileProviderKey = null,
    string defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
);

public sealed class RtcDataSource
{
    private readonly RtcDataSourceOptions _options;
    private readonly RtcDriverManager _driverManager;

    public RtcDataSource(
        RtcDataSourceOptions? options = null,
        RtcDriverManager? driverManager = null
    )
    {
        _options = options ?? new RtcDataSourceOptions();
        _driverManager = driverManager ?? new RtcDriverManager();
    }

    public RtcProviderSelection DescribeSelection(RtcDataSourceOptions? overrides = null)
    {
        return describeSelection(overrides);
    }

    public RtcProviderSupport DescribeProviderSupport(RtcDataSourceOptions? overrides = null)
    {
        return describeProviderSupport(overrides);
    }

    public IReadOnlyList<RtcProviderSupport> ListProviderSupport()
    {
        return listProviderSupport();
    }

    private RtcProviderSelection describeSelection(RtcDataSourceOptions? overrides)
    {
        var merged = merge(_options, overrides);
        return _driverManager.ResolveSelection(
            new Request(
                merged.providerUrl,
                merged.providerKey,
                merged.tenantOverrideProviderKey,
                merged.deploymentProfileProviderKey
            ),
            merged.defaultProviderKey
        );
    }

    private RtcProviderSupport describeProviderSupport(RtcDataSourceOptions? overrides)
    {
        return _driverManager.DescribeProviderSupport(describeSelection(overrides).providerKey);
    }

    private IReadOnlyList<RtcProviderSupport> listProviderSupport()
    {
        return _driverManager.ListProviderSupport();
    }

    private static RtcDataSourceOptions merge(
        RtcDataSourceOptions baseOptions,
        RtcDataSourceOptions? overrides
    )
    {
        if (overrides is null)
        {
            return baseOptions;
        }

        return new RtcDataSourceOptions(
            overrides.providerUrl ?? baseOptions.providerUrl,
            overrides.providerKey ?? baseOptions.providerKey,
            overrides.tenantOverrideProviderKey ?? baseOptions.tenantOverrideProviderKey,
            overrides.deploymentProfileProviderKey ?? baseOptions.deploymentProfileProviderKey,
            string.IsNullOrWhiteSpace(overrides.defaultProviderKey)
                ? baseOptions.defaultProviderKey
                : overrides.defaultProviderKey
        );
    }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      content: lines(`
namespace Sdkwork.Rtc.Sdk;

public enum RtcProviderSupportStatus
{
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown,
}

public sealed record RtcProviderSupport(
    string providerKey,
    RtcProviderSupportStatus status,
    bool builtin,
    bool official,
    bool registered
);
`),
    },
  ];
}

function renderSwiftReservedLanguagePlan(languageEntry, assembly) {
  const providers = assembly.providers ?? [];
  const capabilities = assembly.capabilityCatalog ?? [];
  const extensions = assembly.providerExtensionCatalog ?? [];
  const providerPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
    languageEntry,
    providers,
  );

  const providerEntries = providers
    .map(
      (provider) =>
        `        .init(providerKey: ${q(provider.providerKey)}, pluginId: ${q(provider.pluginId)}, driverId: ${q(provider.driverId)}, defaultSelected: ${provider.defaultSelected ? 'true' : 'false'}),`,
    )
    .join('\n');

  const providerPackageEntries = providerPackageCatalogEntries
    .map(
      (entry) =>
        `        .init(providerKey: ${q(entry.providerKey)}, pluginId: ${q(entry.pluginId)}, driverId: ${q(entry.driverId)}, packageIdentity: ${q(entry.packageIdentity)}, manifestPath: ${q(entry.manifestPath)}, readmePath: ${q(entry.readmePath)}, sourcePath: ${q(entry.sourcePath)}, sourceSymbol: ${q(entry.sourceSymbol)}, builtin: ${entry.builtin ? 'true' : 'false'}, rootPublic: ${entry.rootPublic ? 'true' : 'false'}, status: ${q(entry.status)}, runtimeBridgeStatus: ${q(entry.runtimeBridgeStatus)}),`,
    )
    .join('\n');

  const capabilityEntries = capabilities
    .map(
      (descriptor) =>
        `        .init(capabilityKey: ${q(descriptor.capabilityKey)}, category: ${q(descriptor.category)}, surface: ${q(descriptor.surface)}),`,
    )
    .join('\n');

  const extensionEntries = extensions
    .map(
      (descriptor) =>
        `        .init(extensionKey: ${q(descriptor.extensionKey)}, providerKey: ${q(descriptor.providerKey)}, displayName: ${q(descriptor.displayName)}, surface: ${q(descriptor.surface)}, access: ${q(descriptor.access)}, status: ${q(descriptor.status)}),`,
    )
    .join('\n');

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      content: lines(`
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RtcSdk",
    platforms: [
        .iOS(.v15),
        .macOS(.v13),
    ],
    products: [
        .library(
            name: "RtcSdk",
            targets: ["RtcSdk"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdk",
            path: "Sources/RtcSdk"
        ),
    ]
)

// build system: ${languageEntry.packageScaffold.buildSystem}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      content: lines(`
public enum RtcStandardContract {
    public static let symbol = "RtcStandardContract"
}

public protocol RtcProviderDriver {
    var providerKey: String { get }
}

public protocol RtcDriverManager {
    func resolveDriver(providerKey: String)
}

public protocol RtcDataSource {
    func createClient() async throws
}

public protocol RtcClient {
    func join() async throws
    func leave() async throws
    func publish(trackId: String) async throws
    func unpublish(trackId: String) async throws
    func muteAudio(muted: Bool) async throws
    func muteVideo(muted: Bool) async throws
    func unwrap() -> Any?
}

public protocol RtcRuntimeController {
    func join() async throws
    func leave() async throws
    func publish(trackId: String) async throws
    func unpublish(trackId: String) async throws
    func muteAudio(muted: Bool) async throws
    func muteVideo(muted: Bool) async throws
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      content: lines(`
public struct RtcProviderCatalogEntry {
    public let providerKey: String
    public let pluginId: String
    public let driverId: String
    public let defaultSelected: Bool
}

public enum RtcProviderCatalog {
    public static let DEFAULT_RTC_PROVIDER_KEY: String = ${q(assembly.defaults?.providerKey ?? 'volcengine')}

    public static let entries: [RtcProviderCatalogEntry] = [
${providerEntries}
    ]

${renderReservedLanguageProviderCatalogLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      content: lines(`
public struct RtcProviderPackageCatalogEntry {
    public let providerKey: String
    public let pluginId: String
    public let driverId: String
    public let packageIdentity: String
    public let manifestPath: String
    public let readmePath: String
    public let sourcePath: String
    public let sourceSymbol: String
    public let builtin: Bool
    public let rootPublic: Bool
    public let status: String
    public let runtimeBridgeStatus: String
}

public enum RtcProviderPackageCatalog {
    public static let entries: [RtcProviderPackageCatalogEntry] = [
${providerPackageEntries}
    ]

${renderReservedLanguageProviderPackageLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      content: lines(`
public struct RtcCapabilityCatalogEntry {
    public let capabilityKey: String
    public let category: String
    public let surface: String
}

public enum RtcCapabilityCatalog {
    public static let entries: [RtcCapabilityCatalogEntry] = [
${capabilityEntries}
    ]

${renderReservedLanguageCapabilityLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      content: lines(`
public struct RtcProviderExtensionCatalogEntry {
    public let extensionKey: String
    public let providerKey: String
    public let displayName: String
    public let surface: String
    public let access: String
    public let status: String
}

public enum RtcProviderExtensionCatalog {
    public static let recognizedSurfaces: [String] = [
        "control-plane",
        "runtime-bridge",
        "cross-surface",
    ]

    public static let recognizedAccessModes: [String] = [
        "unwrap-only",
        "extension-object",
    ]

    public static let recognizedStatuses: [String] = [
        "reference-baseline",
        "reserved",
    ]

    public static let entries: [RtcProviderExtensionCatalogEntry] = [
${extensionEntries}
    ]

${renderReservedLanguageProviderExtensionLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      content: lines(`
public enum Source: String {
    case provider_url = "provider_url"
    case provider_key = "provider_key"
    case tenant_override = "tenant_override"
    case deployment_profile = "deployment_profile"
    case default_provider = "default_provider"
}

public struct RtcProviderSelection {
    public let providerKey: String
    public let source: Source
}

public struct Request {
    public let providerUrl: String?
    public let providerKey: String?
    public let tenantOverrideProviderKey: String?
    public let deploymentProfileProviderKey: String?
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      content: lines(`
public struct RtcDriverManager {
    public init() {}

    public func resolveSelection(
        request: Request = Request(providerUrl: nil, providerKey: nil, tenantOverrideProviderKey: nil, deploymentProfileProviderKey: nil),
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    ) -> RtcProviderSelection {
        if let providerUrl = request.providerUrl, hasText(providerUrl) {
            return RtcProviderSelection(
                providerKey: parseProviderKey(providerUrl),
                source: .provider_url
            )
        }

        if let providerKey = request.providerKey, hasText(providerKey) {
            return RtcProviderSelection(
                providerKey: providerKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .provider_key
            )
        }

        if let tenantOverrideProviderKey = request.tenantOverrideProviderKey, hasText(tenantOverrideProviderKey) {
            return RtcProviderSelection(
                providerKey: tenantOverrideProviderKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .tenant_override
            )
        }

        if let deploymentProfileProviderKey = request.deploymentProfileProviderKey, hasText(deploymentProfileProviderKey) {
            return RtcProviderSelection(
                providerKey: deploymentProfileProviderKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .deployment_profile
            )
        }

        return RtcProviderSelection(
            providerKey: defaultProviderKey,
            source: .default_provider
        )
    }

    public func describeProviderSupport(providerKey: String) -> RtcProviderSupport {
        let official = RtcProviderCatalog.entries.contains { $0.providerKey == providerKey }
        if official {
            return RtcProviderSupport(
                providerKey: providerKey,
                status: .official_unregistered,
                builtin: false,
                official: true,
                registered: false
            )
        }

        return RtcProviderSupport(
            providerKey: providerKey,
            status: .unknown,
            builtin: false,
            official: false,
            registered: false
        )
    }

    public func listProviderSupport() -> [RtcProviderSupport] {
        RtcProviderCatalog.entries.map { describeProviderSupport(providerKey: $0.providerKey) }
    }

    private func hasText(_ value: String) -> Bool {
        !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func parseProviderKey(_ providerUrl: String) -> String {
        let trimmed = providerUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.hasPrefix("rtc:"), let delimiter = trimmed.range(of: "://") else {
            fatalError("Invalid RTC provider URL: \\(providerUrl)")
        }

        return String(trimmed[trimmed.index(trimmed.startIndex, offsetBy: 4)..<delimiter.lowerBound]).lowercased()
    }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      content: lines(`
public struct RtcDataSourceOptions {
    public let providerUrl: String?
    public let providerKey: String?
    public let tenantOverrideProviderKey: String?
    public let deploymentProfileProviderKey: String?
    public let defaultProviderKey: String

    public init(
        providerUrl: String? = nil,
        providerKey: String? = nil,
        tenantOverrideProviderKey: String? = nil,
        deploymentProfileProviderKey: String? = nil,
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    ) {
        self.providerUrl = providerUrl
        self.providerKey = providerKey
        self.tenantOverrideProviderKey = tenantOverrideProviderKey
        self.deploymentProfileProviderKey = deploymentProfileProviderKey
        self.defaultProviderKey = defaultProviderKey
    }
}

public struct RtcDataSource {
    public let options: RtcDataSourceOptions
    public let driverManager: RtcDriverManager

    public init(
        options: RtcDataSourceOptions = RtcDataSourceOptions(),
        driverManager: RtcDriverManager = RtcDriverManager()
    ) {
        self.options = options
        self.driverManager = driverManager
    }

    public func describeSelection(_ overrides: RtcDataSourceOptions? = nil) -> RtcProviderSelection {
        let merged = merge(options, overrides)
        return driverManager.resolveSelection(
            request: Request(
                providerUrl: merged.providerUrl,
                providerKey: merged.providerKey,
                tenantOverrideProviderKey: merged.tenantOverrideProviderKey,
                deploymentProfileProviderKey: merged.deploymentProfileProviderKey
            ),
            defaultProviderKey: merged.defaultProviderKey
        )
    }

    public func describeProviderSupport(_ overrides: RtcDataSourceOptions? = nil) -> RtcProviderSupport {
        let selection = describeSelection(overrides)
        return driverManager.describeProviderSupport(providerKey: selection.providerKey)
    }

    public func listProviderSupport() -> [RtcProviderSupport] {
        driverManager.listProviderSupport()
    }

    private func merge(_ base: RtcDataSourceOptions, _ overrides: RtcDataSourceOptions?) -> RtcDataSourceOptions {
        guard let overrides else {
            return base
        }

        return RtcDataSourceOptions(
            providerUrl: overrides.providerUrl ?? base.providerUrl,
            providerKey: overrides.providerKey ?? base.providerKey,
            tenantOverrideProviderKey: overrides.tenantOverrideProviderKey ?? base.tenantOverrideProviderKey,
            deploymentProfileProviderKey: overrides.deploymentProfileProviderKey ?? base.deploymentProfileProviderKey,
            defaultProviderKey: overrides.defaultProviderKey.isEmpty ? base.defaultProviderKey : overrides.defaultProviderKey
        )
    }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      content: lines(`
public enum RtcProviderSupportStatus: String {
    case builtin_registered = "builtin_registered"
    case official_registered = "official_registered"
    case official_unregistered = "official_unregistered"
    case unknown = "unknown"
}

public struct RtcProviderSupport {
    public let providerKey: String
    public let status: RtcProviderSupportStatus
    public let builtin: Bool
    public let official: Bool
    public let registered: Bool
}
`),
    },
  ];
}

function renderKotlinReservedLanguagePlan(languageEntry, assembly) {
  const providers = assembly.providers ?? [];
  const capabilities = assembly.capabilityCatalog ?? [];
  const extensions = assembly.providerExtensionCatalog ?? [];
  const providerPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
    languageEntry,
    providers,
  );

  const providerEntries = providers
    .map(
      (provider) =>
        `        RtcProviderCatalogEntry(${q(provider.providerKey)}, ${q(provider.pluginId)}, ${q(provider.driverId)}, ${provider.defaultSelected ? 'true' : 'false'}),`,
    )
    .join('\n');

  const providerPackageEntries = providerPackageCatalogEntries
    .map(
      (entry) =>
        `        RtcProviderPackageCatalogEntry(${q(entry.providerKey)}, ${q(entry.pluginId)}, ${q(entry.driverId)}, ${q(entry.packageIdentity)}, ${q(entry.manifestPath)}, ${q(entry.readmePath)}, ${q(entry.sourcePath)}, ${q(entry.sourceSymbol)}, ${entry.builtin ? 'true' : 'false'}, ${entry.rootPublic ? 'true' : 'false'}, ${q(entry.status)}, ${q(entry.runtimeBridgeStatus)}),`,
    )
    .join('\n');

  const capabilityEntries = capabilities
    .map(
      (descriptor) =>
        `        RtcCapabilityCatalogEntry(${q(descriptor.capabilityKey)}, ${q(descriptor.category)}, ${q(descriptor.surface)}),`,
    )
    .join('\n');

  const extensionEntries = extensions
    .map(
      (descriptor) =>
        `        RtcProviderExtensionCatalogEntry(${q(descriptor.extensionKey)}, ${q(descriptor.providerKey)}, ${q(descriptor.displayName)}, ${q(descriptor.surface)}, ${q(descriptor.access)}, ${q(descriptor.status)}),`,
    )
    .join('\n');

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      content: lines(`
plugins {
    base
}

group = "com.sdkwork"
version = "0.1.0"
description = "Reserved Kotlin package scaffold for ${languageEntry.publicPackage} with build system: ${languageEntry.packageScaffold.buildSystem}"

extra["sdkworkPublicPackage"] = "${languageEntry.publicPackage}"

base {
    archivesName.set("rtc-sdk")
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      content: lines(`
package com.sdkwork.rtc.standard

object RtcStandardContract {
    const val SYMBOL: String = "RtcStandardContract"
}

interface RtcProviderDriver<TNativeClient> {
    val providerKey: String

    fun createClient(): RtcClient<TNativeClient>
}

interface RtcDriverManager<TNativeClient> {
    fun resolveDriver(providerKey: String): RtcProviderDriver<TNativeClient>
}

interface RtcDataSource<TNativeClient> {
    fun createClient(): RtcClient<TNativeClient>
}

interface RtcClient<TNativeClient> {
    fun join()

    fun leave()

    fun publish(trackId: String)

    fun unpublish(trackId: String)

    fun muteAudio(muted: Boolean)

    fun muteVideo(muted: Boolean)

    fun unwrap(): TNativeClient?
}

interface RtcRuntimeController<TNativeClient> {
    fun join()

    fun leave()

    fun publish(trackId: String)

    fun unpublish(trackId: String)

    fun muteAudio(muted: Boolean)

    fun muteVideo(muted: Boolean)
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata

data class RtcProviderCatalogEntry(
    val providerKey: String,
    val pluginId: String,
    val driverId: String,
    val defaultSelected: Boolean,
)

object RtcProviderCatalog {
    const val DEFAULT_RTC_PROVIDER_KEY: String = ${q(assembly.defaults?.providerKey ?? 'volcengine')}

    val entries: List<RtcProviderCatalogEntry> = listOf(
${providerEntries}
    )

${renderReservedLanguageProviderCatalogLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata

data class RtcProviderPackageCatalogEntry(
    val providerKey: String,
    val pluginId: String,
    val driverId: String,
    val packageIdentity: String,
    val manifestPath: String,
    val readmePath: String,
    val sourcePath: String,
    val sourceSymbol: String,
    val builtin: Boolean,
    val rootPublic: Boolean,
    val status: String,
    val runtimeBridgeStatus: String,
)

object RtcProviderPackageCatalog {
    val entries: List<RtcProviderPackageCatalogEntry> = listOf(
${providerPackageEntries}
    )

${renderReservedLanguageProviderPackageLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata

data class RtcCapabilityCatalogEntry(
    val capabilityKey: String,
    val category: String,
    val surface: String,
)

object RtcCapabilityCatalog {
    val entries: List<RtcCapabilityCatalogEntry> = listOf(
${capabilityEntries}
    )

${renderReservedLanguageCapabilityLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata

data class RtcProviderExtensionCatalogEntry(
    val extensionKey: String,
    val providerKey: String,
    val displayName: String,
    val surface: String,
    val access: String,
    val status: String,
)

object RtcProviderExtensionCatalog {
    val recognizedSurfaces: List<String> = listOf(
        "control-plane",
        "runtime-bridge",
        "cross-surface",
    )

    val recognizedAccessModes: List<String> = listOf(
        "unwrap-only",
        "extension-object",
    )

    val recognizedStatuses: List<String> = listOf(
        "reference-baseline",
        "reserved",
    )

    val entries: List<RtcProviderExtensionCatalogEntry> = listOf(
${extensionEntries}
    )

${renderReservedLanguageProviderExtensionLookupHelper(languageEntry.language)}
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata

enum class Source {
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider,
}

data class RtcProviderSelection(
    val providerKey: String,
    val source: Source,
)

data class Request(
    val providerUrl: String? = null,
    val providerKey: String? = null,
    val tenantOverrideProviderKey: String? = null,
    val deploymentProfileProviderKey: String? = null,
)
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata

class RtcDriverManager {
    fun resolveSelection(
        request: Request = Request(),
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    ): RtcProviderSelection {
        if (hasText(request.providerUrl)) {
            return RtcProviderSelection(
                providerKey = parseProviderKey(request.providerUrl!!),
                source = Source.provider_url,
            )
        }

        if (hasText(request.providerKey)) {
            return RtcProviderSelection(
                providerKey = request.providerKey!!.trim(),
                source = Source.provider_key,
            )
        }

        if (hasText(request.tenantOverrideProviderKey)) {
            return RtcProviderSelection(
                providerKey = request.tenantOverrideProviderKey!!.trim(),
                source = Source.tenant_override,
            )
        }

        if (hasText(request.deploymentProfileProviderKey)) {
            return RtcProviderSelection(
                providerKey = request.deploymentProfileProviderKey!!.trim(),
                source = Source.deployment_profile,
            )
        }

        return RtcProviderSelection(
            providerKey = defaultProviderKey,
            source = Source.default_provider,
        )
    }

    fun describeProviderSupport(providerKey: String): RtcProviderSupport {
        val official = RtcProviderCatalog.entries.any { it.providerKey == providerKey }
        if (official) {
            return RtcProviderSupport(
                providerKey = providerKey,
                status = RtcProviderSupportStatus.official_unregistered,
                builtin = false,
                official = true,
                registered = false,
            )
        }

        return RtcProviderSupport(
            providerKey = providerKey,
            status = RtcProviderSupportStatus.unknown,
            builtin = false,
            official = false,
            registered = false,
        )
    }

    fun listProviderSupport(): List<RtcProviderSupport> {
        return RtcProviderCatalog.entries.map { describeProviderSupport(it.providerKey) }
    }

    private fun hasText(value: String?): Boolean = value != null && value.isNotBlank()

    private fun parseProviderKey(providerUrl: String): String {
        val trimmed = providerUrl.trim()
        require(trimmed.startsWith("rtc:") && trimmed.contains("://")) {
            "Invalid RTC provider URL: $providerUrl"
        }

        return trimmed.substring(4, trimmed.indexOf("://")).lowercase()
    }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata

data class RtcDataSourceOptions(
    val providerUrl: String? = null,
    val providerKey: String? = null,
    val tenantOverrideProviderKey: String? = null,
    val deploymentProfileProviderKey: String? = null,
    val defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
)

class RtcDataSource(
    private val options: RtcDataSourceOptions = RtcDataSourceOptions(),
    private val driverManager: RtcDriverManager = RtcDriverManager(),
) {
    fun describeSelection(overrides: RtcDataSourceOptions? = null): RtcProviderSelection {
        val merged = merge(options, overrides)
        return driverManager.resolveSelection(
            request = Request(
                providerUrl = merged.providerUrl,
                providerKey = merged.providerKey,
                tenantOverrideProviderKey = merged.tenantOverrideProviderKey,
                deploymentProfileProviderKey = merged.deploymentProfileProviderKey,
            ),
            defaultProviderKey = merged.defaultProviderKey,
        )
    }

    fun describeProviderSupport(overrides: RtcDataSourceOptions? = null): RtcProviderSupport {
        return driverManager.describeProviderSupport(describeSelection(overrides).providerKey)
    }

    fun listProviderSupport(): List<RtcProviderSupport> {
        return driverManager.listProviderSupport()
    }

    private fun merge(
        base: RtcDataSourceOptions,
        overrides: RtcDataSourceOptions?,
    ): RtcDataSourceOptions {
        if (overrides == null) {
            return base
        }

        return RtcDataSourceOptions(
            providerUrl = overrides.providerUrl ?: base.providerUrl,
            providerKey = overrides.providerKey ?: base.providerKey,
            tenantOverrideProviderKey = overrides.tenantOverrideProviderKey ?: base.tenantOverrideProviderKey,
            deploymentProfileProviderKey = overrides.deploymentProfileProviderKey ?: base.deploymentProfileProviderKey,
            defaultProviderKey = overrides.defaultProviderKey.ifBlank { base.defaultProviderKey },
        )
    }
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      content: lines(`
package com.sdkwork.rtc.metadata

enum class RtcProviderSupportStatus {
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown,
}

data class RtcProviderSupport(
    val providerKey: String,
    val status: RtcProviderSupportStatus,
    val builtin: Boolean,
    val official: Boolean,
    val registered: Boolean,
)
`),
    },
  ];
}

function renderGoReservedLanguagePlan(languageEntry, assembly) {
  const providers = assembly.providers ?? [];
  const capabilities = assembly.capabilityCatalog ?? [];
  const extensions = assembly.providerExtensionCatalog ?? [];
  const providerPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
    languageEntry,
    providers,
  );

  const providerEntries = providers
    .map(
      (provider) =>
        `    {ProviderKey: ${q(provider.providerKey)}, PluginId: ${q(provider.pluginId)}, DriverId: ${q(provider.driverId)}, DefaultSelected: ${provider.defaultSelected ? 'true' : 'false'}},`,
    )
    .join('\n');

  const providerPackageEntries = providerPackageCatalogEntries
    .map(
      (entry) =>
        `    {ProviderKey: ${q(entry.providerKey)}, PluginId: ${q(entry.pluginId)}, DriverId: ${q(entry.driverId)}, PackageIdentity: ${q(entry.packageIdentity)}, ManifestPath: ${q(entry.manifestPath)}, ReadmePath: ${q(entry.readmePath)}, SourcePath: ${q(entry.sourcePath)}, SourceSymbol: ${q(entry.sourceSymbol)}, Builtin: ${entry.builtin ? 'true' : 'false'}, RootPublic: ${entry.rootPublic ? 'true' : 'false'}, Status: ${q(entry.status)}, RuntimeBridgeStatus: ${q(entry.runtimeBridgeStatus)}},`,
    )
    .join('\n');

  const capabilityEntries = capabilities
    .map(
      (descriptor) =>
        `    {CapabilityKey: ${q(descriptor.capabilityKey)}, Category: ${q(descriptor.category)}, Surface: ${q(descriptor.surface)}},`,
    )
    .join('\n');

  const extensionEntries = extensions
    .map(
      (descriptor) =>
        `    {ExtensionKey: ${q(descriptor.extensionKey)}, ProviderKey: ${q(descriptor.providerKey)}, DisplayName: ${q(descriptor.displayName)}, Surface: ${q(descriptor.surface)}, Access: ${q(descriptor.access)}, Status: ${q(descriptor.status)}},`,
    )
    .join('\n');

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      content: lines(`
module ${languageEntry.publicPackage}

go 1.22

// build system: ${languageEntry.packageScaffold.buildSystem}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      content: lines(`
package rtcstandard

type RtcStandardContract struct{}

type RtcProviderDriver interface {
    ProviderKey() string
}

type RtcDriverManager interface {
    ResolveDriver(providerKey string)
}

type RtcDataSource interface {
    CreateClient()
}

type RtcClient interface {
    Join() error
    Leave() error
    Publish(trackID string) error
    Unpublish(trackID string) error
    MuteAudio(muted bool) error
    MuteVideo(muted bool) error
    Unwrap() any
}

type RtcRuntimeController interface {
    Join() error
    Leave() error
    Publish(trackID string) error
    Unpublish(trackID string) error
    MuteAudio(muted bool) error
    MuteVideo(muted bool) error
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      content: lines(`
package rtcstandard

type RtcProviderCatalogEntry struct {
    ProviderKey     string
    PluginId        string
    DriverId        string
    DefaultSelected bool
}

type RtcProviderCatalog struct{}

const DEFAULT_RTC_PROVIDER_KEY = ${q(assembly.defaults?.providerKey ?? 'volcengine')}

var OFFICIAL_RTC_PROVIDERS = []RtcProviderCatalogEntry{
${providerEntries}
}

${renderReservedLanguageProviderCatalogLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      content: lines(`
package rtcstandard

type RtcProviderPackageCatalogEntry struct {
    ProviderKey         string
    PluginId            string
    DriverId            string
    PackageIdentity     string
    ManifestPath        string
    ReadmePath          string
    SourcePath          string
    SourceSymbol        string
    Builtin             bool
    RootPublic          bool
    Status              string
    RuntimeBridgeStatus string
}

type RtcProviderPackageCatalog struct{}

var OFFICIAL_RTC_PROVIDER_PACKAGES = []RtcProviderPackageCatalogEntry{
${providerPackageEntries}
}

${renderReservedLanguageProviderPackageLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      content: lines(`
package rtcstandard

type RtcCapabilityCatalogEntry struct {
    CapabilityKey string
    Category      string
    Surface       string
}

type RtcCapabilityCatalog struct{}

var RTC_CAPABILITY_CATALOG = []RtcCapabilityCatalogEntry{
${capabilityEntries}
}

${renderReservedLanguageCapabilityLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      content: lines(`
package rtcstandard

type RtcProviderExtensionCatalogEntry struct {
    ExtensionKey string
    ProviderKey  string
    DisplayName  string
    Surface      string
    Access       string
    Status       string
}

type RtcProviderExtensionCatalog struct{}

var RTC_PROVIDER_EXTENSION_SURFACES = []string{
    "control-plane",
    "runtime-bridge",
    "cross-surface",
}

var RTC_PROVIDER_EXTENSION_ACCESSES = []string{
    "unwrap-only",
    "extension-object",
}

var RTC_PROVIDER_EXTENSION_STATUSES = []string{
    "reference-baseline",
    "reserved",
}

var RTC_PROVIDER_EXTENSION_CATALOG = []RtcProviderExtensionCatalogEntry{
${extensionEntries}
}

${renderReservedLanguageProviderExtensionLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      content: lines(`
package rtcstandard

type RtcProviderSelection struct {
    providerKey string
    source      string
}

type RtcProviderSelectionRequest struct {
    providerUrl                  string
    providerKey                  string
    tenantOverrideProviderKey    string
    deploymentProfileProviderKey string
}

var RTC_PROVIDER_SELECTION_SOURCES = []string{
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      content: lines(`
package rtcstandard

import "strings"

type RtcDriverManager struct{}

func hasText(value string) bool {
    return strings.TrimSpace(value) != ""
}

func parseProviderKey(providerUrl string) string {
    trimmed := strings.TrimSpace(providerUrl)
    if !strings.HasPrefix(trimmed, "rtc:") || !strings.Contains(trimmed, "://") {
        panic("Invalid RTC provider URL: " + providerUrl)
    }

    withoutPrefix := strings.TrimPrefix(trimmed, "rtc:")
    providerKey, _, _ := strings.Cut(withoutPrefix, "://")
    return strings.ToLower(providerKey)
}

func (manager RtcDriverManager) resolveSelection(request RtcProviderSelectionRequest, defaultProviderKey string) RtcProviderSelection {
    if hasText(request.providerUrl) {
        return RtcProviderSelection{
            providerKey: parseProviderKey(request.providerUrl),
            source:      "provider_url",
        }
    }

    if hasText(request.providerKey) {
        return RtcProviderSelection{
            providerKey: strings.TrimSpace(request.providerKey),
            source:      "provider_key",
        }
    }

    if hasText(request.tenantOverrideProviderKey) {
        return RtcProviderSelection{
            providerKey: strings.TrimSpace(request.tenantOverrideProviderKey),
            source:      "tenant_override",
        }
    }

    if hasText(request.deploymentProfileProviderKey) {
        return RtcProviderSelection{
            providerKey: strings.TrimSpace(request.deploymentProfileProviderKey),
            source:      "deployment_profile",
        }
    }

    resolvedDefaultProviderKey := defaultProviderKey
    if !hasText(resolvedDefaultProviderKey) {
        resolvedDefaultProviderKey = DEFAULT_RTC_PROVIDER_KEY
    }

    return RtcProviderSelection{
        providerKey: resolvedDefaultProviderKey,
        source:      "default_provider",
    }
}

func (manager RtcDriverManager) ResolveSelection(request RtcProviderSelectionRequest, defaultProviderKey string) RtcProviderSelection {
    return manager.resolveSelection(request, defaultProviderKey)
}

func (manager RtcDriverManager) describeProviderSupport(providerKey string) RtcProviderSupport {
    for _, entry := range OFFICIAL_RTC_PROVIDERS {
        if entry.providerKey == providerKey {
            return RtcProviderSupport{
                providerKey: providerKey,
                status:      "official_unregistered",
                builtin:     false,
                official:    true,
                registered:  false,
            }
        }
    }

    return RtcProviderSupport{
        providerKey: providerKey,
        status:      "unknown",
        builtin:     false,
        official:    false,
        registered:  false,
    }
}

func (manager RtcDriverManager) DescribeProviderSupport(providerKey string) RtcProviderSupport {
    return manager.describeProviderSupport(providerKey)
}

func (manager RtcDriverManager) listProviderSupport() []RtcProviderSupport {
    supports := make([]RtcProviderSupport, 0, len(OFFICIAL_RTC_PROVIDERS))
    for _, entry := range OFFICIAL_RTC_PROVIDERS {
        supports = append(supports, manager.describeProviderSupport(entry.providerKey))
    }
    return supports
}

func (manager RtcDriverManager) ListProviderSupport() []RtcProviderSupport {
    return manager.listProviderSupport()
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      content: lines(`
package rtcstandard

type RtcDataSourceOptions struct {
    providerUrl                  string
    providerKey                  string
    tenantOverrideProviderKey    string
    deploymentProfileProviderKey string
    defaultProviderKey           string
}

type RtcDataSource struct {
    options       RtcDataSourceOptions
    driverManager RtcDriverManager
}

func NewRtcDataSourceOptions() RtcDataSourceOptions {
    return RtcDataSourceOptions{
        defaultProviderKey: DEFAULT_RTC_PROVIDER_KEY,
    }
}

func NewRtcDataSource(options RtcDataSourceOptions, driverManager RtcDriverManager) RtcDataSource {
    if !hasText(options.defaultProviderKey) {
        options.defaultProviderKey = DEFAULT_RTC_PROVIDER_KEY
    }

    return RtcDataSource{
        options:       options,
        driverManager: driverManager,
    }
}

func mergeRtcDataSourceOptions(base RtcDataSourceOptions, overrides *RtcDataSourceOptions) RtcDataSourceOptions {
    if overrides == nil {
        return base
    }

    merged := base
    if overrides.providerUrl != "" {
        merged.providerUrl = overrides.providerUrl
    }
    if overrides.providerKey != "" {
        merged.providerKey = overrides.providerKey
    }
    if overrides.tenantOverrideProviderKey != "" {
        merged.tenantOverrideProviderKey = overrides.tenantOverrideProviderKey
    }
    if overrides.deploymentProfileProviderKey != "" {
        merged.deploymentProfileProviderKey = overrides.deploymentProfileProviderKey
    }
    if overrides.defaultProviderKey != "" {
        merged.defaultProviderKey = overrides.defaultProviderKey
    }

    return merged
}

func (dataSource RtcDataSource) describeSelection(overrides *RtcDataSourceOptions) RtcProviderSelection {
    merged := mergeRtcDataSourceOptions(dataSource.options, overrides)
    return dataSource.driverManager.resolveSelection(
        RtcProviderSelectionRequest{
            providerUrl:                  merged.providerUrl,
            providerKey:                  merged.providerKey,
            tenantOverrideProviderKey:    merged.tenantOverrideProviderKey,
            deploymentProfileProviderKey: merged.deploymentProfileProviderKey,
        },
        merged.defaultProviderKey,
    )
}

func (dataSource RtcDataSource) DescribeSelection(overrides *RtcDataSourceOptions) RtcProviderSelection {
    return dataSource.describeSelection(overrides)
}

func (dataSource RtcDataSource) describeProviderSupport(overrides *RtcDataSourceOptions) RtcProviderSupport {
    selection := dataSource.describeSelection(overrides)
    return dataSource.driverManager.describeProviderSupport(selection.providerKey)
}

func (dataSource RtcDataSource) DescribeProviderSupport(overrides *RtcDataSourceOptions) RtcProviderSupport {
    return dataSource.describeProviderSupport(overrides)
}

func (dataSource RtcDataSource) listProviderSupport() []RtcProviderSupport {
    return dataSource.driverManager.listProviderSupport()
}

func (dataSource RtcDataSource) ListProviderSupport() []RtcProviderSupport {
    return dataSource.listProviderSupport()
}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      content: lines(`
package rtcstandard

type RtcProviderSupport struct {
    providerKey string
    status      string
    builtin     bool
    official    bool
    registered  bool
}

var RTC_PROVIDER_SUPPORT_STATUSES = []string{
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
}
`),
    },
  ];
}

function renderPythonReservedLanguagePlan(languageEntry, assembly) {
  const providers = assembly.providers ?? [];
  const capabilities = assembly.capabilityCatalog ?? [];
  const extensions = assembly.providerExtensionCatalog ?? [];
  const providerPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
    languageEntry,
    providers,
  );

  const providerEntries = providers
    .map(
      (provider) =>
        `        RtcProviderCatalogEntry(${q(provider.providerKey)}, ${q(provider.pluginId)}, ${q(provider.driverId)}, ${provider.defaultSelected ? 'True' : 'False'}),`,
    )
    .join('\n');

  const providerPackageEntries = providerPackageCatalogEntries
    .map(
      (entry) =>
        `        RtcProviderPackageCatalogEntry(${q(entry.providerKey)}, ${q(entry.pluginId)}, ${q(entry.driverId)}, ${q(entry.packageIdentity)}, ${q(entry.manifestPath)}, ${q(entry.readmePath)}, ${q(entry.sourcePath)}, ${q(entry.sourceSymbol)}, ${entry.builtin ? 'True' : 'False'}, ${entry.rootPublic ? 'True' : 'False'}, ${q(entry.status)}, ${q(entry.runtimeBridgeStatus)}),`,
    )
    .join('\n');

  const capabilityEntries = capabilities
    .map(
      (descriptor) =>
        `        RtcCapabilityCatalogEntry(${q(descriptor.capabilityKey)}, ${q(descriptor.category)}, ${q(descriptor.surface)}),`,
    )
    .join('\n');

  const extensionEntries = extensions
    .map(
      (descriptor) =>
        `        RtcProviderExtensionCatalogEntry(${q(descriptor.extensionKey)}, ${q(descriptor.providerKey)}, ${q(descriptor.displayName)}, ${q(descriptor.surface)}, ${q(descriptor.access)}, ${q(descriptor.status)}),`,
    )
    .join('\n');

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      content: lines(`
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = ${q(languageEntry.publicPackage)}
version = "0.1.0"
description = ${q(`Reserved Python package scaffold for ${languageEntry.publicPackage} with build system: ${languageEntry.packageScaffold.buildSystem}`)}
requires-python = ">=3.11"
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      content: lines(`
from __future__ import annotations

from typing import Protocol, TypeVar


NativeClientT = TypeVar("NativeClientT")


class RtcStandardContract:
    symbol = "RtcStandardContract"


class RtcProviderDriver(Protocol[NativeClientT]):
    @property
    def provider_key(self) -> str:
        ...

    def create_client(self) -> "RtcClient[NativeClientT]":
        ...


class RtcDriverManager(Protocol[NativeClientT]):
    def resolve_driver(self, provider_key: str) -> RtcProviderDriver[NativeClientT]:
        ...


class RtcDataSource(Protocol[NativeClientT]):
    def create_client(self) -> "RtcClient[NativeClientT]":
        ...


class RtcClient(Protocol[NativeClientT]):
    def join(self) -> None:
        ...

    def leave(self) -> None:
        ...

    def publish(self, track_id: str) -> None:
        ...

    def unpublish(self, track_id: str) -> None:
        ...

    def mute_audio(self, muted: bool) -> None:
        ...

    def mute_video(self, muted: bool) -> None:
        ...

    def unwrap(self) -> NativeClientT | None:
        ...


class RtcRuntimeController(Protocol[NativeClientT]):
    def join(self) -> None:
        ...

    def leave(self) -> None:
        ...

    def publish(self, track_id: str) -> None:
        ...

    def unpublish(self, track_id: str) -> None:
        ...

    def mute_audio(self, muted: bool) -> None:
        ...

    def mute_video(self, muted: bool) -> None:
        ...
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      content: lines(`
from dataclasses import dataclass
from typing import Optional


DEFAULT_RTC_PROVIDER_KEY = ${q(assembly.defaults?.providerKey ?? 'volcengine')}


@dataclass(frozen=True)
class RtcProviderCatalogEntry:
    providerKey: str
    pluginId: str
    driverId: str
    defaultSelected: bool


class RtcProviderCatalog:
    entries = [
${providerEntries}
    ]


${renderReservedLanguageProviderCatalogLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      content: lines(`
from dataclasses import dataclass


@dataclass(frozen=True)
class RtcProviderPackageCatalogEntry:
    providerKey: str
    pluginId: str
    driverId: str
    packageIdentity: str
    manifestPath: str
    readmePath: str
    sourcePath: str
    sourceSymbol: str
    builtin: bool
    rootPublic: bool
    status: str
    runtimeBridgeStatus: str


class RtcProviderPackageCatalog:
    entries = [
${providerPackageEntries}
    ]


${renderReservedLanguageProviderPackageLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      content: lines(`
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RtcCapabilityCatalogEntry:
    capabilityKey: str
    category: str
    surface: str


class RtcCapabilityCatalog:
    entries = [
${capabilityEntries}
    ]


${renderReservedLanguageCapabilityLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      content: lines(`
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RtcProviderExtensionCatalogEntry:
    extensionKey: str
    providerKey: str
    displayName: str
    surface: str
    access: str
    status: str


class RtcProviderExtensionCatalog:
    recognizedSurfaces = [
        "control-plane",
        "runtime-bridge",
        "cross-surface",
    ]

    recognizedAccessModes = [
        "unwrap-only",
        "extension-object",
    ]

    recognizedStatuses = [
        "reference-baseline",
        "reserved",
    ]

    entries = [
${extensionEntries}
    ]


${renderReservedLanguageProviderExtensionLookupHelper(languageEntry.language)}
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      content: lines(`
from dataclasses import dataclass
from enum import Enum


class RtcProviderSelectionSource(str, Enum):
    provider_url = "provider_url"
    provider_key = "provider_key"
    tenant_override = "tenant_override"
    deployment_profile = "deployment_profile"
    default_provider = "default_provider"


@dataclass(frozen=True)
class RtcProviderSelection:
    providerKey: str
    source: RtcProviderSelectionSource


@dataclass(frozen=True)
class RtcProviderSelectionRequest:
    providerUrl: str | None = None
    providerKey: str | None = None
    tenantOverrideProviderKey: str | None = None
    deploymentProfileProviderKey: str | None = None
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      content: lines(`
from .provider_catalog import DEFAULT_RTC_PROVIDER_KEY, RtcProviderCatalog
from .provider_selection import (
    RtcProviderSelection,
    RtcProviderSelectionRequest,
    RtcProviderSelectionSource,
)
from .provider_support import RtcProviderSupport, RtcProviderSupportStatus


def _has_text(value: str | None) -> bool:
    return value is not None and value.strip() != ""


def _parse_provider_key(providerUrl: str) -> str:
    trimmed = providerUrl.strip()
    if not trimmed.startswith("rtc:") or "://" not in trimmed:
        raise ValueError(f"Invalid RTC provider URL: {providerUrl}")
    return trimmed[4:].split("://", 1)[0].lower()


class RtcDriverManager:
    def resolveSelection(
        self,
        request: RtcProviderSelectionRequest | None = None,
        *,
        defaultProviderKey: str = DEFAULT_RTC_PROVIDER_KEY,
    ) -> RtcProviderSelection:
        request = request or RtcProviderSelectionRequest()

        if _has_text(request.providerUrl):
            return RtcProviderSelection(
                providerKey=_parse_provider_key(request.providerUrl),
                source=RtcProviderSelectionSource.provider_url,
            )

        if _has_text(request.providerKey):
            return RtcProviderSelection(
                providerKey=request.providerKey.strip(),
                source=RtcProviderSelectionSource.provider_key,
            )

        if _has_text(request.tenantOverrideProviderKey):
            return RtcProviderSelection(
                providerKey=request.tenantOverrideProviderKey.strip(),
                source=RtcProviderSelectionSource.tenant_override,
            )

        if _has_text(request.deploymentProfileProviderKey):
            return RtcProviderSelection(
                providerKey=request.deploymentProfileProviderKey.strip(),
                source=RtcProviderSelectionSource.deployment_profile,
            )

        return RtcProviderSelection(
            providerKey=defaultProviderKey,
            source=RtcProviderSelectionSource.default_provider,
        )

    def describeProviderSupport(self, providerKey: str) -> RtcProviderSupport:
        official = any(entry.providerKey == providerKey for entry in RtcProviderCatalog.entries)

        if official:
            return RtcProviderSupport(
                providerKey=providerKey,
                status=RtcProviderSupportStatus.official_unregistered,
                builtin=False,
                official=True,
                registered=False,
            )

        return RtcProviderSupport(
            providerKey=providerKey,
            status=RtcProviderSupportStatus.unknown,
            builtin=False,
            official=False,
            registered=False,
        )

    def listProviderSupport(self) -> list[RtcProviderSupport]:
        return [
            self.describeProviderSupport(entry.providerKey)
            for entry in RtcProviderCatalog.entries
        ]
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      content: lines(`
from dataclasses import dataclass

from .driver_manager import RtcDriverManager
from .provider_catalog import DEFAULT_RTC_PROVIDER_KEY
from .provider_selection import RtcProviderSelection, RtcProviderSelectionRequest
from .provider_support import RtcProviderSupport


@dataclass(frozen=True)
class RtcDataSourceOptions:
    providerUrl: str | None = None
    providerKey: str | None = None
    tenantOverrideProviderKey: str | None = None
    deploymentProfileProviderKey: str | None = None
    defaultProviderKey: str = DEFAULT_RTC_PROVIDER_KEY


def _prefer(overrideValue: str | None, baseValue: str | None) -> str | None:
    return overrideValue if overrideValue is not None else baseValue


def _merge_options(
    base: RtcDataSourceOptions,
    overrides: RtcDataSourceOptions | None,
) -> RtcDataSourceOptions:
    if overrides is None:
        return base

    return RtcDataSourceOptions(
        providerUrl=_prefer(overrides.providerUrl, base.providerUrl),
        providerKey=_prefer(overrides.providerKey, base.providerKey),
        tenantOverrideProviderKey=_prefer(
            overrides.tenantOverrideProviderKey,
            base.tenantOverrideProviderKey,
        ),
        deploymentProfileProviderKey=_prefer(
            overrides.deploymentProfileProviderKey,
            base.deploymentProfileProviderKey,
        ),
        defaultProviderKey=overrides.defaultProviderKey or base.defaultProviderKey,
    )


class RtcDataSource:
    def __init__(
        self,
        options: RtcDataSourceOptions | None = None,
        driverManager: RtcDriverManager | None = None,
    ) -> None:
        self._options = options or RtcDataSourceOptions()
        self._driverManager = driverManager or RtcDriverManager()

    def describeSelection(
        self,
        overrides: RtcDataSourceOptions | None = None,
    ) -> RtcProviderSelection:
        merged = _merge_options(self._options, overrides)
        return self._driverManager.resolveSelection(
            RtcProviderSelectionRequest(
                providerUrl=merged.providerUrl,
                providerKey=merged.providerKey,
                tenantOverrideProviderKey=merged.tenantOverrideProviderKey,
                deploymentProfileProviderKey=merged.deploymentProfileProviderKey,
            ),
            defaultProviderKey=merged.defaultProviderKey,
        )

    def describeProviderSupport(
        self,
        overrides: RtcDataSourceOptions | None = None,
    ) -> RtcProviderSupport:
        selection = self.describeSelection(overrides)
        return self._driverManager.describeProviderSupport(selection.providerKey)

    def listProviderSupport(self) -> list[RtcProviderSupport]:
        return self._driverManager.listProviderSupport()
`),
    },
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      content: lines(`
from dataclasses import dataclass
from enum import Enum


class RtcProviderSupportStatus(str, Enum):
    builtin_registered = "builtin_registered"
    official_registered = "official_registered"
    official_unregistered = "official_unregistered"
    unknown = "unknown"


@dataclass(frozen=True)
class RtcProviderSupport:
    providerKey: str
    status: RtcProviderSupportStatus
    builtin: bool
    official: bool
    registered: bool
`),
    },
  ];
}

function renderReservedLanguageProviderActivationCatalogPlan(languageEntry, assembly) {
  if (typeof languageEntry.metadataScaffold?.providerActivationCatalogRelativePath !== 'string') {
    return [];
  }

  const entries = buildLanguageProviderActivationCatalogEntries(languageEntry, assembly.providers);

  switch (languageEntry.language) {
    case 'flutter': {
      const activationEntries = entries
        .map(
          (entry) => `    RtcProviderActivationCatalogEntry(
      providerKey: ${q(entry.providerKey)},
      pluginId: ${q(entry.pluginId)},
      driverId: ${q(entry.driverId)},
      activationStatus: ${q(entry.activationStatus)},
      runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'},
      rootPublic: ${entry.rootPublic ? 'true' : 'false'},
      packageBoundary: ${entry.packageBoundary ? 'true' : 'false'},
      builtin: ${entry.builtin ? 'true' : 'false'},
      packageIdentity: ${q(entry.packageIdentity)},
    ),`,
        )
        .join('\n');
      const recognizedStatuses = PROVIDER_ACTIVATION_STATUSES.map((status) => `    ${q(status)},`).join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
          content: lines(`
final class RtcProviderActivationCatalogEntry {
  const RtcProviderActivationCatalogEntry({
    required this.providerKey,
    required this.pluginId,
    required this.driverId,
    required this.activationStatus,
    required this.runtimeBridge,
    required this.rootPublic,
    required this.packageBoundary,
    required this.builtin,
    required this.packageIdentity,
  });

  final String providerKey;
  final String pluginId;
  final String driverId;
  final String activationStatus;
  final bool runtimeBridge;
  final bool rootPublic;
  final bool packageBoundary;
  final bool builtin;
  final String packageIdentity;
}

final class RtcProviderActivationCatalog {
  static const List<String> recognizedActivationStatuses = <String>[
${recognizedStatuses}
  ];

  static const List<RtcProviderActivationCatalogEntry> entries =
      <RtcProviderActivationCatalogEntry>[
${activationEntries}
      ];

  const RtcProviderActivationCatalog._();
}

${renderReservedLanguageProviderActivationLookupHelper(languageEntry.language)}
`),
        },
      ];
    }
    case 'rust': {
      const activationEntries = entries
        .map(
          (entry) => `    RtcProviderActivationCatalogEntry { providerKey: ${q(entry.providerKey)}, pluginId: ${q(entry.pluginId)}, driverId: ${q(entry.driverId)}, activationStatus: ${q(entry.activationStatus)}, runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'}, rootPublic: ${entry.rootPublic ? 'true' : 'false'}, packageBoundary: ${entry.packageBoundary ? 'true' : 'false'}, builtin: ${entry.builtin ? 'true' : 'false'}, packageIdentity: ${q(entry.packageIdentity)} },`,
        )
        .join('\n');
      const recognizedStatuses = PROVIDER_ACTIVATION_STATUSES.map(q).join(', ');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
          content: lines(`
#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcProviderActivationCatalogEntry {
    pub providerKey: &'static str,
    pub pluginId: &'static str,
    pub driverId: &'static str,
    pub activationStatus: &'static str,
    pub runtimeBridge: bool,
    pub rootPublic: bool,
    pub packageBoundary: bool,
    pub builtin: bool,
    pub packageIdentity: &'static str,
}

pub struct RtcProviderActivationCatalog;

pub const RTC_PROVIDER_ACTIVATION_STATUSES: [&str; ${PROVIDER_ACTIVATION_STATUSES.length}] = [${recognizedStatuses}];

pub const OFFICIAL_RTC_PROVIDER_ACTIVATIONS: [RtcProviderActivationCatalogEntry; ${entries.length}] = [
${activationEntries}
];

${renderReservedLanguageProviderActivationLookupHelper(languageEntry.language)}
`),
        },
      ];
    }
    case 'java': {
      const activationEntries = entries
        .map(
          (entry) =>
            `      new RtcProviderActivationCatalogEntry(${q(entry.providerKey)}, ${q(entry.pluginId)}, ${q(entry.driverId)}, ${q(entry.activationStatus)}, ${entry.runtimeBridge ? 'true' : 'false'}, ${entry.rootPublic ? 'true' : 'false'}, ${entry.packageBoundary ? 'true' : 'false'}, ${entry.builtin ? 'true' : 'false'}, ${q(entry.packageIdentity)})`,
        )
        .join(',\n');
      const recognizedStatuses = PROVIDER_ACTIVATION_STATUSES.map((status) => `      ${q(status)}`).join(',\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
          content: lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcProviderActivationCatalog {

  public static final List<String> RECOGNIZED_ACTIVATION_STATUSES = List.of(
${recognizedStatuses}
  );

  public static final List<RtcProviderActivationCatalogEntry> ENTRIES = List.of(
${activationEntries}
  );

${renderReservedLanguageProviderActivationLookupHelper(languageEntry.language)}

  private RtcProviderActivationCatalog() {
  }

  public record RtcProviderActivationCatalogEntry(
      String providerKey,
      String pluginId,
      String driverId,
      String activationStatus,
      boolean runtimeBridge,
      boolean rootPublic,
      boolean packageBoundary,
      boolean builtin,
      String packageIdentity
  ) {
  }
}
`),
        },
      ];
    }
    case 'csharp': {
      const activationEntries = entries
        .map(
          (entry) =>
            `        new(${q(entry.providerKey)}, ${q(entry.pluginId)}, ${q(entry.driverId)}, ${q(entry.activationStatus)}, ${entry.runtimeBridge ? 'true' : 'false'}, ${entry.rootPublic ? 'true' : 'false'}, ${entry.packageBoundary ? 'true' : 'false'}, ${entry.builtin ? 'true' : 'false'}, ${q(entry.packageIdentity)}),`,
        )
        .join('\n');
      const recognizedStatuses = PROVIDER_ACTIVATION_STATUSES.map((status) => `        ${q(status)},`).join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
          content: lines(`
namespace Sdkwork.Rtc.Sdk;

using System.Linq;

public sealed record RtcProviderActivationCatalogEntry(
    string providerKey,
    string pluginId,
    string driverId,
    string activationStatus,
    bool runtimeBridge,
    bool rootPublic,
    bool packageBoundary,
    bool builtin,
    string packageIdentity
);

public static class RtcProviderActivationCatalog
{
    public static readonly IReadOnlyList<string> RecognizedActivationStatuses =
    [
${recognizedStatuses}
    ];

    public static readonly IReadOnlyList<RtcProviderActivationCatalogEntry> Entries =
    [
${activationEntries}
    ];

${renderReservedLanguageProviderActivationLookupHelper(languageEntry.language)}
}
`),
        },
      ];
    }
    case 'swift': {
      const activationEntries = entries
        .map(
          (entry) =>
            `        .init(providerKey: ${q(entry.providerKey)}, pluginId: ${q(entry.pluginId)}, driverId: ${q(entry.driverId)}, activationStatus: ${q(entry.activationStatus)}, runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'}, rootPublic: ${entry.rootPublic ? 'true' : 'false'}, packageBoundary: ${entry.packageBoundary ? 'true' : 'false'}, builtin: ${entry.builtin ? 'true' : 'false'}, packageIdentity: ${q(entry.packageIdentity)}),`,
        )
        .join('\n');
      const recognizedStatuses = PROVIDER_ACTIVATION_STATUSES.map((status) => `        ${q(status)},`).join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
          content: lines(`
public struct RtcProviderActivationCatalogEntry {
    public let providerKey: String
    public let pluginId: String
    public let driverId: String
    public let activationStatus: String
    public let runtimeBridge: Bool
    public let rootPublic: Bool
    public let packageBoundary: Bool
    public let builtin: Bool
    public let packageIdentity: String
}

public enum RtcProviderActivationCatalog {
    public static let recognizedActivationStatuses: [String] = [
${recognizedStatuses}
    ]

    public static let entries: [RtcProviderActivationCatalogEntry] = [
${activationEntries}
    ]

${renderReservedLanguageProviderActivationLookupHelper(languageEntry.language)}
}
`),
        },
      ];
    }
    case 'kotlin': {
      const activationEntries = entries
        .map(
          (entry) =>
            `        RtcProviderActivationCatalogEntry(${q(entry.providerKey)}, ${q(entry.pluginId)}, ${q(entry.driverId)}, ${q(entry.activationStatus)}, ${entry.runtimeBridge ? 'true' : 'false'}, ${entry.rootPublic ? 'true' : 'false'}, ${entry.packageBoundary ? 'true' : 'false'}, ${entry.builtin ? 'true' : 'false'}, ${q(entry.packageIdentity)}),`,
        )
        .join('\n');
      const recognizedStatuses = PROVIDER_ACTIVATION_STATUSES.map((status) => `        ${q(status)},`).join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
          content: lines(`
package com.sdkwork.rtc.metadata

data class RtcProviderActivationCatalogEntry(
    val providerKey: String,
    val pluginId: String,
    val driverId: String,
    val activationStatus: String,
    val runtimeBridge: Boolean,
    val rootPublic: Boolean,
    val packageBoundary: Boolean,
    val builtin: Boolean,
    val packageIdentity: String,
)

object RtcProviderActivationCatalog {
    val recognizedActivationStatuses: List<String> = listOf(
${recognizedStatuses}
    )

    val entries: List<RtcProviderActivationCatalogEntry> = listOf(
${activationEntries}
    )

${renderReservedLanguageProviderActivationLookupHelper(languageEntry.language)}
}
`),
        },
      ];
    }
    case 'go': {
      const activationEntries = entries
        .map(
          (entry) =>
            `    {ProviderKey: ${q(entry.providerKey)}, PluginId: ${q(entry.pluginId)}, DriverId: ${q(entry.driverId)}, ActivationStatus: ${q(entry.activationStatus)}, RuntimeBridge: ${entry.runtimeBridge ? 'true' : 'false'}, RootPublic: ${entry.rootPublic ? 'true' : 'false'}, PackageBoundary: ${entry.packageBoundary ? 'true' : 'false'}, Builtin: ${entry.builtin ? 'true' : 'false'}, PackageIdentity: ${q(entry.packageIdentity)}},`,
        )
        .join('\n');
      const recognizedStatuses = PROVIDER_ACTIVATION_STATUSES.map((status) => q(status)).join(', ');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
          content: lines(`
package rtcstandard

type RtcProviderActivationCatalogEntry struct {
    ProviderKey      string
    PluginId         string
    DriverId         string
    ActivationStatus string
    RuntimeBridge    bool
    RootPublic       bool
    PackageBoundary  bool
    Builtin          bool
    PackageIdentity  string
}

type RtcProviderActivationCatalog struct{}

var RTC_PROVIDER_ACTIVATION_STATUSES = []string{${recognizedStatuses}}

var OFFICIAL_RTC_PROVIDER_ACTIVATIONS = []RtcProviderActivationCatalogEntry{
${activationEntries}
}

${renderReservedLanguageProviderActivationLookupHelper(languageEntry.language)}
`),
        },
      ];
    }
    case 'python': {
      const activationEntries = entries
        .map(
          (entry) =>
            `        RtcProviderActivationCatalogEntry(${q(entry.providerKey)}, ${q(entry.pluginId)}, ${q(entry.driverId)}, ${q(entry.activationStatus)}, ${entry.runtimeBridge ? 'True' : 'False'}, ${entry.rootPublic ? 'True' : 'False'}, ${entry.packageBoundary ? 'True' : 'False'}, ${entry.builtin ? 'True' : 'False'}, ${q(entry.packageIdentity)}),`,
        )
        .join('\n');
      const recognizedStatuses = PROVIDER_ACTIVATION_STATUSES.map((status) => `        ${q(status)},`).join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
          content: lines(`
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RtcProviderActivationCatalogEntry:
    providerKey: str
    pluginId: str
    driverId: str
    activationStatus: str
    runtimeBridge: bool
    rootPublic: bool
    packageBoundary: bool
    builtin: bool
    packageIdentity: str


class RtcProviderActivationCatalog:
    recognizedActivationStatuses = [
${recognizedStatuses}
    ]

    entries = [
${activationEntries}
    ]


${renderReservedLanguageProviderActivationLookupHelper(languageEntry.language)}
`),
        },
      ];
    }
    default:
      return [];
  }
}

function buildLanguageWorkspaceCatalogEntries(assembly) {
  const defaultProviderContract =
    typeof assembly.defaults?.providerKey === 'string' &&
    typeof assembly.defaults?.pluginId === 'string' &&
    typeof assembly.defaults?.driverId === 'string'
      ? {
          providerKey: assembly.defaults.providerKey,
          pluginId: assembly.defaults.pluginId,
          driverId: assembly.defaults.driverId,
        }
      : undefined;
  const providerSelectionContract =
    Array.isArray(assembly.providerSelectionStandard?.sourceTerms) &&
    Array.isArray(assembly.providerSelectionStandard?.precedence) &&
    typeof assembly.providerSelectionStandard?.defaultSource === 'string'
      ? {
          sourceTerms: [...assembly.providerSelectionStandard.sourceTerms],
          precedence: [...assembly.providerSelectionStandard.precedence],
          defaultSource: assembly.providerSelectionStandard.defaultSource,
        }
      : undefined;
  const providerSupportContract = Array.isArray(assembly.providerSupportStandard?.statusTerms)
    ? {
        statusTerms: [...assembly.providerSupportStandard.statusTerms],
      }
    : undefined;
  const providerActivationContract = Array.isArray(assembly.providerActivationStandard?.statusTerms)
    ? {
        statusTerms: [...assembly.providerActivationStandard.statusTerms],
      }
    : undefined;
  const providerPackageBoundaryContract =
    Array.isArray(assembly.providerPackageBoundaryStandard?.modeTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.rootPublicPolicyTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.lifecycleStatusTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.runtimeBridgeStatusTerms)
      ? {
          modeTerms: [...assembly.providerPackageBoundaryStandard.modeTerms],
          rootPublicPolicyTerms: [...assembly.providerPackageBoundaryStandard.rootPublicPolicyTerms],
          lifecycleStatusTerms: [...assembly.providerPackageBoundaryStandard.lifecycleStatusTerms],
          runtimeBridgeStatusTerms: [
            ...assembly.providerPackageBoundaryStandard.runtimeBridgeStatusTerms,
          ],
        }
      : undefined;

  return (assembly.languages ?? []).map((languageEntry) => ({
    language: languageEntry.language,
    workspace: languageEntry.workspace,
    workspaceCatalogRelativePath: languageEntry.workspaceCatalogRelativePath,
    displayName: languageEntry.displayName,
    publicPackage: languageEntry.publicPackage,
    maturityTier: languageEntry.maturityTier,
    controlSdk: languageEntry.controlSdk === true,
    runtimeBridge: languageEntry.runtimeBridge === true,
    currentRole: languageEntry.currentRole,
    workspaceSummary: languageEntry.workspaceSummary,
    roleHighlights: [...(languageEntry.roleHighlights ?? [])],
    defaultProviderContract,
    providerSelectionContract,
    providerSupportContract,
    providerActivationContract,
    runtimeBaseline: languageEntry.runtimeBaseline
      ? {
          vendorSdkPackage: languageEntry.runtimeBaseline.vendorSdkPackage,
          vendorSdkImportPath: languageEntry.runtimeBaseline.vendorSdkImportPath,
          signalingSdkPackage: languageEntry.runtimeBaseline.signalingSdkPackage,
          signalingSdkImportPath: languageEntry.runtimeBaseline.signalingSdkImportPath,
          recommendedEntrypoint: languageEntry.runtimeBaseline.recommendedEntrypoint,
          smokeCommand: languageEntry.runtimeBaseline.smokeCommand,
          smokeMode: languageEntry.runtimeBaseline.smokeMode,
          smokeVariants: [...languageEntry.runtimeBaseline.smokeVariants],
        }
      : undefined,
    metadataScaffold: languageEntry.metadataScaffold
      ? {
          providerCatalogRelativePath: languageEntry.metadataScaffold.providerCatalogRelativePath,
          capabilityCatalogRelativePath: languageEntry.metadataScaffold.capabilityCatalogRelativePath,
          providerExtensionCatalogRelativePath:
            languageEntry.metadataScaffold.providerExtensionCatalogRelativePath,
          providerPackageCatalogRelativePath:
            languageEntry.metadataScaffold.providerPackageCatalogRelativePath,
          providerActivationCatalogRelativePath:
            languageEntry.metadataScaffold.providerActivationCatalogRelativePath,
          providerSelectionRelativePath:
            languageEntry.metadataScaffold.providerSelectionRelativePath,
        }
      : undefined,
    resolutionScaffold: languageEntry.resolutionScaffold
      ? {
          driverManagerRelativePath: languageEntry.resolutionScaffold.driverManagerRelativePath,
          dataSourceRelativePath: languageEntry.resolutionScaffold.dataSourceRelativePath,
          providerSupportRelativePath: languageEntry.resolutionScaffold.providerSupportRelativePath,
          providerPackageLoaderRelativePath:
            languageEntry.resolutionScaffold.providerPackageLoaderRelativePath,
        }
      : undefined,
    providerPackageBoundaryContract,
    providerPackageBoundary: languageEntry.providerPackageBoundary
      ? {
          mode: languageEntry.providerPackageBoundary.mode,
          rootPublicPolicy: languageEntry.providerPackageBoundary.rootPublicPolicy,
          lifecycleStatusTerms: [...(languageEntry.providerPackageBoundary.lifecycleStatusTerms ?? [])],
          runtimeBridgeStatusTerms: [
            ...(languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms ?? []),
          ],
        }
      : undefined,
    providerPackageScaffold: languageEntry.providerPackageScaffold
      ? {
          relativePath: languageEntry.providerPackageScaffold.relativePath,
          directoryPattern: languageEntry.providerPackageScaffold.directoryPattern,
          packagePattern: languageEntry.providerPackageScaffold.packagePattern,
          manifestFileName: languageEntry.providerPackageScaffold.manifestFileName,
          readmeFileName: languageEntry.providerPackageScaffold.readmeFileName,
          sourceFilePattern: languageEntry.providerPackageScaffold.sourceFilePattern,
          sourceSymbolPattern: languageEntry.providerPackageScaffold.sourceSymbolPattern,
          templateTokens: [...(languageEntry.providerPackageScaffold.templateTokens ?? [])],
          sourceTemplateTokens: [
            ...(languageEntry.providerPackageScaffold.sourceTemplateTokens ?? []),
          ],
          runtimeBridgeStatus: languageEntry.providerPackageScaffold.runtimeBridgeStatus,
          rootPublic: languageEntry.providerPackageScaffold.rootPublic === true,
          status: languageEntry.providerPackageScaffold.status,
        }
      : undefined,
  }));
}

function renderReservedLanguageWorkspaceCatalogPlan(languageEntry, assembly) {
  if (typeof languageEntry.workspaceCatalogRelativePath !== 'string') {
    return [];
  }

  const entries = buildLanguageWorkspaceCatalogEntries(assembly);

  switch (languageEntry.language) {
    case 'flutter': {
      const workspaceEntries = entries
        .map(
          (entry) => `    RtcLanguageWorkspaceCatalogEntry(
      language: ${q(entry.language)},
      workspace: ${q(entry.workspace)},
      workspaceCatalogRelativePath: ${q(entry.workspaceCatalogRelativePath)},
      displayName: ${q(entry.displayName)},
      publicPackage: ${q(entry.publicPackage)},
      maturityTier: ${q(entry.maturityTier)},
      controlSdk: ${entry.controlSdk ? 'true' : 'false'},
      runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'},
      currentRole: ${q(entry.currentRole)},
      workspaceSummary: ${q(entry.workspaceSummary)},
      roleHighlights: <String>[
${entry.roleHighlights.map((roleHighlight) => `        ${q(roleHighlight)},`).join('\n')}
      ],
      defaultProviderContract: RtcLanguageWorkspaceDefaultProviderContract(
        providerKey: ${q(entry.defaultProviderContract?.providerKey ?? '')},
        pluginId: ${q(entry.defaultProviderContract?.pluginId ?? '')},
        driverId: ${q(entry.defaultProviderContract?.driverId ?? '')},
      ),
      providerSelectionContract: RtcLanguageWorkspaceProviderSelectionContract(
        sourceTerms: <String>[${(entry.providerSelectionContract?.sourceTerms ?? []).map(q).join(', ')}],
        precedence: <String>[${(entry.providerSelectionContract?.precedence ?? []).map(q).join(', ')}],
        defaultSource: ${q(entry.providerSelectionContract?.defaultSource ?? '')},
      ),
      providerSupportContract: RtcLanguageWorkspaceProviderSupportContract(
        statusTerms: <String>[${(entry.providerSupportContract?.statusTerms ?? []).map(q).join(', ')}],
      ),
      providerActivationContract: RtcLanguageWorkspaceProviderActivationContract(
        statusTerms: <String>[${(entry.providerActivationContract?.statusTerms ?? []).map(q).join(', ')}],
      ),
      runtimeBaseline: ${entry.runtimeBaseline
        ? `RtcLanguageWorkspaceRuntimeBaseline(
        vendorSdkPackage: ${q(entry.runtimeBaseline.vendorSdkPackage)},
        vendorSdkImportPath: ${q(entry.runtimeBaseline.vendorSdkImportPath)},
        signalingSdkPackage: ${q(entry.runtimeBaseline.signalingSdkPackage)},
        signalingSdkImportPath: ${q(entry.runtimeBaseline.signalingSdkImportPath)},
        recommendedEntrypoint: ${q(entry.runtimeBaseline.recommendedEntrypoint)},
        smokeCommand: ${q(entry.runtimeBaseline.smokeCommand)},
        smokeMode: ${q(entry.runtimeBaseline.smokeMode)},
        smokeVariants: <String>[${entry.runtimeBaseline.smokeVariants.map(q).join(', ')}],
      )`
        : 'null'},
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: ${q(entry.metadataScaffold?.providerCatalogRelativePath ?? '')},
        capabilityCatalogRelativePath: ${q(entry.metadataScaffold?.capabilityCatalogRelativePath ?? '')},
        providerExtensionCatalogRelativePath: ${q(entry.metadataScaffold?.providerExtensionCatalogRelativePath ?? '')},
        providerPackageCatalogRelativePath: ${q(entry.metadataScaffold?.providerPackageCatalogRelativePath ?? '')},
        providerActivationCatalogRelativePath: ${q(entry.metadataScaffold?.providerActivationCatalogRelativePath ?? '')},
        providerSelectionRelativePath: ${q(entry.metadataScaffold?.providerSelectionRelativePath ?? '')},
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: ${q(entry.resolutionScaffold?.driverManagerRelativePath ?? '')},
        dataSourceRelativePath: ${q(entry.resolutionScaffold?.dataSourceRelativePath ?? '')},
        providerSupportRelativePath: ${q(entry.resolutionScaffold?.providerSupportRelativePath ?? '')},
        providerPackageLoaderRelativePath: ${q(entry.resolutionScaffold?.providerPackageLoaderRelativePath ?? '')},
      ),
      providerPackageBoundaryContract: RtcLanguageWorkspaceProviderPackageBoundaryContract(
        modeTerms: <String>[${(entry.providerPackageBoundaryContract?.modeTerms ?? []).map(q).join(', ')}],
        rootPublicPolicyTerms: <String>[${(entry.providerPackageBoundaryContract?.rootPublicPolicyTerms ?? []).map(q).join(', ')}],
        lifecycleStatusTerms: <String>[${(entry.providerPackageBoundaryContract?.lifecycleStatusTerms ?? []).map(q).join(', ')}],
        runtimeBridgeStatusTerms: <String>[${(entry.providerPackageBoundaryContract?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}],
      ),
      providerPackageBoundary: RtcLanguageWorkspaceProviderPackageBoundary(
        mode: ${q(entry.providerPackageBoundary?.mode ?? '')},
        rootPublicPolicy: ${q(entry.providerPackageBoundary?.rootPublicPolicy ?? '')},
        lifecycleStatusTerms: <String>[${(entry.providerPackageBoundary?.lifecycleStatusTerms ?? []).map(q).join(', ')}],
        runtimeBridgeStatusTerms: <String>[${(entry.providerPackageBoundary?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}],
      ),
      providerPackageScaffold: ${entry.providerPackageScaffold
        ? `RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: ${q(entry.providerPackageScaffold.relativePath)},
        directoryPattern: ${q(entry.providerPackageScaffold.directoryPattern)},
        packagePattern: ${q(entry.providerPackageScaffold.packagePattern)},
        manifestFileName: ${q(entry.providerPackageScaffold.manifestFileName)},
        readmeFileName: ${q(entry.providerPackageScaffold.readmeFileName)},
        sourceFilePattern: ${q(entry.providerPackageScaffold.sourceFilePattern)},
        sourceSymbolPattern: ${q(entry.providerPackageScaffold.sourceSymbolPattern)},
        templateTokens: <String>[${entry.providerPackageScaffold.templateTokens.map(q).join(', ')}],
        sourceTemplateTokens: <String>[${entry.providerPackageScaffold.sourceTemplateTokens.map(q).join(', ')}],
        runtimeBridgeStatus: ${q(entry.providerPackageScaffold.runtimeBridgeStatus)},
        rootPublic: ${entry.providerPackageScaffold.rootPublic ? 'true' : 'false'},
        status: ${q(entry.providerPackageScaffold.status)},
      )`
        : 'null'},
    ),`,
        )
        .join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
          content: lines(`
final class RtcLanguageWorkspaceCatalogEntry {
  const RtcLanguageWorkspaceCatalogEntry({
    required this.language,
    required this.workspace,
    required this.workspaceCatalogRelativePath,
    required this.displayName,
    required this.publicPackage,
    required this.maturityTier,
    required this.controlSdk,
    required this.runtimeBridge,
    required this.currentRole,
    required this.workspaceSummary,
    required this.roleHighlights,
    required this.defaultProviderContract,
    required this.providerSelectionContract,
    required this.providerSupportContract,
    required this.providerActivationContract,
    required this.runtimeBaseline,
    required this.metadataScaffold,
    required this.resolutionScaffold,
    required this.providerPackageBoundaryContract,
    required this.providerPackageBoundary,
    required this.providerPackageScaffold,
  });

  final String language;
  final String workspace;
  final String workspaceCatalogRelativePath;
  final String displayName;
  final String publicPackage;
  final String maturityTier;
  final bool controlSdk;
  final bool runtimeBridge;
  final String currentRole;
  final String workspaceSummary;
  final List<String> roleHighlights;
  final RtcLanguageWorkspaceDefaultProviderContract defaultProviderContract;
  final RtcLanguageWorkspaceProviderSelectionContract providerSelectionContract;
  final RtcLanguageWorkspaceProviderSupportContract providerSupportContract;
  final RtcLanguageWorkspaceProviderActivationContract providerActivationContract;
  final RtcLanguageWorkspaceRuntimeBaseline? runtimeBaseline;
  final RtcLanguageWorkspaceMetadataScaffold metadataScaffold;
  final RtcLanguageWorkspaceResolutionScaffold resolutionScaffold;
  final RtcLanguageWorkspaceProviderPackageBoundaryContract providerPackageBoundaryContract;
  final RtcLanguageWorkspaceProviderPackageBoundary providerPackageBoundary;
  final RtcLanguageWorkspaceProviderPackageScaffold? providerPackageScaffold;
}

final class RtcLanguageWorkspaceDefaultProviderContract {
  const RtcLanguageWorkspaceDefaultProviderContract({
    required this.providerKey,
    required this.pluginId,
    required this.driverId,
  });

  final String providerKey;
  final String pluginId;
  final String driverId;
}

final class RtcLanguageWorkspaceProviderSelectionContract {
  const RtcLanguageWorkspaceProviderSelectionContract({
    required this.sourceTerms,
    required this.precedence,
    required this.defaultSource,
  });

  final List<String> sourceTerms;
  final List<String> precedence;
  final String defaultSource;
}

final class RtcLanguageWorkspaceProviderSupportContract {
  const RtcLanguageWorkspaceProviderSupportContract({
    required this.statusTerms,
  });

  final List<String> statusTerms;
}

final class RtcLanguageWorkspaceProviderActivationContract {
  const RtcLanguageWorkspaceProviderActivationContract({
    required this.statusTerms,
  });

  final List<String> statusTerms;
}

final class RtcLanguageWorkspaceRuntimeBaseline {
  const RtcLanguageWorkspaceRuntimeBaseline({
    required this.vendorSdkPackage,
    required this.vendorSdkImportPath,
    required this.signalingSdkPackage,
    required this.signalingSdkImportPath,
    required this.recommendedEntrypoint,
    required this.smokeCommand,
    required this.smokeMode,
    required this.smokeVariants,
  });

  final String vendorSdkPackage;
  final String vendorSdkImportPath;
  final String signalingSdkPackage;
  final String signalingSdkImportPath;
  final String recommendedEntrypoint;
  final String smokeCommand;
  final String smokeMode;
  final List<String> smokeVariants;
}

final class RtcLanguageWorkspaceMetadataScaffold {
  const RtcLanguageWorkspaceMetadataScaffold({
    required this.providerCatalogRelativePath,
    required this.capabilityCatalogRelativePath,
    required this.providerExtensionCatalogRelativePath,
    required this.providerPackageCatalogRelativePath,
    required this.providerActivationCatalogRelativePath,
    required this.providerSelectionRelativePath,
  });

  final String providerCatalogRelativePath;
  final String capabilityCatalogRelativePath;
  final String providerExtensionCatalogRelativePath;
  final String providerPackageCatalogRelativePath;
  final String providerActivationCatalogRelativePath;
  final String providerSelectionRelativePath;
}

final class RtcLanguageWorkspaceResolutionScaffold {
  const RtcLanguageWorkspaceResolutionScaffold({
    required this.driverManagerRelativePath,
    required this.dataSourceRelativePath,
    required this.providerSupportRelativePath,
    required this.providerPackageLoaderRelativePath,
  });

  final String driverManagerRelativePath;
  final String dataSourceRelativePath;
  final String providerSupportRelativePath;
  final String providerPackageLoaderRelativePath;
}

final class RtcLanguageWorkspaceProviderPackageBoundaryContract {
  const RtcLanguageWorkspaceProviderPackageBoundaryContract({
    required this.modeTerms,
    required this.rootPublicPolicyTerms,
    required this.lifecycleStatusTerms,
    required this.runtimeBridgeStatusTerms,
  });

  final List<String> modeTerms;
  final List<String> rootPublicPolicyTerms;
  final List<String> lifecycleStatusTerms;
  final List<String> runtimeBridgeStatusTerms;
}

final class RtcLanguageWorkspaceProviderPackageBoundary {
  const RtcLanguageWorkspaceProviderPackageBoundary({
    required this.mode,
    required this.rootPublicPolicy,
    required this.lifecycleStatusTerms,
    required this.runtimeBridgeStatusTerms,
  });

  final String mode;
  final String rootPublicPolicy;
  final List<String> lifecycleStatusTerms;
  final List<String> runtimeBridgeStatusTerms;
}

final class RtcLanguageWorkspaceProviderPackageScaffold {
  const RtcLanguageWorkspaceProviderPackageScaffold({
    required this.relativePath,
    required this.directoryPattern,
    required this.packagePattern,
    required this.manifestFileName,
    required this.readmeFileName,
    required this.sourceFilePattern,
    required this.sourceSymbolPattern,
    required this.templateTokens,
    required this.sourceTemplateTokens,
    required this.runtimeBridgeStatus,
    required this.rootPublic,
    required this.status,
  });

  final String relativePath;
  final String directoryPattern;
  final String packagePattern;
  final String manifestFileName;
  final String readmeFileName;
  final String sourceFilePattern;
  final String sourceSymbolPattern;
  final List<String> templateTokens;
  final List<String> sourceTemplateTokens;
  final String runtimeBridgeStatus;
  final bool rootPublic;
  final String status;
}

final class RtcLanguageWorkspaceCatalog {
  static const List<RtcLanguageWorkspaceCatalogEntry> entries =
      <RtcLanguageWorkspaceCatalogEntry>[
${workspaceEntries}
      ];

  const RtcLanguageWorkspaceCatalog._();
}

${renderReservedLanguageWorkspaceLookupHelper(languageEntry.language)}
`),
        },
      ];
    }
    case 'rust': {
      const workspaceEntries = entries
        .map(
          (entry) =>
            `    RtcLanguageWorkspaceCatalogEntry { language: ${q(entry.language)}, workspace: ${q(entry.workspace)}, workspaceCatalogRelativePath: ${q(entry.workspaceCatalogRelativePath)}, displayName: ${q(entry.displayName)}, publicPackage: ${q(entry.publicPackage)}, maturityTier: ${q(entry.maturityTier)}, controlSdk: ${entry.controlSdk ? 'true' : 'false'}, runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'}, currentRole: ${q(entry.currentRole)}, workspaceSummary: ${q(entry.workspaceSummary)}, roleHighlights: &[${entry.roleHighlights.map(q).join(', ')}], defaultProviderContract: RtcLanguageWorkspaceDefaultProviderContract { providerKey: ${q(entry.defaultProviderContract?.providerKey ?? '')}, pluginId: ${q(entry.defaultProviderContract?.pluginId ?? '')}, driverId: ${q(entry.defaultProviderContract?.driverId ?? '')} }, providerSelectionContract: RtcLanguageWorkspaceProviderSelectionContract { sourceTerms: &[${(entry.providerSelectionContract?.sourceTerms ?? []).map(q).join(', ')}], precedence: &[${(entry.providerSelectionContract?.precedence ?? []).map(q).join(', ')}], defaultSource: ${q(entry.providerSelectionContract?.defaultSource ?? '')} }, providerSupportContract: RtcLanguageWorkspaceProviderSupportContract { statusTerms: &[${(entry.providerSupportContract?.statusTerms ?? []).map(q).join(', ')}] }, providerActivationContract: RtcLanguageWorkspaceProviderActivationContract { statusTerms: &[${(entry.providerActivationContract?.statusTerms ?? []).map(q).join(', ')}] }, runtimeBaseline: ${entry.runtimeBaseline ? `Some(RtcLanguageWorkspaceRuntimeBaseline { vendorSdkPackage: ${q(entry.runtimeBaseline.vendorSdkPackage)}, vendorSdkImportPath: ${q(entry.runtimeBaseline.vendorSdkImportPath)}, signalingSdkPackage: ${q(entry.runtimeBaseline.signalingSdkPackage)}, signalingSdkImportPath: ${q(entry.runtimeBaseline.signalingSdkImportPath)}, recommendedEntrypoint: ${q(entry.runtimeBaseline.recommendedEntrypoint)}, smokeCommand: ${q(entry.runtimeBaseline.smokeCommand)}, smokeMode: ${q(entry.runtimeBaseline.smokeMode)}, smokeVariants: &[${entry.runtimeBaseline.smokeVariants.map(q).join(', ')}] })` : 'None'}, metadataScaffold: RtcLanguageWorkspaceMetadataScaffold { providerCatalogRelativePath: ${q(entry.metadataScaffold?.providerCatalogRelativePath ?? '')}, capabilityCatalogRelativePath: ${q(entry.metadataScaffold?.capabilityCatalogRelativePath ?? '')}, providerExtensionCatalogRelativePath: ${q(entry.metadataScaffold?.providerExtensionCatalogRelativePath ?? '')}, providerPackageCatalogRelativePath: ${q(entry.metadataScaffold?.providerPackageCatalogRelativePath ?? '')}, providerActivationCatalogRelativePath: ${q(entry.metadataScaffold?.providerActivationCatalogRelativePath ?? '')}, providerSelectionRelativePath: ${q(entry.metadataScaffold?.providerSelectionRelativePath ?? '')} }, resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold { driverManagerRelativePath: ${q(entry.resolutionScaffold?.driverManagerRelativePath ?? '')}, dataSourceRelativePath: ${q(entry.resolutionScaffold?.dataSourceRelativePath ?? '')}, providerSupportRelativePath: ${q(entry.resolutionScaffold?.providerSupportRelativePath ?? '')}, providerPackageLoaderRelativePath: ${q(entry.resolutionScaffold?.providerPackageLoaderRelativePath ?? '')} }, providerPackageBoundaryContract: RtcLanguageWorkspaceProviderPackageBoundaryContract { modeTerms: &[${(entry.providerPackageBoundaryContract?.modeTerms ?? []).map(q).join(', ')}], rootPublicPolicyTerms: &[${(entry.providerPackageBoundaryContract?.rootPublicPolicyTerms ?? []).map(q).join(', ')}], lifecycleStatusTerms: &[${(entry.providerPackageBoundaryContract?.lifecycleStatusTerms ?? []).map(q).join(', ')}], runtimeBridgeStatusTerms: &[${(entry.providerPackageBoundaryContract?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}] }, providerPackageBoundary: RtcLanguageWorkspaceProviderPackageBoundary { mode: ${q(entry.providerPackageBoundary?.mode ?? '')}, rootPublicPolicy: ${q(entry.providerPackageBoundary?.rootPublicPolicy ?? '')}, lifecycleStatusTerms: &[${(entry.providerPackageBoundary?.lifecycleStatusTerms ?? []).map(q).join(', ')}], runtimeBridgeStatusTerms: &[${(entry.providerPackageBoundary?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}] }, providerPackageScaffold: ${entry.providerPackageScaffold ? `Some(RtcLanguageWorkspaceProviderPackageScaffold { relativePath: ${q(entry.providerPackageScaffold.relativePath)}, directoryPattern: ${q(entry.providerPackageScaffold.directoryPattern)}, packagePattern: ${q(entry.providerPackageScaffold.packagePattern)}, manifestFileName: ${q(entry.providerPackageScaffold.manifestFileName)}, readmeFileName: ${q(entry.providerPackageScaffold.readmeFileName)}, sourceFilePattern: ${q(entry.providerPackageScaffold.sourceFilePattern)}, sourceSymbolPattern: ${q(entry.providerPackageScaffold.sourceSymbolPattern)}, templateTokens: &[${entry.providerPackageScaffold.templateTokens.map(q).join(', ')}], sourceTemplateTokens: &[${entry.providerPackageScaffold.sourceTemplateTokens.map(q).join(', ')}], runtimeBridgeStatus: ${q(entry.providerPackageScaffold.runtimeBridgeStatus)}, rootPublic: ${entry.providerPackageScaffold.rootPublic ? 'true' : 'false'}, status: ${q(entry.providerPackageScaffold.status)} })` : 'None'} },`,
        )
        .join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
          content: lines(`
#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceDefaultProviderContract {
    pub providerKey: &'static str,
    pub pluginId: &'static str,
    pub driverId: &'static str,
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceProviderSelectionContract {
    pub sourceTerms: &'static [&'static str],
    pub precedence: &'static [&'static str],
    pub defaultSource: &'static str,
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceProviderSupportContract {
    pub statusTerms: &'static [&'static str],
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceProviderActivationContract {
    pub statusTerms: &'static [&'static str],
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceRuntimeBaseline {
    pub vendorSdkPackage: &'static str,
    pub vendorSdkImportPath: &'static str,
    pub signalingSdkPackage: &'static str,
    pub signalingSdkImportPath: &'static str,
    pub recommendedEntrypoint: &'static str,
    pub smokeCommand: &'static str,
    pub smokeMode: &'static str,
    pub smokeVariants: &'static [&'static str],
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceMetadataScaffold {
    pub providerCatalogRelativePath: &'static str,
    pub capabilityCatalogRelativePath: &'static str,
    pub providerExtensionCatalogRelativePath: &'static str,
    pub providerPackageCatalogRelativePath: &'static str,
    pub providerActivationCatalogRelativePath: &'static str,
    pub providerSelectionRelativePath: &'static str,
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceResolutionScaffold {
    pub driverManagerRelativePath: &'static str,
    pub dataSourceRelativePath: &'static str,
    pub providerSupportRelativePath: &'static str,
    pub providerPackageLoaderRelativePath: &'static str,
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceProviderPackageBoundaryContract {
    pub modeTerms: &'static [&'static str],
    pub rootPublicPolicyTerms: &'static [&'static str],
    pub lifecycleStatusTerms: &'static [&'static str],
    pub runtimeBridgeStatusTerms: &'static [&'static str],
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceProviderPackageBoundary {
    pub mode: &'static str,
    pub rootPublicPolicy: &'static str,
    pub lifecycleStatusTerms: &'static [&'static str],
    pub runtimeBridgeStatusTerms: &'static [&'static str],
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceProviderPackageScaffold {
    pub relativePath: &'static str,
    pub directoryPattern: &'static str,
    pub packagePattern: &'static str,
    pub manifestFileName: &'static str,
    pub readmeFileName: &'static str,
    pub sourceFilePattern: &'static str,
    pub sourceSymbolPattern: &'static str,
    pub templateTokens: &'static [&'static str],
    pub sourceTemplateTokens: &'static [&'static str],
    pub runtimeBridgeStatus: &'static str,
    pub rootPublic: bool,
    pub status: &'static str,
}

#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcLanguageWorkspaceCatalogEntry {
    pub language: &'static str,
    pub workspace: &'static str,
    pub workspaceCatalogRelativePath: &'static str,
    pub displayName: &'static str,
    pub publicPackage: &'static str,
    pub maturityTier: &'static str,
    pub controlSdk: bool,
    pub runtimeBridge: bool,
    pub currentRole: &'static str,
    pub workspaceSummary: &'static str,
    pub roleHighlights: &'static [&'static str],
    pub defaultProviderContract: RtcLanguageWorkspaceDefaultProviderContract,
    pub providerSelectionContract: RtcLanguageWorkspaceProviderSelectionContract,
    pub providerSupportContract: RtcLanguageWorkspaceProviderSupportContract,
    pub providerActivationContract: RtcLanguageWorkspaceProviderActivationContract,
    pub runtimeBaseline: Option<RtcLanguageWorkspaceRuntimeBaseline>,
    pub metadataScaffold: RtcLanguageWorkspaceMetadataScaffold,
    pub resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold,
    pub providerPackageBoundaryContract: RtcLanguageWorkspaceProviderPackageBoundaryContract,
    pub providerPackageBoundary: RtcLanguageWorkspaceProviderPackageBoundary,
    pub providerPackageScaffold: Option<RtcLanguageWorkspaceProviderPackageScaffold>,
}

pub struct RtcLanguageWorkspaceCatalog;

pub const OFFICIAL_RTC_LANGUAGE_WORKSPACES: [RtcLanguageWorkspaceCatalogEntry; ${entries.length}] = [
${workspaceEntries}
];

${renderReservedLanguageWorkspaceLookupHelper(languageEntry.language)}
`),
        },
      ];
    }
    case 'java': {
      const workspaceEntries = entries
        .map(
          (entry) =>
            `      new RtcLanguageWorkspaceCatalogEntry(${q(entry.language)}, ${q(entry.workspace)}, ${q(entry.workspaceCatalogRelativePath)}, ${q(entry.displayName)}, ${q(entry.publicPackage)}, ${q(entry.maturityTier)}, ${entry.controlSdk ? 'true' : 'false'}, ${entry.runtimeBridge ? 'true' : 'false'}, ${q(entry.currentRole)}, ${q(entry.workspaceSummary)}, List.of(${entry.roleHighlights.map(q).join(', ')}), new RtcLanguageWorkspaceDefaultProviderContract(${q(entry.defaultProviderContract?.providerKey ?? '')}, ${q(entry.defaultProviderContract?.pluginId ?? '')}, ${q(entry.defaultProviderContract?.driverId ?? '')}), new RtcLanguageWorkspaceProviderSelectionContract(List.of(${(entry.providerSelectionContract?.sourceTerms ?? []).map(q).join(', ')}), List.of(${(entry.providerSelectionContract?.precedence ?? []).map(q).join(', ')}), ${q(entry.providerSelectionContract?.defaultSource ?? '')}), new RtcLanguageWorkspaceProviderSupportContract(List.of(${(entry.providerSupportContract?.statusTerms ?? []).map(q).join(', ')})), new RtcLanguageWorkspaceProviderActivationContract(List.of(${(entry.providerActivationContract?.statusTerms ?? []).map(q).join(', ')})), ${entry.runtimeBaseline ? `new RtcLanguageWorkspaceRuntimeBaseline(${q(entry.runtimeBaseline.vendorSdkPackage)}, ${q(entry.runtimeBaseline.vendorSdkImportPath)}, ${q(entry.runtimeBaseline.signalingSdkPackage)}, ${q(entry.runtimeBaseline.signalingSdkImportPath)}, ${q(entry.runtimeBaseline.recommendedEntrypoint)}, ${q(entry.runtimeBaseline.smokeCommand)}, ${q(entry.runtimeBaseline.smokeMode)}, List.of(${entry.runtimeBaseline.smokeVariants.map(q).join(', ')}))` : 'null'}, new RtcLanguageWorkspaceMetadataScaffold(${q(entry.metadataScaffold?.providerCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.capabilityCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerExtensionCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerPackageCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerActivationCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerSelectionRelativePath ?? '')}), new RtcLanguageWorkspaceResolutionScaffold(${q(entry.resolutionScaffold?.driverManagerRelativePath ?? '')}, ${q(entry.resolutionScaffold?.dataSourceRelativePath ?? '')}, ${q(entry.resolutionScaffold?.providerSupportRelativePath ?? '')}, ${q(entry.resolutionScaffold?.providerPackageLoaderRelativePath ?? '')}), new RtcLanguageWorkspaceProviderPackageBoundaryContract(List.of(${(entry.providerPackageBoundaryContract?.modeTerms ?? []).map(q).join(', ')}), List.of(${(entry.providerPackageBoundaryContract?.rootPublicPolicyTerms ?? []).map(q).join(', ')}), List.of(${(entry.providerPackageBoundaryContract?.lifecycleStatusTerms ?? []).map(q).join(', ')}), List.of(${(entry.providerPackageBoundaryContract?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')})), new RtcLanguageWorkspaceProviderPackageBoundary(${q(entry.providerPackageBoundary?.mode ?? '')}, ${q(entry.providerPackageBoundary?.rootPublicPolicy ?? '')}, List.of(${(entry.providerPackageBoundary?.lifecycleStatusTerms ?? []).map(q).join(', ')}), List.of(${(entry.providerPackageBoundary?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')})), ${entry.providerPackageScaffold ? `new RtcLanguageWorkspaceProviderPackageScaffold(${q(entry.providerPackageScaffold.relativePath)}, ${q(entry.providerPackageScaffold.directoryPattern)}, ${q(entry.providerPackageScaffold.packagePattern)}, ${q(entry.providerPackageScaffold.manifestFileName)}, ${q(entry.providerPackageScaffold.readmeFileName)}, ${q(entry.providerPackageScaffold.sourceFilePattern)}, ${q(entry.providerPackageScaffold.sourceSymbolPattern)}, List.of(${entry.providerPackageScaffold.templateTokens.map(q).join(', ')}), List.of(${entry.providerPackageScaffold.sourceTemplateTokens.map(q).join(', ')}), ${q(entry.providerPackageScaffold.runtimeBridgeStatus)}, ${entry.providerPackageScaffold.rootPublic ? 'true' : 'false'}, ${q(entry.providerPackageScaffold.status)})` : 'null'})`,
        )
        .join(',\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
          content: lines(`
package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcLanguageWorkspaceCatalog {

  public static final List<RtcLanguageWorkspaceCatalogEntry> ENTRIES = List.of(
${workspaceEntries}
  );

${renderReservedLanguageWorkspaceLookupHelper(languageEntry.language)}

  private RtcLanguageWorkspaceCatalog() {
  }

  public record RtcLanguageWorkspaceCatalogEntry(
      String language,
      String workspace,
      String workspaceCatalogRelativePath,
      String displayName,
      String publicPackage,
      String maturityTier,
      boolean controlSdk,
      boolean runtimeBridge,
      String currentRole,
      String workspaceSummary,
      List<String> roleHighlights,
      RtcLanguageWorkspaceDefaultProviderContract defaultProviderContract,
      RtcLanguageWorkspaceProviderSelectionContract providerSelectionContract,
      RtcLanguageWorkspaceProviderSupportContract providerSupportContract,
      RtcLanguageWorkspaceProviderActivationContract providerActivationContract,
      RtcLanguageWorkspaceRuntimeBaseline runtimeBaseline,
      RtcLanguageWorkspaceMetadataScaffold metadataScaffold,
      RtcLanguageWorkspaceResolutionScaffold resolutionScaffold,
      RtcLanguageWorkspaceProviderPackageBoundaryContract providerPackageBoundaryContract,
      RtcLanguageWorkspaceProviderPackageBoundary providerPackageBoundary,
      RtcLanguageWorkspaceProviderPackageScaffold providerPackageScaffold
  ) {
  }

  public record RtcLanguageWorkspaceDefaultProviderContract(
      String providerKey,
      String pluginId,
      String driverId
  ) {
  }

  public record RtcLanguageWorkspaceProviderSelectionContract(
      List<String> sourceTerms,
      List<String> precedence,
      String defaultSource
  ) {
  }

  public record RtcLanguageWorkspaceProviderSupportContract(
      List<String> statusTerms
  ) {
  }

  public record RtcLanguageWorkspaceProviderActivationContract(
      List<String> statusTerms
  ) {
  }

  public record RtcLanguageWorkspaceRuntimeBaseline(
      String vendorSdkPackage,
      String vendorSdkImportPath,
      String signalingSdkPackage,
      String signalingSdkImportPath,
      String recommendedEntrypoint,
      String smokeCommand,
      String smokeMode,
      List<String> smokeVariants
  ) {
  }

  public record RtcLanguageWorkspaceMetadataScaffold(
      String providerCatalogRelativePath,
      String capabilityCatalogRelativePath,
      String providerExtensionCatalogRelativePath,
      String providerPackageCatalogRelativePath,
      String providerActivationCatalogRelativePath,
      String providerSelectionRelativePath
  ) {
  }

  public record RtcLanguageWorkspaceResolutionScaffold(
      String driverManagerRelativePath,
      String dataSourceRelativePath,
      String providerSupportRelativePath,
      String providerPackageLoaderRelativePath
  ) {
  }

  public record RtcLanguageWorkspaceProviderPackageBoundaryContract(
      List<String> modeTerms,
      List<String> rootPublicPolicyTerms,
      List<String> lifecycleStatusTerms,
      List<String> runtimeBridgeStatusTerms
  ) {
  }

  public record RtcLanguageWorkspaceProviderPackageBoundary(
      String mode,
      String rootPublicPolicy,
      List<String> lifecycleStatusTerms,
      List<String> runtimeBridgeStatusTerms
  ) {
  }

  public record RtcLanguageWorkspaceProviderPackageScaffold(
      String relativePath,
      String directoryPattern,
      String packagePattern,
      String manifestFileName,
      String readmeFileName,
      String sourceFilePattern,
      String sourceSymbolPattern,
      List<String> templateTokens,
      List<String> sourceTemplateTokens,
      String runtimeBridgeStatus,
      boolean rootPublic,
      String status
  ) {
  }
}
`),
        },
      ];
    }
    case 'csharp': {
      const workspaceEntries = entries
        .map(
          (entry) =>
            `        new(${q(entry.language)}, ${q(entry.workspace)}, ${q(entry.workspaceCatalogRelativePath)}, ${q(entry.displayName)}, ${q(entry.publicPackage)}, ${q(entry.maturityTier)}, ${entry.controlSdk ? 'true' : 'false'}, ${entry.runtimeBridge ? 'true' : 'false'}, ${q(entry.currentRole)}, ${q(entry.workspaceSummary)}, new List<string> { ${entry.roleHighlights.map(q).join(', ')} }, new(${q(entry.defaultProviderContract?.providerKey ?? '')}, ${q(entry.defaultProviderContract?.pluginId ?? '')}, ${q(entry.defaultProviderContract?.driverId ?? '')}), new(new List<string> { ${(entry.providerSelectionContract?.sourceTerms ?? []).map(q).join(', ')} }, new List<string> { ${(entry.providerSelectionContract?.precedence ?? []).map(q).join(', ')} }, ${q(entry.providerSelectionContract?.defaultSource ?? '')}), new(new List<string> { ${(entry.providerSupportContract?.statusTerms ?? []).map(q).join(', ')} }), new(new List<string> { ${(entry.providerActivationContract?.statusTerms ?? []).map(q).join(', ')} }), ${entry.runtimeBaseline ? `new(${q(entry.runtimeBaseline.vendorSdkPackage)}, ${q(entry.runtimeBaseline.vendorSdkImportPath)}, ${q(entry.runtimeBaseline.signalingSdkPackage)}, ${q(entry.runtimeBaseline.signalingSdkImportPath)}, ${q(entry.runtimeBaseline.recommendedEntrypoint)}, ${q(entry.runtimeBaseline.smokeCommand)}, ${q(entry.runtimeBaseline.smokeMode)}, new List<string> { ${entry.runtimeBaseline.smokeVariants.map(q).join(', ')} })` : 'null'}, new(${q(entry.metadataScaffold?.providerCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.capabilityCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerExtensionCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerPackageCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerActivationCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerSelectionRelativePath ?? '')}), new(${q(entry.resolutionScaffold?.driverManagerRelativePath ?? '')}, ${q(entry.resolutionScaffold?.dataSourceRelativePath ?? '')}, ${q(entry.resolutionScaffold?.providerSupportRelativePath ?? '')}, ${q(entry.resolutionScaffold?.providerPackageLoaderRelativePath ?? '')}), new(new List<string> { ${(entry.providerPackageBoundaryContract?.modeTerms ?? []).map(q).join(', ')} }, new List<string> { ${(entry.providerPackageBoundaryContract?.rootPublicPolicyTerms ?? []).map(q).join(', ')} }, new List<string> { ${(entry.providerPackageBoundaryContract?.lifecycleStatusTerms ?? []).map(q).join(', ')} }, new List<string> { ${(entry.providerPackageBoundaryContract?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')} }), new(${q(entry.providerPackageBoundary?.mode ?? '')}, ${q(entry.providerPackageBoundary?.rootPublicPolicy ?? '')}, new List<string> { ${(entry.providerPackageBoundary?.lifecycleStatusTerms ?? []).map(q).join(', ')} }, new List<string> { ${(entry.providerPackageBoundary?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')} }), ${entry.providerPackageScaffold ? `new(${q(entry.providerPackageScaffold.relativePath)}, ${q(entry.providerPackageScaffold.directoryPattern)}, ${q(entry.providerPackageScaffold.packagePattern)}, ${q(entry.providerPackageScaffold.manifestFileName)}, ${q(entry.providerPackageScaffold.readmeFileName)}, ${q(entry.providerPackageScaffold.sourceFilePattern)}, ${q(entry.providerPackageScaffold.sourceSymbolPattern)}, new List<string> { ${entry.providerPackageScaffold.templateTokens.map(q).join(', ')} }, new List<string> { ${entry.providerPackageScaffold.sourceTemplateTokens.map(q).join(', ')} }, ${q(entry.providerPackageScaffold.runtimeBridgeStatus)}, ${entry.providerPackageScaffold.rootPublic ? 'true' : 'false'}, ${q(entry.providerPackageScaffold.status)})` : 'null'}),`,
        )
        .join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
          content: lines(`
using System.Collections.Generic;
using System.Linq;

namespace Sdkwork.Rtc.Sdk;

public sealed record RtcLanguageWorkspaceCatalogEntry(
    string language,
    string workspace,
    string workspaceCatalogRelativePath,
    string displayName,
    string publicPackage,
    string maturityTier,
    bool controlSdk,
    bool runtimeBridge,
    string currentRole,
    string workspaceSummary,
    IReadOnlyList<string> roleHighlights,
    RtcLanguageWorkspaceDefaultProviderContract defaultProviderContract,
    RtcLanguageWorkspaceProviderSelectionContract providerSelectionContract,
    RtcLanguageWorkspaceProviderSupportContract providerSupportContract,
    RtcLanguageWorkspaceProviderActivationContract providerActivationContract,
    RtcLanguageWorkspaceRuntimeBaseline? runtimeBaseline,
    RtcLanguageWorkspaceMetadataScaffold metadataScaffold,
    RtcLanguageWorkspaceResolutionScaffold resolutionScaffold,
    RtcLanguageWorkspaceProviderPackageBoundaryContract providerPackageBoundaryContract,
    RtcLanguageWorkspaceProviderPackageBoundary providerPackageBoundary,
    RtcLanguageWorkspaceProviderPackageScaffold? providerPackageScaffold
);

public sealed record RtcLanguageWorkspaceDefaultProviderContract(
    string providerKey,
    string pluginId,
    string driverId
);

public sealed record RtcLanguageWorkspaceProviderSelectionContract(
    IReadOnlyList<string> sourceTerms,
    IReadOnlyList<string> precedence,
    string defaultSource
);

public sealed record RtcLanguageWorkspaceProviderSupportContract(
    IReadOnlyList<string> statusTerms
);

public sealed record RtcLanguageWorkspaceProviderActivationContract(
    IReadOnlyList<string> statusTerms
);

public sealed record RtcLanguageWorkspaceRuntimeBaseline(
    string vendorSdkPackage,
    string vendorSdkImportPath,
    string signalingSdkPackage,
    string signalingSdkImportPath,
    string recommendedEntrypoint,
    string smokeCommand,
    string smokeMode,
    IReadOnlyList<string> smokeVariants
);

public sealed record RtcLanguageWorkspaceMetadataScaffold(
    string providerCatalogRelativePath,
    string capabilityCatalogRelativePath,
    string providerExtensionCatalogRelativePath,
    string providerPackageCatalogRelativePath,
    string providerActivationCatalogRelativePath,
    string providerSelectionRelativePath
);

public sealed record RtcLanguageWorkspaceResolutionScaffold(
    string driverManagerRelativePath,
    string dataSourceRelativePath,
    string providerSupportRelativePath,
    string providerPackageLoaderRelativePath
);

public sealed record RtcLanguageWorkspaceProviderPackageBoundaryContract(
    IReadOnlyList<string> modeTerms,
    IReadOnlyList<string> rootPublicPolicyTerms,
    IReadOnlyList<string> lifecycleStatusTerms,
    IReadOnlyList<string> runtimeBridgeStatusTerms
);

public sealed record RtcLanguageWorkspaceProviderPackageBoundary(
    string mode,
    string rootPublicPolicy,
    IReadOnlyList<string> lifecycleStatusTerms,
    IReadOnlyList<string> runtimeBridgeStatusTerms
);

public sealed record RtcLanguageWorkspaceProviderPackageScaffold(
    string relativePath,
    string directoryPattern,
    string packagePattern,
    string manifestFileName,
    string readmeFileName,
    string sourceFilePattern,
    string sourceSymbolPattern,
    IReadOnlyList<string> templateTokens,
    IReadOnlyList<string> sourceTemplateTokens,
    string runtimeBridgeStatus,
    bool rootPublic,
    string status
);

public static class RtcLanguageWorkspaceCatalog
{
    public static readonly IReadOnlyList<RtcLanguageWorkspaceCatalogEntry> Entries =
    [
${workspaceEntries}
    ];

${renderReservedLanguageWorkspaceLookupHelper(languageEntry.language)}
}
`),
        },
      ];
    }
    case 'swift': {
      const workspaceEntries = entries
        .map(
          (entry) =>
            `        .init(language: ${q(entry.language)}, workspace: ${q(entry.workspace)}, workspaceCatalogRelativePath: ${q(entry.workspaceCatalogRelativePath)}, displayName: ${q(entry.displayName)}, publicPackage: ${q(entry.publicPackage)}, maturityTier: ${q(entry.maturityTier)}, controlSdk: ${entry.controlSdk ? 'true' : 'false'}, runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'}, currentRole: ${q(entry.currentRole)}, workspaceSummary: ${q(entry.workspaceSummary)}, roleHighlights: [${entry.roleHighlights.map(q).join(', ')}], defaultProviderContract: .init(providerKey: ${q(entry.defaultProviderContract?.providerKey ?? '')}, pluginId: ${q(entry.defaultProviderContract?.pluginId ?? '')}, driverId: ${q(entry.defaultProviderContract?.driverId ?? '')}), providerSelectionContract: .init(sourceTerms: [${(entry.providerSelectionContract?.sourceTerms ?? []).map(q).join(', ')}], precedence: [${(entry.providerSelectionContract?.precedence ?? []).map(q).join(', ')}], defaultSource: ${q(entry.providerSelectionContract?.defaultSource ?? '')}), providerSupportContract: .init(statusTerms: [${(entry.providerSupportContract?.statusTerms ?? []).map(q).join(', ')}]), providerActivationContract: .init(statusTerms: [${(entry.providerActivationContract?.statusTerms ?? []).map(q).join(', ')}]), runtimeBaseline: ${entry.runtimeBaseline ? `.init(vendorSdkPackage: ${q(entry.runtimeBaseline.vendorSdkPackage)}, vendorSdkImportPath: ${q(entry.runtimeBaseline.vendorSdkImportPath)}, signalingSdkPackage: ${q(entry.runtimeBaseline.signalingSdkPackage)}, signalingSdkImportPath: ${q(entry.runtimeBaseline.signalingSdkImportPath)}, recommendedEntrypoint: ${q(entry.runtimeBaseline.recommendedEntrypoint)}, smokeCommand: ${q(entry.runtimeBaseline.smokeCommand)}, smokeMode: ${q(entry.runtimeBaseline.smokeMode)}, smokeVariants: [${entry.runtimeBaseline.smokeVariants.map(q).join(', ')}])` : 'nil'}, metadataScaffold: .init(providerCatalogRelativePath: ${q(entry.metadataScaffold?.providerCatalogRelativePath ?? '')}, capabilityCatalogRelativePath: ${q(entry.metadataScaffold?.capabilityCatalogRelativePath ?? '')}, providerExtensionCatalogRelativePath: ${q(entry.metadataScaffold?.providerExtensionCatalogRelativePath ?? '')}, providerPackageCatalogRelativePath: ${q(entry.metadataScaffold?.providerPackageCatalogRelativePath ?? '')}, providerActivationCatalogRelativePath: ${q(entry.metadataScaffold?.providerActivationCatalogRelativePath ?? '')}, providerSelectionRelativePath: ${q(entry.metadataScaffold?.providerSelectionRelativePath ?? '')}), resolutionScaffold: .init(driverManagerRelativePath: ${q(entry.resolutionScaffold?.driverManagerRelativePath ?? '')}, dataSourceRelativePath: ${q(entry.resolutionScaffold?.dataSourceRelativePath ?? '')}, providerSupportRelativePath: ${q(entry.resolutionScaffold?.providerSupportRelativePath ?? '')}, providerPackageLoaderRelativePath: ${q(entry.resolutionScaffold?.providerPackageLoaderRelativePath ?? '')}), providerPackageBoundaryContract: .init(modeTerms: [${(entry.providerPackageBoundaryContract?.modeTerms ?? []).map(q).join(', ')}], rootPublicPolicyTerms: [${(entry.providerPackageBoundaryContract?.rootPublicPolicyTerms ?? []).map(q).join(', ')}], lifecycleStatusTerms: [${(entry.providerPackageBoundaryContract?.lifecycleStatusTerms ?? []).map(q).join(', ')}], runtimeBridgeStatusTerms: [${(entry.providerPackageBoundaryContract?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}]), providerPackageBoundary: .init(mode: ${q(entry.providerPackageBoundary?.mode ?? '')}, rootPublicPolicy: ${q(entry.providerPackageBoundary?.rootPublicPolicy ?? '')}, lifecycleStatusTerms: [${(entry.providerPackageBoundary?.lifecycleStatusTerms ?? []).map(q).join(', ')}], runtimeBridgeStatusTerms: [${(entry.providerPackageBoundary?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}]), providerPackageScaffold: ${entry.providerPackageScaffold ? `.init(relativePath: ${q(entry.providerPackageScaffold.relativePath)}, directoryPattern: ${q(entry.providerPackageScaffold.directoryPattern)}, packagePattern: ${q(entry.providerPackageScaffold.packagePattern)}, manifestFileName: ${q(entry.providerPackageScaffold.manifestFileName)}, readmeFileName: ${q(entry.providerPackageScaffold.readmeFileName)}, sourceFilePattern: ${q(entry.providerPackageScaffold.sourceFilePattern)}, sourceSymbolPattern: ${q(entry.providerPackageScaffold.sourceSymbolPattern)}, templateTokens: [${entry.providerPackageScaffold.templateTokens.map(q).join(', ')}], sourceTemplateTokens: [${entry.providerPackageScaffold.sourceTemplateTokens.map(q).join(', ')}], runtimeBridgeStatus: ${q(entry.providerPackageScaffold.runtimeBridgeStatus)}, rootPublic: ${entry.providerPackageScaffold.rootPublic ? 'true' : 'false'}, status: ${q(entry.providerPackageScaffold.status)})` : 'nil'}),`,
        )
        .join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
          content: lines(`
public struct RtcLanguageWorkspaceCatalogEntry {
    public let language: String
    public let workspace: String
    public let workspaceCatalogRelativePath: String
    public let displayName: String
    public let publicPackage: String
    public let maturityTier: String
    public let controlSdk: Bool
    public let runtimeBridge: Bool
    public let currentRole: String
    public let workspaceSummary: String
    public let roleHighlights: [String]
    public let defaultProviderContract: RtcLanguageWorkspaceDefaultProviderContract
    public let providerSelectionContract: RtcLanguageWorkspaceProviderSelectionContract
    public let providerSupportContract: RtcLanguageWorkspaceProviderSupportContract
    public let providerActivationContract: RtcLanguageWorkspaceProviderActivationContract
    public let runtimeBaseline: RtcLanguageWorkspaceRuntimeBaseline?
    public let metadataScaffold: RtcLanguageWorkspaceMetadataScaffold
    public let resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold
    public let providerPackageBoundaryContract: RtcLanguageWorkspaceProviderPackageBoundaryContract
    public let providerPackageBoundary: RtcLanguageWorkspaceProviderPackageBoundary
    public let providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold?
}

public struct RtcLanguageWorkspaceDefaultProviderContract {
    public let providerKey: String
    public let pluginId: String
    public let driverId: String
}

public struct RtcLanguageWorkspaceProviderSelectionContract {
    public let sourceTerms: [String]
    public let precedence: [String]
    public let defaultSource: String
}

public struct RtcLanguageWorkspaceProviderSupportContract {
    public let statusTerms: [String]
}

public struct RtcLanguageWorkspaceProviderActivationContract {
    public let statusTerms: [String]
}

public struct RtcLanguageWorkspaceRuntimeBaseline {
    public let vendorSdkPackage: String
    public let vendorSdkImportPath: String
    public let signalingSdkPackage: String
    public let signalingSdkImportPath: String
    public let recommendedEntrypoint: String
    public let smokeCommand: String
    public let smokeMode: String
    public let smokeVariants: [String]
}

public struct RtcLanguageWorkspaceMetadataScaffold {
    public let providerCatalogRelativePath: String
    public let capabilityCatalogRelativePath: String
    public let providerExtensionCatalogRelativePath: String
    public let providerPackageCatalogRelativePath: String
    public let providerActivationCatalogRelativePath: String
    public let providerSelectionRelativePath: String
}

public struct RtcLanguageWorkspaceResolutionScaffold {
    public let driverManagerRelativePath: String
    public let dataSourceRelativePath: String
    public let providerSupportRelativePath: String
    public let providerPackageLoaderRelativePath: String
}

public struct RtcLanguageWorkspaceProviderPackageBoundaryContract {
    public let modeTerms: [String]
    public let rootPublicPolicyTerms: [String]
    public let lifecycleStatusTerms: [String]
    public let runtimeBridgeStatusTerms: [String]
}

public struct RtcLanguageWorkspaceProviderPackageBoundary {
    public let mode: String
    public let rootPublicPolicy: String
    public let lifecycleStatusTerms: [String]
    public let runtimeBridgeStatusTerms: [String]
}

public struct RtcLanguageWorkspaceProviderPackageScaffold {
    public let relativePath: String
    public let directoryPattern: String
    public let packagePattern: String
    public let manifestFileName: String
    public let readmeFileName: String
    public let sourceFilePattern: String
    public let sourceSymbolPattern: String
    public let templateTokens: [String]
    public let sourceTemplateTokens: [String]
    public let runtimeBridgeStatus: String
    public let rootPublic: Bool
    public let status: String
}

public enum RtcLanguageWorkspaceCatalog {
    public static let entries: [RtcLanguageWorkspaceCatalogEntry] = [
${workspaceEntries}
    ]

${renderReservedLanguageWorkspaceLookupHelper(languageEntry.language)}
}
`),
        },
      ];
    }
    case 'kotlin': {
      const workspaceEntries = entries
        .map(
          (entry) =>
            `        RtcLanguageWorkspaceCatalogEntry(${q(entry.language)}, ${q(entry.workspace)}, ${q(entry.workspaceCatalogRelativePath)}, ${q(entry.displayName)}, ${q(entry.publicPackage)}, ${q(entry.maturityTier)}, ${entry.controlSdk ? 'true' : 'false'}, ${entry.runtimeBridge ? 'true' : 'false'}, ${q(entry.currentRole)}, ${q(entry.workspaceSummary)}, listOf(${entry.roleHighlights.map(q).join(', ')}), RtcLanguageWorkspaceDefaultProviderContract(${q(entry.defaultProviderContract?.providerKey ?? '')}, ${q(entry.defaultProviderContract?.pluginId ?? '')}, ${q(entry.defaultProviderContract?.driverId ?? '')}), RtcLanguageWorkspaceProviderSelectionContract(listOf(${(entry.providerSelectionContract?.sourceTerms ?? []).map(q).join(', ')}), listOf(${(entry.providerSelectionContract?.precedence ?? []).map(q).join(', ')}), ${q(entry.providerSelectionContract?.defaultSource ?? '')}), RtcLanguageWorkspaceProviderSupportContract(listOf(${(entry.providerSupportContract?.statusTerms ?? []).map(q).join(', ')})), RtcLanguageWorkspaceProviderActivationContract(listOf(${(entry.providerActivationContract?.statusTerms ?? []).map(q).join(', ')})), ${entry.runtimeBaseline ? `RtcLanguageWorkspaceRuntimeBaseline(${q(entry.runtimeBaseline.vendorSdkPackage)}, ${q(entry.runtimeBaseline.vendorSdkImportPath)}, ${q(entry.runtimeBaseline.signalingSdkPackage)}, ${q(entry.runtimeBaseline.signalingSdkImportPath)}, ${q(entry.runtimeBaseline.recommendedEntrypoint)}, ${q(entry.runtimeBaseline.smokeCommand)}, ${q(entry.runtimeBaseline.smokeMode)}, listOf(${entry.runtimeBaseline.smokeVariants.map(q).join(', ')}))` : 'null'}, RtcLanguageWorkspaceMetadataScaffold(${q(entry.metadataScaffold?.providerCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.capabilityCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerExtensionCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerPackageCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerActivationCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerSelectionRelativePath ?? '')}), RtcLanguageWorkspaceResolutionScaffold(${q(entry.resolutionScaffold?.driverManagerRelativePath ?? '')}, ${q(entry.resolutionScaffold?.dataSourceRelativePath ?? '')}, ${q(entry.resolutionScaffold?.providerSupportRelativePath ?? '')}, ${q(entry.resolutionScaffold?.providerPackageLoaderRelativePath ?? '')}), RtcLanguageWorkspaceProviderPackageBoundaryContract(listOf(${(entry.providerPackageBoundaryContract?.modeTerms ?? []).map(q).join(', ')}), listOf(${(entry.providerPackageBoundaryContract?.rootPublicPolicyTerms ?? []).map(q).join(', ')}), listOf(${(entry.providerPackageBoundaryContract?.lifecycleStatusTerms ?? []).map(q).join(', ')}), listOf(${(entry.providerPackageBoundaryContract?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')})), RtcLanguageWorkspaceProviderPackageBoundary(${q(entry.providerPackageBoundary?.mode ?? '')}, ${q(entry.providerPackageBoundary?.rootPublicPolicy ?? '')}, listOf(${(entry.providerPackageBoundary?.lifecycleStatusTerms ?? []).map(q).join(', ')}), listOf(${(entry.providerPackageBoundary?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')})), ${entry.providerPackageScaffold ? `RtcLanguageWorkspaceProviderPackageScaffold(${q(entry.providerPackageScaffold.relativePath)}, ${q(entry.providerPackageScaffold.directoryPattern)}, ${q(entry.providerPackageScaffold.packagePattern)}, ${q(entry.providerPackageScaffold.manifestFileName)}, ${q(entry.providerPackageScaffold.readmeFileName)}, ${q(entry.providerPackageScaffold.sourceFilePattern)}, ${q(entry.providerPackageScaffold.sourceSymbolPattern)}, listOf(${entry.providerPackageScaffold.templateTokens.map(q).join(', ')}), listOf(${entry.providerPackageScaffold.sourceTemplateTokens.map(q).join(', ')}), ${q(entry.providerPackageScaffold.runtimeBridgeStatus)}, ${entry.providerPackageScaffold.rootPublic ? 'true' : 'false'}, ${q(entry.providerPackageScaffold.status)})` : 'null'}),`,
        )
        .join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
          content: lines(`
package com.sdkwork.rtc.metadata

data class RtcLanguageWorkspaceCatalogEntry(
    val language: String,
    val workspace: String,
    val workspaceCatalogRelativePath: String,
    val displayName: String,
    val publicPackage: String,
    val maturityTier: String,
    val controlSdk: Boolean,
    val runtimeBridge: Boolean,
    val currentRole: String,
    val workspaceSummary: String,
    val roleHighlights: List<String>,
    val defaultProviderContract: RtcLanguageWorkspaceDefaultProviderContract,
    val providerSelectionContract: RtcLanguageWorkspaceProviderSelectionContract,
    val providerSupportContract: RtcLanguageWorkspaceProviderSupportContract,
    val providerActivationContract: RtcLanguageWorkspaceProviderActivationContract,
    val runtimeBaseline: RtcLanguageWorkspaceRuntimeBaseline?,
    val metadataScaffold: RtcLanguageWorkspaceMetadataScaffold,
    val resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold,
    val providerPackageBoundaryContract: RtcLanguageWorkspaceProviderPackageBoundaryContract,
    val providerPackageBoundary: RtcLanguageWorkspaceProviderPackageBoundary,
    val providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold?,
)

data class RtcLanguageWorkspaceDefaultProviderContract(
    val providerKey: String,
    val pluginId: String,
    val driverId: String,
)

data class RtcLanguageWorkspaceProviderSelectionContract(
    val sourceTerms: List<String>,
    val precedence: List<String>,
    val defaultSource: String,
)

data class RtcLanguageWorkspaceProviderSupportContract(
    val statusTerms: List<String>,
)

data class RtcLanguageWorkspaceProviderActivationContract(
    val statusTerms: List<String>,
)

data class RtcLanguageWorkspaceRuntimeBaseline(
    val vendorSdkPackage: String,
    val vendorSdkImportPath: String,
    val signalingSdkPackage: String,
    val signalingSdkImportPath: String,
    val recommendedEntrypoint: String,
    val smokeCommand: String,
    val smokeMode: String,
    val smokeVariants: List<String>,
)

data class RtcLanguageWorkspaceMetadataScaffold(
    val providerCatalogRelativePath: String,
    val capabilityCatalogRelativePath: String,
    val providerExtensionCatalogRelativePath: String,
    val providerPackageCatalogRelativePath: String,
    val providerActivationCatalogRelativePath: String,
    val providerSelectionRelativePath: String,
)

data class RtcLanguageWorkspaceResolutionScaffold(
    val driverManagerRelativePath: String,
    val dataSourceRelativePath: String,
    val providerSupportRelativePath: String,
    val providerPackageLoaderRelativePath: String,
)

data class RtcLanguageWorkspaceProviderPackageBoundaryContract(
    val modeTerms: List<String>,
    val rootPublicPolicyTerms: List<String>,
    val lifecycleStatusTerms: List<String>,
    val runtimeBridgeStatusTerms: List<String>,
)

data class RtcLanguageWorkspaceProviderPackageBoundary(
    val mode: String,
    val rootPublicPolicy: String,
    val lifecycleStatusTerms: List<String>,
    val runtimeBridgeStatusTerms: List<String>,
)

data class RtcLanguageWorkspaceProviderPackageScaffold(
    val relativePath: String,
    val directoryPattern: String,
    val packagePattern: String,
    val manifestFileName: String,
    val readmeFileName: String,
    val sourceFilePattern: String,
    val sourceSymbolPattern: String,
    val templateTokens: List<String>,
    val sourceTemplateTokens: List<String>,
    val runtimeBridgeStatus: String,
    val rootPublic: Boolean,
    val status: String,
)

object RtcLanguageWorkspaceCatalog {
    val entries: List<RtcLanguageWorkspaceCatalogEntry> = listOf(
${workspaceEntries}
    )

${renderReservedLanguageWorkspaceLookupHelper(languageEntry.language)}
}
`),
        },
      ];
    }
    case 'go': {
      const workspaceEntries = entries
        .map(
          (entry) =>
            `    {Language: ${q(entry.language)}, Workspace: ${q(entry.workspace)}, WorkspaceCatalogRelativePath: ${q(entry.workspaceCatalogRelativePath)}, DisplayName: ${q(entry.displayName)}, PublicPackage: ${q(entry.publicPackage)}, MaturityTier: ${q(entry.maturityTier)}, ControlSdk: ${entry.controlSdk ? 'true' : 'false'}, RuntimeBridge: ${entry.runtimeBridge ? 'true' : 'false'}, CurrentRole: ${q(entry.currentRole)}, WorkspaceSummary: ${q(entry.workspaceSummary)}, RoleHighlights: []string{${entry.roleHighlights.map(q).join(', ')}}, DefaultProviderContract: RtcLanguageWorkspaceDefaultProviderContract{ProviderKey: ${q(entry.defaultProviderContract?.providerKey ?? '')}, PluginId: ${q(entry.defaultProviderContract?.pluginId ?? '')}, DriverId: ${q(entry.defaultProviderContract?.driverId ?? '')}}, ProviderSelectionContract: RtcLanguageWorkspaceProviderSelectionContract{SourceTerms: []string{${(entry.providerSelectionContract?.sourceTerms ?? []).map(q).join(', ')}}, Precedence: []string{${(entry.providerSelectionContract?.precedence ?? []).map(q).join(', ')}}, DefaultSource: ${q(entry.providerSelectionContract?.defaultSource ?? '')}}, ProviderSupportContract: RtcLanguageWorkspaceProviderSupportContract{StatusTerms: []string{${(entry.providerSupportContract?.statusTerms ?? []).map(q).join(', ')}}}, ProviderActivationContract: RtcLanguageWorkspaceProviderActivationContract{StatusTerms: []string{${(entry.providerActivationContract?.statusTerms ?? []).map(q).join(', ')}}}, RuntimeBaseline: ${entry.runtimeBaseline ? `&RtcLanguageWorkspaceRuntimeBaseline{VendorSdkPackage: ${q(entry.runtimeBaseline.vendorSdkPackage)}, VendorSdkImportPath: ${q(entry.runtimeBaseline.vendorSdkImportPath)}, SignalingSdkPackage: ${q(entry.runtimeBaseline.signalingSdkPackage)}, SignalingSdkImportPath: ${q(entry.runtimeBaseline.signalingSdkImportPath)}, RecommendedEntrypoint: ${q(entry.runtimeBaseline.recommendedEntrypoint)}, SmokeCommand: ${q(entry.runtimeBaseline.smokeCommand)}, SmokeMode: ${q(entry.runtimeBaseline.smokeMode)}, SmokeVariants: []string{${entry.runtimeBaseline.smokeVariants.map(q).join(', ')}}}` : 'nil'}, MetadataScaffold: RtcLanguageWorkspaceMetadataScaffold{ProviderCatalogRelativePath: ${q(entry.metadataScaffold?.providerCatalogRelativePath ?? '')}, CapabilityCatalogRelativePath: ${q(entry.metadataScaffold?.capabilityCatalogRelativePath ?? '')}, ProviderExtensionCatalogRelativePath: ${q(entry.metadataScaffold?.providerExtensionCatalogRelativePath ?? '')}, ProviderPackageCatalogRelativePath: ${q(entry.metadataScaffold?.providerPackageCatalogRelativePath ?? '')}, ProviderActivationCatalogRelativePath: ${q(entry.metadataScaffold?.providerActivationCatalogRelativePath ?? '')}, ProviderSelectionRelativePath: ${q(entry.metadataScaffold?.providerSelectionRelativePath ?? '')}}, ResolutionScaffold: RtcLanguageWorkspaceResolutionScaffold{DriverManagerRelativePath: ${q(entry.resolutionScaffold?.driverManagerRelativePath ?? '')}, DataSourceRelativePath: ${q(entry.resolutionScaffold?.dataSourceRelativePath ?? '')}, ProviderSupportRelativePath: ${q(entry.resolutionScaffold?.providerSupportRelativePath ?? '')}, ProviderPackageLoaderRelativePath: ${q(entry.resolutionScaffold?.providerPackageLoaderRelativePath ?? '')}}, ProviderPackageBoundaryContract: RtcLanguageWorkspaceProviderPackageBoundaryContract{ModeTerms: []string{${(entry.providerPackageBoundaryContract?.modeTerms ?? []).map(q).join(', ')}}, RootPublicPolicyTerms: []string{${(entry.providerPackageBoundaryContract?.rootPublicPolicyTerms ?? []).map(q).join(', ')}}, LifecycleStatusTerms: []string{${(entry.providerPackageBoundaryContract?.lifecycleStatusTerms ?? []).map(q).join(', ')}}, RuntimeBridgeStatusTerms: []string{${(entry.providerPackageBoundaryContract?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}}}, ProviderPackageBoundary: RtcLanguageWorkspaceProviderPackageBoundary{Mode: ${q(entry.providerPackageBoundary?.mode ?? '')}, RootPublicPolicy: ${q(entry.providerPackageBoundary?.rootPublicPolicy ?? '')}, LifecycleStatusTerms: []string{${(entry.providerPackageBoundary?.lifecycleStatusTerms ?? []).map(q).join(', ')}}, RuntimeBridgeStatusTerms: []string{${(entry.providerPackageBoundary?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}}}, ProviderPackageScaffold: ${entry.providerPackageScaffold ? `&RtcLanguageWorkspaceProviderPackageScaffold{RelativePath: ${q(entry.providerPackageScaffold.relativePath)}, DirectoryPattern: ${q(entry.providerPackageScaffold.directoryPattern)}, PackagePattern: ${q(entry.providerPackageScaffold.packagePattern)}, ManifestFileName: ${q(entry.providerPackageScaffold.manifestFileName)}, ReadmeFileName: ${q(entry.providerPackageScaffold.readmeFileName)}, SourceFilePattern: ${q(entry.providerPackageScaffold.sourceFilePattern)}, SourceSymbolPattern: ${q(entry.providerPackageScaffold.sourceSymbolPattern)}, TemplateTokens: []string{${entry.providerPackageScaffold.templateTokens.map(q).join(', ')}}, SourceTemplateTokens: []string{${entry.providerPackageScaffold.sourceTemplateTokens.map(q).join(', ')}}, RuntimeBridgeStatus: ${q(entry.providerPackageScaffold.runtimeBridgeStatus)}, RootPublic: ${entry.providerPackageScaffold.rootPublic ? 'true' : 'false'}, Status: ${q(entry.providerPackageScaffold.status)}}` : 'nil'}},`,
        )
        .join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
          content: lines(`
package rtcstandard

type RtcLanguageWorkspaceCatalogEntry struct {
    Language                     string
    Workspace                    string
    WorkspaceCatalogRelativePath string
    DisplayName                  string
    PublicPackage                string
    MaturityTier                 string
    ControlSdk                   bool
    RuntimeBridge                bool
    CurrentRole                  string
    WorkspaceSummary             string
    RoleHighlights               []string
    DefaultProviderContract      RtcLanguageWorkspaceDefaultProviderContract
    ProviderSelectionContract    RtcLanguageWorkspaceProviderSelectionContract
    ProviderSupportContract      RtcLanguageWorkspaceProviderSupportContract
    ProviderActivationContract   RtcLanguageWorkspaceProviderActivationContract
    RuntimeBaseline              *RtcLanguageWorkspaceRuntimeBaseline
    MetadataScaffold             RtcLanguageWorkspaceMetadataScaffold
    ResolutionScaffold           RtcLanguageWorkspaceResolutionScaffold
    ProviderPackageBoundaryContract RtcLanguageWorkspaceProviderPackageBoundaryContract
    ProviderPackageBoundary      RtcLanguageWorkspaceProviderPackageBoundary
    ProviderPackageScaffold      *RtcLanguageWorkspaceProviderPackageScaffold
}

type RtcLanguageWorkspaceDefaultProviderContract struct {
    ProviderKey string
    PluginId    string
    DriverId    string
}

type RtcLanguageWorkspaceProviderSelectionContract struct {
    SourceTerms   []string
    Precedence    []string
    DefaultSource string
}

type RtcLanguageWorkspaceProviderSupportContract struct {
    StatusTerms []string
}

type RtcLanguageWorkspaceProviderActivationContract struct {
    StatusTerms []string
}

type RtcLanguageWorkspaceRuntimeBaseline struct {
    VendorSdkPackage        string
    VendorSdkImportPath     string
    SignalingSdkPackage     string
    SignalingSdkImportPath  string
    RecommendedEntrypoint   string
    SmokeCommand            string
    SmokeMode               string
    SmokeVariants           []string
}

type RtcLanguageWorkspaceMetadataScaffold struct {
    ProviderCatalogRelativePath       string
    CapabilityCatalogRelativePath     string
    ProviderExtensionCatalogRelativePath string
    ProviderPackageCatalogRelativePath string
    ProviderActivationCatalogRelativePath string
    ProviderSelectionRelativePath     string
}

type RtcLanguageWorkspaceResolutionScaffold struct {
    DriverManagerRelativePath     string
    DataSourceRelativePath        string
    ProviderSupportRelativePath   string
    ProviderPackageLoaderRelativePath string
}

type RtcLanguageWorkspaceProviderPackageBoundaryContract struct {
    ModeTerms                 []string
    RootPublicPolicyTerms     []string
    LifecycleStatusTerms      []string
    RuntimeBridgeStatusTerms  []string
}

type RtcLanguageWorkspaceProviderPackageBoundary struct {
    Mode                     string
    RootPublicPolicy         string
    LifecycleStatusTerms     []string
    RuntimeBridgeStatusTerms []string
}

type RtcLanguageWorkspaceProviderPackageScaffold struct {
    RelativePath        string
    DirectoryPattern    string
    PackagePattern      string
    ManifestFileName    string
    ReadmeFileName      string
    SourceFilePattern   string
    SourceSymbolPattern string
    TemplateTokens      []string
    SourceTemplateTokens []string
    RuntimeBridgeStatus string
    RootPublic          bool
    Status              string
}

type RtcLanguageWorkspaceCatalog struct{}

var OFFICIAL_RTC_LANGUAGE_WORKSPACES = []RtcLanguageWorkspaceCatalogEntry{
${workspaceEntries}
}

${renderReservedLanguageWorkspaceLookupHelper(languageEntry.language)}
`),
        },
      ];
    }
    case 'python': {
      const workspaceEntries = entries
        .map(
          (entry) =>
            `        RtcLanguageWorkspaceCatalogEntry(${q(entry.language)}, ${q(entry.workspace)}, ${q(entry.workspaceCatalogRelativePath)}, ${q(entry.displayName)}, ${q(entry.publicPackage)}, ${q(entry.maturityTier)}, ${entry.controlSdk ? 'True' : 'False'}, ${entry.runtimeBridge ? 'True' : 'False'}, ${q(entry.currentRole)}, ${q(entry.workspaceSummary)}, [${entry.roleHighlights.map(q).join(', ')}], RtcLanguageWorkspaceDefaultProviderContract(${q(entry.defaultProviderContract?.providerKey ?? '')}, ${q(entry.defaultProviderContract?.pluginId ?? '')}, ${q(entry.defaultProviderContract?.driverId ?? '')}), RtcLanguageWorkspaceProviderSelectionContract([${(entry.providerSelectionContract?.sourceTerms ?? []).map(q).join(', ')}], [${(entry.providerSelectionContract?.precedence ?? []).map(q).join(', ')}], ${q(entry.providerSelectionContract?.defaultSource ?? '')}), RtcLanguageWorkspaceProviderSupportContract([${(entry.providerSupportContract?.statusTerms ?? []).map(q).join(', ')}]), RtcLanguageWorkspaceProviderActivationContract([${(entry.providerActivationContract?.statusTerms ?? []).map(q).join(', ')}]), ${entry.runtimeBaseline ? `RtcLanguageWorkspaceRuntimeBaseline(${q(entry.runtimeBaseline.vendorSdkPackage)}, ${q(entry.runtimeBaseline.vendorSdkImportPath)}, ${q(entry.runtimeBaseline.signalingSdkPackage)}, ${q(entry.runtimeBaseline.signalingSdkImportPath)}, ${q(entry.runtimeBaseline.recommendedEntrypoint)}, ${q(entry.runtimeBaseline.smokeCommand)}, ${q(entry.runtimeBaseline.smokeMode)}, [${entry.runtimeBaseline.smokeVariants.map(q).join(', ')}])` : 'None'}, RtcLanguageWorkspaceMetadataScaffold(${q(entry.metadataScaffold?.providerCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.capabilityCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerExtensionCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerPackageCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerActivationCatalogRelativePath ?? '')}, ${q(entry.metadataScaffold?.providerSelectionRelativePath ?? '')}), RtcLanguageWorkspaceResolutionScaffold(${q(entry.resolutionScaffold?.driverManagerRelativePath ?? '')}, ${q(entry.resolutionScaffold?.dataSourceRelativePath ?? '')}, ${q(entry.resolutionScaffold?.providerSupportRelativePath ?? '')}, ${q(entry.resolutionScaffold?.providerPackageLoaderRelativePath ?? '')}), RtcLanguageWorkspaceProviderPackageBoundaryContract([${(entry.providerPackageBoundaryContract?.modeTerms ?? []).map(q).join(', ')}], [${(entry.providerPackageBoundaryContract?.rootPublicPolicyTerms ?? []).map(q).join(', ')}], [${(entry.providerPackageBoundaryContract?.lifecycleStatusTerms ?? []).map(q).join(', ')}], [${(entry.providerPackageBoundaryContract?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}]), RtcLanguageWorkspaceProviderPackageBoundary(${q(entry.providerPackageBoundary?.mode ?? '')}, ${q(entry.providerPackageBoundary?.rootPublicPolicy ?? '')}, [${(entry.providerPackageBoundary?.lifecycleStatusTerms ?? []).map(q).join(', ')}], [${(entry.providerPackageBoundary?.runtimeBridgeStatusTerms ?? []).map(q).join(', ')}]), ${entry.providerPackageScaffold ? `RtcLanguageWorkspaceProviderPackageScaffold(${q(entry.providerPackageScaffold.relativePath)}, ${q(entry.providerPackageScaffold.directoryPattern)}, ${q(entry.providerPackageScaffold.packagePattern)}, ${q(entry.providerPackageScaffold.manifestFileName)}, ${q(entry.providerPackageScaffold.readmeFileName)}, ${q(entry.providerPackageScaffold.sourceFilePattern)}, ${q(entry.providerPackageScaffold.sourceSymbolPattern)}, [${entry.providerPackageScaffold.templateTokens.map(q).join(', ')}], [${entry.providerPackageScaffold.sourceTemplateTokens.map(q).join(', ')}], ${q(entry.providerPackageScaffold.runtimeBridgeStatus)}, ${entry.providerPackageScaffold.rootPublic ? 'True' : 'False'}, ${q(entry.providerPackageScaffold.status)})` : 'None'}),`,
        )
        .join('\n');

      return [
        {
          relativePath: `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
          content: lines(`
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RtcLanguageWorkspaceCatalogEntry:
    language: str
    workspace: str
    workspaceCatalogRelativePath: str
    displayName: str
    publicPackage: str
    maturityTier: str
    controlSdk: bool
    runtimeBridge: bool
    currentRole: str
    workspaceSummary: str
    roleHighlights: list[str]
    defaultProviderContract: "RtcLanguageWorkspaceDefaultProviderContract"
    providerSelectionContract: "RtcLanguageWorkspaceProviderSelectionContract"
    providerSupportContract: "RtcLanguageWorkspaceProviderSupportContract"
    providerActivationContract: "RtcLanguageWorkspaceProviderActivationContract"
    runtimeBaseline: Optional["RtcLanguageWorkspaceRuntimeBaseline"]
    metadataScaffold: "RtcLanguageWorkspaceMetadataScaffold"
    resolutionScaffold: "RtcLanguageWorkspaceResolutionScaffold"
    providerPackageBoundaryContract: "RtcLanguageWorkspaceProviderPackageBoundaryContract"
    providerPackageBoundary: "RtcLanguageWorkspaceProviderPackageBoundary"
    providerPackageScaffold: Optional["RtcLanguageWorkspaceProviderPackageScaffold"]


@dataclass(frozen=True)
class RtcLanguageWorkspaceDefaultProviderContract:
    providerKey: str
    pluginId: str
    driverId: str


@dataclass(frozen=True)
class RtcLanguageWorkspaceProviderSelectionContract:
    sourceTerms: list[str]
    precedence: list[str]
    defaultSource: str


@dataclass(frozen=True)
class RtcLanguageWorkspaceProviderSupportContract:
    statusTerms: list[str]


@dataclass(frozen=True)
class RtcLanguageWorkspaceProviderActivationContract:
    statusTerms: list[str]


@dataclass(frozen=True)
class RtcLanguageWorkspaceRuntimeBaseline:
    vendorSdkPackage: str
    vendorSdkImportPath: str
    signalingSdkPackage: str
    signalingSdkImportPath: str
    recommendedEntrypoint: str
    smokeCommand: str
    smokeMode: str
    smokeVariants: list[str]


@dataclass(frozen=True)
class RtcLanguageWorkspaceMetadataScaffold:
    providerCatalogRelativePath: str
    capabilityCatalogRelativePath: str
    providerExtensionCatalogRelativePath: str
    providerPackageCatalogRelativePath: str
    providerActivationCatalogRelativePath: str
    providerSelectionRelativePath: str


@dataclass(frozen=True)
class RtcLanguageWorkspaceResolutionScaffold:
    driverManagerRelativePath: str
    dataSourceRelativePath: str
    providerSupportRelativePath: str
    providerPackageLoaderRelativePath: str


@dataclass(frozen=True)
class RtcLanguageWorkspaceProviderPackageBoundaryContract:
    modeTerms: list[str]
    rootPublicPolicyTerms: list[str]
    lifecycleStatusTerms: list[str]
    runtimeBridgeStatusTerms: list[str]


@dataclass(frozen=True)
class RtcLanguageWorkspaceProviderPackageBoundary:
    mode: str
    rootPublicPolicy: str
    lifecycleStatusTerms: list[str]
    runtimeBridgeStatusTerms: list[str]


@dataclass(frozen=True)
class RtcLanguageWorkspaceProviderPackageScaffold:
    relativePath: str
    directoryPattern: str
    packagePattern: str
    manifestFileName: str
    readmeFileName: str
    sourceFilePattern: str
    sourceSymbolPattern: str
    templateTokens: list[str]
    sourceTemplateTokens: list[str]
    runtimeBridgeStatus: str
    rootPublic: bool
    status: str


class RtcLanguageWorkspaceCatalog:
    entries = [
${workspaceEntries}
    ]


${renderReservedLanguageWorkspaceLookupHelper(languageEntry.language)}
`),
        },
      ];
    }
    default:
      return [];
  }
}

function renderReservedLanguageRootPublicEntrypointPlan(languageEntry) {
  switch (languageEntry.language) {
    case 'flutter':
      return [
        {
          relativePath: `${languageEntry.workspace}/lib/rtc_sdk.dart`,
          content: lines(`
library rtc_sdk;

export 'src/rtc_standard_contract.dart';
export 'src/rtc_errors.dart';
export 'src/rtc_types.dart';
export 'src/rtc_provider_metadata.dart';
export 'src/rtc_client.dart';
export 'src/rtc_driver.dart';
export 'src/rtc_call_types.dart';
export 'src/rtc_call_controller.dart';
export 'src/rtc_call_session.dart';
export 'src/rtc_signaling_adapter.dart';
export 'src/rtc_signaling_protocol.dart';
export 'src/rtc_signaling_transport.dart';
export 'src/rtc_standard_call_stack.dart';
export 'src/volcengine_official_flutter.dart';
export 'src/rtc_provider_catalog.dart';
export 'src/rtc_provider_package_catalog.dart';
export 'src/rtc_provider_activation_catalog.dart';
export 'src/rtc_capability_catalog.dart';
export 'src/rtc_provider_extension_catalog.dart';
export 'src/rtc_language_workspace_catalog.dart';
export 'src/rtc_provider_selection.dart';
export 'src/rtc_provider_package_loader.dart';
export 'src/rtc_provider_support.dart';
export 'src/rtc_driver_manager.dart';
export 'src/rtc_data_source.dart';
export 'src/providers/volcengine.dart';
`),
        },
      ];
    case 'python':
      return [
        {
          relativePath: `${languageEntry.workspace}/sdkwork_rtc_sdk/__init__.py`,
          content: lines(`
from .capability_catalog import (
    RtcCapabilityCatalog,
    RtcCapabilityCatalogEntry,
    get_rtc_capability_catalog,
    get_rtc_capability_descriptor,
)
from .data_source import RtcDataSource, RtcDataSourceOptions
from .driver_manager import RtcDriverManager
from .language_workspace_catalog import (
    RtcLanguageWorkspaceCatalog,
    RtcLanguageWorkspaceCatalogEntry,
    get_rtc_language_workspace_by_language,
)
from .provider_activation_catalog import (
    RtcProviderActivationCatalog,
    RtcProviderActivationCatalogEntry,
    get_rtc_provider_activation_by_provider_key,
)
from .provider_catalog import (
    DEFAULT_RTC_PROVIDER_KEY,
    RtcProviderCatalog,
    RtcProviderCatalogEntry,
    get_rtc_provider_by_provider_key,
)
from .provider_extension_catalog import (
    RtcProviderExtensionCatalog,
    RtcProviderExtensionCatalogEntry,
    get_rtc_provider_extension_catalog,
    get_rtc_provider_extension_descriptor,
    get_rtc_provider_extensions,
    get_rtc_provider_extensions_for_provider,
    has_rtc_provider_extension,
)
from .provider_package_catalog import (
    RtcProviderPackageCatalog,
    RtcProviderPackageCatalogEntry,
    get_rtc_provider_package_by_package_identity,
    get_rtc_provider_package_by_provider_key,
)
from .provider_package_loader import (
    RtcProviderModuleNamespace,
    RtcProviderPackageImportFn,
    RtcProviderPackageInstallRequest,
    RtcProviderPackageLoadRequest,
    RtcProviderPackageLoader,
    RtcProviderPackageLoaderException,
    RtcResolvedProviderPackageLoadTarget,
    create_rtc_provider_package_loader,
    install_rtc_provider_package,
    install_rtc_provider_packages,
    load_rtc_provider_module,
    resolve_rtc_provider_package_load_target,
)
from .provider_selection import (
    ParsedRtcProviderUrl,
    RTC_PROVIDER_SELECTION_PRECEDENCE,
    RTC_PROVIDER_SELECTION_SOURCES,
    RtcProviderSelection,
    RtcProviderSelectionRequest,
    RtcProviderSelectionSource,
    parse_rtc_provider_url,
    resolve_rtc_provider_selection,
)
from .provider_support import (
    RTC_PROVIDER_SUPPORT_STATUSES,
    RtcProviderSupport,
    RtcProviderSupportStateRequest,
    RtcProviderSupportStatus,
    create_rtc_provider_support_state,
    resolve_rtc_provider_support_status,
)
from .standard_contract import (
    RtcClient,
    RtcProviderDriver,
    RtcRuntimeController,
    RtcStandardContract,
)

__all__ = [
    "DEFAULT_RTC_PROVIDER_KEY",
    "ParsedRtcProviderUrl",
    "RTC_PROVIDER_SELECTION_PRECEDENCE",
    "RTC_PROVIDER_SELECTION_SOURCES",
    "RTC_PROVIDER_SUPPORT_STATUSES",
    "RtcCapabilityCatalog",
    "RtcCapabilityCatalogEntry",
    "RtcClient",
    "RtcDataSource",
    "RtcDataSourceOptions",
    "RtcDriverManager",
    "RtcLanguageWorkspaceCatalog",
    "RtcLanguageWorkspaceCatalogEntry",
    "RtcProviderActivationCatalog",
    "RtcProviderActivationCatalogEntry",
    "RtcProviderCatalog",
    "RtcProviderCatalogEntry",
    "RtcProviderDriver",
    "RtcProviderExtensionCatalog",
    "RtcProviderExtensionCatalogEntry",
    "RtcProviderPackageCatalog",
    "RtcProviderPackageCatalogEntry",
    "RtcProviderPackageImportFn",
    "RtcProviderPackageInstallRequest",
    "RtcProviderPackageLoadRequest",
    "RtcProviderPackageLoader",
    "RtcProviderPackageLoaderException",
    "RtcProviderModuleNamespace",
    "RtcProviderSelection",
    "RtcProviderSelectionRequest",
    "RtcProviderSelectionSource",
    "RtcProviderSupport",
    "RtcProviderSupportStateRequest",
    "RtcProviderSupportStatus",
    "RtcResolvedProviderPackageLoadTarget",
    "RtcRuntimeController",
    "RtcStandardContract",
    "create_rtc_provider_package_loader",
    "create_rtc_provider_support_state",
    "get_rtc_capability_catalog",
    "get_rtc_capability_descriptor",
    "get_rtc_language_workspace_by_language",
    "get_rtc_provider_activation_by_provider_key",
    "get_rtc_provider_by_provider_key",
    "get_rtc_provider_extension_catalog",
    "get_rtc_provider_extension_descriptor",
    "get_rtc_provider_extensions",
    "get_rtc_provider_extensions_for_provider",
    "get_rtc_provider_package_by_package_identity",
    "get_rtc_provider_package_by_provider_key",
    "has_rtc_provider_extension",
    "install_rtc_provider_package",
    "install_rtc_provider_packages",
    "load_rtc_provider_module",
    "parse_rtc_provider_url",
    "resolve_rtc_provider_package_load_target",
    "resolve_rtc_provider_selection",
    "resolve_rtc_provider_support_status",
]
`),
        },
      ];
    default:
      return [];
  }
}

function renderReservedLanguageProviderPackageLoaderPlan(languageEntry) {
  if (!languageEntry.resolutionScaffold?.providerPackageLoaderRelativePath) {
    return [];
  }

  return [
    {
      relativePath: `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerPackageLoaderRelativePath}`,
      content: renderReservedLanguageProviderPackageLoaderModule(languageEntry.language),
    },
  ];
}

export function buildReservedLanguageMaterializationPlan(languageEntry, assembly) {
  let basePlan;

  switch (languageEntry.language) {
    case 'flutter':
      basePlan = renderFlutterReservedLanguagePlan(languageEntry, assembly);
      break;
    case 'rust':
      basePlan = renderRustReservedLanguagePlan(languageEntry, assembly);
      break;
    case 'java':
      basePlan = renderJavaReservedLanguagePlan(languageEntry, assembly);
      break;
    case 'csharp':
      basePlan = renderCsharpReservedLanguagePlan(languageEntry, assembly);
      break;
    case 'swift':
      basePlan = renderSwiftReservedLanguagePlan(languageEntry, assembly);
      break;
    case 'kotlin':
      basePlan = renderKotlinReservedLanguagePlan(languageEntry, assembly);
      break;
    case 'go':
      basePlan = renderGoReservedLanguagePlan(languageEntry, assembly);
      break;
    case 'python':
      basePlan = renderPythonReservedLanguagePlan(languageEntry, assembly);
      break;
    default:
      throw new Error(`Unsupported reserved language scaffold materialization: ${languageEntry.language}`);
  }

  const providerSelectionPath =
    `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`;
  const providerSupportPath =
    `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`;
  const driverManagerPath =
    `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`;
  const dataSourcePath =
    `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`;
  const driverManagerContent = renderReservedLanguageDriverManagerModule(languageEntry.language);
  const dataSourceContent = renderReservedLanguageDataSourceModule(languageEntry.language);

  basePlan = basePlan.map((entry) => {
    if (entry.relativePath === providerSelectionPath) {
      return {
        ...entry,
        content: renderReservedLanguageProviderSelectionModule(languageEntry.language),
      };
    }

    if (entry.relativePath === providerSupportPath) {
      return {
        ...entry,
        content: renderReservedLanguageProviderSupportModule(languageEntry.language),
      };
    }

    if (entry.relativePath === driverManagerPath && driverManagerContent) {
      return {
        ...entry,
        content: driverManagerContent,
      };
    }

    if (entry.relativePath === dataSourcePath && dataSourceContent) {
      return {
        ...entry,
        content: dataSourceContent,
      };
    }

    return entry;
  });

  return [
    ...basePlan,
    ...renderReservedLanguageRootPublicEntrypointPlan(languageEntry),
    ...renderReservedLanguageWorkspaceCatalogPlan(languageEntry, assembly),
    ...renderReservedLanguageProviderActivationCatalogPlan(languageEntry, assembly),
    ...renderReservedLanguageProviderPackageLoaderPlan(languageEntry),
    ...renderReservedLanguageProviderPackageScaffoldPlan(languageEntry, assembly),
    ...renderReservedLanguageProviderPackageBoundaryPlan(languageEntry, assembly),
  ];
}
