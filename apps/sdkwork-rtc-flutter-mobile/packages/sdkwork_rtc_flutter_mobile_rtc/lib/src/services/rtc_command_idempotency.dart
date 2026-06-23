import 'dart:math';

String createRtcCommandIdempotencyKey(String scope) {
  final random = Random.secure();
  final token = List<int>.generate(8, (_) => random.nextInt(256));
  final suffix =
      token.map((value) => value.toRadixString(16).padLeft(2, '0')).join();
  return 'rtc-$scope-${DateTime.now().toUtc().millisecondsSinceEpoch}-$suffix';
}
