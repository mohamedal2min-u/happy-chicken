'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { 
  HiOutlineUserGroup, 
  HiOutlineCurrencyDollar, 
  HiOutlineArrowTrendingUp, 
  HiOutlineBanknotes,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineUserPlus
} from "react-icons/hi2";

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransModal, setShowTransModal] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    phone: '',
    password: 'partner123',
    share_percentage: '10',
    initial_capital: '0'
  });

  const [transForm, setTransForm] = useState({
    amount: '',
    type: 'capital_entry',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [selectedPartnerForLedger, setSelectedPartnerForLedger] = useState<any>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const fetchLedger = async (partner: any) => {
    setSelectedPartnerForLedger(partner);
    setShowLedgerModal(true);
    setLoadingLedger(true);
    try {
      const resp = await api.get(`/partners/${partner.id}/transactions`);
      setLedgerTransactions(resp.data);
    } catch (err) {
      alert('خطأ في تحميل كشف الحساب');
    } finally { setLoadingLedger(false); }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const resp = await api.get('/partners');
      const data = resp.data.map((p: any) => ({
        ...p,
        share_percentage: parseFloat(p.share_percentage) || 0,
        current_balance: parseFloat(p.current_balance) || 0
      }));
      setPartners(data);
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
      await api.post('/partners', partnerForm);
      setShowModal(false);
      setPartnerForm({ name: '', phone: '', password: 'partner123', share_percentage: '10', initial_capital: '0' });
      fetchPartners();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ في الإضافة');
    } finally { setSubmitting(false); }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // منع السحب اليدوي إذا كان الرصيد غير كافٍ
    if (transForm.type === 'withdrawal') {
       const partner = partners.find(p => p.id === selectedPartnerId);
       const balance = partner?.current_balance || 0;
       if (parseFloat(transForm.amount) > balance) {
          alert(`عذراً، الرصيد المتاح (${balance} ل.س) غير كافٍ للسحب اليدوي. الرصيد السالب مسموح فقط في حالات الخسارة الآلية.`);
          return;
       }
    }

    setSubmitting(true);
    try {
      await api.post('/partners/transaction', {
        ...transForm,
        partner_id: selectedPartnerId
      });
      setShowTransModal(false);
      setTransForm({ amount: '', type: 'capital_entry', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchPartners();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ في معالجة العملية');
    } finally { setSubmitting(false); }
  };

  const totalCapital = partners.reduce((sum, p) => sum + (p.current_balance || 0), 0);
  const totalShares = partners.reduce((sum, p) => sum + p.share_percentage, 0);

  return (
    <div className="partners-pro-dashboard animate-fade-in no-print-global">
      <div className="pro-bg-pattern no-print"></div>

      <div className="section-header-modern no-print">
         <div className="header-meta">
             <div className="hero-icon"><HiOutlineUserGroup /></div>
             <div className="title-area">
                 <h1>سجل الشركاء والمساهمين</h1>
                 <p className="subtitle">إدارة الحصص الاستثمارية والتدفقات المالية لمدجنة كنصفرة</p>
             </div>
         </div>
         <div className="action-btns-modern">
            <button className="btn-secondary-modern" onClick={() => window.print()}>
              <HiOutlineClock /> طباعة كشف عام
            </button>
            <button className="btn-primary-modern" onClick={() => setShowModal(true)}>
              <HiOutlineUserPlus /> إضافة مساهم جديد
            </button>
         </div>
      </div>

      <div className="stats-container-modern no-print">
          <div className="stat-card-pro glass-pro">
             <div className="card-top">
                <div className="icon-box emerald"><HiOutlineBanknotes /></div>
                <span className="trend-label">رأس المال</span>
             </div>
             <div className="card-main">
                <div className="val-modern number-font">{totalCapital.toLocaleString('en-US')}</div>
                <label>ليرة سورية</label>
             </div>
             <div className="card-footer">إجمالي المساهمات الفعلية</div>
          </div>

          <div className="stat-card-pro glass-pro">
             <div className="card-top">
                <div className="icon-box blue"><HiOutlineUserPlus /></div>
                <span className="trend-label">النشطين</span>
             </div>
             <div className="card-main">
                <div className="val-modern number-font">{partners.length}</div>
                <label>مساهم</label>
             </div>
             <div className="card-footer">شركاء مسجلين حالياً</div>
          </div>

          <div className="stat-card-pro glass-pro">
             <div className="card-top">
                <div className="icon-box orange"><HiOutlineArrowTrendingUp /></div>
                <span className="trend-label">النمو</span>
             </div>
             <div className="card-main">
                <div className="val-modern number-font">%{totalShares.toFixed(1)}</div>
                <label>من الإجمالي</label>
             </div>
             <div className="card-footer">إجمالي الحصص الموزعة</div>
          </div>
      </div>

      <div className="table-section-modern shadow-pro-luxe">
        <div className="table-header-pro no-print">
           <div className="table-title">القائمة التفصيلية للشركاء</div>
           <div className="search-box-pro">
              <input type="text" placeholder="بحث باسم الشريك..." className="search-input-pro" />
           </div>
        </div>
        
        <div className="print-only-header">
           <div className="company-logo-print">Kansafra Poultry</div>
           <h2>بيان الحصص والذمم المالية للشركاء</h2>
           <p className="print-date">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SY')} | الساعة: {new Date().toLocaleTimeString('ar-SY')}</p>
        </div>

        <div className="table-responsive">
          <table className="pro-table-v2">
            <thead>
              <tr>
                <th>المساهم</th>
                <th>التواصل</th>
                <th style={{textAlign: 'center'}}>الحصة</th>
                <th style={{textAlign: 'right'}}>رصيد المساهمة</th>
                <th style={{textAlign: 'center'}} className="no-print">الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="empty-state">جاري تحميل سجلات المساهمين...</td></tr>
              ) : partners.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">لا يوجد أي شركاء مسجلين في النظام حالياً.</td></tr>
              ) : (
                partners.map((p: any) => (
                  <tr key={p.id}>
                    <td className="user-cell">
                      <div className="avatar-pro" style={{background: `linear-gradient(135deg, #0f172a, #334155)`}}>
                        {p.name.charAt(0)}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{p.name}</span>
                        <span className="user-status active">نشط</span>
                      </div>
                    </td>
                    <td className="number-font contact-cell">{p.phone}</td>
                    <td style={{textAlign: 'center'}}>
                      <div className="share-pill active">%{p.share_percentage}</div>
                    </td>
                    <td className="amount-cell number-font" style={{textAlign: 'right'}}>
                      <span className={`val ${p.current_balance < 0 ? 'negative-balance' : ''}`}>
                        {p.current_balance < 0 ? '-' : ''}
                        {Math.abs(p.current_balance || 0).toLocaleString('en-US')}
                      </span>
                      <small>ل.س</small>
                    </td>
                    <td style={{textAlign: 'center'}} className="no-print">
                      <div className="action-row-pro">
                        <button className="action-btn-pro gold" onClick={() => { setSelectedPartnerId(p.id); setShowTransModal(true); }} title="إضافة مساهمة مالية">
                          <HiOutlinePlus /> <span>تسجيل</span>
                        </button>
                        <button className="action-btn-pro outline" onClick={() => fetchLedger(p)} title="عرض كشف تفصيلي">
                          <HiOutlineClock /> <span>كشف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Partner */}
      {showModal && (
        <div className="modal-overlay-modern no-print">
          <div className="modal-card-pro glass-modal animate-slide-up">
             <div className="modal-header-pro">
                <div className="modal-icon"><HiOutlineUserPlus /></div>
                <h3>تسجيل مساهم جديد</h3>
                <button className="close-btn-pro" onClick={() => setShowModal(false)}>×</button>
             </div>
             <form onSubmit={handleCreatePartner} className="pro-form">
                <div className="form-grid">
                  <div className="input-group-pro full">
                     <label>الاسم الكامل</label>
                     <input type="text" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} required placeholder="أدخل اسم الشريك الثلاثي" />
                  </div>
                  <div className="input-group-pro">
                     <label>رقم الهاتف</label>
                     <input type="text" className="number-font" value={partnerForm.phone} onChange={e => setPartnerForm({...partnerForm, phone: e.target.value})} required placeholder="05xxxxxxxx" />
                  </div>
                  <div className="input-group-pro">
                     <label>كلمة المرور</label>
                     <input type="password" value={partnerForm.password} onChange={e => setPartnerForm({...partnerForm, password: e.target.value})} required />
                  </div>
                  <div className="input-group-pro">
                     <label>نسبة الشراكة (%)</label>
                     <input type="number" step="0.01" max="100" className="number-font" value={partnerForm.share_percentage} onChange={e => setPartnerForm({...partnerForm, share_percentage: e.target.value})} required />
                     <p className="hint-text">مجموع النسب لكافة الشركاء لا يتجاوز %100.</p>
                  </div>
                  <div className="input-group-pro">
                     <label>رأس مال تأسيسي</label>
                     <input type="number" className="number-font" value={partnerForm.initial_capital} onChange={e => setPartnerForm({...partnerForm, initial_capital: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn-submit-pro" disabled={submitting}>
                    {submitting ? 'جاري المعالجة...' : 'اعتماد المساهم في النظام'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Add Transaction */}
      {showTransModal && (
        <div className="modal-overlay-modern no-print">
          <div className="modal-card-pro glass-modal animate-slide-up" style={{maxWidth: '480px'}}>
             <div className="modal-header-pro">
                <div className="modal-icon gold"><HiOutlineCurrencyDollar /></div>
                <h3>تسجيل عملية مالية للمساهم</h3>
                <button className="close-btn-pro" onClick={() => setShowTransModal(false)}>×</button>
             </div>
             <form onSubmit={handleAddTransaction} className="pro-form">
                <div className="input-group-pro full">
                   <label>نوع العملية</label>
                   <div className="pro-radio-group">
                      <label className={`pro-radio-label ${transForm.type === 'capital_entry' ? 'active slate' : ''}`}>
                         <input type="radio" value="capital_entry" checked={transForm.type === 'capital_entry'} onChange={e => setTransForm({...transForm, type: e.target.value})} />
                         مساهمة (+)
                      </label>
                      <label className={`pro-radio-label ${transForm.type === 'withdrawal' ? 'active red' : ''}`}>
                         <input type="radio" value="withdrawal" checked={transForm.type === 'withdrawal'} onChange={e => setTransForm({...transForm, type: e.target.value})} />
                         سحب نقدي (-)
                      </label>
                   </div>
                   <p className="hint-text">ملاحظة: السحوبات اليدوية مسموحة فقط في حدود الرصيد المتوفر.</p>
                </div>
                <div className="input-group-pro full">
                   <label>المبلغ المالي</label>
                   <input type="number" className="number-font big-input" value={transForm.amount} onChange={e => setTransForm({...transForm, amount: e.target.value})} required placeholder="0.00" />
                </div>
                <div className="input-group-pro full">
                   <label>تاريخ القيد</label>
                   <input type="date" value={transForm.date} onChange={e => setTransForm({...transForm, date: e.target.value})} required />
                </div>
                <div className="input-group-pro full">
                   <label>ملاحظات وسند القيد</label>
                   <textarea rows={2} value={transForm.notes} onChange={e => setTransForm({...transForm, notes: e.target.value})} placeholder="أدخل تفاصيل العملية..." />
                </div>
                <button type="submit" className="btn-submit-pro pro-slate-btn" disabled={submitting}>
                    {submitting ? 'جاري الترحيل...' : 'تأكيد وحفظ العملية'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Ledger View (Khashf) */}
      {showLedgerModal && (
        <div className="modal-overlay-modern ledger-modal-overlay">
          <div className="modal-card-pro glass-modal animate-slide-up ledger-modal">
             <div className="modal-header-pro no-print">
                <div className="modal-icon blue"><HiOutlineClock /></div>
                <div className="title-stack">
                   <h3>كشف الحركات المالية</h3>
                   <span className="partner-name-badge">{selectedPartnerForLedger?.name}</span>
                </div>
                <div style={{marginRight: 'auto', display: 'flex', gap: '8px'}}>
                  <button className="print-btn-pro" onClick={() => window.print()}>
                    <HiOutlineClock /> طباعة الكشف
                  </button>
                  <button className="close-btn-pro" onClick={() => setShowLedgerModal(false)}>×</button>
                </div>
             </div>

             <div className="ledger-content-printable">
                <div className="print-header-ledger">
                   <div className="brand-print">Kansafra Poultry Systems</div>
                   <h2>كشف حساب تفصيلي - مساهم</h2>
                   <div className="partner-meta-print">
                      <p>اسم الشريك: <strong>{selectedPartnerForLedger?.name}</strong></p>
                      <p>رقم التواصل: <span className="number-font">{selectedPartnerForLedger?.phone}</span></p>
                      <p>نسبة الحصة: <span className="number-font">%{selectedPartnerForLedger?.share_percentage}</span></p>
                      <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SY')}</p>
                   </div>
                </div>

                <div className="ledger-table-container">
                   {loadingLedger ? (
                      <div className="loading-ledger">جاري تجميع البيانات...</div>
                   ) : ledgerTransactions.length === 0 ? (
                      <div className="empty-ledger">لا توجد حركات مالية مسجلة لهذا الشريك.</div>
                   ) : (
                      <table className="ledger-table">
                         <thead>
                            <tr>
                               <th>التاريخ</th>
                               <th>نوع العملية</th>
                               <th>البيان / ملاحظات</th>
                               <th style={{textAlign: 'left'}}>المبلغ</th>
                            </tr>
                         </thead>
                         <tbody>
                            {ledgerTransactions.map((t, idx) => (
                               <tr key={idx}>
                                  <td className="number-font">{t.date}</td>
                                  <td>
                                     <span className={`type-tag ${t.type}`}>
                                        {t.type === 'capital_entry' && 'إيداع رأس مال (+)'}
                                        {t.type === 'withdrawal' && 'سحب نقدي (-)'}
                                        {t.type === 'profit_distribution' && (t.amount >= 0 ? 'توزيع رابح (+)' : 'توزيع خسارة (-)')}
                                     </span>
                                  </td>
                                  <td className="notes-col">{t.notes}</td>
                                  <td className={`amount-col number-font ${t.type === 'withdrawal' || (t.type === 'profit_distribution' && t.amount < 0) ? 'red-text' : 'green-text'}`}>
                                     {t.amount.toLocaleString('en-US')}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                         <tfoot>
                            <tr>
                               <td colSpan={3}>الرصيد النهائي الحالي:</td>
                               <td className={`final-balance number-font ${selectedPartnerForLedger?.current_balance < 0 ? 'red-text' : 'green-text'}`}>
                                  {selectedPartnerForLedger?.current_balance?.toLocaleString('en-US')} ل.س
                               </td>
                            </tr>
                         </tfoot>
                      </table>
                   )}
                </div>
                
                <div className="print-footer-ledger">
                   <p>يتم إصدار هذا الكشف آلياً - نظام إدارة مدجنة كنصفرة</p>
                   <div className="signature-area">
                      <span>توقيع المحاسب: .....................</span>
                      <span>ختم الإدارة: .....................</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .partners-pro-dashboard { 
          position: relative;
          padding: 24px;
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
          color: #0f172a;
          background: #f8fafc;
        }

        .negative-balance { color: #ef4444 !important; font-weight: 900 !important; }
        .pro-radio-group { display: flex; gap: 12px; margin-bottom: 8px; }
        .pro-radio-label { flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 14px; text-align: center; cursor: pointer; transition: 0.2s; font-size: 13px; font-weight: 800; color: #64748b; }
        .pro-radio-label input { display: none; }
        .pro-radio-label.active.slate { background: #0f172a; color: white; border-color: #0f172a; }
        .pro-radio-label.active.red { background: #ef4444; color: white; border-color: #ef4444; }
        .pro-radio-label:hover { background: #f8fafc; }
        .pro-slate-btn { background: #1e293b !important; }
        .pro-slate-btn:hover { background: #0f172a !important; }

        .pro-bg-pattern {
          position: absolute;
          top: 0; left: 0; right: 0; height: 300px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          z-index: 0;
          opacity: 0.95;
          clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
        }

        .section-header-modern {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          color: white;
        }

        .header-meta { display: flex; align-items: center; gap: 20px; }
        .hero-icon { width: 56px; height: 56px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; border: 1px solid rgba(255,255,255,0.2); }
        .title-area h1 { font-size: 30px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .subtitle { font-size: 14px; opacity: 0.8; margin-top: 4px; }

        .action-btns-modern { display: flex; gap: 12px; }
        .btn-primary-modern { background: white; color: #0f172a; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .btn-primary-modern:hover { transform: translateY(-3px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); background: #f1f5f9; }
        
        .btn-secondary-modern { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; backdrop-filter: blur(8px); transition: 0.3s; }
        .btn-secondary-modern:hover { background: rgba(255,255,255,0.2); }
        .gold-stroke { border-color: #fbbf24 !important; color: #fbbf24 !important; }

        .stats-container-modern {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card-pro { 
          padding: 24px; 
          border-radius: 28px; 
          background: white; 
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
          transition: 0.3s;
        }
        .stat-card-pro:hover { transform: scale(1.02); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1); }

        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .icon-box.emerald { background: #ecfdf5; color: #10b981; }
        .icon-box.blue { background: #eff6ff; color: #3b82f6; }
        .icon-box.orange { background: #fff7ed; color: #fdba74; }
        .trend-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }

        .card-main { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
        .val-modern { font-size: 32px; font-weight: 950; color: #0f172a; letter-spacing: -1px; }
        .card-main label { font-size: 13px; font-weight: 700; color: #94a3b8; }
        .card-footer { font-size: 12px; color: #64748b; font-weight: 600; }

        .table-section-modern {
          position: relative;
          z-index: 10;
          background: white;
          border-radius: 32px;
          padding: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .table-header-pro { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        .table-title { font-size: 18px; font-weight: 800; color: #0f172a; }
        .search-input-pro { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 14px; width: 280px; font-size: 14px; outline: none; transition: 0.3s; }
        .search-input-pro:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }

        .table-responsive { overflow-x: auto; }
        .pro-table-v2 { width: 100%; border-collapse: separate; border-spacing: 0; }
        .pro-table-v2 th { padding: 20px 32px; background: #fcfdfe; text-align: right; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #f1f5f9; }
        .pro-table-v2 td { padding: 20px 32px; vertical-align: middle; border-bottom: 1px solid #f8fafc; transition: 0.2s; }
        .pro-table-v2 tr:hover td { background: #fbfcfe; }

        .user-cell { display: flex; align-items: center; gap: 16px; }
        .avatar-pro { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; }
        .user-info { display: flex; flex-direction: column; }
        .user-name { font-size: 15px; font-weight: 800; color: #1e293b; }
        .user-status { font-size: 11px; font-weight: 700; margin-top: 2px; display: inline-flex; align-items: center; gap: 4px; }
        .user-status.active { color: #10b981; }
        .user-status.active::before { content: ''; width: 6px; height: 6px; background: #10b981; border-radius: 50%; }

        .share-pill { display: inline-block; padding: 6px 14px; border-radius: 10px; font-weight: 800; font-size: 13px; }
        .share-pill.active { background: #f0fdf4; color: #10b981; border: 1px solid #d1fae5; }
        
        .amount-cell .val { font-size: 17px; font-weight: 950; color: #0f172a; margin-left: 6px; }

        /* Ledger & Print Styles */
        .ledger-modal { max-width: 900px !important; padding: 0 !important; overflow: hidden; }
        .title-stack { display: flex; flex-direction: column; }
        .partner-name-badge { font-size: 13px; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: 2px 10px; border-radius: 8px; margin-top: 4px; border: 1px solid #dbeafe; width: fit-content; }
        
        .print-btn-pro { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 800; font-size: 12px; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(59,130,246,0.3); }
        .print-btn-pro:hover { background: #2563eb; transform: translateY(-1px); }

        .ledger-content-printable { padding: 40px; background: white; }
        .print-header-ledger { display: none; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
        .brand-print { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
        .partner-meta-print { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 20px; font-size: 14px; }

        .ledger-table-container { margin-top: 20px; }
        .ledger-table { width: 100%; border-collapse: collapse; }
        .ledger-table th { background: #f8fafc; padding: 15px; text-align: right; font-size: 12px; font-weight: 800; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; }
        .ledger-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .type-tag { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 900; }
        .type-tag.capital_entry { background: #f0fdf4; color: #10b981; }
        .type-tag.withdrawal { background: #fef2f2; color: #ef4444; }
        .type-tag.profit_distribution { background: #f0f9ff; color: #0369a1; }
        
        .notes-col { font-size: 13px; color: #64748b; font-weight: 500; }
        .amount-col { font-weight: 950; font-size: 15px; text-align: left; }
        .green-text { color: #10b981; }
        .red-text { color: #ef4444; }

        .final-balance { font-size: 20px !important; font-weight: 950; text-align: left !important; }
        .ledger-table tfoot td { padding: 30px 15px; font-weight: 900; font-size: 16px; border-top: 2px solid #0f172a; }

        .print-footer-ledger { display: none; margin-top: 60px; font-size: 12px; color: #94a3b8; }
        .signature-area { display: flex; justify-content: space-between; margin-top: 40px; color: #1e293b; font-weight: 700; }

        @media print {
          @page { margin: 10mm; }
          .no-print { display: none !important; }
          .modal-overlay-modern { background: white !important; padding: 0 !important; position: static !important; display: none !important; }
          .ledger-modal-overlay { display: block !important; position: absolute !important; top: 0; left: 0; width: 100% !important; height: auto !important; z-index: 9999; }
          .modal-card-pro { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; margin: 0 !important; width: 100% !important; }
          .ledger-modal { background: white !important; }
          .ledger-content-printable { padding: 40px; }
          .print-header-ledger { display: block !important; visibility: visible !important; border-bottom: 3px double #0f172a; padding-bottom: 30px; margin-bottom: 40px; text-align: center; }
          .print-footer-ledger { display: block !important; visibility: visible !important; border-top: 1px dashed #cbd5e1; padding-top: 30px; margin-top: 80px; }
          .ledger-table-container { width: 100% !important; }
          .pro-bg-pattern, .section-header-modern, .stats-container-modern, .table-section-modern, .navbar-modern, .sidebar-modern, footer { display: none !important; }
          body { background: white !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; font-size: 14pt; }
          .ledger-table th { background: #f8fafc !important; -webkit-print-color-adjust: exact; border: 1px solid #0f172a !important; color: #000 !important; padding: 12px !important; }
          .ledger-table td { border: 1px solid #cbd5e1 !important; color: #000 !important; padding: 12px !important; }
          .type-tag { border: 1px solid #cbd5e1 !important; -webkit-print-color-adjust: exact; padding: 4px 8px !important; }
          .final-balance { font-size: 26px !important; color: #000 !important; font-weight: 900 !important; }
          .loading-ledger, .empty-ledger, .close-btn-pro, .print-btn-pro { display: none !important; }
          .brand-print { font-size: 28px !important; letter-spacing: -0.5px; }
          .partner-meta-print { display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
          .partner-meta-print p { margin: 0; }
        }
        .amount-cell small { font-size: 11px; font-weight: 800; color: #94a3b8; }

        .action-row-pro { display: flex; gap: 10px; justify-content: center; }
        .action-btn-pro { padding: 8px 16px; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; transition: 0.2s; border: none; }
        .action-btn-pro.gold { background: #0f172a; color: white; }
        .action-btn-pro.gold:hover { background: #334155; transform: scale(1.05); }
        .action-btn-pro.outline { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
        .action-btn-pro.outline:hover { background: #f1f5f9; color: #0f172a; }

        .modal-overlay-modern { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-card-pro { background: white; border-radius: 36px; width: 100%; maxWidth: 580px; padding: 32px; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); }
        .modal-header-pro { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; position: relative; }
        .modal-icon { width: 48px; height: 48px; background: #f1f5f9; color: #0f172a; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .modal-icon.gold { background: #fefce8; color: #854d0e; }
        .close-btn-pro { width: 36px; height: 36px; border-radius: 12px; border: none; background: #f8fafc; color: #94a3b8; font-size: 20px; cursor: pointer; transition: 0.2s; }
        .close-btn-pro:hover { background: #fee2e2; color: #ef4444; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .input-group-pro { display: flex; flex-direction: column; gap: 8px; }
        .input-group-pro.full { grid-column: span 2; }
        .input-group-pro label { font-size: 13px; font-weight: 800; color: #334155; }
        .input-group-pro input, .input-group-pro textarea { background: #f8fafc; border: 1px dotted #cbd5e1; padding: 14px 18px; border-radius: 14px; font-size: 15px; outline: none; transition: 0.3s; }
        .input-group-pro input:focus { border: 1.5px solid #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59,130,246,0.05); }
        .big-input { font-size: 24px !important; font-weight: 900 !important; color: #0f172a; }
        .hint-text { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; }

        .pro-radio-group { display: flex; gap: 12px; margin-bottom: 12px; }
        .pro-radio-label { flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 14px; text-align: center; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; color: #64748b; }
        .pro-radio-label:hover { background: #f8fafc; }
        
        .pro-radio-label.active.slate { background: #0f172a; color: white; border-color: #0f172a; }
        .pro-radio-label.active.emerald { background: #10b981; color: white; border-color: #10b981; }
        .pro-radio-label.active.red { background: #ef4444; color: white; border-color: #ef4444; }
        
        .pro-radio-label input { display: none; }

        .btn-submit-pro { width: 100%; border: none; background: #0f172a; color: white; padding: 18px; border-radius: 18px; font-size: 16px; font-weight: 900; cursor: pointer; margin-top: 24px; transition: 0.3s; }
        .btn-submit-pro:hover { transform: translateY(-3px); box-shadow: 0 15px 30px -10px rgba(15, 23, 42, 0.4); }
        .pro-slate-btn { background: #1e293b !important; }
        .pro-slate-btn:hover { background: #0f172a !important; }

        .print-only-header { display: none; }
        .empty-state { padding: 60px !important; text-align: center !important; color: #94a3b8; font-weight: 700; font-size: 14px; }

        @media print {
           .no-print { display: none !important; }
           .partners-pro-dashboard { padding: 0; background: white; }
           .table-section-modern { border: none; border-radius: 0; padding: 0; }
           .pro-table-v2 { border: 1px solid #ddd; }
           .pro-table-v2 th { background: #eee !important; color: black !important; }
           .print-only-header { display: block; text-align: center; margin-bottom: 40px; border-bottom: 3px double #000; padding-bottom: 20px; }
           .company-logo-print { font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; }
           .print-date { font-size: 12px; color: #666; margin-top: 5px; }
           body { width: 100%; height: 100%; }
        }

        .animate-slide-up { animation: slideUp 0.5s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
