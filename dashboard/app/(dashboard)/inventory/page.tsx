'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { 
  HiOutlineCube, 
  HiOutlineTruck, 
  HiOutlineBeaker, 
  HiOutlineFire, 
  HiOutlineDocumentText,
  HiOutlineScale,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineFlag,
  HiOutlineBanknotes
} from "react-icons/hi2";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ feed: 0, medicine: 0, coal: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemForm, setItemForm] = useState({ name: '', type_name: 'علف', unit: 'bag' });
  const [shipForm, setShipForm] = useState({ quantity: '', price_per_unit: '', flock_id: '', invoice: null as any });
  const [submitting, setSubmitting] = useState(false);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [activeFlock, setActiveFlock] = useState<any>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const resp = await api.get('/inventory');
      setItems(resp.data.items || []);
      setSummary(resp.data.summary || { feed: 0, medicine: 0, coal: 0 });
      setTransactions(resp.data.recent_transactions || []);
      
      const flockResp = await api.get('/flocks');
      const allFlocks = flockResp.data || [];
      setFlocks(allFlocks);
      const active = allFlocks.find((f: any) => !f.is_closed);
      setActiveFlock(active);
      if (active) setShipForm(prev => ({...prev, flock_id: active.id}));
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
      alert(err.response?.data?.message || 'خطأ في تعريف المادة');
    } finally { setSubmitting(false); }
  };

  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return alert('يرجى اختيار المادة');
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('item_id', selectedItemId);
    formData.append('quantity', shipForm.quantity);
    formData.append('price_per_unit', shipForm.price_per_unit || '0');
    
    // Auto-link to active flock if exists
    const fId = activeFlock?.id || shipForm.flock_id;
    if (fId) formData.append('flock_id', fId);

    if (shipForm.invoice) {
        formData.append('invoice', shipForm.invoice);
    }

    try {
      const resp = await api.post('/inventory/shipment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowShipmentModal(false);
      setShipForm({ quantity: '', price_per_unit: '', flock_id: activeFlock?.id || '', invoice: null });
      fetchInventory();
    } catch (err: any) {
      console.error(err);
      alert('❌ فشل التحميل: ' + (err.response?.data?.message || 'خطأ في السيرفر'));
    } finally { setSubmitting(false); }
  };

  const formatWeight = (q: number, unit: string) => {
    if (unit === 'bag') {
      const kg = q * 50;
      return kg >= 1000 ? `${(kg / 1000).toFixed(2)} طن` : `${kg.toLocaleString('en-US')} كغ`;
    }
    return `${q.toLocaleString('en-US')} ${unit}`;
  };

  return (
    <div className="inventory-pro-dashboard animate-fade-in">
      <div className="pro-bg-pattern"></div>
      
      <div className="section-header-modern">
        <div className="title-stack">
          <h1>إدارة المستودع الذكي</h1>
          <p className="subtitle-pro">مراقبة المخزون، الحمولات الواردة، وسجلات التوريد للأنعام والتدفئة.</p>
        </div>
        <div className="action-btns-pro">
            <button className="btn-secondary-pro glass-btn" onClick={() => setShowItemModal(true)}>
              <HiOutlinePlus /> تعريف مادة جديدة
            </button>
            <button className="btn-primary-pro bounce-hover" onClick={() => setShowShipmentModal(true)}>
              <HiOutlineTruck /> تسجيل توريد شحنة
            </button>
        </div>
      </div>

      <div className="stats-container-modern">
        <div className="stat-card glass-morph orange-glow">
          <div className="icon-box"><HiOutlineCube /></div>
          <div className="content">
            <label>إجمالي العلف المتوفر</label>
            <div className="val number-font">{(summary.feed || 0).toLocaleString('en-US')} <span>كيس</span></div>
            <div className="sub-val">≈ {(summary.feed * 0.05).toFixed(1)} طن متوفّر</div>
          </div>
        </div>
        
        <div className="stat-card glass-morph blue-glow">
          <div className="icon-box"><HiOutlineBeaker /></div>
          <div className="content">
            <label>سجل الأدوية واللقاحات</label>
            <div className="val number-font">{summary.medicine || 0} <span>صنف</span></div>
            <div className="sub-val">مواد جاهزة للصرف اليومي</div>
          </div>
        </div>

        <div className="stat-card glass-morph slate-glow">
          <div className="icon-box"><HiOutlineFire /></div>
          <div className="content">
            <label>رصيد التدفئة (فحم)</label>
            <div className="val number-font">{(summary.coal || 0).toLocaleString('en-US')} <span>طن</span></div>
            <div className="sub-val">احتياطي كافٍ للدورة الحالية</div>
          </div>
        </div>

        <div className="stat-card glass-morph gold-glow">
          <div className="icon-box"><HiOutlineBanknotes /></div>
          <div className="content">
            <label>تكلفة التوريدات الأخيرة</label>
            <div className="val number-font">
               {(transactions.reduce((acc, tr) => acc + (tr.total_cost || 0), 0) / 1000000).toFixed(1)} <span>مليون ل.س</span>
            </div>
            <div className="sub-val">مرصد لآخر 15 شحنة</div>
          </div>
        </div>
      </div>

      <div className="inventory-grid-pro">
        {/* Real Stock Ledger */}
        <div className="table-section-modern glass-card">
           <div className="card-header-pro">
              <h3><HiOutlineScale /> جريدة الرصيد الفعلي للمواد</h3>
              <span className="count-badge">{items.length} مواد</span>
           </div>
           <div className="scrollable-table">
             <table className="inventory-table">
               <thead>
                 <tr>
                   <th>المادة</th>
                   <th>التصنيف</th>
                   <th>الرصيد الحالي</th>
                   <th style={{textAlign: 'center'}}>حالة التوفر</th>
                 </tr>
               </thead>
               <tbody>
                 {loading ? (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: '50px'}}>جاري مزامنة المخزن...</td></tr>
                 ) : items.length === 0 ? (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: '50px'}} className="text-muted">لا توجد مواد مسجلة.</td></tr>
                 ) : (
                    items.map(it => (
                      <tr key={it.id} className="hover-row">
                        <td>
                           <div className="item-name-cell">
                              <span className="dot" style={{background: it.current_quantity > 10 ? '#10b981' : '#f59e0b'}}></span>
                              <b>{it.name}</b>
                           </div>
                        </td>
                        <td><span className="type-pill">{it.type?.name}</span></td>
                        <td>
                           <div className="qty-stack number-font">
                              <span className="main-qty">{it.current_quantity.toLocaleString('en-US')}</span>
                              <span className="unit-label">{it.unit === 'bag' ? 'كيس' : it.unit}</span>
                           </div>
                           <div className="weight-hint">{formatWeight(it.current_quantity, it.unit)}</div>
                        </td>
                        <td style={{textAlign: 'center'}}>
                          <span className={`status-tag ${it.current_quantity > 10 ? 'secure' : 'critical'}`}>
                            {it.current_quantity > 10 ? 'متوفر بكثرة' : 'تحتاج توريد'}
                          </span>
                        </td>
                      </tr>
                    ))
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Dynamic Movement Log */}
        <div className="log-section-modern glass-card">
           <div className="card-header-pro">
              <h3><HiOutlineClock /> آخر حركات التوريد</h3>
           </div>
            <div className="movement-list">
                {transactions.length === 0 ? (
                  <div className="empty-log">لا يوجد عمليات توريد مؤخراً</div>
                ) : (
                  transactions.map(tr => (
                    <div key={tr.id} className="movement-item bounce-hover">
                       <div className="m-icon"><HiOutlineCalendarDays /></div>
                       <div className="m-info">
                          <div className="m-name">{tr.item?.name}</div>
                          <div className="m-details">
                             <span className="m-qty number-font">+{tr.quantity} {tr.item?.unit}</span>
                             <span className="m-sep">•</span>
                             <span className="m-date">{new Date(tr.created_at).toLocaleDateString('ar-SY')}</span>
                          </div>
                       </div>
                       <div className="m-financials">
                          <div className="m-cost number-font">
                             {tr.total_cost > 0 
                                ? (tr.total_cost).toLocaleString('en-US') + ' ل.س'
                                : 'بدون تكلفة'}
                          </div>
                          <span className={`m-status ${tr.payment_status === 'paid' ? 'paid' : 'debt'}`}>
                             {tr.payment_status === 'paid' ? 'مدفوع' : 'دين'}
                          </span>
                       </div>
                       {tr.invoice_path && (
                          <div className="invoice-link" title="عرض الفاتورة" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/storage/${tr.invoice_path}`, '_blank')}>
                             <HiOutlineDocumentText />
                          </div>
                       )}
                    </div>
                  ))
                )}
            </div>
        </div>
      </div>

      {/* Optimized Modals */}
      {showItemModal && (
        <div className="modal-overlay-modern no-print">
           <div className="modal-card-pro glass-modal animate-slide-up">
              <div className="modal-header-pro">
                 <div className="modal-icon blue"><HiOutlinePlus /></div>
                 <div className="title-stack">
                    <h3>تعريف مادة مخزنية</h3>
                    <p>إضافة صنف جديد لقاعدة بيانات المستودع</p>
                 </div>
                 <button className="close-btn-pro" onClick={() => setShowItemModal(false)}>×</button>
              </div>
              <form onSubmit={handleCreateItem} className="pro-form">
                 <div className="input-group-pro full">
                    <label>اسم المادة</label>
                    <input type="text" className="form-input-pro" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} required placeholder="مثلاً: علف دوجا 1" />
                 </div>
                 <div className="row-pro">
                    <div className="input-group-pro half">
                       <label>التصنيف</label>
                       <select className="form-input-pro" value={itemForm.type_name} onChange={e => setItemForm({...itemForm, type_name: e.target.value})}>
                          <option value="علف">علف</option>
                          <option value="دواء">دواء / لقاح</option>
                          <option value="فحم">فحم تدفئة</option>
                          <option value="أخرى">أخرى</option>
                       </select>
                    </div>
                    <div className="input-group-pro half">
                       <label>الوحدة</label>
                       <select className="form-input-pro" value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})}>
                          <option value="bag">كيس (50 كغ)</option>
                          <option value="ton">طن</option>
                          <option value="liter">لتر</option>
                          <option value="kg">كيلو</option>
                          <option value="unit">وحدة / جرعة</option>
                       </select>
                    </div>
                 </div>
                 <button type="submit" className="btn-submit-pro" disabled={submitting}>
                    {submitting ? 'جاري الحفظ...' : 'اعتماد وحفظ المادة'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showShipmentModal && (
        <div className="modal-overlay-modern no-print">
           <div className="modal-card-pro glass-modal animate-slide-up">
              <div className="modal-header-pro">
                 <div className="modal-icon blue"><HiOutlineTruck /></div>
                 <div className="title-stack">
                    <h3>تسجيل توريد شحنة</h3>
                    <p>إضافة كميات واردة لرصيد المادة الفعلي</p>
                 </div>
                 <button className="close-btn-pro" onClick={() => setShowShipmentModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddShipment} className="pro-form">
                 <div className="input-group-pro full">
                    <label>اختر المادة الواردة</label>
                    <select className="form-input-pro" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} required>
                       <option value="">-- اختر مادة من القائمة --</option>
                       {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>)}
                    </select>
                 </div>
                 <div className="row-pro">
                    <div className="input-group-pro half">
                       <label>الكمية المستلمة</label>
                       <input type="number" step="0.01" className="form-input-pro" value={shipForm.quantity} onChange={e => setShipForm({...shipForm, quantity: e.target.value})} required placeholder="0.00" />
                    </div>
                    <div className="input-group-pro half">
                       <label>سعر الوحدة (اختياري)</label>
                       <input type="number" className="form-input-pro" value={shipForm.price_per_unit} onChange={e => setShipForm({...shipForm, price_per_unit: e.target.value})} placeholder="السعر..." />
                    </div>
                 </div>
                 <div className="input-group-pro full">
                    <div className="auto-link-notice">
                       <HiOutlineFlag /> {activeFlock 
                          ? `سيتم تقييد فاتورة الشراء آلياً على الفوج الحالي: #${activeFlock.batch_number}`
                          : 'سيتم تسجيل العملية كقيد عام للمزرعة (لا يوجد فوج نشط حالياً)'}
                    </div>
                 </div>
                 <div className="input-group-pro full">
                    <label>تحميل صورة الفاتورة (اختياري)</label>
                    <input type="file" className="form-input-pro" onChange={e => setShipForm({...shipForm, invoice: e.target.files?.[0]})} />
                 </div>
                 <button type="submit" className="btn-submit-pro" disabled={submitting}>
                    {submitting ? 'جاري ترحيل الشحنة...' : 'تأكيد ودخول المخزن'}
                 </button>
              </form>
           </div>
        </div>
      )}

      <style jsx>{`
        .inventory-pro-dashboard { position: relative; padding: 30px; min-height: 100vh; background: #f8fafc; overflow: hidden; }
        .pro-bg-pattern { position: absolute; top: 0; left: 0; right: 0; height: 350px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); z-index: 0; clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%); opacity: 0.98; }
        
        .section-header-modern { position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; color: white; }
        .title-stack h1 { font-size: 32px; font-weight: 900; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .subtitle-pro { font-size: 15px; opacity: 0.8; font-weight: 500; }
        
        .action-btns-pro { display: flex; gap: 12px; }
        .btn-primary-pro { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; gap: 10px; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(59,130,246,0.3); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-secondary-pro { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; gap: 10px; cursor: pointer; backdrop-filter: blur(10px); }
        .bounce-hover:hover { transform: translateY(-3px); box-shadow: 0 20px 25px -5px rgba(59,130,246,0.4); }

        .stats-container-modern { position: relative; z-index: 10; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
        .stat-card { background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); padding: 30px; border-radius: 30px; display: flex; align-items: center; gap: 25px; transition: 0.3s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .icon-box { width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .orange-glow .icon-box { background: #fff7ed; color: #f97316; }
        .blue-glow .icon-box { background: #eff6ff; color: #3b82f6; }
        .slate-glow .icon-box { background: #f8fafc; color: #475569; }
        .gold-glow .icon-box { background: #fffbeb; color: #f59e0b; }
        .content label { font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 4px; display: block; }
        .val { font-size: 28px; font-weight: 950; color: #0f172a; }
        .val span { font-size: 14px; font-weight: 800; color: #94a3b8; margin-right: 4px; }
        .sub-val { font-size: 12px; font-weight: 700; color: #10b981; margin-top: 4px; }

        .inventory-grid-pro { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; position: relative; z-index: 10; }
        .glass-card { background: white; border-radius: 32px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .card-header-pro { padding: 25px 30px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fbfcfe; }
        .card-header-pro h3 { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 900; color: #1e293b; }
        .count-badge { background: #eff6ff; color: #3b82f6; padding: 4px 12px; border-radius: 10px; font-size: 12px; font-weight: 900; }

        .inventory-table { width: 100%; border-collapse: collapse; }
        .inventory-table th { background: #f8fafc; padding: 20px 30px; text-align: right; font-size: 12px; font-weight: 800; color: #64748b; border-bottom: 2px solid #f1f5f9; text-transform: uppercase; }
        .hover-row:hover { background: #fbfcfe; cursor: default; }
        .inventory-table td { padding: 20px 30px; border-bottom: 1px solid #f1f5f9; }
        .item-name-cell { display: flex; align-items: center; gap: 12px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .type-pill { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 10px; font-size: 11px; font-weight: 800; }
        .main-qty { font-size: 20px; font-weight: 950; color: #0f172a; }
        .unit-label { font-size: 11px; font-weight: 800; color: #94a3b8; margin-right: 4px; }
        .weight-hint { font-size: 11px; color: #64748b; font-weight: 600; }
        .status-tag { font-size: 11px; font-weight: 900; padding: 6px 14px; border-radius: 20px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
        .status-tag.secure { background: #d1fae5; color: #065f46; }
        .status-tag.critical { background: #fee2e2; color: #991b1b; animation: pulse 2s infinite; }

        .movement-list { padding: 15px; }
        .movement-item { display: flex; align-items: center; gap: 15px; padding: 18px; border-radius: 20px; transition: 0.2s; border: 1px solid transparent; }
        .movement-item:hover { background: #f8fafc; border-color: #f1f5f9; }
        .m-icon { width: 45px; height: 45px; background: #eff6ff; color: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .m-info { flex: 1; }
        .m-name { font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
        .m-details { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .m-qty { color: #10b981; font-weight: 900; }
        .m-date { color: #94a3b8; font-weight: 600; }
        .m-sep { color: #e2e8f0; }
        .m-financials { text-align: left; margin-inline-start: 15px; display: flex; flex-direction: column; align-items: flex-end; }
        .m-cost { font-size: 14px; font-weight: 900; color: #1e293b; margin-bottom: 4px; }
        .m-status { font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
        .m-status.paid { background: #dcfce7; color: #166534; }
        .m-status.debt { background: #fef2f2; color: #991b1b; }
        .invoice-link { width: 30px; height: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; }
        .invoice-link:hover { background: #eff6ff; color: #3b82f6; border-color: #3b82f6; }
        .empty-log { padding: 60px; text-align: center; color: #94a3b8; font-weight: 700; font-size: 14px; }

        /* Modal Styles */
        .modal-overlay-modern { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); width: 100%; max-width: 500px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
        .modal-header-pro { padding: 30px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 20px; position: relative; }
        .modal-icon { width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .modal-icon.blue { background: #eff6ff; color: #3b82f6; }
        .close-btn-pro { position: absolute; left: 30px; top: 30px; background: #f1f5f9; border: none; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .close-btn-pro:hover { background: #e2e8f0; transform: rotate(90deg); }
        .pro-form { padding: 30px; }
        .input-group-pro { margin-bottom: 24px; }
        .input-group-pro label { display: block; font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 8px; }
        .form-input-pro { width: 100%; padding: 14px 18px; border: 2px solid #f1f5f9; border-radius: 14px; font-size: 15px; font-weight: 600; outline: none; transition: 0.2s; background: white; }
        .form-input-pro:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
        .row-pro { display: flex; gap: 20px; }
        .half { flex: 1; }
        .btn-submit-pro { width: 100%; background: #0f172a; color: white; border: none; padding: 18px; border-radius: 16px; font-size: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; margin-top: 10px; }
        .btn-submit-pro:hover { background: #1e293b; transform: scale(1.02); }
        .btn-submit-pro:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .auto-link-notice { background: #eff6ff; color: #1e40af; padding: 16px; border-radius: 14px; display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 800; border: 1px solid #dbeafe; }
        .auto-link-notice :global(svg) { font-size: 20px; }

        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
