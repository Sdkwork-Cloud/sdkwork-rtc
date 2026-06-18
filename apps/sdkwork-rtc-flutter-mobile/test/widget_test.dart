import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_rtc_flutter_mobile/app.dart';

void main() {
  testWidgets('renders RTC app sign-in shell', (WidgetTester tester) async {
    await tester.pumpWidget(const RtcApp());
    await tester.pumpAndSettle();

    expect(find.text('RTC App Sign In'), findsOneWidget);
    expect(find.text('Continue with Appbase'), findsOneWidget);
  });
}
