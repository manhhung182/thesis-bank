// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Input, Button, Spinner } from '../components/ui';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Vui lòng nhập đầy đủ email và mật khẩu'); return; }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError('Email hoặc mật khẩu không đúng');
    } else {
      onLogin(data.user);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="3" width="8" height="8" rx="1.5"/>
              <rect x="13" y="3" width="8" height="8" rx="1.5"/>
              <rect x="3" y="13" width="8" height="8" rx="1.5"/>
              <rect x="13" y="13" width="8" height="8" rx="1.5"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>ResearchHub</div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Đăng nhập quản lý khoa</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Email</label>
            <Input
              type="email"
              placeholder="admin@khoa.edu.vn"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Mật khẩu</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-light)', borderRadius: 8, fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: 11, fontSize: 14 }}>
            {loading ? <Spinner size={16} /> : null}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 12, color: 'var(--gray-500)', textAlign: 'center' }}>
          Sinh viên tra cứu đề tài không cần đăng nhập —
          <button onClick={() => window.location.href = '/'} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', marginLeft: 4 }}>
            Vào trang tra cứu
          </button>
        </div>
      </div>
    </div>
  );
}
