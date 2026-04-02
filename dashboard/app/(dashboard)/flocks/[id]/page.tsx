'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import './flock-detail.css';

export default function FlockDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    fetchFlockData();
  }, [id]);

  const fetchFlockData = async () => {
    setLoading(true);
    setError(null);
    try {
      // إضافة v= لتجنب التخزين القديم (Cache Buster)
      const resp = await api.get(`/flocks/${id}?v=${Date.now()}`);
      if (resp.data.success === false) {
        setError(resp.data.error || 'حدث خطأ في جلب البيانات');
      } else {
        setData(resp.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'تعذر الاتصال بالسيرفر (500)');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-container premium-slate-ocean">
      <div className="chicken-loader">🐔</div>
      <p>جاري استحضار سجلات المدجنة الرقمية...</p>
    </div>
  );

  if (error) return (
    <div className="error-container premium-slate-ocean">
      <div className="error-card glass-card">
        <div className="error-icon">⚠️</div>
        <h2>تعذر تحميل بيانات الفوج</h2>
        <p className="error-msg">{error}</p>
        <button className="retry-btn" onClick={fetchFlockData}>إعادة المحاولة</button>
        <button className="back-btn" onClick={() => router.back()}>العودة للخلف</button>
      </div>
    </div>
  );

  const { flock, kpis, cumulative, daily_movements } = data;

  return (
    <div className="flock-detail-page animate-fade-in premium-slate-ocean">
      {/* رأس الصفحة */}
      <div className="page-header">
        <div className="header-info">
          <h1>سجل الفوج الصوصي: <span className="number-font"># {flock.batch_number}</span></h1>
          <p>تاريخ البدء: {flock.created_at?.split('T')[0]} | الدورة الحالية</p>
        </div>
        <div className="header-actions">
          <button className="btn-back" onClick={() => router.back()}>العودة للرئيسية</button>
        </div>
      </div>

      {/* بطاقات الإحصائيات العلوية */}
      <div className="stats-grid-4">
        <div className="stat-box-mini">
          <label>نسبة النفوق</label>
          <div className="val number-font text-red">{kpis.mortality_rate}%</div>
        </div>
        <div className="stat-box-mini">
          <label>العدد الحي حالياً</label>
          <div className="val number-font">{flock.current_count?.toLocaleString()}</div>
        </div>
        <div className="stat-box-mini">
          <label>إجمالي العلف (كيس)</label>
          <div className="val number-font">{cumulative.total_feed_bags}</div>
        </div>
        <div className="stat-box-mini">
          <label>الربح التقريبي</label>
          <div className="val number-font text-green">{cumulative.net_profit?.toLocaleString()} <small>ل.س</small></div>
        </div>
      </div>

      {/* الجدول التشغيلي الدقيق */}
      <div className="log-table-container glass-card">
        <h3>📊 التقرير اليومي المفصل (اليوميات)</h3>
        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>اليوم</th>
                <th>التاريخ</th>
                <th>النفوق</th>
                <th>العلف (أكياس)</th>
                <th>المصاريف</th>
                <th>البيان</th>
                <th>بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {daily_movements?.map((move: any) => (
                <tr key={move.day}>
                  <td className="number-font">اليوم {move.day}</td>
                  <td className="date-cell">{move.date}</td>
                  <td className={`number-font ${move.mortality > 0 ? 'text-red' : ''}`}>{move.mortality}</td>
                  <td className="number-font">{move.actual_feed_bags}</td>
                  <td className="number-font">{(move.expense_amount || 0).toLocaleString()}</td>
                  <td className="note-cell">{move.expense_summary}</td>
                  <td className="user-cell">{move.updated_by}</td>
                </tr>
              ))}
              {(!daily_movements || daily_movements.length === 0) && (
                <tr><td colSpan={7} className="empty-row">لا توجد بيانات مسجلة لهذا الفوج بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
