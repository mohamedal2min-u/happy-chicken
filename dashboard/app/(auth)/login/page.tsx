'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineShieldCheck, HiOutlineFingerPrint, HiOutlineCheckBadge } from "react-icons/hi2";
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // تفعيل التثبيت لتجنب مشاكل الهيدرة (تم نقله للـ Layout)
  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {

  return (
    <div className="login-root">
      <div className="login-overlay"></div>
      
      <div className="login-card-container">
        <div className="glass-card login-card animate-scale-up">
          <div className="logo-section">
            <div className="icon-badge">
              <img src="/icon.png" alt="Logo" />
            </div>
            <h1>دجاجتي</h1>
            <p>مركز الإدارة والعمليات المتكامل</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="error-alert">{error}</div>}

            <div className="input-field">
              <label><HiOutlineEnvelope /> البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="example@farm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-field">
              <label><HiOutlineLockClosed /> كلمة المرور</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-options">
              <label className="checkbox-container">
                <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                />
                <span className="checkmark"></span>
                تذكر بياناتي
              </label>
              <a href="#" className="forgot-link">نسيت كلمة المرور؟</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'جاري التحقق...' : 'دخول للنظام'}
            </button>
          </form>

          {/* Security & Warranty Section */}
          <div className="security-badges">
             <div className="badge-item">
                <HiOutlineShieldCheck />
                <span>حماية مشفرة</span>
             </div>
             <div className="badge-item">
                <HiOutlineCheckBadge />
                <span>نظام أصيل</span>
             </div>
             <div className="badge-item">
                <HiOutlineFingerPrint />
                <span>دخول آمن</span>
             </div>
          </div>

          <div className="login-footer">
            <p>© 2026 نظام دجاجتي - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </div>
    </div>
  );
}
