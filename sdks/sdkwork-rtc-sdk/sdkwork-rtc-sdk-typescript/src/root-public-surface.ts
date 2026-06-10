import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS = freezeRtcRuntimeValue(['./errors.js', './runtime-surface.js', './runtime-immutability.js', './root-public-surface.js', './types.js', './capability-catalog.js', './capability-negotiation.js', './provider-catalog.js', './language-workspace-catalog.js', './provider-selection.js', './provider-support.js', './provider-extension-catalog.js', './provider-package-catalog.js', './provider-package-loader.js', './provider-activation-catalog.js', './capabilities.js', './client.js', './driver.js', './driver-manager.js', './data-source.js', './provider-module.js'] as const);

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS = freezeRtcRuntimeValue([] as const);

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES = freezeRtcRuntimeValue([] as const);

export const RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES = freezeRtcRuntimeValue(['standard-contract', 'provider-catalog', 'provider-package-catalog', 'provider-activation-catalog', 'capability-catalog', 'provider-extension-catalog', 'language-workspace-catalog', 'provider-selection', 'provider-package-loader', 'provider-support', 'driver-manager', 'data-source'] as const);

export const RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS = freezeRtcRuntimeValue({
  "flutter": 'barrel',
  "python": 'package-init',
} as const);

export const RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM = 'provider-plugin-package-only';

export const RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM = 'package-boundary-only';

export {
  RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS,
  RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS,
  RTC_LOOKUP_HELPER_NAMING_STANDARD,
} from './lookup-helper-naming.js';

export const RTC_ROOT_PUBLIC_SURFACE_STANDARD = freezeRtcRuntimeValue({
  typescriptProviderNeutralExportPaths:
    RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
  typescriptBuiltinProviderExportPaths:
    RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS,
  typescriptInlineHelperNames: RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES,
  reservedSurfaceFamilies: RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES,
  reservedEntryPointKinds: RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS,
  builtinProviderExposureTerm: RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM,
  nonBuiltinProviderExposureTerm: RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM,
} as const);
