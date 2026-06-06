import type {
  RtcCapabilityKey,
  RtcOptionalCapability,
  RtcRequiredCapability,
} from './capability-catalog.js';

export type {
  RtcCapabilityKey,
  RtcOptionalCapability,
  RtcRequiredCapability,
} from './capability-catalog.js';

export type RtcCapabilityCategory = 'required-baseline' | 'optional-advanced';
export type RtcCapabilitySurface = 'control-plane' | 'runtime-bridge' | 'cross-surface';
export type RtcProviderExtensionAccess = 'unwrap-only' | 'extension-object';
export type RtcProviderExtensionStatus = 'reference-baseline' | 'reserved';

export interface RtcCapabilityDescriptor<TCapabilityKey extends string = string> {
  capabilityKey: TCapabilityKey;
  category: RtcCapabilityCategory;
  surface: RtcCapabilitySurface;
}

export interface RtcProviderExtensionDescriptor<TExtensionKey extends string = string> {
  extensionKey: TExtensionKey;
  providerKey: string;
  displayName: string;
  surface: RtcCapabilitySurface;
  access: RtcProviderExtensionAccess;
  status: RtcProviderExtensionStatus;
}

export interface RtcCapabilitySupportState {
  capabilityKey: RtcCapabilityKey;
  category: RtcCapabilityCategory;
  surface: RtcCapabilitySurface;
  supported: boolean;
}

export interface RtcCapabilitySet {
  required: readonly RtcRequiredCapability[];
  optional: readonly RtcOptionalCapability[];
}

export interface RtcCloseable {
  close(): Promise<void> | void;
}

export type RtcTrackKind = 'audio' | 'video' | 'screen-share' | 'data';
export type RtcSessionConnectionState = 'joined' | 'left';

export interface RtcJoinOptions {
  sessionId: string;
  roomId: string;
  participantId: string;
  token?: string;
  metadata?: Record<string, unknown>;
}

export interface RtcSessionDescriptor {
  sessionId: string;
  roomId: string;
  participantId: string;
  providerKey: string;
  connectionState: RtcSessionConnectionState;
}

export interface RtcPublishOptions {
  trackId: string;
  kind: RtcTrackKind;
  metadata?: Record<string, unknown>;
}

export interface RtcTrackPublication {
  trackId: string;
  kind: RtcTrackKind;
  muted: boolean;
}

export interface RtcMuteState {
  kind: 'audio' | 'video';
  muted: boolean;
}

export interface RtcCapabilityNegotiationRequest {
  required?: readonly RtcCapabilityKey[];
  optional?: readonly RtcCapabilityKey[];
}

export type RtcCapabilityNegotiationStatus = 'supported' | 'degraded' | 'unsupported';
export type RtcCapabilityNegotiationRule =
  | 'all-requested-capabilities-available'
  | 'all-required-capabilities-available_optional-capabilities-missing'
  | 'required-capabilities-missing';

export interface RtcCapabilityNegotiationSurfaceMap {
  controlPlane: readonly RtcCapabilityKey[];
  runtimeBridge: readonly RtcCapabilityKey[];
  crossSurface: readonly RtcCapabilityKey[];
}

export interface RtcCapabilityNegotiationResult {
  status: RtcCapabilityNegotiationStatus;
  supportedRequired: readonly RtcCapabilityKey[];
  missingRequired: readonly RtcCapabilityKey[];
  supportedOptional: readonly RtcCapabilityKey[];
  missingOptional: readonly RtcCapabilityKey[];
  missingBySurface: RtcCapabilityNegotiationSurfaceMap;
}

export interface RtcProviderMetadata {
  providerKey: string;
  pluginId: string;
  driverId: string;
  displayName: string;
  defaultSelected: boolean;
  urlSchemes: readonly string[];
  requiredCapabilities: readonly RtcRequiredCapability[];
  optionalCapabilities: readonly RtcOptionalCapability[];
  extensionKeys: readonly string[];
}

export type RtcProviderTier = 'tier-a' | 'tier-b' | 'tier-c';

export interface RtcTypeScriptAdapterContract {
  sdkProvisioning: 'consumer-supplied';
  bindingStrategy: 'native-factory';
  bundlePolicy: 'must-not-bundle';
  runtimeBridgeStatus: 'reference-baseline';
  officialVendorSdkRequirement: 'required';
}

export interface RtcTypeScriptPackageContract {
  packageName: string;
  sourceModule: string;
  driverFactory: string;
  metadataSymbol: string;
  moduleSymbol: string;
  rootPublic: boolean;
}

export interface RtcProviderCatalogEntry extends RtcProviderMetadata {
  tier: RtcProviderTier;
  builtin: boolean;
  typescriptAdapter: RtcTypeScriptAdapterContract;
  typescriptPackage: RtcTypeScriptPackageContract;
}

export interface RtcClientConfig {
  providerUrl?: string;
  providerKey?: string;
  tenantOverrideProviderKey?: string;
  deploymentProfileProviderKey?: string;
  defaultProviderKey?: string;
  nativeConfig?: Record<string, unknown>;
}

export interface RtcProviderSelectionRequest {
  providerUrl?: string;
  providerKey?: string;
  tenantOverrideProviderKey?: string;
  deploymentProfileProviderKey?: string;
}

export type RtcProviderSelectionSource =
  | 'provider_url'
  | 'provider_key'
  | 'tenant_override'
  | 'deployment_profile'
  | 'default_provider';

export type RtcLanguageWorkspaceMaturityTier = 'reference' | 'reserved';

export interface RtcLanguageWorkspaceMetadataScaffold {
  providerCatalogRelativePath: string;
  capabilityCatalogRelativePath: string;
  providerExtensionCatalogRelativePath: string;
  providerPackageCatalogRelativePath: string;
  providerActivationCatalogRelativePath: string;
  providerSelectionRelativePath: string;
}

export interface RtcLanguageWorkspaceResolutionScaffold {
  driverManagerRelativePath: string;
  dataSourceRelativePath: string;
  providerSupportRelativePath: string;
  providerPackageLoaderRelativePath: string;
}

export interface RtcLanguageWorkspaceDefaultProviderContract {
  providerKey: string;
  pluginId: string;
  driverId: string;
}

export interface RtcLanguageWorkspaceProviderSelectionContract {
  sourceTerms: readonly RtcProviderSelectionSource[];
  precedence: readonly RtcProviderSelectionSource[];
  defaultSource: RtcProviderSelectionSource;
}

export interface RtcLanguageWorkspaceProviderSupportContract {
  statusTerms: readonly RtcProviderSupportStatus[];
}

export interface RtcLanguageWorkspaceProviderActivationContract {
  statusTerms: readonly RtcProviderActivationStatus[];
}

export type RtcLanguageWorkspaceSmokeMode = 'runtime-backed' | 'analysis-backed';
export type RtcLanguageWorkspaceSmokeVariant = 'default' | 'reuse-live-connection';

export interface RtcLanguageWorkspaceRuntimeBaseline {
  vendorSdkPackage: string;
  vendorSdkImportPath: string;
  signalingSdkPackage: string;
  signalingSdkImportPath: string;
  recommendedEntrypoint: string;
  smokeCommand: string;
  smokeMode: RtcLanguageWorkspaceSmokeMode;
  smokeVariants: readonly RtcLanguageWorkspaceSmokeVariant[];
}

export type RtcProviderPackageRuntimeBridgeStatus =
  | RtcTypeScriptAdapterContract['runtimeBridgeStatus']
  | 'reserved';

export type RtcProviderPackageCatalogStatus =
  | 'root_public_reference_boundary'
  | 'package_reference_boundary';

export type RtcLanguageWorkspaceProviderPackageScaffoldStatus =
  | 'future-runtime-bridge-only';

export type RtcLanguageWorkspaceProviderPackageBoundaryMode =
  | 'catalog-governed-mixed'
  | 'scaffold-per-provider-package';

export type RtcLanguageWorkspaceProviderPackageBoundaryRootPublicPolicy =
  | 'builtin-only'
  | 'none';

export type RtcLanguageWorkspaceProviderPackageBoundaryLifecycleStatus =
  | RtcProviderPackageCatalogStatus
  | RtcLanguageWorkspaceProviderPackageScaffoldStatus;

export interface RtcLanguageWorkspaceProviderPackageBoundaryContract {
  modeTerms: readonly RtcLanguageWorkspaceProviderPackageBoundaryMode[];
  rootPublicPolicyTerms: readonly RtcLanguageWorkspaceProviderPackageBoundaryRootPublicPolicy[];
  lifecycleStatusTerms: readonly RtcLanguageWorkspaceProviderPackageBoundaryLifecycleStatus[];
  runtimeBridgeStatusTerms: readonly RtcProviderPackageRuntimeBridgeStatus[];
}

export interface RtcLanguageWorkspaceProviderPackageBoundary {
  mode: RtcLanguageWorkspaceProviderPackageBoundaryMode;
  rootPublicPolicy: RtcLanguageWorkspaceProviderPackageBoundaryRootPublicPolicy;
  lifecycleStatusTerms: readonly RtcLanguageWorkspaceProviderPackageBoundaryLifecycleStatus[];
  runtimeBridgeStatusTerms: readonly RtcProviderPackageRuntimeBridgeStatus[];
}

export interface RtcLanguageWorkspaceProviderPackageScaffold {
  relativePath: string;
  directoryPattern: string;
  packagePattern: string;
  manifestFileName: string;
  readmeFileName: string;
  sourceFilePattern: string;
  sourceSymbolPattern: string;
  templateTokens: readonly string[];
  sourceTemplateTokens: readonly string[];
  runtimeBridgeStatus: RtcProviderPackageRuntimeBridgeStatus;
  rootPublic: boolean;
  status: RtcLanguageWorkspaceProviderPackageScaffoldStatus;
}

export interface RtcLanguageWorkspaceCatalogEntry {
  language: string;
  workspace: string;
  workspaceCatalogRelativePath: string;
  displayName: string;
  publicPackage: string;
  maturityTier: RtcLanguageWorkspaceMaturityTier;
  controlSdk: boolean;
  runtimeBridge: boolean;
  currentRole: string;
  workspaceSummary: string;
  roleHighlights: readonly string[];
  defaultProviderContract: RtcLanguageWorkspaceDefaultProviderContract;
  providerSelectionContract: RtcLanguageWorkspaceProviderSelectionContract;
  providerSupportContract: RtcLanguageWorkspaceProviderSupportContract;
  providerActivationContract: RtcLanguageWorkspaceProviderActivationContract;
  runtimeBaseline?: RtcLanguageWorkspaceRuntimeBaseline;
  metadataScaffold?: RtcLanguageWorkspaceMetadataScaffold;
  resolutionScaffold?: RtcLanguageWorkspaceResolutionScaffold;
  providerPackageBoundaryContract: RtcLanguageWorkspaceProviderPackageBoundaryContract;
  providerPackageBoundary: RtcLanguageWorkspaceProviderPackageBoundary;
  providerPackageScaffold?: RtcLanguageWorkspaceProviderPackageScaffold;
}

export interface RtcProviderPackageCatalogEntry {
  providerKey: string;
  pluginId: string;
  driverId: string;
  packageIdentity: string;
  manifestPath: string;
  readmePath: string;
  sourcePath: string;
  declarationPath: string;
  sourceSymbol: string;
  sourceModule: string;
  driverFactory: string;
  metadataSymbol: string;
  moduleSymbol: string;
  builtin: boolean;
  rootPublic: boolean;
  status: RtcProviderPackageCatalogStatus;
  runtimeBridgeStatus: RtcTypeScriptAdapterContract['runtimeBridgeStatus'];
  requiredCapabilities: readonly RtcRequiredCapability[];
  optionalCapabilities: readonly RtcOptionalCapability[];
  extensionKeys: readonly string[];
}

export type RtcProviderActivationStatus =
  | 'root-public-builtin'
  | 'package-boundary'
  | 'control-metadata-only';

export interface RtcProviderActivationEntry {
  providerKey: string;
  pluginId: string;
  driverId: string;
  activationStatus: RtcProviderActivationStatus;
  runtimeBridge: boolean;
  rootPublic: boolean;
  packageBoundary: boolean;
  builtin: boolean;
  packageIdentity: string;
}

export interface RtcProviderSelection {
  providerKey: string;
  source: RtcProviderSelectionSource;
}

export type RtcProviderSupportStatus =
  | 'builtin_registered'
  | 'official_registered'
  | 'official_unregistered'
  | 'unknown';

export interface RtcProviderSupportStateRequest {
  providerKey: string;
  builtin: boolean;
  official: boolean;
  registered: boolean;
}

export interface RtcProviderSupportState {
  providerKey: string;
  status: RtcProviderSupportStatus;
  builtin: boolean;
  official: boolean;
  registered: boolean;
}

export interface RtcResolvedClientConfig extends RtcClientConfig {
  providerKey: string;
  selectionSource: RtcProviderSelectionSource;
}

export interface RtcRuntimeControllerContext<TNativeClient = unknown> {
  metadata: RtcProviderMetadata;
  capabilities: RtcCapabilitySet;
  selection: RtcProviderSelection;
  nativeClient: TNativeClient;
}

export interface RtcRuntimeController<TNativeClient = unknown> {
  join(
    options: RtcJoinOptions,
    context: RtcRuntimeControllerContext<TNativeClient>,
  ): Promise<RtcSessionDescriptor> | RtcSessionDescriptor;
  leave(
    context: RtcRuntimeControllerContext<TNativeClient>,
  ): Promise<RtcSessionDescriptor> | RtcSessionDescriptor;
  publish(
    options: RtcPublishOptions,
    context: RtcRuntimeControllerContext<TNativeClient>,
  ): Promise<RtcTrackPublication> | RtcTrackPublication;
  unpublish(
    trackId: string,
    context: RtcRuntimeControllerContext<TNativeClient>,
  ): Promise<void> | void;
  muteAudio(
    muted: boolean,
    context: RtcRuntimeControllerContext<TNativeClient>,
  ): Promise<RtcMuteState> | RtcMuteState;
  muteVideo(
    muted: boolean,
    context: RtcRuntimeControllerContext<TNativeClient>,
  ): Promise<RtcMuteState> | RtcMuteState;
}
