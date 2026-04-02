'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { useParams, useRouter } from 'next/navigation';

export default function FlockDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     fetchFlockData();
  }, [id]);

  const fetchFlockData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/flocks/${id}`);
      if (resp.data.success === false) {
          setError(resp.data.error || 'حدث خطأ غير معروف في السيرفر');
      } else {
          setData(resp.data);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'تعذر الاتصال بالسيرفر أو حدث خطأ داخلي (500)';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseFlock = async () => {
     if (!confirm('سيتم أرشفة الفوج وإيقاف كافة العمليات عليه. هل أنت متأكد؟')) return;
     setClosing(true);
     try {
       await api.post(`/flocks/${id}/close`);
       fetchFlockData();
     } catch (err: any) {
       alert(err.response?.data?.error || 'خطأ في إغلاق الفوج.');
     } finally {
       setClosing(false);
     }
  };

  if (loading) return (
     <div className="loading-state">
        <div className="spinner"></div>
        <style jsx>{`
           .loading-state { display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; }
           .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #0f172a; border-radius: 50%; animation: spin 0.8s linear infinite; }
           @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
     </div>
  );

  if (!data || !data.flock) return (
     <div className="error-wrap">
        <div className="error-card glass-card">
           <span className="err-icon">⚠️</span>
           <h2>بيانات الفوج غير متاحة</h2>
           <p>نعتذر، لم نتمكن من العثور على سجل هذا الفوج في النظام.</p>
           <button className="btn-back" onClick={() => router.back()}>العودة للرئيسية</button>
        </div>
        <style jsx>{`
           .error-wrap { display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; padding: 20px; }
           .error-card { text-align: center; padding: 60px; max-width: 500px; width: 100%; border-radius: 40px; }
           .err-icon { font-size: 50px; display: block; margin-bottom: 20px; }
           h2 { font-weight: 900; margin-bottom: 10px; color: #0f172a; }
           p { color: #64748b; margin-bottom: 30px; }
           .btn-back { background: #0f172a; color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 800; cursor: pointer; }
        `}</style>
     </div>
  );

  const flock = data?.flock || {};
  const today = data?.today || { mortality: 0, feed_bags: 0, expense: 0, sales_birds: 0 };
  const cumulative = data?.cumulative || { total_mortality: 0, total_feed_bags: 0, total_expenses: 0, net_profit: 0 };
  const kpis = data?.kpis || { mortality_rate: 0 };
  const daily_movements = data?.daily_movements || [];
  const last_update = data?.last_update || { time: '---', user: 'مدير النظام' };

  const isTooYoung = (flock?.age_days || 0) < 35;

  return (
    <div className="flock-audit-page premium-slate-ocean">
       
       {/* 🚀 1. FLAGSHIP COMMAND HEADER */}
       <header className="command-header">
          <div className="header-orb"></div>
          <div className="ch-content">
             <div className="ch-left-brand">
                <div className="batch-tag-glass">
                   <span className="pulse-dot"></span>
                   <span className="number-font">BATCH No. {flock.batch_number || id}</span>
                </div>
                <h1>سجل المتابعة والتدقيق</h1>
                <p className="breed-info">نظام التحليل المتطور لسلالة {flock.breed || 'اللاحم الممتاز'}</p>
             </div>
             
             <div className="ch-right-controls">
                <button className="btn-exit" onClick={() => router.back()}>
                   <span>خروج</span>
                   <span className="icon">←</span>
                </button>
                {flock.status === 'open' && (
                   <div className="close-action-group">
                      <button 
                        className={`btn-finalize-flagship ${isTooYoung ? 'locked' : ''}`}
                        onClick={handleCloseFlock}
                        disabled={isTooYoung || closing}
                      >
                         {closing ? 'جاري المعالجة...' : '🔒 إتمام المهمة وإغلاق الفوج'}
                      </button>
                      {isTooYoung && <div className="lock-notice">يفتح تلقائياً في اليوم ٣٥</div>}
                   </div>
                )}
             </div>
          </div>

          <div className="header-stats-grid">
             <div className="hs-card">
                <label>تاريخ التأسيس</label>
                <div className="v number-font">{flock.created_at?.split('T')[0] || '---'}</div>
             </div>
             <div className="hs-card">
                <label>عصر الفوج الحقيقي</label>
                <div className="v number-font">{flock.age_days || 0} يوم</div>
             </div>
             <div className="hs-card active-stat">
                <label>إحصاء الكائنات الحية</label>
                <div className="v number-font">{( (flock.start_count || 0) - (cumulative.total_mortality || 0))?.toLocaleString()}</div>
             </div>
             <div className="hs-card">
                <label>بيانات المزامنة</label>
                <div className="v">{last_update.time} <small>بوصلة {last_update.user}</small></div>
             </div>
          </div>
       </header>

       <div className="page-content-wrapper">
          {/* 📊 2. PERFORMANCE HUB */}
          <section className="dashboard-section section-daily-glow">
             <div className="modern-sh">
                <span className="line"></span>
                <h3>نشرة الأداء اليومي</h3>
                <span className="badge-today number-font">{today.date || '٢٤ ساعة'}</span>
             </div>
             <div className="glow-grid">
                <div className="g-card danger">
                   <div className="g-icon">💀</div>
                   <div className="g-body">
                      <label>إجمالي النفوق</label>
                      <div className="val number-font">{today.mortality || 0} <small>طير</small></div>
                   </div>
                </div>
                <div className="g-card success">
                   <div className="g-icon">🌾</div>
                   <div className="g-body">
                      <label>استهلاك العلف</label>
                      <div className="val number-font">{today.feed_bags || 0} <small>كيس</small></div>
                   </div>
                </div>
                <div className="g-card warning">
                   <div className="g-icon">💰</div>
                   <div className="g-body">
                      <label>مصروف الصيانة</label>
                      <div className="val number-font">{today.expense?.toLocaleString()} <small>ل.س</small></div>
                   </div>
                </div>
                <div className="g-card info">
                   <div className="g-icon">🚚</div>
                   <div className="g-body">
                      <label>إجمالي المبيعات</label>
                      <div className="val number-font">{today.sales_birds || 0} <small>طير</small></div>
                   </div>
                </div>
             </div>
          </section>

          {/* 💰 3. FINANCIAL INTELLIGENCE */}
          <section className="dashboard-section section-finance-pro">
             <div className="modern-sh">
                <span className="line"></span>
                <h3>التحليل المالي والربحية</h3>
                <span className="badge-meta">تراكمي مجمع</span>
             </div>
             <div className="finance-hero-container">
                <div className="fh-main-box glass-card">
                   <div className="fh-top-stats">
                      <div className="fh-stat-primary">
                         <label>صافي عوائد الاستثمار (ROI)</label>
                         <div className={`value-mega number-font ${cumulative.net_profit >= 0 ? 'pos' : 'neg'}`}>
                            {cumulative.net_profit?.toLocaleString()} <small>ل.س</small>
                         </div>
                         <div className={`status-tag ${cumulative.net_profit >= 0 ? 'bg-pos' : 'bg-neg'}`}>
                            {cumulative.net_profit >= 0 ? '📈 صافي ربح تراكمي' : '📉 عجز مالي حالي'}
                         </div>
                      </div>
                      <div className="fh-stat-secondary">
                         <label>مؤشر الكفاءة الحيوية</label>
                         <div className={`value-pro number-font ${kpis.mortality_rate > 5 ? 'neg' : 'pos'}`}>
                            {kpis.mortality_rate}%
                         </div>
                         <div className="hint-tag">نسبة النفوق</div>
                      </div>
                   </div>
                   <div className="fh-bottom-row">
                      <div className="fb-item">
                         <label>الخسائر الحيوية</label>
                         <div className="n number-font">{cumulative.total_mortality} طير</div>
                      </div>
                      <div className="fb-item">
                         <label>المخزون المستهلك</label>
                         <div className="n number-font">{cumulative.total_feed_bags} كيس</div>
                      </div>
                      <div className="fb-item">
                         <label>التكاليف التشغيلية</label>
                         <div className="n number-font">{cumulative.total_expenses?.toLocaleString()} ل.س</div>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* 📅 4. AUDIT LOG TABLE */}
          <section className="dashboard-section section-audit-log">
             <div className="modern-sh">
                <span className="line"></span>
                <h3>سجل التدقيق والمتابعة الدقيقة</h3>
                <span className="badge-unit">الوحدة: كيس ٥٠ كغ</span>
             </div>
             <div className="audit-table-container">
                <table className="flagship-table">
                   <thead>
                      <tr>
                         <th>العمر</th>
                         <th>التاريخ</th>
                         <th className="dark-red">النفوق</th>
                         <th className="dark-green">العلف</th>
                         <th>المقدّر</th>
                         <th>التعتيم</th>
                         <th>الدواء</th>
                         <th>المصروف</th>
                         <th className="wide">الملاحظات</th>
                         <th>المسؤول</th>
                      </tr>
                   </thead>
                   <tbody>
                      {daily_movements.map((move: any) => (
                        <tr key={move.day}>
                           <td className="age-col"><span className="age-box">عمر {move.day}</span></td>
                           <td className="date-col number-font">{move.date}</td>
                           <td className={`mort-col number-font ${move.mortality > 0 ? 'has-mort' : 'no-mort'}`}>{move.mortality || 0}</td>
                           <td className="feed-col number-font active-feed">{move.actual_feed_bags} <small>كيس</small></td>
                           <td className="est-col number-font muted">{move.estimated_feed_bags} <small>كيس</small></td>
                           <td className="blackout-col number-font">{move.estimated_blackout} س</td>
                           <td className="med-col">
                              {move.medicine_count > 0 ? <span className="pill-blue">{move.medicine_count} جرعة</span> : '---'}
                           </td>
                           <td className="exp-col">
                              <div className="e-val number-font">{move.expense_amount?.toLocaleString() || '0'}</div>
                              <div className="e-note">{move.expense_summary}</div>
                           </td>
                           <td className="note-col">{move.notes || 'لا يوجد'}</td>
                           <td className="user-col">
                              <div className="u-name">{move.updated_by}</div>
                              <div className="u-time number-font">{move.updated_at}</div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                   <tfoot>
                      <tr className="grand-total-row">
                         <td colSpan={2} className="label">الإجمالي التراكمي</td>
                         <td className="number-font">{cumulative.total_mortality}</td>
                         <td className="number-font text-emerald">{cumulative.total_feed_bags} كيس</td>
                         <td className="number-font muted">{cumulative.total_estimated_feed_bags} كيس</td>
                         <td colSpan={2}>---</td>
                         <td className="number-font text-gold">{cumulative.total_expenses?.toLocaleString()}</td>
                         <td colSpan={2}>---</td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </section>
       </div>

       <style jsx>{`
          .flock-audit-page { background: #f8fafc; min-height: 100vh; padding-bottom: 50px; color: #0f172a; }
          .page-content-wrapper { max-width: 1300px; margin: 0 auto; padding: 0 30px; display: flex; flex-direction: column; gap: 40px; }

          /* Header Premium */
          .command-header { 
             background: #0f172a; padding: 60px 50px 100px; position: relative; overflow: hidden; margin-bottom: -60px;
             color: white; 
          }
          .header-orb { 
             position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(30, 64, 175, 0.4) 0%, transparent 70%); 
             top: -200px; right: -100px; z-index: 1; 
          }
          .ch-content { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
          .batch-tag-glass { 
             background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); display: inline-flex; align-items: center; gap: 10px; 
             padding: 6px 16px; border-radius: 64px; border: 1px solid rgba(255,255,255,0.2); font-size: 11px; font-weight: 900; color: #94a3b8;
             margin-bottom: 15px;
          }
          .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 1.5s infinite; }
          @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.8; } }
          
          h1 { font-size: 32px; font-weight: 950; margin-bottom: 4px; }
          .breed-info { color: #94a3b8; font-weight: 700; font-size: 14px; }

          .ch-right-controls { display: flex; gap: 15px; align-items: flex-start; }
          .btn-exit { 
             background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); 
             padding: 10px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px;
             transition: all 0.2s;
          }
          .btn-exit:hover { background: rgba(255,255,255,0.1); }
          .btn-finalize-flagship { 
             background: linear-gradient(135deg, #ef4444 0%, #be123c 100%); color: white; border: none; padding: 12px 24px; border-radius: 12px; 
             font-weight: 900; cursor: pointer; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); 
          }
          .btn-finalize-flagship.locked { background: #475569 !important; cursor: not-allowed; box-shadow: none; opacity: 0.6; }
          .lock-notice { font-size: 10px; text-align: center; color: #94a3b8; margin-top: 6px; font-weight: 800; }

          .header-stats-grid { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .hs-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 20px; border-radius: 20px; }
          .hs-card label { display: block; font-size: 10px; color: #64748b; font-weight: 800; margin-bottom: 8px; }
          .hs-card .v { font-size: 18px; font-weight: 900; }
          .hs-card.active-stat { background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2); color: #10b981; }

          /* Dashboard Rows */
          .modern-sh { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
          .modern-sh .line { width: 40px; height: 4px; background: #0f172a; border-radius: 2px; }
          .modern-sh h3 { font-size: 22px; font-weight: 950; }
          .badge-today, .badge-meta, .badge-unit { font-size: 11px; font-weight: 900; background: #e2e8f0; padding: 3px 12px; border-radius: 6px; color: #475569; }

          .glow-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .g-card { background: white; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 20px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
          .g-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
          .g-icon { width: 54px; height: 54px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
          .g-card.danger .g-icon { background: #fef2f2; }
          .g-card.success .g-icon { background: #f0fdf4; }
          .g-card.warning .g-icon { background: #fff7ed; }
          .g-card.info .g-icon { background: #eff6ff; }
          .g-body label { display: block; font-size: 11px; color: #64748b; font-weight: 800; margin-bottom: 4px; }
          .g-body .val { font-size: 20px; font-weight: 950; }
          .g-body .val small { font-size: 11px; opacity: 0.5; margin-right: 4px; }

          /* Finance Professional */
          .fh-main-box { padding: 40px; }
          .fh-top-stats { display: flex; justify-content: space-between; align-items: center; padding-bottom: 40px; margin-bottom: 40px; border-bottom: 1px dashed #e2e8f0; }
          .fh-stat-primary label { display: block; font-size: 13px; font-weight: 900; color: #64748b; margin-bottom: 15px; }
          .value-mega { font-size: 56px; font-weight: 950; letter-spacing: -2px; line-height: 1; margin-bottom: 15px; }
          .value-mega.pos { color: #059669; }
          .value-mega.neg { color: #dc2626; }
          .status-tag { display: inline-block; padding: 6px 16px; border-radius: 32px; font-size: 12px; font-weight: 900; }
          .bg-pos { background: #dcfce7; color: #166534; }
          .bg-neg { background: #fee2e2; color: #991b1b; }
          
          .value-pro { font-size: 32px; font-weight: 950; color: #0f172a; margin-bottom: 5px; }
          .value-pro.pos { color: #10b981; }
          .value-pro.neg { color: #ef4444; }
          .hint-tag { font-size: 11px; font-weight: 800; color: #94a3b8; }

          .fh-bottom-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
          .fb-item { text-align: center; background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; }
          .fb-item label { display: block; font-size: 10px; color: #64748b; font-weight: 800; margin-bottom: 10px; }
          .fb-item .n { font-size: 20px; font-weight: 950; color: #1e293b; }

          /* Audit Table Flagship */
          .audit-table-container { background: white; border-radius: 32px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .flagship-table { width: 100%; border-collapse: collapse; text-align: center; }
          .flagship-table th { padding: 20px 15px; background: #f8fafc; font-size: 12px; font-weight: 900; color: #475569; border-bottom: 1.5px solid #e2e8f0; }
          .flagship-table td { padding: 18px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
          
          .age-col .age-box { background: #0f172a; color: white; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; }
          .date-col { font-size: 11px; color: #94a3b8; }
          .mort-col.has-mort { background: #fff5f5; color: #ef4444; font-weight: 900; }
          .ext-mort { font-size: 16px; }
          .active-feed { color: #059669; font-weight: 900; font-size: 16px; }
          .pill-blue { background: #eff6ff; color: #2563eb; padding: 2px 10px; border-radius: 6px; font-weight: 800; font-size: 11px; border: 1px solid #dbeafe; }
          
          .e-val { font-weight: 900; color: #0f172a; }
          .e-note { font-size: 10px; color: #94a3b8; font-weight: 700; margin-top: 2px; }
          .note-col { max-width: 150px; font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .user-col .u-name { font-weight: 800; font-size: 12px; }
          .user-col .u-time { font-size: 10px; color: #94a3b8; }

          .grand-total-row { background: #0f172a; color: white; }
          .grand-total-row td { padding: 25px 15px; font-size: 16px; border: none; font-weight: 900; }
          .grand-total-row .label { text-align: right; padding-right: 50px; font-size: 18px; }
          .text-emerald { color: #10b981; }
          .text-gold { color: #fbbf24; }

          .glass-card { background: white; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
          .number-font { font-family: 'Outfit', sans-serif; }
          .muted { color: #94a3b8; opacity: 0.6; }

          @media (max-width: 1200px) {
             .header-stats-grid, .glow-grid { grid-template-columns: repeat(2, 1fr); }
             .fh-top-stats { flex-direction: column; text-align: center; gap: 30px; }
             .audit-table-container { overflow-x: auto; }
             .ch-content { flex-direction: column; align-items: flex-start; gap: 30px; }
             .command-header { padding-bottom: 120px; }
          }
       `}</style>
    </div>
  );
}
