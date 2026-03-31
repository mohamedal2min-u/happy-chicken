import 'package:flutter/material.dart';

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl, // اتجاه عربي إلزامي
      child: Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(color: Color(0xFF2ECC71).withOpacity(0.1), shape: BoxShape.circle),
                    child: Center(child: Text("🐣", style: TextStyle(fontSize: 40))),
                  ),
                  SizedBox(height: 20),
                  Text("دخول العامل", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF34495E))),
                  Text("أدخل بياناتك للبدء بتسجيل اليوميات", style: TextStyle(color: Colors.grey)),
                  SizedBox(height: 40),
                  
                  TextField(
                    controller: _emailController,
                    decoration: InputDecoration(
                      labelText: "البريد الإلكتروني",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                  ),
                  SizedBox(height: 20),
                  
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: "كلمة المرور",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: Icon(Icons.lock_outline),
                    ),
                  ),
                  SizedBox(height: 30),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: _loading ? null : () {}, // سيتم ربطه مع الـ ApiService
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF2ECC71),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _loading ? CircularProgressIndicator(color: Colors.white) : Text("تسجيل الدخول", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
