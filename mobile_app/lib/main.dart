import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'features/auth/login_page.dart';

void main() {
  runApp(PoultryApp());
}

class PoultryApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'نظام إدارة المداجن (عامل)',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Tajawal', // استخدام خط تجوال للعربية
        primaryColor: Color(0xFF2ECC71),
        scaffoldBackgroundColor: Color(0xFFF8FAFC),
        textTheme: GoogleFonts.tajawalTextTheme(
          Theme.of(context).textTheme,
        ),
      ),
      // اتجاه لغة عربي RTL افتراضي
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child!,
        );
      },
      home: LoginPage(), // البدء بصفحة تسجيل الدخول
    );
  }
}
