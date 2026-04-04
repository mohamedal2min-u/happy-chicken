'use client';

import React from 'react';
import { 
  HiOutlineExclamationCircle, 
  HiOutlineCircleStack, 
  HiOutlineBeaker,
  HiOutlineScale,
  HiOutlineBanknotes
} from "react-icons/hi2";
import { FaSkull } from "react-icons/fa6";

interface OpsModalsProps {
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  inventoryItems: any[];
  invLoading: boolean;
  currentFlock: any;
}

export default function OpsModals({
  activeModal,
  setActiveModal,
  formData,
  setFormData,
  onSubmit,
  loading,
  inventoryItems,
  invLoading,
  currentFlock
}: OpsModalsProps) {
  if (!activeModal) return null;

  const isFuel = formData.description === 'تزويد مازوت (ليتر)';
  const isWater = formData.description === 'تعبئة صهريج مياه';

  return (
    <div className="modal-overlay" onClick={() => setActiveModal(null)}>
      <div className="modal-window glass-card animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>
            {activeModal === 'mortality' ? 'تسجيل نفوق يومي' : 
             activeModal === 'feed' ? 'توزيع وجبة علف' : 
             activeModal === 'medicine' ? 'إضافة تحصينات / دواء' :
             'تسجيل مصروف نثري'}
          </h2>
          <button className="close-x" onClick={() => setActiveModal(null)}>×</button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          {!currentFlock && activeModal !== 'expense' ? (
             <div className="error-alert animate-shake">
                <HiOutlineExclamationCircle /> عذراً، لا يوجد فوج نشط حالياً للقيام بهذه العملية. يرجى البدء بفتح فوج جديد أولاً.
             </div>
          ) : (
            <>
              {activeModal === 'mortality' && (
                 <div className="group animate-slide-up">
                    <label><FaSkull className="text-red" /> عدد الطيور النافقة اليوم</label>
                    <div className="input-with-sub">
                      <input type="number" className="number-font" value={formData.count} onChange={e => setFormData({...formData, count: e.target.value})} autoFocus required placeholder="0" />
                      <span className="sub-hint">سيتم خصمها من العدد الحي للفوج</span>
                    </div>
                 </div>
              )}
              {activeModal === 'feed' && (
                 <div className="group animate-slide-up">
                    <label><HiOutlineScale className="text-orange" /> كمية العلف الموزعة (أكياس)</label>
                    <div className="input-with-sub">
                      <input type="number" step="0.5" className="number-font" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} autoFocus required placeholder="مثلاً: 2.5" />
                      <span className="sub-hint">الكيس الواحد يعادل 50 كغ</span>
                    </div>
                 </div>
              )}
          {activeModal === 'medicine' && (
             <>
                <div className="group">
                   <label>اختيار الدواء من المخزون</label>
                   {invLoading ? (
                     <div className="loading-small">جاري جلب القائمة...</div>
                   ) : inventoryItems.length > 0 ? (
                     <>
                       <select 
                         className="form-select"
                         value={formData.item_id}
                         onChange={e => {
                           const it = inventoryItems.find(i => i.id.toString() === e.target.value);
                           setFormData({...formData, item_id: e.target.value, medicine_name: it?.name || ''});
                         }}
                         required
                       >
                         <option value="">-- اختر الدواء المتوفر --</option>
                         {inventoryItems.map(it => (
                           <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                         ))}
                       </select>
                       {formData.item_id && (
                         <div className="stock-info animate-fade-in">
                            <HiOutlineCircleStack /> الرصيد الحالي: <b className="number-font">{inventoryItems.find(i => i.id.toString() === formData.item_id)?.current_quantity || 0}</b> {inventoryItems.find(i => i.id.toString() === formData.item_id)?.unit}
                         </div>
                       )}
                     </>
                   ) : (
                     <div className="error-alert">
                       <HiOutlineExclamationCircle /> لا توجد أدوية متوفرة في المخزون. يرجى إضافتها أولاً من قسم المخزون.
                     </div>
                   )}
                </div>

                {formData.item_id && (
                   <div className="calculation-box animate-fade-in">
                      <div className="calc-row">
                         <div className="group half">
                            <label>
                               {['لتر', 'liter', 'ليتر'].includes(inventoryItems.find(i => i.id.toString() === formData.item_id)?.unit?.toLowerCase()) 
                                 ? 'الكمية اليومية (مل)' 
                                 : 'الجرعة اليومية (وحدة)'}
                            </label>
                            <input 
                              type="number" 
                              className="number-font" 
                              value={formData.daily_quantity} 
                              onChange={e => setFormData({...formData, daily_quantity: e.target.value})} 
                              placeholder="مثلاً: 50"
                              required 
                            />
                         </div>
                         <div className="group half">
                            <label>مدة الاستخدام (أيام)</label>
                            <div className="days-badge">
                               {formData.start_date && formData.end_date ? (
                                 Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / 86400000) + 1
                               ) : 1} يوم
                            </div>
                         </div>
                      </div>
                      
                      <div className="total-display glass-card">
                         <label>إجمالي الاستهلاك المتوقع:</label>
                         <div className="total-v number-font">
                            {(() => {
                               const item = inventoryItems.find(i => i.id.toString() === formData.item_id);
                               const days = formData.start_date && formData.end_date 
                                 ? Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / 86400000) + 1 
                                 : 1;
                               const qty = parseFloat(formData.daily_quantity || '0');
                               const total = ['لتر', 'liter', 'ليتر'].includes(item?.unit?.toLowerCase()) ? (qty / 1000) * days : qty * days;
                               return (
                                 <span className={total > (item?.current_quantity || 0) ? 'text-red' : 'text-green'}>
                                    {total.toLocaleString()} {item?.unit}
                                 </span>
                               );
                            })()}
                         </div>
                         {(() => {
                            const item = inventoryItems.find(i => i.id.toString() === formData.item_id);
                            const days = formData.start_date && formData.end_date ? Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / 86400000) + 1 : 1;
                            const total = ['لتر', 'liter', 'ليتر'].includes(item?.unit?.toLowerCase()) ? (parseFloat(formData.daily_quantity || '0') / 1000) * days : parseFloat(formData.daily_quantity || '0') * days;
                            if (total > (item?.current_quantity || 0)) {
                               return <div className="error-small animate-pulse">رصيد غير كافي لتغطية المدة!</div>;
                            }
                         })()}
                      </div>
                   </div>
                )}

                <div className="group">
                   <label>الطبيب الواصف (اسم المشرف)</label>
                   <input type="text" value={formData.prescribed_by} onChange={e => setFormData({...formData, prescribed_by: e.target.value})} placeholder="مثلاً: د. أحمد المحمد" />
                </div>
                <div className="calc-row">
                   <div className="group half">
                      <label>من تاريخ</label>
                      <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                   </div>
                   <div className="group half">
                      <label>إلى تاريخ</label>
                      <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
                   </div>
                </div>
                <div className="group">
                   <label>ملاحظات إضافية</label>
                   <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="مثلاً: يوضع في ماء الصباح..." />
                </div>
             </>
          )}
           {activeModal === 'expense' && (
              <>
                 <div className="group animate-slide-up">
                    <label><HiOutlineBanknotes className="text-blue" /> نوع المصروف</label>
                    <select 
                      className="form-select" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value, quantity: '', unit_price: '', amount: ''})}
                      autoFocus
                      required
                    >
                      <option value="">-- اختر النوع --</option>
                      <option value="راتب ناطور">راتب ناطور</option>
                      <option value="راتب مشرف ومتابعة">راتب مشرف ومتابعة</option>
                      <option value="تزويد مازوت (ليتر)">تزويد مازوت (ليتر)</option>
                      <option value="تعبئة صهريج مياه">تعبئة صهريج مياه</option>
                      <option value="صيانة معدات / كهرباء">صيانة معدات / كهرباء</option>
                      <option value="مصاريف نثرية (أخرى)">مصاريف نثرية (أخرى)</option>
                   </select>
                </div>
                
                {(isFuel || isWater) ? (
                   <div className="calculation-box animate-fade-in">
                      <div className="calc-row">
                         <div className="group half">
                            <label>{isFuel ? 'عدد اللترات' : 'عدد الصهاريج'}</label>
                            <input 
                              type="number" 
                              className="number-font" 
                              value={formData.quantity} 
                              onChange={e => setFormData({...formData, quantity: e.target.value})} 
                              placeholder={isFuel ? 'مثلاً: 200' : 'مثلاً: 3'}
                              required 
                            />
                         </div>
                         <div className="group half">
                            <label>{isFuel ? 'سعر اللتر الواحد' : 'سعر الصهريج'}</label>
                            <input 
                              type="number" 
                              className="number-font" 
                              value={formData.unit_price} 
                              onChange={e => setFormData({...formData, unit_price: e.target.value})} 
                              placeholder="مثلاً: 12,000"
                              required 
                            />
                         </div>
                      </div>
                      <div className="total-display glass-card">
                         <label>المجموع التلقائي:</label>
                         <div className="total-v number-font">{formData.amount ? parseFloat(formData.amount).toLocaleString() : 0} <small>ل.س</small></div>
                      </div>
                   </div>
                ) : (
                   <div className="group animate-fade-in">
                      <label>المبلغ الإجمالي (ل.س)</label>
                      <input 
                        type="number" 
                        className="number-font" 
                        value={formData.amount} 
                        onChange={e => setFormData({...formData, amount: e.target.value})} 
                        placeholder="مثلاً: 50,000"
                        required 
                      />
                   </div>
                )}

                <div className="group">
                   <label>ملاحظات إضافية (اختياري)</label>
                   <input 
                     type="text" 
                     value={formData.notes} 
                     onChange={e => setFormData({...formData, notes: e.target.value})} 
                     placeholder="أي تفاصيل أخرى..." 
                   />
                </div>
             </>
          )}
          <button 
            type="submit" 
            className="btn-submit-pro" 
            disabled={loading || (!currentFlock && activeModal !== 'expense') || (activeModal === 'medicine' && (inventoryItems.length === 0 || (() => {
                const item = inventoryItems.find(i => i.id.toString() === formData.item_id);
                const days = formData.start_date && formData.end_date ? Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / 86400000) + 1 : 1;
                const total = ['لتر', 'liter', 'ليتر'].includes(item?.unit?.toLowerCase()) ? (parseFloat(formData.daily_quantity || '0') / 1000) * days : parseFloat(formData.daily_quantity || '0') * days;
                return total > (item?.current_quantity || 0);
            })()))}
          >
             {loading ? 'جاري الحفظ...' : 
              (!currentFlock && activeModal !== 'expense') ? 'لا يمكن التسجيل - لا يوجد فوج نشط' :
              (activeModal === 'medicine' && inventoryItems.length === 0) ? 'المخزون فارغ - لا يمكن الإكمال' : 
              'تأكيد العملية وحفظ السجل'}
          </button>
          </>
        )}
        </form>
      </div>
    </div>
  );
}
