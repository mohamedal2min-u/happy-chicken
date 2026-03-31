import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  final Dio dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:8000/api', // عنوان الـ Backend
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  ));

  ApiService() {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        final farmId = prefs.getString('current_farm_id');

        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (farmId != null) {
          options.headers['X-Farm-ID'] = farmId;
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        if (e.response?.statusCode == 401) {
          // توجيه المستخدم لتسجيل الدخول في حال انتهاء الصلاحية
        }
        return handler.next(e);
      },
    ));
  }
}
