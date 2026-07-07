export interface RtcProviderConfigFieldSchema {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  default?: unknown;
  placeholder?: string | null;
  values?: string[] | null;
  min?: number | null;
  max?: number | null;
  hidden?: boolean;
}
