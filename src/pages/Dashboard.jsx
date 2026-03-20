// src/pages/Dashboard.jsx
import React, { useMemo } from 'react';
import { StatCard, Card, SectionHeader, SimilarityBar, Badge } from '../components/ui';
import { STATUS_CONFIG } from '../data/mockData';

const FIELD_COLORS = [
  '#1A56DB','#0E9F6E','#F59E0B','#8B5CF6','#EF4444',
  '#06B6D4','#F97316','#84CC16','#EC4899','#6B7280',
];

function FieldBar({ name, count, max, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-700)' }}>{name}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', minWidth: 20, textAlign: 'right' }}>{count}</span>
      </div>
      <div style={{ height: 5, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${max > 0 ? (count / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
}

export default function Dashboard({ stats, theses, onOpenDetail, onNavigate }) {
  const recent = theses.filter(t => t.status === 'approved').slice(0, 5);

  // Tính thống kê lĩnh vực từ dữ liệu thật
  const fieldStats = useMemo(() => {
    const map = {};
    theses.filter(t => t.status === 'approved').forEach((t) => {
      const f = t.field || 'Khác';
      map[f] = (map[f] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({ name, count, color: FIELD_COLORS[i % FIELD_COLORS.length] }));
  }, [theses]);

  const maxField = fieldStats.length > 0 ? Math.max(...fieldStats.map((f) => f.count)) : 1;

  return (
    <div className="animate-fade-in">
      {/* Stats — thu nhỏ lại */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { iconBg: 'var(--primary-light)', stroke: 'var(--primary)', value: stats.total, label: 'Tổng đề tài',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
          { iconBg: 'var(--success-light)', value: stats.students, label: 'Sinh viên',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
          { iconBg: 'var(--warning-light)', value: stats.warnings, label: 'Cảnh báo trùng lặp',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
          { iconBg: 'var(--danger-light)', value: stats.highRisk, label: 'Trùng cao >70%',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-100)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 2 cột: đề tài gần đây (rộng hơn) + lĩnh vực (hẹp hơn) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Đề tài gần đây */}
        <Card>
          <SectionHeader title="Đề tài gần đây">
            <button onClick={() => onNavigate && onNavigate('theses')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Xem tất cả</button>
          </SectionHeader>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--gray-400)', fontSize: 13 }}>Chưa có đề tài nào</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: 'var(--gray-50)' }}>
                <tr>
                  {['Tên đề tài', 'Sinh viên', 'Trùng lặp', 'Trạng thái'].map((h) => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => {
                  const st = STATUS_CONFIG[t.status] || { label: t.status, color: 'gray' };
                  return (
                    <tr key={t.id} style={{ borderTop: '1px solid var(--gray-100)' }}
                      onMouseEnter={(e) => Array.from(e.currentTarget.cells).forEach(c => c.style.background = 'var(--gray-50)')}
                      onMouseLeave={(e) => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '')}
                    >
                      <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                        <span onClick={() => onOpenDetail(t.id)}
                          style={{ fontWeight: 600, color: 'var(--gray-800)', cursor: 'pointer', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          onMouseEnter={(e) => { e.target.style.color = 'var(--primary)'; e.target.style.textDecoration = 'underline'; }}
                          onMouseLeave={(e) => { e.target.style.color = 'var(--gray-800)'; e.target.style.textDecoration = 'none'; }}
                        >{t.title}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12, whiteSpace: 'nowrap' }}>{t.student}</td>
                      <td style={{ padding: '10px 14px', minWidth: 110 }}><SimilarityBar value={t.similarity || 0} /></td>
                      <td style={{ padding: '10px 14px' }}><Badge color={st.color}>{st.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* Phân bố lĩnh vực — thu nhỏ, số liệu thật */}
        <Card>
          <SectionHeader title="Phân bố lĩnh vực" />
          <div style={{ padding: '12px 16px' }}>
            {fieldStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', fontSize: 13 }}>Chưa có dữ liệu</div>
            ) : (
              fieldStats.map((f) => (
                <FieldBar key={f.name} name={f.name} count={f.count} max={maxField} color={f.color} />
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
// Note: Dashboard now receives onApprove, onReject, onDelete props
// but they are used in ThesesList - Dashboard just shows stats and recent approved theses
