'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [flocks, setFlocks] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<any>({
    flock_id: '',
    customer_name: '',
    total_amount: '',
    count: '',
    total_weight: '',
    unit_price: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchFlocks();
  }, []);

  const fetchSales = async () => {
    try {
      const resp = await api.get('/accounting/sales');
      setSales(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlocks = async () => {
    try {
      const resp = await api.get('/flocks');
      setFlocks(resp.data);
      if (resp.data.length > 0) {
        setFormData((prev: any) => ({...prev, flock_id: resp.data[0].id}));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // استخدام FormData لدعم رفع الملفات
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (invoiceFile) {
        data.append('invoice_image', invoiceFile);
    }

    try {
      await api.post('/accounting/sales', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      setFormData({...formData, customer_name: '', total_amount: '', count: '', total_weight: '', unit_price: ''});
      setInvoiceFile(null);
      fetchSales();
    } catch (err) {
      console.error(err);
      alert('خطأ في إرسال المبيعات. تأكد من إكمال الحقول.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
         <div className="title-area">
             <h1>سجل المبيعات والتسويق</h1>
             <p className="text-muted">متابعة دقيقة لكل عملية خروج طيور تجارية من المزرعة.</p>
         </div>
         <button className="btn-primary" onClick={() => setShowModal(true)}>
           <span>+</span> تسجيل عملية مبيع (إخراج)
         </button>
      </div>

      <div className="data-table-wrapper shadow-lg">
        <table className="data-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>العميل / التاجر</th>
              <th>رقم الفوج</th>
              <th style={{textAlign: 'right'}}>إجمالي المبلغ</th>
              <th>الحالة</th>
              <th style={{textAlign: 'center'}}>إرسالية بيع</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '40px'}}>جاري جلب بيانات المبيعات...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '40px'}} className="text-muted">لا يوجد مبيعات مسجلة حتى الآن.</td></tr>
            ) : (
             sales.map((s: any) => (
              <tr key={s.id}>
                <td className="number-font">{s.date}</td>
                <td style={{fontWeight: '700'}}>{s.customer_name}</td>
                <td className="number-font bold" style={{fontWeight: '700'}}>#{s.flock?.batch_number || s.flock_id}</td>
                <td className="number-font bold text-success" style={{textAlign: 'right', fontWeight: '800'}}>
                   {(s.total_amount || 0).toLocaleString('en-US')} ل.س
                </td>
                <td>
                    <span className={`badge ${s.status === 'paid' ? 'badge-success' : 'badge-danger'}`} style={{fontSize: '11px'}}>
                        {s.status === 'paid' ? 'تم تحصيلها' : 'دين / آجل'}
                    </span>
                </td>
                <td style={{textAlign: 'center'}}>
                    <button className="btn-secondary" style={{fontSize: '12px', padding: '6px 12px'}}>تحميل الفاتورة 📄</button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Modal Add Sale */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
               <h2>تسجيل مبيعات الفوج</h2>
               <button className="btn-icon" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateSale}>
              <div className="grid-form" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px'}}>
                  <div className="form-group">
                    <label>الفوج المصدر</label>
                    <select className="form-input" value={formData.flock_id} onChange={e => setFormData({...formData, flock_id: e.target.value})} required>
                      {flocks.map(f => (
                        <option key={f.id} value={f.id}>فوج: {f.batch_number}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>تاريخ المبيع</label>
                    <input type="date" className="form-input number-font" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  </div>
              </div>

              <div className="form-group">
                <label>العميل / التاجر</label>
                <input type="text" className="form-input" placeholder="اسم التاجر..." value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} required />
              </div>

              <div className="grid-form" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px'}}>
                  <div className="form-group">
                    <label>عدد الطيور</label>
                    <input type="number" className="form-input number-font" placeholder="1000" value={formData.count} onChange={e => setFormData({...formData, count: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>إجمالي الوزن (كغ)</label>
                    <input type="number" step="0.1" className="form-input number-font" placeholder="2500.5" value={formData.total_weight} onChange={e => setFormData({...formData, total_weight: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>سعر الكيلو (اختياري)</label>
                    <input type="number" className="form-input number-font" placeholder="0.00" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} />
                  </div>
              </div>

              <div className="form-group">
                 <label>أدخل إجمالي المبلغ (ل.س) - <small style={{color: 'var(--text-muted)'}}>يمكن تركه 0 إذا لم يُحدد السعر بعد</small></label>
                 <input type="number" className="form-input number-font" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} placeholder="0.00" />
              </div>

              <div className="form-group">
                <label>رفع صورة الإيصال / الفاتورة (الكاميرا أو ملف)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="form-input"
                  style={{padding: '8px'}}
                  onChange={(e) => e.target.files && setInvoiceFile(e.target.files[0])}
                />
              </div>

              <div style={{marginTop: '32px'}}>
                <button type="submit" className="btn-primary" style={{width: '100%', padding: '16px'}} disabled={submitting}>
                  {submitting ? 'جاري توثيق المبيع...' : 'حفظ عملية المبيع وتحديث السجلات'}
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
