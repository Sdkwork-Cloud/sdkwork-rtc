const RTC_TEMPLATE_MATERIALIZATION_ASSETS_INTERNAL = [
  {
    templateRelativePath: 'root-readme.md',
    materializedRelativePath: 'README.md',
  },
  {
    templateRelativePath: 'docs-readme.md',
    materializedRelativePath: 'docs/README.md',
  },
  {
    templateRelativePath: 'package-standards.md',
    materializedRelativePath: 'docs/package-standards.md',
  },
  {
    templateRelativePath: 'provider-adapter-standard.md',
    materializedRelativePath: 'docs/provider-adapter-standard.md',
  },
  {
    templateRelativePath: 'verification-matrix.md',
    materializedRelativePath: 'docs/verification-matrix.md',
  },
  {
    templateRelativePath: 'typescript-providers-readme.md',
    materializedRelativePath: 'sdkwork-rtc-sdk-typescript/providers/README.md',
  },
];

export const RTC_TEMPLATE_MATERIALIZATION_ASSETS = Object.freeze(
  RTC_TEMPLATE_MATERIALIZATION_ASSETS_INTERNAL.map((asset) =>
    Object.freeze({
      templateRelativePath: asset.templateRelativePath,
      materializedRelativePath: asset.materializedRelativePath,
      templateFileRelativePath: `bin/templates/${asset.templateRelativePath}`,
    }),
  ),
);

export const RTC_TEMPLATE_SOURCE_FILES = Object.freeze(
  RTC_TEMPLATE_MATERIALIZATION_ASSETS.map((asset) => asset.templateFileRelativePath),
);

export const RTC_TEMPLATE_MATERIALIZED_FILES = Object.freeze(
  RTC_TEMPLATE_MATERIALIZATION_ASSETS.map((asset) => asset.materializedRelativePath),
);
