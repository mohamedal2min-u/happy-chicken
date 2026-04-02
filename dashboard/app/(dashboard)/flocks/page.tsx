'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';

export default function FlocksPage() {
  const [flocks, setFlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newFlock, setNewFlock] = useState({
    batch_number: '',
    start_count: '',
    chick_price: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleCreateFlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/flocks', {
        batch_number: newFlock.batch_number,
        start_count: parseInt(newFlock.start_count),
        chick_price: parseFloat(newFlock.chick_price),
        notes: newFlock.notes
      });
      
      setShowModal(false);
      setNewFlock({ batch_number: '', start_count: '', chick_price: '', notes: '' });
      fetchFlocks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الفوج. يرجى مراجعة البيانات.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flocks-monitoring-page animate-fade-in">
      <header className="monitoring-header">
         <div className="header-txt">
            <h1>سجل متابعة الأفواج</h1>
            <p>مراقبة شاملة لأداء الدورات الإنتاجية الحالية والأرشيفية.</p>
         </div>
         <button className="add-flock-btn" onClick={() => setShowModal(true)}>
            <span className="icon">＋</span>
            إضافة فوج جديد
         </button>
      </header>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>إنشاء فوج جديد 🐔</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateFlock} className="flock-form">
              {error && <div className="error-box">{error}</div>}
              
              <div className="form-group-row">
                <div className="form-group">
                  <label>رقم الفوج (Batch ID)</label>
                  <input 
                    type="text" 
                    value={newFlock.batch_number}
                    onChange={(e) => setNewFlock({...newFlock, batch_number: e.target.value})}
                    placeholder="مثال: F-2024-002"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>العدد الابتدائي</label>
                  <input 
                    type="number" 
                    value={newFlock.start_count}
                    onChange={(e) => setNewFlock({...newFlock, start_count: e.target.value})}
                    placeholder="مثال: 5000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>سعر الصوص (للرأس الواحد بالليرة)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newFlock.chick_price}
                  onChange={(e) => setNewFlock({...newFlock, chick_price: e.target.value})}
                  placeholder="مثال: 0.85"
                  required
                />
              </div>

              <div className="form-group">
                <label>ملاحظات إضافية</label>
                <textarea 
                  value={newFlock.notes}
                  onChange={(e) => setNewFlock({...newFlock, notes: e.target.value})}
                  placeholder="نوع السلالة، الشركة الموردة..."
                  rows={3}
                />
              </div>

              <div className="form-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : 'تثبيت الفوج الجديد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        .flocks-monitoring-page { width: 100%; max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        .monitoring-header { 
          margin-bottom: 40px; 
          border-bottom: 2px solid var(--border); 
          padding-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-txt h1 { font-size: 30px; font-weight: 900; color: var(--text-main); }
        .header-txt p { color: var(--text-muted); font-size: 15px; margin-top: 4px; }

        .add-flock-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 10px 15px -3px rgba(30, 101, 52, 0.3);
        }
        .add-flock-btn:hover { transform: translateY(-3px); box-shadow: 0 20px 25px -5px rgba(30, 101, 52, 0.4); }
        .add-flock-btn .icon { font-size: 20px; }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(11, 15, 25, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s;
        }
        .modal-card {
          background: var(--bg-card);
          width: 100%;
          max-width: 500px;
          border-radius: 32px;
          border: 1px solid var(--border);
          padding: 40px;
          box-shadow: var(--shadow-lg);
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .modal-header h2 { font-size: 24px; font-weight: 900; color: var(--text-main); }
        .close-btn { background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer; }

        .flock-form { display: flex; flex-direction: column; gap: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 10px; }
        .form-group label { font-size: 14px; font-weight: 800; color: var(--text-main); }
        .form-group input, .form-group textarea {
          background: var(--bg-input);
          border: 2px solid var(--border);
          border-radius: 16px;
          padding: 14px 20px;
          font-size: 16px;
          color: var(--text-main);
          transition: all 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); outline: none; background: white; }

        .form-footer { display: flex; gap: 16px; margin-top: 10px; }
        .submit-btn { 
          flex: 2; 
          background: var(--primary); 
          color: white; 
          border: none; 
          padding: 16px; 
          border-radius: 20px; 
          font-weight: 900; 
          font-size: 16px; 
          cursor: pointer;
          transition: all 0.2s;
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cancel-btn { 
          flex: 1; 
          background: var(--bg-input); 
          color: var(--text-main); 
          border: 1px solid var(--border); 
          padding: 16px; 
          border-radius: 20px; 
          font-weight: 800; 
          cursor: pointer; 
        }

        .error-box { background: #fef2f2; color: #dc2626; padding: 16px; border-radius: 16px; font-size: 14px; font-weight: 700; border: 1px solid #fee2e2; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

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
            .monitoring-header { flex-direction: column; align-items: flex-start; gap: 20px; }
            .add-flock-btn { width: 100%; }
            .flock-row-card { flex-wrap: wrap; gap: 20px; }
            .flock-row-card > div { flex: 1 1 150px; }
            .action-section { width: 100%; flex: none; text-align: center; border-top: 1px solid var(--border); padding-top: 20px; }
            .view-details-btn { width: 100%; display: block; }
        }
      `}</style>
    </div>
  );
}
