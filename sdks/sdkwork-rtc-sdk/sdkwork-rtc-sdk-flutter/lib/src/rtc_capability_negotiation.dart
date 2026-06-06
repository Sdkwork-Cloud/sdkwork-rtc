enum RtcCapabilityNegotiationStatus {
  supported,
  degraded,
  unsupported,
}

const Map<RtcCapabilityNegotiationStatus, String>
rtcCapabilityNegotiationRules = <RtcCapabilityNegotiationStatus, String>{
  RtcCapabilityNegotiationStatus.supported:
      'all-requested-capabilities-available',
  RtcCapabilityNegotiationStatus.degraded:
      'all-required-capabilities-available_optional-capabilities-missing',
  RtcCapabilityNegotiationStatus.unsupported:
      'required-capabilities-missing',
};

const List<String> rtcCapabilityNegotiationStatuses = <String>[
  'supported',
  'degraded',
  'unsupported',
];

RtcCapabilityNegotiationStatus resolveRtcCapabilityNegotiationStatus(
  int missingRequiredCount,
  int missingOptionalCount,
) {
  if (missingRequiredCount > 0) {
    return RtcCapabilityNegotiationStatus.unsupported;
  }

  if (missingOptionalCount > 0) {
    return RtcCapabilityNegotiationStatus.degraded;
  }

  return RtcCapabilityNegotiationStatus.supported;
}
