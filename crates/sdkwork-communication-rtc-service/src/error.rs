#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RtcContractError {
    UnsupportedCapability(String),
    Conflict(String),
    Unavailable(String),
}
