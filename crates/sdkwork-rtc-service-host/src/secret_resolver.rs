use std::collections::BTreeMap;
use std::error::Error;
use std::fmt;
use std::sync::Arc;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcSecretResolverError {
    pub message: String,
}

impl RtcSecretResolverError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl fmt::Display for RtcSecretResolverError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}", self.message)
    }
}

impl Error for RtcSecretResolverError {}

pub trait RtcSecretResolver: Send + Sync {
    fn resolve_secret(&self, secret_ref: &str) -> Result<String, RtcSecretResolverError>;
}

#[derive(Clone, Debug, Default)]
pub struct EnvRtcSecretResolver;

impl RtcSecretResolver for EnvRtcSecretResolver {
    fn resolve_secret(&self, secret_ref: &str) -> Result<String, RtcSecretResolverError> {
        let trimmed = secret_ref.trim();
        if trimmed.is_empty() {
            return Err(RtcSecretResolverError::new("secret ref must not be empty"));
        }

        if let Some(value) = trimmed.strip_prefix("plain:") {
            if !allows_plaintext_secret_refs() {
                return Err(RtcSecretResolverError::new(
                    "plain secret refs are disabled outside local development; use secret:// refs",
                ));
            }
            if value.trim().is_empty() {
                return Err(RtcSecretResolverError::new(
                    "plain secret ref must include a non-empty value",
                ));
            }
            return Ok(value.to_owned());
        }

        let env_key = secret_ref_to_env_key(trimmed);
        if let Ok(value) = std::env::var(&env_key) {
            let value = value.trim();
            if !value.is_empty() {
                return Ok(value.to_owned());
            }
        }

        Err(RtcSecretResolverError::new(format!(
            "unable to resolve secret ref {trimmed}; configure environment variable {env_key}"
        )))
    }
}

#[derive(Clone, Debug, Default)]
pub struct MapRtcSecretResolver {
    secrets: BTreeMap<String, String>,
}

impl MapRtcSecretResolver {
    pub fn new(secrets: BTreeMap<String, String>) -> Self {
        Self { secrets }
    }

    pub fn with_secret(mut self, secret_ref: impl Into<String>, value: impl Into<String>) -> Self {
        self.secrets.insert(secret_ref.into(), value.into());
        self
    }

    pub fn test_defaults() -> Self {
        let mut secrets = BTreeMap::new();
        for provider in [
            "acme",
            "backup",
            "volcengine",
            "tencent",
            "agora",
            "aliyun",
            "livekit",
        ] {
            secrets.insert(
                format!("secret://rtc/{provider}/webhook"),
                "sdkwork-rtc-webhook-test-secret".to_owned(),
            );
            secrets.insert(
                format!("secret://rtc/{provider}/credential"),
                format!("{provider}-credential-test-secret"),
            );
        }
        Self { secrets }
    }
}

impl RtcSecretResolver for MapRtcSecretResolver {
    fn resolve_secret(&self, secret_ref: &str) -> Result<String, RtcSecretResolverError> {
        let trimmed = secret_ref.trim();
        self.secrets.get(trimmed).cloned().ok_or_else(|| {
            RtcSecretResolverError::new(format!(
                "secret ref is not configured in map resolver: {trimmed}"
            ))
        })
    }
}

pub type SharedRtcSecretResolver = Arc<dyn RtcSecretResolver>;

fn allows_plaintext_secret_refs() -> bool {
    let environment = std::env::var("SDKWORK_RTC_ENVIRONMENT")
        .or_else(|_| std::env::var("SDKWORK_ENVIRONMENT"))
        .unwrap_or_else(|_| "development".to_owned())
        .to_ascii_lowercase();
    matches!(
        environment.as_str(),
        "development" | "dev" | "local" | "test"
    )
}

fn secret_ref_to_env_key(secret_ref: &str) -> String {
    let normalized = secret_ref
        .trim()
        .trim_start_matches("secret://")
        .trim_start_matches("secrets://")
        .trim_start_matches("vault://")
        .trim_start_matches("kms://")
        .trim_start_matches("sm://")
        .replace(['/', '-', '.', ':'], "_")
        .to_ascii_uppercase();
    format!("SDKWORK_RTC_SECRET_{normalized}")
}
