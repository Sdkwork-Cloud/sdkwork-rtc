/**
 * RTC admin domain copy (en-US) — `artifactDetail` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcArtifactDetailEn = {
  "admin.rtc.artifactDetail.title": "Artifact Details",
  "admin.rtc.artifactDetail.loading": "Loading artifact {{id}}...",
  "admin.rtc.artifactDetail.col.artifactId": "Artifact ID",
  "admin.rtc.artifactDetail.col.mediaSession": "Media Session",
  "admin.rtc.artifactDetail.col.kind": "Kind",
  "admin.rtc.artifactDetail.col.status": "Status",
  "admin.rtc.artifactDetail.col.owner": "Owner",
  "admin.rtc.artifactDetail.col.providerArtifact": "Provider Artifact",
  "admin.rtc.artifactDetail.col.started": "Started",
  "admin.rtc.artifactDetail.col.ended": "Ended",
  "admin.rtc.artifactDetail.col.duration": "Duration",
  "admin.rtc.artifactDetail.col.failureReason": "Failure Reason",
  "admin.rtc.artifactDetail.driveTitle": "Drive Reference",
  "admin.rtc.artifactDetail.col.driveUri": "Drive URI",
  "admin.rtc.artifactDetail.col.space": "Space",
  "admin.rtc.artifactDetail.col.node": "Node",
  "admin.rtc.artifactDetail.col.nodeVersion": "Node Version",
  "admin.rtc.artifactDetail.noDrive": "No Drive reference attached yet.",
  "admin.rtc.artifactDetail.resourceTitle": "Media Resource",
  "admin.rtc.artifactDetail.col.fileName": "File Name",
  "admin.rtc.artifactDetail.col.source": "Source",
  "admin.rtc.artifactDetail.col.mime": "MIME",
  "admin.rtc.artifactDetail.col.size": "Size",
  "admin.rtc.artifactDetail.col.mediaDuration": "Media Duration",
  "admin.rtc.artifactDetail.checksum": "Checksum ({{algorithm}})",
  "admin.rtc.artifactDetail.openFile": "Open File",
  "admin.rtc.artifactDetail.noResource": "No media resource metadata attached.",
} as const;
