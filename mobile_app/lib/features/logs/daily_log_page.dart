import 'package:flutter/material.dart';

class DailyLogPage extends StatefulWidget {
  final Map flock; // بيانات الفوج المختارة (batch_number, current_count)
  DailyLogPage({required this.flock});

  @override
  _DailyLogPageState createState() => _DailyLogPageState();
}

class _DailyLogPageState extends State<DailyLogPage> {
  final _mortalityController = TextEditingController();
  final _feedController = TextEditingController();
  final _noteController = TextEditingController();
  bool _isSaving = false;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text("تسجيل يومي: ${widget.flock['batch_number']}"),
          backgroundColor: Color(0xFF2ECC71),
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ملخص العدد الحي
              Container(
                padding: EdgeInsets.all(20),
                width: double.infinity,
                decoration: BoxDecoration(color: Color(0xFF2ECC71).withOpacity(0.05), borderRadius: BorderRadius.circular(16), border: Border.all(color: Color(0xFF2ECC71))),
                child: Column(
                  children: [
                    Text("العدد الحي المتبقي بالفوج", style: TextStyle(color: Colors.grey)),
                    Text("${widget.flock['current_count']}", style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF2ECC71))),
                  ],
                ),
              ),
              SizedBox(height: 30),
              
              // 1. تسجيل النفوق
              Text("تسجيل عدد النفوق اليوم", style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              TextField(
                controller: _mortalityController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  hintText: "أدخل عدد الوفيات (0-9 فقط)",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  suffixIcon: Icon(Icons.trending_down, color: Colors.red),
                ),
              ),
              SizedBox(height: 25),

              // 2. تسجيل العلف
              Text("كمية العلف المستهلكة (كغ)", style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              TextField(
                controller: _feedController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  hintText: "أدخل الكمية بالكيلو",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  suffixIcon: Icon(Icons.restaurant, color: Colors.green),
                ),
              ),
              SizedBox(height: 25),

              // 3. الملاحظات
              Text("ملاحظات إضافية", style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              TextField(
                controller: _noteController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: "أي ملحوظة عن صحة الطيور...",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              SizedBox(height: 40),

              // زر الحفظ النهائي
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : () {
                    // سيتم استدعاء API الموتات والعلف من هنا
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Color(0xFF2ECC71), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: _isSaving ? CircularProgressIndicator(color: Colors.white) : Text("حفظ السجل اليومي", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
