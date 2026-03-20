// src/components/Sidebar.jsx
import React from 'react';

// ── Tuỳ chỉnh thông tin khoa tại đây ──────────────────
const FACULTY_NAME = 'Quản trị viên';
const FACULTY_DEPT = 'Khoa KHCB';       // ← Sửa tên khoa ở đây
const FACULTY_INITIALS = 'QT';
// ──────────────────────────────────────────────────────

export default function Sidebar({ activePage, onNavigate, thesisCount }) {
  const NAV_ITEMS = [
    {
      section: 'Tổng quan',
      items: [
        { id: 'dashboard', label: 'Dashboard', badge: null,
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
        { id: 'theses', label: 'Kho đề tài', badge: thesisCount || null,
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
        { id: 'check', label: 'Kiểm tra trùng lặp', badge: null,
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
      ],
    },
    {
      section: 'Quản lý',
      items: [
        { id: 'submit', label: 'Nộp đề tài mới', badge: null,
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
        { id: 'analytics', label: 'Thống kê & Báo cáo', badge: null,
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
      ],
    },
  ];

  return (
    <aside style={{
      width: 240, background: '#fff', borderRight: '1px solid var(--gray-200)',
      display: 'flex', flexDirection: 'column', position: 'fixed',
      top: 0, left: 0, height: '100vh', zIndex: 100,
    }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{
          width: 36, height: 36, background: 'var(--primary)', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="3" y="3" width="8" height="8" rx="1.5"/>
            <rect x="13" y="3" width="8" height="8" rx="1.5"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5"/>
            <rect x="13" y="13" width="8" height="8" rx="1.5"/>
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.2 }}>ResearchHub</div>
        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>Ngân hàng đề tài khoa học</div>
      </div>

      <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((group) => (
          <div key={group.section} style={{ padding: '0 12px 8px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.6px', padding: '8px 8px 4px' }}>
              {group.section}
            </div>
            {group.items.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--gray-600)',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    border: 'none', width: '100%', textAlign: 'left',
                    fontFamily: 'inherit', transition: 'all .15s', marginBottom: 1,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--gray-50)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ opacity: isActive ? 1 : .7, color: isActive ? 'var(--primary)' : 'inherit', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>{FACULTY_INITIALS}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{FACULTY_NAME}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{FACULTY_DEPT}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
