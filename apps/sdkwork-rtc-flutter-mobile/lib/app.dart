import 'package:flutter/material.dart';
import 'auth_gate.dart';

class RtcApp extends StatelessWidget {
  const RtcApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SDKWork RTC',
      theme: ThemeData(
        colorSchemeSeed: Colors.blue,
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}
