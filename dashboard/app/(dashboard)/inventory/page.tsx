'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { 
  HiOutlineCube, 
  HiOutlineTruck, 
  HiOutlineBeaker, 
  HiOutlineFire, 
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineScale,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineXMark
} from "react-icons/hi2";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ feed: 0, medicine: 0, coal: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', type_name: 'علف', unit: 'bag' });
  const [shipForm, setShipForm] = useState({ quantity: '', price_per_unit: '', invoice: null as any });

  useEffect(() => {
    setMounted(true);
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const resp = await api.get('/inventory');
      setItems(resp.data.items);
      setSummary(resp.data.summary);
      setTransactions(resp.data.recent_transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/inventory', itemForm);
      setShowItemModal(false);
      setItemForm({ name: '', type_name: 'علف', unit: 'bag' });
      fetchInventory();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطأ في التعريف - يرجى مراجعة قاعدة البيانات';
      alert(msg);
    } finally { setSubmitting(false); }
  };

  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return alert('يرجى اختيار المادة');
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('item_id', selectedItemId);
    formData.append('quantity', shipForm.quantity);
    formData.append('price_per_unit', shipForm.price_per_unit);
    if (shipForm.invoice) {
        formData.append('invoice', shipForm.invoice);
    }

    try {
      await api.post('/inventory/shipment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowShipmentModal(false);
      setShipForm({ quantity: '', price_per_unit: '', invoice: null });
      fetchInventory();
    } catch (err) {
      alert('خطأ في إضافة الشحنة');
    } finally { setSubmitting(false); }
  };

  const formatWeight = (q: number, unit: string) => {
    if (unit === 'bag') {
      const kg = q * 50;
      if (kg >= 1000) return `${(kg / 1000).toFixed(2)} طن (${kg.toLocaleString('en-US')} كغ)`;
      return `${kg.toLocaleString('en-US')} كغ`;
    }
    if (unit === 'ton') return `${q.toLocaleString('en-US')} طن`;
    return `${q.toLocaleString('en-US')} ${unit}`;
  };

  if (!mounted) return null;

  return (
    <div className="inventory-dashboard animate-fade-in">
      {/* Header & Actions */}
      <div className="section-header">
        <div className="title-area">
          <h1>إدارة المستودع الذكي</h1>
          <p>متابعة حركة الأنعام، الأدوية، والتدفئة مع الفوترة المالية.</p>
        </div>
        <div className="action-btns">
            <button className="btn-secondary pro" onClick={() => setShowItemModal(true)}>
              <HiOutlinePlus /> تعريف مادة جديدة
            </button>
            <button className="btn-primary pro" onClick={() => setShowShipmentModal(true)}>
              <HiOutlineTruck /> تسجيل حمولة (شحنة)
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="s-card orange">
          <div className="s-icon"><HiOutlineCube /></div>
          <div className="s-info">
            <label>إجمالي العلف</label>
            <div className="s-val number-font">{(summary.feed || 0).toLocaleString('en-US')} <small>كيس</small></div>
            <p>{((summary.feed || 0) * 50 / 1000).toFixed(1)} طن متاح</p>
          </div>
        </div>
        <div className="s-card blue">
          <div className="s-icon"><HiOutlineBeaker /></div>
          <div className="s-info">
            <label>أنواع الأدوية</label>
            <div className="s-val number-font">{summary.medicine || 0} <small>منتج</small></div>
            <p>جاهزة للاستخدام</p>
          </div>
        </div>
        <div className="s-card slate">
          <div className="s-icon"><HiOutlineFire /></div>
          <div className="s-info">
            <label>رصيد الفحم</label>
            <div className="s-val number-font">{(summary.coal || 0).toLocaleString('en-US')} <small>طن</small></div>
            <p>لتأمين التدفئة</p>
          </div>
        </div>
      </div>

      {/* Detailed Stock Table */}
      <div className="table-container shadow-premium">
        <div className="t-header">
          <h3><HiOutlineScale /> حالة المخزون الحالية</h3>
        </div>
        <table className="pro-table">
          <thead>
            <tr>
              <th>المادة</th>
              <th>التصنيف</th>
              <th>الرصيد</th>
              <th>الوزن / الحجم</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id}>
                <td><div className="item-cell"><b>{it.name}</b></div></td>
                <td><span className="cat-tag">{it.type?.name}</span></td>
                <td className="number-font">{it.current_quantity.toLocaleString('en-US')} {it.unit === 'bag' ? 'كيس' : it.unit}</td>
                <td className="number-font text-muted">{formatWeight(it.current_quantity, it.unit)}</td>
                <td>
                  <span className={`status-dot ${it.current_quantity > 10 ? 'ok' : 'low'}`}>
                    {it.current_quantity > 10 ? 'مستقر' : 'منخفض'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Movements Log */}
      <div className="table-container shadow-premium mt-4">
        <div className="t-header">
          <h3><HiOutlineClock /> سجل الحمولات والمخزون</h3>
        </div>
        <table className="pro-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>المادة</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>الإجمالي</th>
              <th>الحالة المالية</th>
              <th>الفاتورة</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tr => (
              <tr key={tr.id}>
                <td className="number-font text-muted">{new Date(tr.created_at).toLocaleDateString('en-GB')}</td>
                <td><b>{tr.item?.name}</b></td>
                <td className="number-font">{tr.quantity} {tr.item?.unit}</td>
                <td className="number-font">
                  {tr.price_per_unit > 0 ? tr.price_per_unit.toLocaleString('en-US') : <span className="debt-status">دين (بدون سعر)</span>}
                </td>
                <td className="number-font bold">{tr.total_cost?.toLocaleString('en-US') || '---'}</td>
                <td>
                  <span className={`pay-tag ${tr.payment_status}`}>
                    {tr.payment_status === 'paid' ? 'مدفوع' : 'ذمم (دين)'}
                  </span>
                </td>
                <td style={{textAlign: 'center'}}>
                  {tr.invoice_path ? (
                    <a href={`/storage/${tr.invoice_path}`} target="_blank" className="invoice-link">
                      <HiOutlineDocumentText />
                    </a>
                  ) : '---'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3><HiOutlinePlus /> تعريف مادة مخزنية</h3>
            <form onSubmit={handleCreateItem}>
              <div className="form-group">
                <label>اسم المادة (مثلاً: علف دوجا 1)</label>
                <input type="text" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} required placeholder="أدخل الاسم..." />
              </div>
              <div className="calc-row">
                <div className="group half">
                  <label>التصنيف</label>
                  <select value={itemForm.type_name} onChange={e => setItemForm({...itemForm, type_name: e.target.value})}>
                    <option value="علف">علف</option>
                    <option value="دواء">دواء / لقاح</option>
                    <option value="فحم">فحم تدفئة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div className="group half">
                  <label>الوحدة الأساسية</label>
                  <select value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})}>
                    <option value="bag">كيس (50 كغ)</option>
                    <option value="ton">طن</option>
                    <option value="liter">لتر</option>
                    <option value="kg">كيلو</option>
                    <option value="unit">وحدة / جرعة</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-confirm" disabled={submitting}>حفظ وإضافة للمخزن</button>
              <button type="button" className="btn-cancel" onClick={() => setShowItemModal(false)}>إلغاء</button>
            </form>
          </div>
        </div>
      )}

      {showShipmentModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3><HiOutlineTruck /> تسجيل حمولة (دخول مخزني)</h3>
            <form onSubmit={handleAddShipment}>
              <div className="form-group">
                <label>اختر المادة</label>
                <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} required>
                  <option value="">-- اختر من المواد المعرفة --</option>
                  {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>)}
                </select>
              </div>
              <div className="calc-row">
                  <div className="group half">
                    <label>الكمية المستلمة</label>
                    <input type="number" step="0.01" value={shipForm.quantity} onChange={e => setShipForm({...shipForm, quantity: e.target.value})} placeholder="مثلاً: 200" required />
                  </div>
                  <div className="group half">
                    <label>السعر للوحدة (يترك فارغاً إذا كان ديناً)</label>
                    <input type="number" value={shipForm.price_per_unit} onChange={e => setShipForm({...shipForm, price_per_unit: e.target.value})} placeholder="سعر الكيس أو الطن..." />
                  </div>
              </div>
              <div className="form-group">
                <label>إرفاق صورة الفاتورة (اختياري)</label>
                <div className="file-box">
                  <input type="file" onChange={e => setShipForm({...shipForm, invoice: e.target.files?.[0]})} />
                </div>
              </div>
              <button type="submit" className="btn-confirm" disabled={submitting}>تأكيد وحفظ الحمولة</button>
              <button type="button" className="btn-cancel" onClick={() => setShowShipmentModal(false)}>إلغاء</button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .inventory-dashboard { padding: 20px; color: #0f172a; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .title-area h1 { font-size: 28px; font-weight: 900; margin: 0; }
        .title-area p { color: #64748b; margin-top: 5px; }
        
        .action-btns { display: flex; gap: 15px; }
        .btn-primary.pro, .btn-secondary.pro { display: flex; align-items: center; gap: 8px; padding: 14px 24px; border-radius: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; }
        .btn-primary.pro { background: #0f172a; color: white; }
        .btn-secondary.pro { background: white; color: #0f172a; border: 1px solid #e2e8f0; }

        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .s-card { background: white; padding: 25px; border-radius: 24px; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
        .s-icon { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .orange .s-icon { background: #fff7ed; color: #f97316; }
        .blue .s-icon { background: #eff6ff; color: #3b82f6; }
        .slate .s-icon { background: #f8fafc; color: #475569; }
        .s-info label { font-size: 13px; color: #64748b; font-weight: 700; }
        .s-val { font-size: 24px; font-weight: 900; }
        .s-val small { font-size: 12px; color: #94a3b8; }
        .s-info p { margin: 0; font-size: 12px; color: #10b981; font-weight: 700; }

        .table-container { background: white; border-radius: 24px; overflow: hidden; padding-bottom: 10px; }
        .t-header { padding: 20px; border-bottom: 1px solid #f1f5f9; }
        .t-header h3 { font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px; margin: 0; }
        
        .pro-table { width: 100%; border-collapse: collapse; }
        .pro-table th { background: #f8fafc; padding: 15px 20px; text-align: right; font-size: 13px; color: #64748b; }
        .pro-table td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; font-size: 15px; }
        
        .cat-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #475569; }
        .status-dot { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; }
        .status-dot::before { content: ''; width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.ok { color: #10b981; }
        .status-dot.ok::before { background: #10b981; }
        .status-dot.low { color: #f43f5e; }
        .status-dot.low::before { background: #f43f5e; }

        .pay-tag { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 900; }
        .pay-tag.paid { background: #d1fae5; color: #065f46; }
        .pay-tag.debt { background: #fee2e2; color: #991b1b; }
        .debt-status { color: #ef4444; font-weight: 800; font-size: 12px; }
        .invoice-link { font-size: 20px; color: #3b82f6; cursor: pointer; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-card { background: white; width: 100%; max-width: 500px; padding: 40px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .modal-card h3 { font-size: 22px; font-weight: 900; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }
        
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .form-group input, .form-group select { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: inherit; font-size: 15px; }
        .calc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .group label { font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 6px; display: block; }
        .group select, .group input { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 15px; }
        
        .file-box { border: 2px dashed #e2e8f0; padding: 20px; border-radius: 16px; text-align: center; }
        .btn-confirm { width: 100%; padding: 16px; border-radius: 16px; border: none; background: #0f172a; color: white; font-weight: 800; font-size: 16px; cursor: pointer; margin-top: 10px; }
        .btn-cancel { width: 100%; padding: 14px; border-radius: 16px; border: none; background: transparent; color: #64748b; font-weight: 700; cursor: pointer; margin-top: 10px; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
