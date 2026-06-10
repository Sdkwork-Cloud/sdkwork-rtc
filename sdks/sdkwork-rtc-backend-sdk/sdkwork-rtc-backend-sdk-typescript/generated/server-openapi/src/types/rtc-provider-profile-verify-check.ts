export interface RtcProviderProfileVerifyCheck {
  name: string;
  status: 'passed' | 'warning' | 'failed' | 'skipped';
  detail?: string | null;
}
