/**
 * RTC admin domain copy (zh-CN) — `artifactDetail` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcArtifactDetailZh = {
  "admin.rtc.artifactDetail.title": "记录文件详情",
  "admin.rtc.artifactDetail.loading": "正在加载记录文件 {{id}}...",
  "admin.rtc.artifactDetail.col.artifactId": "记录文件 ID",
  "admin.rtc.artifactDetail.col.mediaSession": "媒体会话",
  "admin.rtc.artifactDetail.col.kind": "类型",
  "admin.rtc.artifactDetail.col.status": "状态",
  "admin.rtc.artifactDetail.col.owner": "所有者",
  "admin.rtc.artifactDetail.col.providerArtifact": "供应商记录文件",
  "admin.rtc.artifactDetail.col.started": "开始时间",
  "admin.rtc.artifactDetail.col.ended": "结束时间",
  "admin.rtc.artifactDetail.col.duration": "时长",
  "admin.rtc.artifactDetail.col.failureReason": "失败原因",
  "admin.rtc.artifactDetail.driveTitle": "Drive 引用",
  "admin.rtc.artifactDetail.col.driveUri": "Drive URI",
  "admin.rtc.artifactDetail.col.space": "空间",
  "admin.rtc.artifactDetail.col.node": "节点",
  "admin.rtc.artifactDetail.col.nodeVersion": "节点版本",
  "admin.rtc.artifactDetail.noDrive": "暂未关联 Drive 引用。",
  "admin.rtc.artifactDetail.resourceTitle": "媒体资源",
  "admin.rtc.artifactDetail.col.fileName": "文件名",
  "admin.rtc.artifactDetail.col.source": "来源",
  "admin.rtc.artifactDetail.col.mime": "MIME",
  "admin.rtc.artifactDetail.col.size": "大小",
  "admin.rtc.artifactDetail.col.mediaDuration": "媒体时长",
  "admin.rtc.artifactDetail.checksum": "校验和（{{algorithm}}）",
  "admin.rtc.artifactDetail.openFile": "打开文件",
  "admin.rtc.artifactDetail.noResource": "暂未关联媒体资源元数据。",
} as const;
