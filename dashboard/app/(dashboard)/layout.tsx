'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('light');

  const [user, setUser] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Auth Guard - منع الدخول غير المصرح به
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedUser = localStorage.getItem('user');
    const savedFarms = localStorage.getItem('farms');
    const savedFarmId = localStorage.getItem('current_farm_id');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedFarms) setFarms(JSON.parse(savedFarms));
    if (savedFarmId) setSelectedFarmId(savedFarmId);
  }, [router]);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedFarmId(newId);
    localStorage.setItem('current_farm_id', newId);
    window.location.reload(); // إعادة التحميل لتطبيق الفلترة الجديدة
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const isSuperAdmin = user?.roles?.includes('super_admin');

  const navItems = (!mounted || !user) 
    ? [] 
    : isSuperAdmin
    ? [
        { name: 'الرئيسة', path: '/', icon: '🏠' },
      ]
    : [
        { name: 'الرئيسة', path: '/', icon: '🏠' },
        { name: 'الأفواج', path: '/flocks', icon: '🐣' },
        { name: 'المخزن', path: '/inventory', icon: '📦' },
        { name: 'الشركاء', path: '/partners', icon: '🤝' },
        { name: 'المبيعات', path: '/sales', icon: '📈' },
        { name: 'المحاسبة', path: '/expenses', icon: '⚖️' },
      ];


  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('farms');
    localStorage.removeItem('current_farm_id');
    router.push('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar (Desktop) */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ marginBottom: '20px', padding: '10px' }}>
          <h2 style={{ color: 'var(--primary)', fontWeight: '900' }}>دجاجتي 🐓</h2>
          <p style={{ fontSize: '12px', opacity: 0.7 }}>نظام إدارة المزارع</p>
        </div>


        <nav>
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className={`nav-link ${pathname === item.path ? 'active' : ''}`}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <button onClick={toggleTheme} className="btn-theme-toggle" title="تحويل اللون">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <button onClick={handleLogout} className="nav-link" style={{ marginTop: '20px', border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}>
          <span>🚪</span> تسجيل الخروج
        </button>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className={`m-link ${pathname === item.path ? 'active' : ''}`}>
             <span className="icon">{item.icon}</span>
             <span>{item.name}</span>
          </Link>
        ))}
        {/* Toggle Theme Mobile */}
        <button onClick={toggleTheme} className="m-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
           <span className="icon">{theme === 'light' ? '🌙' : '☀️'}</span>
           <span>المظهر</span>
        </button>
      </nav>
    </div>
  );
}
