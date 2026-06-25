import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildProfileId,
  createTopologyRuntime,
  isTcpPortReachable,
  loadTopologySpec,
  normalizeText,
  waitForHttpHealthy,
} from '@sdkwork/app-topology';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const SPEC_PATH = path.join(REPO_ROOT, 'specs/topology.spec.json');
export const API_GATEWAY_REPO = path.resolve(REPO_ROOT, '..', 'sdkwork-api-cloud-gateway');
export const PC_APP_ROOT = path.join(REPO_ROOT, 'apps', 'sdkwork-rtc-pc');
export const IAM_REPO_ROOT = path.resolve(REPO_ROOT, '..', 'sdkwork-iam');

export const IAM_APPLICATION_BOOTSTRAP_ENV = {
  SDKWORK_APP_ROOT: PC_APP_ROOT,
  SDKWORK_IAM_APP_ROOT: IAM_REPO_ROOT,
  SDKWORK_RTC_APP_ROOT: PC_APP_ROOT,
};

const spec = loadTopologySpec(SPEC_PATH);
const runtime = createTopologyRuntime(spec, REPO_ROOT);

export const VALID_HOSTING = runtime.hostingValues;
export const VALID_SERVICE_LAYOUTS = runtime.serviceLayoutValues;
export const DEFAULT_DEV_PROFILE_ID = runtime.defaults.developmentProfileId;
export const DEFAULT_BUILD_PROFILE_ID = runtime.defaults.productionProfileId;
export const PLATFORM_CONFIG_BUNDLE_PROFILE = 'platform-config-bundle';
export const GATEWAY_PACKAGE_TARGETS = runtime.listPackageTargets();
export const RTC_CLOUD_GATEWAY_CONFIGS = spec.packaging?.cloudConfigFiles ?? [];

export function listGatewayPackageTargets(profile) {
  return runtime.listPackageTargetsByProfile(profile);
}

export function findGatewayPackageTarget(targetId) {
  return runtime.findPackageTarget(targetId);
}

export function resolveDevProfileId(hosting, serviceLayout = 'split-services') {
  runtime.assertHosting(hosting);
  runtime.assertServiceLayout(serviceLayout);
  return buildProfileId(hosting, serviceLayout, 'development');
}

export const loadProfile = runtime.loadProfile;
export const applyProfileEnv = runtime.applyProfileEnv;
export const mergeRuntimeEnv = runtime.mergeRuntimeEnv;
export const loadEnvFile = runtime.loadEnvFile;
export const assertHosting = runtime.assertHosting;
export const assertServiceLayout = runtime.assertServiceLayout;
export const resolveSurfaceHttpUrl = runtime.resolveSurfaceHttpUrl.bind(runtime);
export const resolveSurfaceBind = runtime.resolveSurfaceBind.bind(runtime);
export const shouldAutostartGateway = runtime.shouldAutostartGateway;
export const resolveGatewayBind = runtime.resolveGatewayBind;
export const resolveGatewayBaseUrl = runtime.resolveGatewayBaseUrl;
export const resolveIamDevEnv = runtime.resolveIamDevEnv;
export const resolveCloudGatewayConfigPath = runtime.resolveCloudGatewayConfigPath.bind(runtime);
export const listOrchestrationProcesses = runtime.listOrchestrationProcesses;
export const listHealthSurfaces = runtime.listHealthSurfaces;

export { buildProfileId, normalizeText, isTcpPortReachable, waitForHttpHealthy, spec, runtime };
