'use client';

import React, { useMemo, useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineArrowLongRight, HiOutlineExclamationCircle } from "react-icons/hi2";

const CATEGORIES = ['علف', 'أدوية', 'لقاحات', 'أجور عمال', 'تدفئة ومحروقات', 'نقل', 'مصاريف عامة'];

type ExpenseRow = { category: string; quantity: string; unit_price: string; amount: string; description: string };
type SaleRow = { customer_name: string; date: string; count: string; total_weight: string; unit_price: string; total_amount: string; paid_amount: string };

const emptyExpense = (): ExpenseRow => ({ category: 'علف', quantity: '', unit_price: '', amount: '', description: '' });
const emptySale = (): SaleRow => ({ customer_name: '', date: '', count: '', total_weight: '', unit_price: '', total_amount: '', paid_amount: '' });

const num = (v: string) => parseFloat(v) || 0;
const money = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' $';

// المبلغ = الكمية × السعر إذا أُدخلا، وإلا المبلغ المكتوب يدوياً
const expenseAmount = (e: ExpenseRow) => (e.quantity && e.unit_price ? num(e.quantity) * num(e.unit_price) : num(e.amount));
const saleAmount = (s: SaleRow) => (s.total_weight && s.unit_price ? num(s.total_weight) * num(s.unit_price) : num(s.total_amount));

export default function HistoricalFlockPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const [flock, setFlock] = useState({
    batch_number: '', start_date: '', end_date: '', start_count: '', chick_price: '', mortality_count: '', notes: '',
  });
  const [distribute, setDistribute] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([emptyExpense()]);
  const [sales, setSales] = useState<SaleRow[]>([emptySale()]);

  const totals = useMemo(() => {
    const chicks = num(flock.start_count) * num(flock.chick_price);
    const otherExpenses = expenses.reduce((sum, e) => sum + expenseAmount(e), 0);
    const totalSales = sales.reduce((sum, s) => sum + saleAmount(s), 0);
    const expensesTotal = chicks + otherExpenses;
    return { chicks, expensesTotal, totalSales, profit: totalSales - expensesTotal };
  }, [flock, expenses, sales]);

  const updateExpense = (i: number, field: keyof ExpenseRow, value: string) =>
    setExpenses(expenses.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  const updateSale = (i: number, field: keyof SaleRow, value: string) =>
    setSales(sales.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!confirm(`سيتم حفظ الفوج بمصاريف ${money(totals.expensesTotal)} ومبيعات ${money(totals.totalSales)} وصافي ${money(totals.profit)}. هل الأرقام مطابقة للورقة؟`)) return;
    setSubmitting(true);
    try {
      const resp = await api.post('/flocks/historical', {
        batch_number: flock.batch_number,
        start_date: flock.start_date,
        end_date: flock.end_date,
        start_count: parseInt(flock.start_count),
        chick_price: num(flock.chick_price),
        mortality_count: parseInt(flock.mortality_count) || 0,
        notes: flock.notes,
        distribute_profit: distribute,
        expenses: expenses
          .filter(x => expenseAmount(x) > 0)
          .map(x => ({
            category: x.category,
            amount: Math.round(expenseAmount(x) * 100) / 100,
            description: [x.quantity && x.unit_price ? `${x.quantity} × ${x.unit_price}` : '', x.description].filter(Boolean).join(' | ') || null,
          })),
        sales: sales
          .filter(x => saleAmount(x) > 0)
          .map(x => ({
            customer_name: x.customer_name || null,
            date: x.date || flock.end_date,
            count: parseInt(x.count) || 0,
            total_weight: num(x.total_weight),
            unit_price: num(x.unit_price),
            total_amount: Math.round(saleAmount(x) * 100) / 100,
            paid_amount: x.paid_amount === '' ? undefined : num(x.paid_amount),
          })),
      });
      setResult(resp.data);
    } catch (err: any) {
      const data = err.response?.data;
      const firstValidation = data?.errors ? (Object.values(data.errors)[0] as string[])?.[0] : null;
      setError(data?.error || firstValidation || data?.message || 'حدث خطأ غير متوقع.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="hist-page animate-fade-in">
        <div className="card done">
          <div className="done-icon">✓</div>
          <h2>تم حفظ الفوج #{result.flock?.batch_number}</h2>
          <div className="summary">
            <div><span>المبيعات</span><b>{money(result.stats.sales)}</b></div>
            <div><span>المصاريف</span><b>{money(result.stats.expenses)}</b></div>
            <div><span>صافي الربح</span><b>{money(result.stats.net_profit)}</b></div>
          </div>
          <p className="hint">الدفعات التي أخذها الشركاء من الربح تُسجَّل من صفحة الشركاء كـ "سحب" بتاريخها.</p>
          <div className="actions">
            <button onClick={() => router.push(`/flocks/${result.flock?.id}`)}>عرض الفوج</button>
            <button className="secondary" onClick={() => router.push('/partners')}>صفحة الشركاء</button>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="hist-page animate-fade-in">
      <Link href="/flocks" className="back-link"><HiOutlineArrowLongRight /> العودة للأفواج</Link>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h1>🗂 إدخال فوج سابق</h1>
          <p className="sub">لتسجيل حسابات فوج انتهى قبل استخدام التطبيق. يُحفظ الفوج مغلقاً، وكل مبلغ في مكانه.</p>
          {error && <div className="error-alert"><HiOutlineExclamationCircle /> {error}</div>}

          <div className="grid">
            <label>رقم الفوج<input required value={flock.batch_number} onChange={e => setFlock({ ...flock, batch_number: e.target.value })} placeholder="مثال: F-2026-001" /></label>
            <label>تاريخ البداية<input required type="date" value={flock.start_date} onChange={e => setFlock({ ...flock, start_date: e.target.value })} /></label>
            <label>تاريخ النهاية<input required type="date" value={flock.end_date} onChange={e => setFlock({ ...flock, end_date: e.target.value })} /></label>
            <label>عدد الصيصان<input required type="number" min="1" value={flock.start_count} onChange={e => setFlock({ ...flock, start_count: e.target.value })} /></label>
            <label>سعر الصوص ($)<input required type="number" step="0.001" min="0" value={flock.chick_price} onChange={e => setFlock({ ...flock, chick_price: e.target.value })} /></label>
            <label>إجمالي النفوق (طير)<input type="number" min="0" value={flock.mortality_count} onChange={e => setFlock({ ...flock, mortality_count: e.target.value })} /></label>
          </div>
          <div className="auto-line">ثمن الصيصان (مصروف "صيصان" تلقائي): <b>{money(totals.chicks)}</b></div>
        </div>

        <div className="card">
          <h2>المصاريف</h2>
          <p className="sub">اكتب الكمية والسعر ليُحسب المبلغ تلقائياً، أو اكتب المبلغ مباشرة.</p>
          {expenses.map((x, i) => (
            <div key={i} className="row expense-row">
              <select value={x.category} onChange={e => updateExpense(i, 'category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" step="any" placeholder="الكمية" value={x.quantity} onChange={e => updateExpense(i, 'quantity', e.target.value)} />
              <input type="number" step="any" placeholder="سعر الوحدة $" value={x.unit_price} onChange={e => updateExpense(i, 'unit_price', e.target.value)} />
              <input type="number" step="any" placeholder="المبلغ $" value={x.quantity && x.unit_price ? String(expenseAmount(x)) : x.amount} disabled={!!(x.quantity && x.unit_price)} onChange={e => updateExpense(i, 'amount', e.target.value)} />
              <input placeholder="بيان (مثلاً: طن، أجار ورشة)" value={x.description} onChange={e => updateExpense(i, 'description', e.target.value)} />
              <button type="button" className="remove" onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="add" onClick={() => setExpenses([...expenses, emptyExpense()])}>＋ مصروف</button>
        </div>

        <div className="card">
          <h2>المبيعات</h2>
          <p className="sub">الوزن × السعر يحسب القيمة تلقائياً. اترك "المدفوع" فارغاً إذا قُبضت الفاتورة كاملة.</p>
          {sales.map((x, i) => (
            <div key={i} className="row sale-row">
              <input placeholder="التاجر / الزبون" value={x.customer_name} onChange={e => updateSale(i, 'customer_name', e.target.value)} />
              <input type="date" value={x.date} onChange={e => updateSale(i, 'date', e.target.value)} title="فارغ = تاريخ النهاية" />
              <input type="number" placeholder="عدد الطيور" value={x.count} onChange={e => updateSale(i, 'count', e.target.value)} />
              <input type="number" step="any" placeholder="الوزن كغ" value={x.total_weight} onChange={e => updateSale(i, 'total_weight', e.target.value)} />
              <input type="number" step="any" placeholder="سعر الكغ $" value={x.unit_price} onChange={e => updateSale(i, 'unit_price', e.target.value)} />
              <input type="number" step="any" placeholder="القيمة $" value={x.total_weight && x.unit_price ? String(saleAmount(x)) : x.total_amount} disabled={!!(x.total_weight && x.unit_price)} onChange={e => updateSale(i, 'total_amount', e.target.value)} />
              <input type="number" step="any" placeholder="المدفوع $" value={x.paid_amount} onChange={e => updateSale(i, 'paid_amount', e.target.value)} />
              <button type="button" className="remove" onClick={() => setSales(sales.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="add" onClick={() => setSales([...sales, emptySale()])}>＋ عملية بيع</button>
        </div>

        <div className="card totals">
          <div><span>مجموع المصاريف</span><b>{money(totals.expensesTotal)}</b></div>
          <div><span>مجموع المبيعات</span><b>{money(totals.totalSales)}</b></div>
          <div className={totals.profit >= 0 ? 'profit' : 'loss'}><span>صافي الربح</span><b>{money(totals.profit)}</b></div>
          <p className="hint">قارن هذه المجاميع بالورقة قبل الحفظ.</p>
          <label className="check">
            <input type="checkbox" checked={distribute} onChange={e => setDistribute(e.target.checked)} />
            توزيع صافي الربح على الشركاء حسب حصصهم (بتاريخ نهاية الفوج)
          </label>
          <label>ملاحظات<textarea rows={2} value={flock.notes} onChange={e => setFlock({ ...flock, notes: e.target.value })} /></label>
          <button type="submit" className="save" disabled={submitting}>{submitting ? '⏳ جاري الحفظ...' : 'حفظ الفوج السابق'}</button>
        </div>
      </form>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .hist-page { max-width: 1000px; margin: 0 auto; padding: 20px 0 60px; }
  .back-link { display: inline-flex; align-items: center; gap: 10px; color: #64748b; text-decoration: none; font-weight: 800; font-size: 14px; margin-bottom: 20px; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 28px; margin-bottom: 20px; }
  h1 { font-size: 24px; font-weight: 950; color: #0f172a; margin-bottom: 6px; }
  h2 { font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
  .sub { font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 18px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 800; color: #334155; }
  input, select, textarea { border: 2px solid #f1f5f9; border-radius: 12px; padding: 10px 12px; font-size: 14px; font-weight: 700; background: #fafbfc; color: #0f172a; min-width: 0; }
  input:disabled { background: #f0fdf4; color: #166534; }
  input:focus, select:focus, textarea:focus { border-color: #166534; outline: none; background: white; }
  .auto-line { margin-top: 16px; font-size: 14px; font-weight: 800; color: #166534; }
  .row { display: grid; gap: 8px; margin-bottom: 10px; align-items: center; }
  .expense-row { grid-template-columns: 1.2fr 0.8fr 0.9fr 1fr 2fr auto; }
  .sale-row { grid-template-columns: 1.5fr 1.2fr 0.8fr 0.9fr 0.8fr 1fr 0.9fr auto; }
  .remove { background: #fef2f2; color: #dc2626; border: none; border-radius: 10px; width: 36px; height: 36px; cursor: pointer; font-weight: 900; }
  .add { background: #f0fdf4; color: #166534; border: 1px dashed #86efac; border-radius: 12px; padding: 10px 16px; font-weight: 900; cursor: pointer; }
  .totals > div, .summary > div { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 800; }
  .totals b, .summary b { font-size: 18px; }
  .profit b { color: #166534; }
  .loss b { color: #dc2626; }
  .hint { font-size: 12px; color: #94a3b8; font-weight: 700; margin: 12px 0; }
  .check { flex-direction: row; align-items: center; gap: 10px; margin-bottom: 14px; }
  .save, .actions button { width: 100%; margin-top: 14px; background: #166534; color: white; border: none; padding: 16px; border-radius: 16px; font-size: 16px; font-weight: 900; cursor: pointer; }
  .save:disabled { opacity: 0.5; }
  .error-alert { background: #fef2f2; color: #dc2626; padding: 14px; border-radius: 14px; font-weight: 800; border: 1px solid #fee2e2; margin-bottom: 18px; display: flex; gap: 8px; align-items: center; }
  .done { text-align: center; }
  .done-icon { width: 80px; height: 80px; background: #166534; color: white; font-size: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
  .summary { text-align: right; margin: 20px 0; }
  .actions { display: flex; gap: 10px; }
  .actions .secondary { background: #475569; }
  @media (max-width: 800px) {
    .grid { grid-template-columns: 1fr 1fr; }
    .expense-row, .sale-row { grid-template-columns: 1fr 1fr; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
  }
`;
