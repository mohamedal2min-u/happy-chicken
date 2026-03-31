'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';

export default function FlocksPage() {
  const [flocks, setFlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlocks();
  }, []);

  const fetchFlocks = async () => {
    try {
      const resp = await api.get('/flocks');
      setFlocks(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flocks-monitoring-page animate-fade-in">
      <header className="monitoring-header">
         <div className="header-txt">
            <h1>سجل متابعة الأفواج</h1>
            <p>مراقبة شاملة لأداء الدورات الإنتاجية الحالية والأرشيفية.</p>
         </div>
      </header>

      <div className="flocks-list-modern">
        {loading ? (
             <div className="loading-state">جاري جلب بيانات الفوج...⏳</div>
        ) : flocks.length === 0 ? (
             <div className="empty-state">لا يوجد أفواج مسجلة حالياً.</div>
        ) : (
          flocks.map((f: any) => (
            <div key={f.id} className="flock-row-card">
               <div className="batch-number-section">
                  <span className="label">رقم الفوج</span>
                  <div className="val number-font">#{f.batch_number}</div>
               </div>

               <div className="info-section">
                  <span className="label">تاريخ البداية</span>
                  <div className="val number-font">{f.created_at?.split('T')[0]}</div>
               </div>

               <div className="info-section">
                  <span className="label">العدد الحي</span>
                  <div className="val number-font highlight">{(f.current_count || 0).toLocaleString('en-US')} <small>طير</small></div>
               </div>

               <div className="info-section">
                  <span className="label">العمر</span>
                  <div className="val number-font">{f.age_days} <small>يوم</small></div>
               </div>

               <div className="status-section">
                  <span className="label">الحالة التشغيلية</span>
                  <div className={`status-pill ${f.status === 'open' ? 'active' : 'closed'}`}>
                     {f.status === 'open' ? 'نشط الآن' : 'مكتمل / مبيع'}
                  </div>
               </div>

               <div className="action-section">
                  <Link href={`/flocks/${f.id}`} className="view-details-btn">
                     عرض السجل الكامل
                  </Link>
               </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .flocks-monitoring-page { width: 100%; max-width: 1200px; margin: 0 auto; }
        
        .monitoring-header { margin-bottom: 40px; border-bottom: 2px solid var(--border); padding-bottom: 24px; }
        .header-txt h1 { font-size: 30px; font-weight: 900; color: var(--text-main); }
        .header-txt p { color: var(--text-muted); font-size: 15px; margin-top: 4px; }

        .flocks-list-modern { display: flex; flex-direction: column; gap: 20px; }

        .flock-row-card { 
            background: var(--bg-card); 
            border: 1px solid var(--border); 
            border-radius: 24px; 
            padding: 30px; 
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            transition: all 0.2s;
        }
        .flock-row-card:hover { transform: scale(1.005); box-shadow: var(--shadow); border-color: var(--primary); }

        .label { display: block; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
        .val { font-size: 18px; font-weight: 800; color: var(--text-main); }
        .val.highlight { color: var(--primary); font-size: 22px; }
        .val small { font-size: 12px; opacity: 0.6; margin-right: 4px; }

        .status-pill { padding: 6px 16px; border-radius: 64px; font-size: 12px; font-weight: 800; text-align: center; width: fit-content; }
        .status-pill.active { background: #dcfce7; color: #166534; }
        .status-pill.closed { background: #f1f5f9; color: #475569; }

        .view-details-btn { 
            background: var(--bg-input); 
            color: var(--text-main); 
            text-decoration: none; 
            padding: 12px 24px; 
            border-radius: 16px; 
            font-size: 13px; 
            font-weight: 800; 
            border: 1px solid var(--border);
            transition: all 0.2s;
        }
        .view-details-btn:hover { background: var(--primary); color: white; border-color: var(--primary); cursor: pointer; }

        .loading-state, .empty-state { padding: 80px; text-align: center; color: var(--text-muted); font-weight: 600; }

        @media (max-width: 1024px) {
            .flock-row-card { flex-wrap: wrap; gap: 20px; }
            .flock-row-card > div { flex: 1 1 150px; }
            .action-section { width: 100%; flex: none; text-align: center; border-top: 1px solid var(--border); padding-top: 20px; }
            .view-details-btn { width: 100%; display: block; }
        }
      `}</style>
    </div>
  );
}
