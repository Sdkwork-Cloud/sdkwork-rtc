/**
 * RTC admin domain copy (en-US) — `quality` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcQualityEn = {
  "admin.rtc.quality.loadMore": "Load more samples",
  "admin.rtc.quality.title": "Quality Monitoring",
  "admin.rtc.quality.exportAll": "Export All",
  "admin.rtc.quality.filter.search": "Search by sample ID or session ID...",
  "admin.rtc.quality.filter.allTime": "All Time",
  "admin.rtc.quality.filter.today": "Today",
  "admin.rtc.quality.filter.week": "Last 7 Days",
  "admin.rtc.quality.filter.month": "Last 30 Days",
  "admin.rtc.quality.filter.clear": "Clear Filters",
  "admin.rtc.quality.col.session": "Session",
  "admin.rtc.quality.col.participant": "Participant",
  "admin.rtc.quality.col.latency": "Latency",
  "admin.rtc.quality.col.jitter": "Jitter",
  "admin.rtc.quality.col.packetLoss": "Packet Loss",
  "admin.rtc.quality.col.bitrate": "Bitrate",
  "admin.rtc.quality.col.sampledAt": "Sampled At",
  "admin.rtc.quality.emptyLoading": "Loading quality samples...",
  "admin.rtc.quality.empty": "No quality samples found.",
  "admin.rtc.quality.csv.id": "ID",
  "admin.rtc.quality.csv.session": "Session",
  "admin.rtc.quality.csv.participant": "Participant",
  "admin.rtc.quality.csv.latency": "Latency (ms)",
  "admin.rtc.quality.csv.jitter": "Jitter (ms)",
  "admin.rtc.quality.csv.packetLoss": "Packet Loss",
  "admin.rtc.quality.csv.bitrate": "Bitrate (kbps)",
  "admin.rtc.quality.csv.sampledAt": "Sampled At",
  "admin.rtc.quality.footer": "{{count}} sample(s) displayed",
} as const;
