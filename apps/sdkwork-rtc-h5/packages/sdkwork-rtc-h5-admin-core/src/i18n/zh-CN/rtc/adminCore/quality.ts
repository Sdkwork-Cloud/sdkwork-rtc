/**
 * RTC admin domain copy (zh-CN) — `quality` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcQualityZh = {
  "admin.rtc.quality.loadMore": "加载更多质量样本",
  "admin.rtc.quality.title": "质量监控",
  "admin.rtc.quality.exportAll": "导出全部",
  "admin.rtc.quality.filter.search": "按样本 ID 或会话 ID 搜索...",
  "admin.rtc.quality.filter.allTime": "全部时间",
  "admin.rtc.quality.filter.today": "今天",
  "admin.rtc.quality.filter.week": "最近 7 天",
  "admin.rtc.quality.filter.month": "最近 30 天",
  "admin.rtc.quality.filter.clear": "清除筛选",
  "admin.rtc.quality.col.session": "会话",
  "admin.rtc.quality.col.participant": "参与者",
  "admin.rtc.quality.col.latency": "延迟",
  "admin.rtc.quality.col.jitter": "抖动",
  "admin.rtc.quality.col.packetLoss": "丢包率",
  "admin.rtc.quality.col.bitrate": "码率",
  "admin.rtc.quality.col.sampledAt": "采样时间",
  "admin.rtc.quality.emptyLoading": "正在加载质量样本...",
  "admin.rtc.quality.empty": "暂无质量样本。",
  "admin.rtc.quality.csv.id": "ID",
  "admin.rtc.quality.csv.session": "会话",
  "admin.rtc.quality.csv.participant": "参与者",
  "admin.rtc.quality.csv.latency": "延迟（ms）",
  "admin.rtc.quality.csv.jitter": "抖动（ms）",
  "admin.rtc.quality.csv.packetLoss": "丢包率",
  "admin.rtc.quality.csv.bitrate": "码率（kbps）",
  "admin.rtc.quality.csv.sampledAt": "采样时间",
  "admin.rtc.quality.footer": "共 {{count}} 个质量样本",
} as const;
