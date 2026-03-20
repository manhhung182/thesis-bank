// src/components/Topbar.jsx
import React from 'react';
import { Button } from './ui';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  theses: 'Kho đề tài',
  check: 'Kiểm tra trùng lặp',
  submit: 'Nộp đề tài mới',
  analytics: 'Thống kê & Báo cáo',
};

export default function Topbar({ activePage, search, onSearch, onNavigate, user, onLogout }) {
  return (
    <header style={{
      background: '#fff', borderBottom: '1px solid var(--gray-200)',
      padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
      gap: 16, position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', minWidth: 160 }}>
        {PAGE_TITLES[activePage] || activePage}
      </div>

      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--gray-400)' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm đề tài, sinh viên, giảng viên..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ width: '100%', padding: '7px 12px 7px 34px', border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'var(--gray-50)', color: 'var(--gray-700)', outline: 'none' }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = '#fff'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--gray-200)'; e.target.style.background = 'var(--gray-50)'; }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <Button variant="outline" onClick={() => onNavigate('check')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Kiểm tra AI
        </Button>
        <Button variant="primary" onClick={() => onNavigate('submit')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm đề tài
        </Button>
        {/* User info + logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid var(--gray-200)' }}>
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{user.email}</span>
            <button onClick={onLogout}
              style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: '1px solid var(--danger)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
