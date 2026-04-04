'use client';

import React, { useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { HiOutlineArrowLongRight, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineLightBulb } from "react-icons/hi2";
import Link from 'next/link';

export default function CreateFlockPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    batch_number: `F-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    start_count: '',
    chick_price: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/flocks', {
        batch_number: formData.batch_number,
        start_count: parseInt(formData.start_count),
        chick_price: parseFloat(formData.chick_price),
        notes: formData.notes
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create flock:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'حدث خطأ غير متوقع. يرجى مراجعة الاتصال بالسيرفر.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="success-overlay animate-fade-in">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>تم إنشاء الفوج بنجاح!</h2>
          <p>يتم الآن توجيهك إلى لوحة التحكم الرئيسية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-flock-container animate-fade-in">
      <Link href="/" className="back-link">
        <HiOutlineArrowLongRight /> العودة للرئيسية
      </Link>

      <div className="creation-card-wrapper">
        <div className="creation-header">
           <div className="icon">🐣</div>
           <div className="titles">
              <h1>تأسيس فوج جديد</h1>
              <p>أدخل بيانات الدورة الإنتاجية الجديدة بدقة لضمان دقة التقارير المالية والتشغيلية.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="creation-form">
          {error && <div className="error-alert"><HiOutlineExclamationCircle /> {error}</div>}
          
          <div className="form-sections-grid">
            <div className="form-main-side">
              <div className="input-group">
                <label>رقم الفوج (Batch Identifier)</label>
                <input 
                  type="text" 
                  value={formData.batch_number}
                  onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                  placeholder="مثال: F-2024-001"
                  required
                />
                <span className="input-hint">معرف فريد يستخدم لتتبع هذا الفوج في السجلات والمبيعات.</span>
              </div>

              <div className="row-inputs">
                <div className="input-group">
                  <label>العدد الابتدائي (العدد عند الاستلام)</label>
                  <input 
                    type="number" 
                    value={formData.start_count}
                    onChange={(e) => setFormData({...formData, start_count: e.target.value})}
                    placeholder="مثال: 5000"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>سعر الصوص الواحد (ل.س)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.chick_price}
                    onChange={(e) => setFormData({...formData, chick_price: e.target.value})}
                    placeholder="مثال: 12000"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>ملاحظات البداية</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="سلالة الصوص، المورد، حالة الاستلام..."
                  rows={4}
                />
              </div>
            </div>

            <div className="form-info-side">
              <div className="info-box tip">
                <div className="info-title"><HiOutlineLightBulb /> نصيحة تقنية</div>
                <p>تأكد من مطابقة السعر الفعلي للفاتورة لضمان حساب أرباح دقيق في نهاية الدورة.</p>
              </div>

              <div className="info-box checklist">
                <div className="info-title"><HiOutlineCheckCircle /> قبل الحفظ</div>
                <ul>
                  <li>تأكد من نظافة المداجن وتعقيمها</li>
                  <li>تجهيز السقايات والمعلف</li>
                  <li>ضبط الحرارة للدرجة المثالية (33°C)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="form-footer-actions">
            <button type="submit" className="btn-confirm-creation" disabled={submitting}>
              {submitting ? '⏳ جاري تأسيس الفوج...' : '🚀 تثبيت وبدء الفوج الآن'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .create-flock-container { 
          max-width: 900px; 
          margin: 0 auto; 
          padding: 20px 0 60px 0; 
        }
        
        .back-link { 
          display: inline-flex; 
          align-items: center; 
          gap: 10px; 
          color: #64748b; 
          text-decoration: none; 
          font-weight: 800; 
          font-size: 14px; 
          margin-bottom: 30px;
          transition: color 0.2s;
        }
        .back-link:hover { color: #166534; }

        .creation-card-wrapper {
          background: white;
          border-radius: 32px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.05);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .creation-header {
          background: #f8fafc;
          padding: 40px;
          display: flex;
          align-items: center;
          gap: 25px;
          border-bottom: 1px solid #e2e8f0;
        }
        .creation-header .icon {
          font-size: 50px;
          background: white;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }
        .creation-header h1 { font-size: 26px; font-weight: 950; color: #0f172a; margin-bottom: 8px; }
        .creation-header p { font-size: 14px; color: #64748b; line-height: 1.6; max-width: 500px; }

        .creation-form { padding: 40px; }
        
        .form-sections-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 40px; }
        
        .input-group { margin-bottom: 25px; }
        .input-group label { display: block; font-size: 14px; font-weight: 800; color: #334155; margin-bottom: 10px; }
        .input-group input, .input-group textarea {
          width: 100%;
          border: 2px solid #f1f5f9;
          border-radius: 16px;
          padding: 16px 20px;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          background: #fafbfc;
          transition: all 0.2s;
        }
        .input-group input:focus, .input-group textarea:focus {
          border-color: #166534;
          background: white;
          outline: none;
          box-shadow: 0 0 0 4px rgba(22, 101, 52, 0.1);
        }
        .input-hint { display: block; font-size: 11px; color: #94a3b8; font-weight: 700; margin-top: 8px; }

        .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .info-box { padding: 25px; border-radius: 24px; margin-bottom: 20px; }
        .info-box.tip { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
        .info-box.checklist { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
        
        .info-title { display: flex; align-items: center; gap: 8px; font-weight: 900; margin-bottom: 12px; font-size: 15px; }
        .info-box p { font-size: 13px; line-height: 1.6; font-weight: 700; }
        .info-box ul { padding-right: 20px; margin: 0; }
        .info-box li { font-size: 13px; font-weight: 700; margin-bottom: 8px; }

        .form-footer-actions { margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 30px; }
        .btn-confirm-creation {
          width: 100%;
          background: #166534;
          color: white;
          border: none;
          padding: 20px;
          border-radius: 18px;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 10px 15px -3px rgba(22, 101, 52, 0.4);
        }
        .btn-confirm-creation:hover { transform: translateY(-3px); filter: brightness(1.2); box-shadow: 0 20px 25px -5px rgba(22, 101, 52, 0.5); }
        .btn-confirm-creation:disabled { opacity: 0.5; cursor: not-allowed; }

        .error-alert { background: #fef2f2; color: #dc2626; padding: 16px; border-radius: 16px; font-size: 14px; font-weight: 800; border: 1px solid #fee2e2; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; }

        .success-overlay {
          position: fixed; inset: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center; z-index: 2000;
        }
        .success-card { text-align: center; }
        .success-icon { 
          width: 100px; height: 100px; background: #166534; color: white; font-size: 50px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 25px; box-shadow: 0 20px 25px -5px rgba(22, 101, 52, 0.4);
        }
        .success-card h2 { font-size: 28px; font-weight: 950; color: #0f172a; margin-bottom: 10px; }
        .success-card p { color: #64748b; font-weight: 700; }

        @media (max-width: 800px) {
          .form-sections-grid { grid-template-columns: 1fr; }
          .creation-header { flex-direction: column; text-align: center; }
          .row-inputs { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
