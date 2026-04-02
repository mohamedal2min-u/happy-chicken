'use client';

import React, { useEffect, useState, useMemo } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  HiOutlineArrowTrendingDown, 
  HiOutlineScale, 
  HiOutlineBanknotes, 
  HiOutlineBeaker,
  HiOutlineArrowLongLeft,
  HiOutlineCloud,
  HiOutlineSparkles,
  HiOutlineExclamationCircle,
  HiOutlineCircleStack,
} from "react-icons/hi2";
import './dashboard.css';

const OpsModals = dynamic(() => import('@/app/_components/dashboard/OpsModals'), {
  loading: () => <p>Loading Modals...</p>,
});

/* ───────────────────────────────────────────────── */
/*  لوحة المدير العام (Super Admin)                  */
/* ───────────────────────────────────────────────── */
function SuperAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // نموذج إنشاء مدجنة جديدة
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    farm_name: '',
    location: '',
    manager_name: '',
    manager_email: '',
    manager_password: '',
  });
  const [formMsg, setFormMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const resp = await api.get('/admin/summary');
      setData(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg('');
    try {
      await api.post('/farms', formData);
      setFormMsg('✅ تم إنشاء المدجنة والمدير بنجاح!');
      setFormData({ farm_name: '', location: '', manager_name: '', manager_email: '', manager_password: '' });
      fetchData();
      setTimeout(() => setShowForm(false), 1500);
    } catch (err: any) {
      setFormMsg('❌ ' + (err.response?.data?.message || 'فشل الإنشاء'));
    } finally {
      setFormLoading(false);
    }
  };

  const toggleFarmStatus = async (id: number) => {
    try {
      await api.patch(`/farms/${id}/toggle-status`);
      fetchData();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div className="admin-dashboard animate-fade-in">

      {/* ── ترحيب ── */}
      <div className="admin-welcome">
        <div>
          <h1>مرحباً بالمدير العام 👋</h1>
          <p>هنا نظرة شاملة على كافة مداجن النظام</p>
        </div>
        <button className="btn-create-farm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ إغلاق' : '➕ مدجنة جديدة'}
        </button>
      </div>

      {/* ── نموذج الإنشاء ── */}
      {showForm && (
        <div className="create-farm-panel animate-slide-down">
          <h3>🏗️ إنشاء مدجنة جديدة</h3>
          <form onSubmit={handleCreate} className="create-farm-form">
            <div className="form-row">
              <div className="form-group">
                <label>اسم المدجنة</label>
                <input type="text" placeholder="مثال: مدجنة النور" value={formData.farm_name}
                  onChange={e => setFormData({...formData, farm_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>الموقع</label>
                <input type="text" placeholder="مثال: ريف دمشق" value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>اسم المدير</label>
                <input type="text" placeholder="اسم مدير المدجنة" value={formData.manager_name}
                  onChange={e => setFormData({...formData, manager_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>بريد المدير</label>
                <input type="email" placeholder="manager@example.com" value={formData.manager_email}
                  onChange={e => setFormData({...formData, manager_email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>كلمة مرور المدير</label>
                <input type="password" placeholder="8 أحرف على الأقل" value={formData.manager_password}
                  onChange={e => setFormData({...formData, manager_password: e.target.value})} required />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={formLoading}>
                {formLoading ? '⏳ جاري الإنشاء...' : '💾 إنشاء وحفظ'}
              </button>
            </div>
            {formMsg && <p className="form-message">{formMsg}</p>}
          </form>
        </div>
      )}

      {/* ── بطاقات الإحصائيات ── */}
      <div className="admin-stats-grid">
        <div className="stat-card card-farms">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <div className="stat-value">{data?.total_farms || 0}</div>
            <div className="stat-label">إجمالي المداجن</div>
          </div>
        </div>
        <div className="stat-card card-active">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{data?.active_farms || 0}</div>
            <div className="stat-label">مداجن نشطة</div>
          </div>
        </div>
        <div className="stat-card card-stopped">
          <div className="stat-icon">⏸️</div>
          <div className="stat-info">
            <div className="stat-value">{data?.stopped_farms || 0}</div>
            <div className="stat-label">مداجن متوقفة</div>
          </div>
        </div>
        <div className="stat-card card-users">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{data?.total_users || 0}</div>
            <div className="stat-label">إجمالي المستخدمين</div>
          </div>
        </div>
        <div className="stat-card card-flocks">
          <div className="stat-icon">🐣</div>
          <div className="stat-info">
            <div className="stat-value">{data?.open_flocks || 0} / {data?.total_flocks || 0}</div>
            <div className="stat-label">أفواج نشطة / الكل</div>
          </div>
        </div>
      </div>

      {/* ── جدول المزارع ── */}
      <div className="farms-table-section">
        <h2>📋 كافة المداجن في النظام</h2>
        <div className="farms-table-wrapper">
          <table className="farms-table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم المدجنة</th>
                <th>الموقع</th>
                <th>عدد الأفواج</th>
                <th>عدد الأعضاء</th>
                <th>الحالة</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {data?.farms?.map((farm: any, i: number) => (
                <tr key={farm.id}>
                  <td className="num-cell">{i + 1}</td>
                  <td className="farm-name-cell">{farm.name}</td>
                  <td>{farm.location || '—'}</td>
                  <td className="num-cell">{farm.flocks_count}</td>
                  <td className="num-cell">{farm.users_count}</td>
                  <td>
                    <span className={`status-badge ${farm.is_active ? 'active' : 'stopped'}`}>
                      {farm.is_active ? '🟢 نشطة' : '🔴 متوقفة'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleFarmStatus(farm.id)} 
                      className={`btn-toggle ${farm.is_active ? 'to-stop' : 'to-activate'}`}
                    >
                      {farm.is_active ? 'إيقاف' : 'تفعيل'}
                    </button>
                  </td>
                </tr>
              ))}
              {(!data?.farms || data.farms.length === 0) && (
                <tr><td colSpan={7} className="empty-row">لا توجد مداجن حالياً. أنشئ واحدة جديدة! 🚀</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────── */
/*  لوحة مدير المزرعة (Farm Admin / Worker)         */
/* ───────────────────────────────────────────────── */
function FarmDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    count: '', quantity: '', unit_price: '', reason: '', amount: '',
    description: '', category_id: '1', medicine_name: '', item_id: '',
    prescribed_by: '', start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    daily_quantity: '', notes: ''
  });

  useEffect(() => { fetchSummary(); }, []);

  const isFuel = formData.description === 'تزويد مازوت (ليتر)';
  const isWater = formData.description === 'تعبئة صهريج مياه';

  useEffect(() => {
    if ((isFuel || isWater) && formData.quantity && formData.unit_price) {
      const total = parseFloat(formData.quantity) * parseFloat(formData.unit_price);
      setFormData(prev => ({ ...prev, amount: total.toString() }));
    }
  }, [formData.quantity, formData.unit_price, formData.description, isFuel, isWater]);

  useEffect(() => {
    if (activeModal === 'medicine') fetchInventoryItems();
  }, [activeModal]);

  const fetchInventoryItems = async () => {
    setInvLoading(true);
    try {
      const resp = await api.get('/inventory');
      const meds = resp.data.filter((it: any) => 
        it.type?.name?.includes('دواء') || it.type?.name?.includes('لقاح') || it.type_id === 2
      );
      setInventoryItems(meds);
    } catch (err) { console.error(err); }
    finally { setInvLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const resp = await api.get('/dashboard/summary');
      setData(resp.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleQuickAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentFlock = data?.flocks?.[0];
    if (!currentFlock && activeModal !== 'expense') return;
    setModalLoading(true);
    try {
      if (activeModal === 'mortality') {
        await api.post(`/flocks/${currentFlock.id}/mortalities`, { count: parseInt(formData.count), reason: formData.reason });
      } else if (activeModal === 'feed') {
        await api.post(`/flocks/${currentFlock.id}/feed`, { quantity: parseFloat(formData.quantity) * 50 });
      } else if (activeModal === 'medicine') {
        await api.post(`/flocks/${currentFlock.id}/medicine`, { 
          item_id: formData.item_id, medicine_name: formData.medicine_name,
          prescribed_by: formData.prescribed_by, start_date: formData.start_date,
          end_date: formData.end_date, daily_quantity: parseFloat(formData.daily_quantity),
          notes: formData.notes
        });
      } else if (activeModal === 'expense') {
        await api.post('/accounting/expenses', {
          amount: parseFloat(formData.amount),
          description: formData.description + (formData.notes ? ` (${formData.notes})` : ''),
          category_id: formData.category_id, flock_id: currentFlock?.id,
          date: new Date().toISOString().split('T')[0]
        });
      }
      await fetchSummary();
      setActiveModal(null);
      setFormData({...formData, count: '', quantity: '', amount: '', notes: '', medicine_name: '', item_id: ''});
      alert('✅ تم تسجيل العملية بنجاح.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'حدث خطأ. يرجى التأكد من البيانات.');
    } finally { setModalLoading(false); }
  };

  const currentFlock = useMemo(() => data?.flocks?.[0], [data]);
  const mortalityRate = useMemo(() => {
    if (!currentFlock || !currentFlock.start_count || currentFlock.start_count <= 0) return '0.0';
    const dead = currentFlock.start_count - (currentFlock.current_count || 0);
    const rate = (dead / currentFlock.start_count) * 100;
    return rate.toFixed(1);
  }, [currentFlock]);

  const getSuggestedTemp = (age: number) => {
    if (age <= 3) return 33; if (age <= 7) return 30;
    if (age <= 14) return 27; if (age <= 21) return 24; return 21;
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div className="daily-ops-dashboard animate-fade-in">
      <section className="ops-header">
        <div className="sh-minimal"><div className="line"></div><h3>الإجراءات التشغيلية السريعة</h3></div>
        <div className="action-grid-4">
          <button className="act-btn red" onClick={() => setActiveModal('mortality')}>
            <div className="icon"><HiOutlineArrowTrendingDown /></div><div className="lbl">تسجيل نفوق</div>
          </button>
          <button className="act-btn orange" onClick={() => setActiveModal('feed')}>
            <div className="icon"><HiOutlineScale /></div><div className="lbl">توزيع علف</div>
          </button>
          <button className="act-btn blue" onClick={() => setActiveModal('expense')}>
            <div className="icon"><HiOutlineBanknotes /></div><div className="lbl">صرف مالي</div>
          </button>
          <button className="act-btn teal" onClick={() => setActiveModal('medicine')}>
            <div className="icon"><HiOutlineBeaker /></div><div className="lbl">إضافة دواء</div>
          </button>
        </div>
      </section>

      <section className="active-flock-section">
        <div className="sh-minimal"><div className="line"></div><h3>وضعية الفوج النشط</h3></div>
        <div className="flock-command-card" onClick={() => currentFlock && router.push(`/flocks/${currentFlock.id}`)}>
          <div className="f-top">
            <div className="f-id"><span className="dot pulse"></span>الفوج الحالي: <b className="number-font"># {currentFlock?.batch_number || '---'}</b></div>
            <div className="f-status">نشط تشغيلياً</div>
          </div>
          <div className="f-main-stats">
            <div className="ms-item"><label>العمر الحالي</label><div className="v number-font">{currentFlock?.age_days || 0} يوم</div></div>
            <div className="ms-item border-x"><label>العدد الحي الحالي</label><div className="v number-font">{(currentFlock?.current_count || 0).toLocaleString()} <small>طير</small></div></div>
            <div className="ms-item"><label>نسبة النفوق</label><div className="v number-font text-red">{mortalityRate}%</div></div>
          </div>
          <div className="f-footer">
            <span>تاريخ البداية: <b className="number-font">{currentFlock?.created_at?.split('T')[0] || '---'}</b></span>
            <span className="arrow-go">دخول السجل التفصيلي <HiOutlineArrowLongLeft /></span>
          </div>
        </div>
      </section>

      <section className="daily-metrics-section">
        <div className="sh-minimal"><div className="line"></div><h3>مؤشرات التشغيل اليومي</h3></div>
        <div className="metrics-grid">
          <div className="m-card">
            <div className="m-icon red"><HiOutlineExclamationCircle /></div>
            <label>نفوق اليوم</label>
            <div className="val number-font text-red">{currentFlock?.today_mortality || 0}</div>
            <div className="hint">المفقود منذ الفجر</div>
          </div>
          <div className="m-card">
            <div className="m-icon orange"><HiOutlineBanknotes /></div>
            <label>مصروف اليوم</label>
            <div className="val number-font">{(currentFlock?.today_expense || 0).toLocaleString()} <small>ل.س</small></div>
            <div className="hint">نثريات وسكر ومياه</div>
          </div>
          <div className="m-card highlight-box">
            <div className="m-icon green"><HiOutlineCircleStack /></div>
            <label>العلف المقدر (أكياس)</label>
            <div className="val number-font text-green">{currentFlock?.estimated_feed_bags || 0}</div>
            <div className="hint">حسب عمر {currentFlock?.age_days || 0} يوم</div>
          </div>
          <div className="m-card">
            <div className="m-icon blue"><HiOutlineSparkles /></div>
            <label>الحرارة المقترحة</label>
            <div className="val number-font text-blue">{currentFlock ? getSuggestedTemp(currentFlock.age_days) : '--'}°C</div>
            <div className="hint">المعيار المثالي للعمر</div>
          </div>
          <div className="m-card weather-box">
            <div className="m-icon slate"><HiOutlineCloud /></div>
            <label>طقس المزرعة الآن</label>
            <div className="val number-font">28°C</div>
            <div className="hint">غائم جزئياً | الرقة</div>
          </div>
        </div>
      </section>

      {activeModal && (
        <OpsModals 
          activeModal={activeModal} setActiveModal={setActiveModal}
          formData={formData} setFormData={setFormData}
          onSubmit={handleQuickAction} loading={modalLoading}
          inventoryItems={inventoryItems} invLoading={invLoading}
        />
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────── */
/*  الصفحة الرئيسية: تحديد اللوحة حسب الدور        */
/* ───────────────────────────────────────────────── */
export default function DashboardHome() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setReady(true);
  }, []);

  if (!ready) return <div className="loading-state"><div className="spinner"></div></div>;

  const isSuperAdmin = user?.roles?.includes('super_admin');
  return isSuperAdmin ? <SuperAdminDashboard /> : <FarmDashboard />;
}
