'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    share_percentage: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const resp = await api.get('/partners');
      setPartners(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const resp = await api.post('/partners', {
        ...formData,
        share_percentage: parseFloat(formData.share_percentage)
      });
      setShowModal(false);
      const login = resp.data.login_details;
      alert(`✅ تم إنشاء الشريك بنجاح.\nاسم الدخول: ${login.username}\nكلمة السر: ${login.password}\nيمكن للشريك الآن تسجيل الدخول للمشاهدة فقط.`);
      setFormData({ name: '', phone: '', password: '', share_percentage: '' });
      fetchPartners();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ في إضافة الشريك. تأكد من أن رقم الواتساب فريد وغير مكرر.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
         <h1>إدارة الشركاء والمستحقات</h1>
         <button className="btn-primary" onClick={() => setShowModal(true)}>
           <span>+</span> إضافة شريك جديد
         </button>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>اسم الشريك</th>
              <th>رقم الواتساب</th>
              <th>النسبة (%)</th>
              <th>الرصيد الحالي</th>
              <th style={{textAlign: 'center'}}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px'}}>جاري تحميل قائمة الشركاء...</td></tr>
            ) : partners.length === 0 ? (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px'}} className="text-muted">لا يوجد شركاء مسجلين حالياً. اضغط "إضافة شريك" للبدء.</td></tr>
            ) : (
             partners.map((p: any) => (
              <tr key={p.id}>
                <td style={{fontWeight: '700'}}>{p.name}</td>
                <td className="number-font">{p.phone || '---'}</td>
                <td className="number-font">{p.share_percentage || 0}%</td>
                <td className="number-font text-success bold" style={{fontWeight: '800'}}>
                   {(p.current_balance || 0).toLocaleString('en-US')} ل.س
                </td>
                <td style={{textAlign: 'center'}}>
                    <button className="btn-secondary" style={{fontSize: '12px', padding: '6px 12px'}}>تفاصيل الحساب 📁</button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Modal Add Partner */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
               <h2>إضافة شريك جديد</h2>
               <button className="btn-icon" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreatePartner}>
              <div className="form-group">
                <label>اسم الشريك بالكامل</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="مثال: الحاج محمود أبو أحمد"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>رقم الواتساب (سيكون اسم المستخدم)</label>
                <input 
                  type="text" 
                  className="form-input number-font" 
                  placeholder="09xxxxxxxx"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>

              <div className="grid-form" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px'}}>
                  <div className="form-group">
                    <label>حصة الشراكة (%)</label>
                    <input type="number" step="0.01" className="form-input number-font" value={formData.share_percentage} onChange={e => setFormData({...formData, share_percentage: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>كلمة مرور الحساب</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="******"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
              </div>
              <p style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '-15px', marginBottom: '20px'}}>
                  💡 ملاحظة: سيتم إنشاء حساب "مشاهد" بهذا الرقم وكلمة المرور تلقائياً.
              </p>

              <div style={{marginTop: '32px'}}>
                <button type="submit" className="btn-primary" style={{width: '100%', padding: '16px'}} disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : 'تأكيد إضافة الشريك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .bold { font-weight: 700; }
        .text-success { color: var(--success); }
      `}</style>
    </div>
  );
}
