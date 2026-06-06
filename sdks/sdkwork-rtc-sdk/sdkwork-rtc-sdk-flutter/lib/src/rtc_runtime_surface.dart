const List<String> rtcRuntimeSurfaceMethods = <String>[
  'join',
  'leave',
  'publish',
  'unpublish',
  'muteAudio',
  'muteVideo',
];

const String rtcRuntimeSurfaceFailureCode = 'native_sdk_not_available';

const Map<String, Object> rtcRuntimeSurfaceStandard = <String, Object>{
  'methodTerms': rtcRuntimeSurfaceMethods,
  'failureCode': rtcRuntimeSurfaceFailureCode,
};
