use std::collections::HashSet;
use std::sync::{Arc, Mutex};

#[derive(Clone, Default)]
pub struct RtcActiveSessionTracker {
    sessions: Arc<Mutex<HashSet<String>>>,
}

impl RtcActiveSessionTracker {
    pub fn open(&self, tenant_id: &str, rtc_session_id: &str) {
        self.sessions
            .lock()
            .expect("rtc active session tracker lock")
            .insert(session_key(tenant_id, rtc_session_id));
    }

    pub fn close(&self, tenant_id: &str, rtc_session_id: &str) -> bool {
        self.sessions
            .lock()
            .expect("rtc active session tracker lock")
            .remove(&session_key(tenant_id, rtc_session_id))
    }
}

fn session_key(tenant_id: &str, rtc_session_id: &str) -> String {
    format!("{tenant_id}:{rtc_session_id}")
}
