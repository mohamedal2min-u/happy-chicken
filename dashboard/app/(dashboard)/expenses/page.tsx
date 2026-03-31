'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [flocks, setFlocks] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    flock_id: '',
    category_id: '1',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchFlocks();
  }, []);

  const fetchExpenses = async () => {
    try {
      const resp = await api.get('/accounting/expenses');
      setExpenses(resp.data);
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
        setFormData(prev => ({...prev, flock_id: resp.data[0].id}));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/accounting/expenses', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowModal(false);
      setFormData({...formData, amount: '', description: ''});
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('خطأ في إضافة المصروف');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
         <div className="title-area">
             <h1>سجل المصاريف الجارية</h1>
             <p className="text-muted">متابعة كافة التكاليف التشغيلية لكل فوج بشكل دقيق.</p>
         </div>
         <button className="btn-primary" onClick={() => setShowModal(true)}>
           <span>+</span> إضافة مصروف تشغيلي
         </button>
      </div>

      <div className="data-table-wrapper shadow-lg">
        <table className="data-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>رقم الفوج</th>
              <th>التصنيف</th>
              <th style={{textAlign: 'right'}}>المبلغ الكامل</th>
              <th>البيان / التفصيل</th>
              <th style={{textAlign: 'center'}}>خيارات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '40px'}}>جاري جلب سجلات المحاسبة...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '40px'}} className="text-muted">لا يوجد مصاريف مسجلة حتى الآن.</td></tr>
            ) : (
             expenses.map((exp: any) => (
              <tr key={exp.id}>
                <td className="number-font">{exp.date}</td>
                <td className="number-font bold" style={{fontWeight: '700'}}>#{exp.flock?.batch_number || exp.flock_id}</td>
                <td><span className="badge badge-danger">{exp.category?.name || 'مصروف عام'}</span></td>
                <td className="number-font bold text-danger" style={{textAlign: 'right', fontWeight: '800'}}>
                   {(exp.amount || 0).toLocaleString('en-US')} ل.س
                </td>
                <td style={{fontSize: '14px'}}>{exp.description || '---'}</td>
                <td style={{textAlign: 'center'}}>
                    <button className="btn-secondary" style={{fontSize: '12px', padding: '6px 12px'}}>حذف 🗑️</button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Modal Add Expense */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{maxWidth: '550px'}}>
            <div className="modal-header">
               <h2>إضافة مصروف مالي</h2>
               <button className="btn-icon" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateExpense}>
              <div className="grid-form" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px'}}>
                  <div className="form-group">
                    <label>الفوج المستهدف</label>
                    <select 
                      className="form-input" 
                      value={formData.flock_id}
                      onChange={e => setFormData({...formData, flock_id: e.target.value})}
                      required
                    >
                      {flocks.map(f => (
                        <option key={f.id} value={f.id}>فوج: {f.batch_number}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>تاريخ الصرف</label>
                    <input 
                      type="date" 
                      className="form-input number-font" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
              </div>

              <div className="form-group">
                <label>مبلغ المصروف (ل.س)</label>
                <input 
                  type="number" 
                  className="form-input number-font" 
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => e.target.value.length < 15 && setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>البيان / تفصيل المصروف</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="مثال: فاتورة كهرباء، أدوية موسمية..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div style={{marginTop: '32px'}}>
                <button type="submit" className="btn-primary" style={{width: '100%', padding: '16px'}} disabled={submitting}>
                  {submitting ? 'جاري توثيق المصروف...' : 'تأكيد وحفظ العملية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .bold { font-weight: 700; }
        .text-danger { color: var(--danger); }
        .title-area h1 { font-size: 28px; margin-bottom: 4px; }
      `}</style>
    </div>
  );
}
