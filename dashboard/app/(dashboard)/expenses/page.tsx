'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import api from '@/services/api';
import { 
  HiOutlineCalculator, 
  HiOutlineArrowTrendingUp, 
  HiOutlineArrowTrendingDown, 
  HiOutlinePrinter,
  HiOutlineDocumentText,
  HiOutlineCircleStack,
  HiOutlineFlag,
  HiOutlineBanknotes,
  HiOutlineChartBar
} from "react-icons/hi2";

export default function AccountingPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger'); // ledger, expenses, sales, analysis
  const [selectedFlockId, setSelectedFlockId] = useState<string>('');
  
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [expResp, salesResp, flockResp] = await Promise.all([
        api.get('/accounting/expenses'),
        api.get('/accounting/sales'),
        api.get('/flocks')
      ]);
      setExpenses(expResp.data || []);
      setSales(salesResp.data || []);
      setFlocks(flockResp.data || []);
      if (flockResp.data.length > 0) setSelectedFlockId(flockResp.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Combine and sort for Ledger - Memoized
  const combinedLedger = useMemo(() => [
    ...expenses.map(e => ({ ...e, type: 'expense', amountText: `-${e.amount.toLocaleString()}` })),
    ...sales.map(s => ({ ...s, type: 'sale', amountText: `+${(s.total_amount || 0).toLocaleString()}` }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [expenses, sales]);

  const { totalExpenses, totalSales, netBalance } = useMemo(() => {
    const expensesSum = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const salesSum = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);
    return {
      totalExpenses: expensesSum,
      totalSales: salesSum,
      netBalance: salesSum - expensesSum
    };
  }, [expenses, sales]);

  // Analysis Logic - Memoized
  const currentAnalysis = useMemo(() => {
    if (!selectedFlockId) return null;
    const fExpenses = expenses.filter(e => e.flock_id == selectedFlockId).reduce((s, e) => s + parseFloat(e.amount), 0);
    const fSales = sales.filter(s => s.flock_id == selectedFlockId).reduce((s, e) => s + parseFloat(s.total_amount), 0);
    const flock = flocks.find(f => f.id == selectedFlockId);
    return {
      revenue: fSales,
      costs: fExpenses,
      profit: fSales - fExpenses,
      batch: flock?.batch_number || '---'
    };
  }, [selectedFlockId, expenses, sales, flocks]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="accounting-pro-dashboard animate-fade-in">
      <div className="pro-bg-pattern"></div>
      
      <div className="section-header-modern no-print">
        <div className="title-stack">
          <h1>نظام المحاسبة والقيود العامة</h1>
          <p className="subtitle-pro">الدائرة المالية المركزية لمدجنة كنصفرة - مراقبة التدفقات، الأرباح، والخسائر.</p>
        </div>
        <div className="action-btns-pro">
            <button className="btn-secondary-pro glass-btn" onClick={handlePrint}>
              <HiOutlinePrinter /> طباعة الكشف المالي
            </button>
            <button className="btn-primary-pro bounce-hover" onClick={fetchAllData}>
              <HiOutlineCircleStack /> تحديث البيانات
            </button>
        </div>
      </div>

      <div className="stats-container-modern no-print">
        <div className="stat-card glass-morph green-glow">
          <div className="icon-box"><HiOutlineArrowTrendingUp /></div>
          <div className="content">
            <label>إجمالي الإيرادات (مبيعات)</label>
            <div className="val number-font">{totalSales.toLocaleString('en-US')} <span>ل.س</span></div>
            <div className="sub-val">نمو مالي مستقر</div>
          </div>
        </div>
        
        <div className="stat-card glass-morph red-glow">
          <div className="icon-box"><HiOutlineArrowTrendingDown /></div>
          <div className="content">
            <label>إجمالي التكاليف (مصاريف)</label>
            <div className="val number-font">{totalExpenses.toLocaleString('en-US')} <span>ل.س</span></div>
            <div className="sub-val text-danger">تكاليف تشغيلية موثقة</div>
          </div>
        </div>

        <div className="stat-card glass-morph gold-glow">
          <div className="icon-box"><HiOutlineBanknotes /></div>
          <div className="content">
            <label>صافي الموقف المالي</label>
            <div className={`val number-font ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                {netBalance.toLocaleString('en-US')} <span>ل.س</span>
            </div>
            <div className="sub-val">{netBalance >= 0 ? 'فائض مالي (ربح مرصد)' : 'عجز مالي مؤقت'}</div>
          </div>
        </div>
      </div>

      <div className="accounting-tabs no-print">
        <button className={activeTab === 'ledger' ? 'active' : ''} onClick={() => setActiveTab('ledger')}><HiOutlineDocumentText /> سجل القيود</button>
        <button className={activeTab === 'analysis' ? 'active' : ''} onClick={() => setActiveTab('analysis')}><HiOutlineChartBar /> تحليل أداء الأفواج</button>
        <button className={activeTab === 'expenses' ? 'active' : ''} onClick={() => setActiveTab('expenses')}><HiOutlineArrowTrendingDown /> المصاريف</button>
        <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}><HiOutlineArrowTrendingUp /> المبيعات</button>
      </div>

      <div className="main-content-area glass-card">
        {activeTab === 'ledger' && (
          <div className="ledger-view animate-fade-in print-section" ref={printRef}>
             <div className="print-header only-print">
                <div className="farm-info">
                   <h2>مدجنة كنصفرة للإنتاج الحيواني</h2>
                   <p>كشف الحساب العام والتدفق المالي</p>
                </div>
                <div className="print-date">تاريخ التقرير: {new Date().toLocaleDateString('ar-SY')}</div>
             </div>

             <table className="pro-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>البيان / التفصيل</th>
                    <th>الفوج</th>
                    <th style={{textAlign: 'right'}}>المبلغ (ل.س)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="loading-cell">جاري تدقيق السجلات المالية...</td></tr>
                  ) : combinedLedger.length === 0 ? (
                    <tr><td colSpan={5} className="empty-cell">لا توجد حركات مالية مسجلة.</td></tr>
                  ) : (
                    combinedLedger.map((item, idx) => (
                      <tr key={idx} className={item.type}>
                        <td className="number-font">{item.date}</td>
                        <td>
                           <span className={`type-tag ${item.type}`}>
                             {item.type === 'sale' ? 'إيراد / مبيع' : 'مصروف / تكلفة'}
                           </span>
                        </td>
                        <td><div className="desc-text">{item.description}</div></td>
                        <td className="number-font bold">#{item.flock?.batch_number}</td>
                        <td className={`amount-cell number-font ${item.type}`}>
                           {item.amountText}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
             
             <div className="print-footer only-print">
                <div className="sig-box">توقيع المحاسب: .....................</div>
                <div className="sig-box">ختم الإدارة: .....................</div>
             </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-view animate-fade-in no-print">
             <div className="selector-bar">
                <label>اختر الفوج للتحليل المالي:</label>
                <select value={selectedFlockId} onChange={e => setSelectedFlockId(e.target.value)} className="modern-select">
                   {flocks.map(f => <option key={f.id} value={f.id}>فوج رقم: {f.batch_number} ({f.is_closed ? 'مغلق' : 'قيد التشغيل'})</option>)}
                </select>
             </div>

             {currentAnalysis && (
               <div className="analysis-grid">
                  <div className="analysis-card revenue">
                     <h3><HiOutlineArrowTrendingUp /> إجمالي المبيعات</h3>
                     <div className="val number-font">{currentAnalysis.revenue.toLocaleString()}</div>
                     <p>عائدات بيع المنتج النهائي (فروج/بيض)</p>
                  </div>
                  <div className="analysis-card costs">
                     <h3><HiOutlineArrowTrendingDown /> إجمالي التكاليف</h3>
                     <div className="val number-font">{currentAnalysis.costs.toLocaleString()}</div>
                     <p>علف، أدوية، تدفئة، ورواتب</p>
                  </div>
                  <div className={`analysis-card result ${currentAnalysis.profit >= 0 ? 'profit' : 'loss'}`}>
                     <h3><HiOutlineFlag /> {currentAnalysis.profit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</h3>
                     <div className="val number-font">{Math.abs(currentAnalysis.profit).toLocaleString()}</div>
                     <div className="status-indicator">{currentAnalysis.profit >= 0 ? 'أداء ممتاز' : 'تحتاج مراجعة تكاليف'}</div>
                  </div>
               </div>
             )}
          </div>
        )}

        {(activeTab === 'expenses' || activeTab === 'sales') && (
           <div className="filtered-view animate-fade-in no-print">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>البيان</th>
                    <th style={{textAlign: 'right'}}>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'expenses' ? expenses : sales).map((item, idx) => (
                    <tr key={idx}>
                      <td className="number-font">{item.date}</td>
                      <td>{item.description}</td>
                      <td className={`number-font bold ${activeTab === 'sales' ? 'text-success' : 'text-danger'}`} style={{textAlign: 'right'}}>
                         {(item.amount || item.total_amount).toLocaleString()} ل.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        )}
      </div>

      <style jsx>{`
        .accounting-pro-dashboard { position: relative; padding: 30px; min-height: 100vh; background: #f8fafc; overflow: hidden; }
        .pro-bg-pattern { position: absolute; top: 0; left: 0; right: 0; height: 350px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); z-index: 0; clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%); opacity: 0.98; }
        
        .section-header-modern { position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; color: white; }
        .title-stack h1 { font-size: 32px; font-weight: 900; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .subtitle-pro { font-size: 15px; opacity: 0.8; font-weight: 500; }
        
        .action-btns-pro { display: flex; gap: 12px; }
        .btn-primary-pro { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; gap: 10px; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(59,130,246,0.3); transition: 0.3s; }
        .btn-secondary-pro { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; gap: 10px; cursor: pointer; backdrop-filter: blur(10px); }
        .bounce-hover:hover { transform: translateY(-3px); box-shadow: 0 20px 25px -5px rgba(59,130,246,0.4); }

        .stats-container-modern { position: relative; z-index: 10; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
        .stat-card { background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); padding: 30px; border-radius: 30px; display: flex; align-items: center; gap: 25px; transition: 0.3s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .icon-box { width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .green-glow .icon-box { background: #ecfdf5; color: #10b981; }
        .red-glow .icon-box { background: #fef2f2; color: #ef4444; }
        .gold-glow .icon-box { background: #fffbeb; color: #f59e0b; }
        .content label { font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 4px; display: block; }
        .val { font-size: 28px; font-weight: 950; color: #0f172a; }
        .val span { font-size: 14px; font-weight: 800; color: #94a3b8; margin-right: 4px; }
        .sub-val { font-size: 12px; font-weight: 700; color: #10b981; margin-top: 4px; }
        .text-danger { color: #ef4444; }
        .text-success { color: #10b981; }

        .accounting-tabs { position: relative; z-index: 10; display: flex; gap: 10px; margin-bottom: 25px; background: rgba(0,0,0,0.03); padding: 6px; border-radius: 20px; width: fit-content; }
        .accounting-tabs button { background: transparent; color: #64748b; border: none; padding: 12px 24px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .accounting-tabs button.active { background: white; color: #3b82f6; box-shadow: 0 10px 15px -3px rgba(59,130,246,0.2); }
        .accounting-tabs button:hover:not(.active) { color: #0f172a; background: rgba(59, 130, 246, 0.08); transform: translateY(-1px); }

        .main-content-area { position: relative; z-index: 10; background: white; border-radius: 32px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); overflow: hidden; }
        
        .pro-table { width: 100%; border-collapse: collapse; }
        .pro-table th { background: #fbfcfe; padding: 25px 30px; text-align: right; font-size: 13px; font-weight: 900; color: #64748b; border-bottom: 2px solid #f1f5f9; }
        .pro-table td { padding: 20px 30px; border-bottom: 1px solid #f1f5f9; }
        .pro-table tr.sale { background: #f0fdf4; }
        .pro-table tr.expense { background: #fef2f2; }
        .type-tag { font-size: 11px; font-weight: 900; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; }
        .type-tag.sale { background: #d1fae5; color: #065f46; }
        .type-tag.expense { background: #fee2e2; color: #991b1b; }
        .amount-cell { font-size: 18px; font-weight: 950; text-align: right; }
        .amount-cell.sale { color: #10b981; }
        .amount-cell.expense { color: #ef4444; }
        .desc-text { font-size: 14px; font-weight: 600; color: #1e293b; max-width: 400px; }

        .analysis-view { padding: 40px; }
        .selector-bar { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
        .selector-bar label { font-weight: 800; color: #64748b; }
        .modern-select { padding: 14px 24px; border-radius: 14px; border: 2px solid #f1f5f9; font-weight: 800; color: #0f172a; outline: none; background: #fbfcfe; }
        
        .analysis-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .analysis-card { padding: 40px; border-radius: 40px; border: 1px solid transparent; transition: 0.3s; position: relative; }
        .analysis-card h3 { display: flex; align-items: center; gap: 15px; font-size: 18px; font-weight: 950; margin-bottom: 20px; }
        .analysis-card .val { font-size: 42px; font-weight: 950; margin-bottom: 15px; }
        .analysis-card p { font-size: 13px; font-weight: 600; opacity: 0.8; line-height: 1.6; }
        
        .revenue { background: #ecfdf5; color: #065f46; border-color: #d1fae5; }
        .costs { background: #fff1f2; color: #9f1239; border-color: #ffe4e6; }
        .result.profit { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; box-shadow: 0 20px 40px -10px rgba(16,185,129,0.3); }
        .result.loss { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; box-shadow: 0 20px 40px -10px rgba(239,68,68,0.3); }
        .result h3 { opacity: 0.9; }
        .status-indicator { display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.2); border-radius: 12px; font-size: 12px; font-weight: 900; margin-top: 10px; }

        .loading-cell, .empty-cell { text-align: center; padding: 100px !important; color: #94a3b8; font-weight: 700; font-size: 15px; }

        .only-print { display: none; }
        @media print {
           body { background: white !important; }
           .no-print, nav, aside { display: none !important; }
           .only-print { display: block !important; }
           .accounting-pro-dashboard { background: white; padding: 0; margin: 0; }
           .pro-bg-pattern { display: none; }
           .main-content-area { border: none !important; box-shadow: none !important; overflow: visible !important; width: 100%; }
           .print-header { display: flex; justify-content: space-between; align-items: center; padding: 40px 0; border-bottom: 3px solid #0f172a; margin-bottom: 30px; }
           .farm-info h2 { font-size: 26px; font-weight: 950; color: #0f172a; margin-bottom: 5px; }
           .print-footer { margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
           .sig-box { border-top: 2px solid #e2e8f0; padding-top: 20px; font-weight: 900; color: #0f172a; }
           .pro-table th { color: #0f172a; border-bottom: 2px solid #0f172a; background: #f8fafc !important; -webkit-print-color-adjust: exact; }
           .pro-table td { border-bottom: 1px solid #e2e8f0; }
           .amount-cell { font-weight: 950; -webkit-print-color-adjust: exact; }
           .amount-cell.sale { color: #059669 !important; }
           .amount-cell.expense { color: #dc2626 !important; }
           .loading-cell { display: none !important; }
        }
      `}</style>
    </div>
  );
}
