'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export default function FarmsManagementPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    farm_name: '',
    manager_name: '',
    manager_email: '',
    manager_password: '',
    location: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      const response = await api.get('/all-farms');
      setFarms(response.data);
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('جاري الإنشاء...');
    try {
      await api.post('/farms', formData);
      setMessage('✅ تم إنشاء المدجنة والمدير بنجاح!');
      setFormData({
        farm_name: '',
        manager_name: '',
        manager_email: '',
        manager_password: '',
        location: ''
      });
      fetchFarms();
    } catch (error: any) {
      setMessage('❌ خطأ: ' + (error.response?.data?.message || 'فشل الإنشاء'));
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await api.patch(`/farms/${id}/toggle-status`);
      fetchFarms();
    } catch (error) {
      alert('خطأ في تغيير الحالة');
    }
  };

  if (loading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">إدارة المداجن والنظام</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form to create new farm */}
        <div className="lg:col-span-1 glass-card p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold mb-4">🆕 إنشاء مدجنة جديدة</h2>
          <form onSubmit={handleCreateFarm} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">اسم المدجنة</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-lg"
                value={formData.farm_name}
                onChange={(e) => setFormData({...formData, farm_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">الموقع</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-lg"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <hr />
            <h3 className="text-sm font-bold opacity-70">بيانات المدير المسؤول</h3>
            <div>
              <label className="block text-sm mb-1">اسم المدير</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-lg"
                value={formData.manager_name}
                onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                className="w-full p-2 border rounded-lg"
                value={formData.manager_email}
                onChange={(e) => setFormData({...formData, manager_email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">كلمة المرور</label>
              <input 
                type="password" 
                className="w-full p-2 border rounded-lg"
                value={formData.manager_password}
                onChange={(e) => setFormData({...formData, manager_password: e.target.value})}
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              إنشاء وحفظ
            </button>
            {message && <p className="text-center text-sm font-bold mt-2">{message}</p>}
          </form>
        </div>

        {/* List of Farms */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-4">📋 المداجن الحالية</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">اسم المدجنة</th>
                    <th className="p-3">الموقع</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {farms.map((farm) => (
                    <tr key={farm.id} className="border-b hover:bg-gray-50/5">
                      <td className="p-3 font-bold">{farm.name}</td>
                      <td className="p-3 opacity-70">{farm.location}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${farm.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {farm.is_active ? 'نشطة' : 'متوقفة'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => toggleStatus(farm.id)}
                          className={`p-2 rounded text-xs ${farm.is_active ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'}`}
                        >
                          {farm.is_active ? 'إيقاف مؤقت' : 'تفعيل المزرعة'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {farms.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center opacity-50">لا يوجد مزارع مضافة حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
