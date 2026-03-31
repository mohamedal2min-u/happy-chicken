import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.alamin.se/api', // عنوان الـ Backend
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Middleware للطلبات: إضافة توكن المصادقة ومعرّف المدجنة
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    const farmId = localStorage.getItem('current_farm_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (farmId) {
      config.headers['X-Farm-ID'] = farmId;
    }
  }
  return config;
});

// معالجة الأخطاء (مثلاً 401: التوكن منتهي)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
