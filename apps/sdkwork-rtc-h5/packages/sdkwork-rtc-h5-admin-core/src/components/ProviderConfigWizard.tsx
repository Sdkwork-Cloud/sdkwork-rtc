import { useState } from "react";
import type { ProviderConfigSchema } from "../types/providerSchema";
import type { ProviderAccountCommand } from "../types/providerAccount";
import type { ProviderApplicationCommand } from "../types/providerApplication";
import type { ProviderCredentialCommand } from "../types/providerCredential";
import type { ProviderProfileCommand } from "../types/providerProfile";
import { ProviderSchemaForm, validateSchemaFields } from "./ProviderSchemaForm";

interface Props {
  schema: ProviderConfigSchema;
  onComplete: (config: ProviderWizardResult) => void;
  onCancel: () => void;
}

export interface ProviderWizardResult {
  account: ProviderAccountCommand;
  application: ProviderApplicationCommand;
  credentials: ProviderCredentialCommand[];
  profile: ProviderProfileCommand;
}

type Step = "account" | "application" | "credentials" | "profile" | "review";

const STEPS: Step[] = ["account", "application", "credentials", "profile", "review"];

const STEP_LABELS: Record<Step, string> = {
  account: "Account",
  application: "Application",
  credentials: "Credentials",
  profile: "Profile",
  review: "Review",
};

export function ProviderConfigWizard({ schema, onComplete, onCancel }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>("account");
  const [accountValues, setAccountValues] = useState<Record<string, unknown>>({});
  const [applicationValues, setApplicationValues] = useState<Record<string, unknown>>({});
  const [profileValues, setProfileValues] = useState<Record<string, unknown>>({});
  const [selectedCredentialRoles, setSelectedCredentialRoles] = useState<string[]>([]);
  const [credentialValues, setCredentialValues] = useState<Record<string, Record<string, unknown>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stepIndex = STEPS.indexOf(currentStep);

  const validateCurrentStep = (): boolean => {
    let fields;
    let values;
    switch (currentStep) {
      case "account":
        fields = schema.accountFields;
        values = accountValues;
        break;
      case "application":
        fields = schema.applicationFields;
        values = applicationValues;
        break;
      case "profile":
        fields = schema.profileFields;
        values = profileValues;
        break;
      case "credentials":
        return selectedCredentialRoles.length > 0;
      default:
        return true;
    }
    const newErrors = validateSchemaFields(fields, values);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
      setErrors({});
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      const previousStep = STEPS[prevIndex];
      if (previousStep) {
        setCurrentStep(previousStep);
      }
      setErrors({});
    }
  };

  const handleComplete = () => {
    const result: ProviderWizardResult = {
      account: {
        provider: schema.provider,
        code: (accountValues.code as string) ?? "",
        name: (accountValues.name as string) ?? "",
        environment: (accountValues.environment as string) ?? "production",
        externalTenantId: (accountValues.externalTenantId as string) || undefined,
        cloudAccountId: (accountValues.cloudAccountId as string) || undefined,
        projectId: (accountValues.projectId as string) || undefined,
        resourceGroupId: (accountValues.resourceGroupId as string) || undefined,
      },
      application: {
        code: (applicationValues.code as string) ?? "",
        name: (applicationValues.name as string) ?? "",
        environment: (applicationValues.environment as string) ?? "production",
        region: (applicationValues.region as string) || undefined,
        providerApplicationId: (applicationValues.providerApplicationId as string) ?? "",
        providerApplicationIdKind: (applicationValues.providerApplicationIdKind as string) ?? "app_id",
        accessEndpoint: (applicationValues.accessEndpoint as string) || undefined,
        apiEndpoint: (applicationValues.apiEndpoint as string) || undefined,
        apiHost: (applicationValues.apiHost as string) || undefined,
        apiVersion: (applicationValues.apiVersion as string) || undefined,
        webhookCallbackUrl: (applicationValues.webhookCallbackUrl as string) || undefined,
        configSnapshot: {},
      },
      credentials: selectedCredentialRoles.map((role) => ({
        credentialRole: role,
        credentialLabel: schema.credentialRoles.find((r) => r.role === role)?.label ?? role,
        credentialRef: (credentialValues[role]?.credentialRef as string) ?? "",
        credentialFingerprint: (credentialValues[role]?.credentialFingerprint as string) || undefined,
      })),
      profile: {
        provider: schema.provider,
        code: (profileValues.code as string) ?? "",
        name: (profileValues.name as string) ?? "",
        isDefault: Boolean(profileValues.isDefault),
        priority: Number(profileValues.priority) || 0,
        environment: (profileValues.environment as string) ?? "production",
        region: (profileValues.region as string) || undefined,
        providerAppId: (profileValues.providerAppId as string) || undefined,
        endpoint: (profileValues.endpoint as string) || undefined,
        credentialRef: (profileValues.credentialRef as string) || undefined,
        webhookSecretRef: (profileValues.webhookSecretRef as string) || undefined,
        capabilities: {
          audio: true,
          video: true,
          live: true,
          screenShare: true,
          recording: true,
          webhook: true,
          activeQuery: true,
          supportedRegions: [],
          providerFeatures: {},
        },
        configSnapshot: {},
      },
    };
    onComplete(result);
  };

  return (
    <div className="provider-config-wizard">
      <div className="wizard-header">
        <h2>Configure {schema.displayName}</h2>
        <p>{schema.description}</p>
      </div>

      <div className="wizard-steps">
        {STEPS.map((step, index) => (
          <div
            key={step}
            className={`wizard-step ${index === stepIndex ? "active" : ""} ${index < stepIndex ? "completed" : ""}`}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-label">{STEP_LABELS[step]}</span>
          </div>
        ))}
      </div>

      <div className="wizard-content">
        {currentStep === "account" && (
          <div>
            <h3>Provider Account</h3>
            <p>Configure the cloud account for {schema.displayName}</p>
            <ProviderSchemaForm
              schema={schema}
              values={accountValues}
              onChange={setAccountValues}
              section="account"
              errors={errors}
            />
          </div>
        )}

        {currentStep === "application" && (
          <div>
            <h3>Provider Application</h3>
            <p>Configure the RTC application for {schema.displayName}</p>
            <ProviderSchemaForm
              schema={schema}
              values={applicationValues}
              onChange={setApplicationValues}
              section="application"
              errors={errors}
            />
          </div>
        )}

        {currentStep === "credentials" && (
          <div>
            <h3>Provider Credentials</h3>
            <p>Select and configure credential roles for {schema.displayName}</p>
            {schema.credentialRoles.map((role) => (
              <div key={role.role} className="credential-role-card">
                <label className="credential-role-toggle">
                  <input
                    type="checkbox"
                    checked={selectedCredentialRoles.includes(role.role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCredentialRoles([...selectedCredentialRoles, role.role]);
                      } else {
                        setSelectedCredentialRoles(selectedCredentialRoles.filter((r) => r !== role.role));
                      }
                    }}
                  />
                  <strong>{role.label}</strong>
                </label>
                <p>{role.description}</p>
                {selectedCredentialRoles.includes(role.role) && (
                  <div className="credential-fields">
                    {role.fields.map((field) => (
                      <div key={field.key} className="form-field">
                        <label>{field.label}</label>
                        <input
                          type={field.type === "secret_ref" ? "password" : "text"}
                          value={(credentialValues[role.role]?.[field.key] as string) ?? ""}
                          onChange={(e) =>
                            setCredentialValues({
                              ...credentialValues,
                              [role.role]: {
                                ...credentialValues[role.role],
                                [field.key]: e.target.value,
                              },
                            })
                          }
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {currentStep === "profile" && (
          <div>
            <h3>Provider Profile</h3>
            <p>Configure the RTC provider profile for {schema.displayName}</p>
            <ProviderSchemaForm
              schema={schema}
              values={profileValues}
              onChange={setProfileValues}
              section="profile"
              errors={errors}
            />
          </div>
        )}

        {currentStep === "review" && (
          <div>
            <h3>Review Configuration</h3>
            <div className="review-section">
              <h4>Account</h4>
              <dl>
                <dt>Provider</dt><dd>{schema.provider}</dd>
                <dt>Code</dt><dd>{accountValues.code as string}</dd>
                <dt>Name</dt><dd>{accountValues.name as string}</dd>
                <dt>Environment</dt><dd>{accountValues.environment as string}</dd>
              </dl>
            </div>
            <div className="review-section">
              <h4>Application</h4>
              <dl>
                <dt>App ID</dt><dd>{applicationValues.providerApplicationId as string}</dd>
                <dt>Region</dt><dd>{applicationValues.region as string ?? "default"}</dd>
              </dl>
            </div>
            <div className="review-section">
              <h4>Credentials</h4>
              <ul>
                {selectedCredentialRoles.map((role) => (
                  <li key={role}>{schema.credentialRoles.find((r) => r.role === role)?.label}</li>
                ))}
              </ul>
            </div>
            <div className="review-section">
              <h4>Profile</h4>
              <dl>
                <dt>Code</dt><dd>{profileValues.code as string}</dd>
                <dt>Default</dt><dd>{profileValues.isDefault ? "Yes" : "No"}</dd>
                <dt>Region</dt><dd>{profileValues.region as string ?? "default"}</dd>
              </dl>
            </div>
          </div>
        )}
      </div>

      <div className="wizard-actions">
        <button onClick={onCancel}>Cancel</button>
        {stepIndex > 0 && <button onClick={handleBack}>Back</button>}
        {stepIndex < STEPS.length - 1 && (
          <button onClick={handleNext} className="primary">
            Next
          </button>
        )}
        {stepIndex === STEPS.length - 1 && (
          <button onClick={handleComplete} className="primary">
            Complete Setup
          </button>
        )}
      </div>
    </div>
  );
}
