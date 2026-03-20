// src/pages/Analytics.jsx
import React, { useMemo, useState } from 'react';
import { Card, SectionHeader, Badge, SimilarityBar } from '../components/ui';
import { exportThesesExcel } from '../lib/exportExcel';

const FIELD_COLORS = ['#1A56DB','#0E9F6E','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#F97316','#84CC16'];

export default function Analytics({ stats, theses, onOpenDetail }) {
  const [selectedKhoa, setSelectedKhoa] = useState('');
  const [exporting, setExporting] = useState(false);

  // Thu thập danh sách khóa từ dữ liệu
  const khoaList = useMemo(() => {
    const set = new Set();
    theses.filter(t => t.status === 'approved').forEach(t => {
      const classes = t.allStudents?.length > 0
        ? t.allStudents.map(s => s?.class).filter(Boolean)
        : (t.class ? [t.class] : []);
      classes.forEach(c => {
        const m = c.match(/K(\d{2,3})/i);
        if (m) set.add(m[1]);
      });
    });
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [theses]);

  const handleExport = async () => {
    setExporting(true);
    try {
      exportThesesExcel(theses, selectedKhoa || null);
    } catch(e) {
      alert('Lỗi xuất file: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  // Thống kê theo năm — chỉ đề tài đã duyệt
  const yearStats = useMemo(() => {
    const map = {};
    theses.filter(t => t.status === 'approved').forEach(t => {
      const y = t.year || 'Khác';
      map[y] = (map[y] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year, count }));
  }, [theses]);

  // Thống kê theo lĩnh vực — chỉ đề tài đã duyệt
  const fieldStats = useMemo(() => {
    const map = {};
    theses.filter(t => t.status === 'approved').forEach(t => {
      const f = t.field || 'Khác';
      map[f] = (map[f] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({ name, count, color: FIELD_COLORS[i % FIELD_COLORS.length] }));
  }, [theses]);

  // Thống kê theo loại
  const doAnCount = theses.filter(t => t.status === 'approved' && t.type === 'do_an').length;
  const nckhCount = theses.filter(t => t.status === 'approved' && t.type === 'nckh').length;

  const maxYear = yearStats.length > 0 ? Math.max(...yearStats.map(y => y.count)) : 1;
  const maxField = fieldStats.length > 0 ? Math.max(...fieldStats.map(f => f.count)) : 1;

  const highRiskTheses = theses.filter(t => (t.similarity || 0) >= 50 && t.status === 'approved');

  return (
    <div className="animate-fade-in">
      {/* Stats */}
      {/* Export bar */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 20px', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-100)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Xuất báo cáo Excel:</span>
          <select
            value={selectedKhoa}
            onChange={e => setSelectedKhoa(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--gray-200)', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: '#fff', cursor: 'pointer', color: 'var(--gray-700)' }}
          >
            <option value="">Tất cả khóa</option>
            {khoaList.map(k => <option key={k} value={k}>Khóa {k}</option>)}
          </select>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            {selectedKhoa
              ? `Xuất đề tài khóa ${selectedKhoa}`
              : 'Xuất tổng hợp + tất cả khóa'}
          </span>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--success)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: exporting ? .7 : 1 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {exporting ? 'Đang xuất...' : 'Tải xuống Excel'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { bg: 'var(--primary-light)', value: stats.approved, label: 'Đề tài đã duyệt',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
          { bg: 'var(--warning-light)', value: stats.pending, label: 'Chờ duyệt',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { bg: 'var(--danger-light)', value: stats.rejected, label: 'Không duyệt',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
          { bg: 'var(--success-light)', value: stats.students, label: 'Sinh viên tham gia',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-100)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Biểu đồ theo năm */}
        <Card>
          <SectionHeader title="Đề tài theo năm" />
          <div style={{ padding: 20 }}>
            {yearStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', fontSize: 13 }}>Chưa có dữ liệu</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
                {yearStats.map(y => (
                  <div key={y.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-600)' }}>{y.count}</span>
                    <div style={{ width: '100%', background: 'var(--primary)', borderRadius: '4px 4px 0 0', height: `${(y.count / maxYear) * 120}px`, opacity: .75 + (y.count / maxYear) * .25, transition: 'height .5s ease', minHeight: 4 }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{y.year}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Top lĩnh vực */}
        <Card>
          <SectionHeader title="Top lĩnh vực nghiên cứu" />
          <div style={{ padding: '14px 20px' }}>
            {fieldStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', fontSize: 13 }}>Chưa có dữ liệu</div>
            ) : fieldStats.map((f, i) => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', minWidth: 18 }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)' }}>{f.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)' }}>{f.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(f.count / maxField) * 100}%`, height: '100%', background: f.color, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Loại đề tài */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Đồ án tốt nghiệp', count: doAnCount, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'NCKH Sinh viên', count: nckhCount, color: 'var(--success)', bg: 'var(--success-light)' },
        ].map(t => (
          <div key={t.label} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: t.color }}>{t.count}</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{t.label}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                {stats.approved > 0 ? `${Math.round((t.count / stats.approved) * 100)}% tổng đề tài` : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cảnh báo trùng lặp */}
      <Card>
        <SectionHeader title={`Đề tài có độ tương đồng cao (${highRiskTheses.length})`} />
        {highRiskTheses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--gray-400)', fontSize: 13 }}>
            ✅ Không có đề tài nào có độ tương đồng cao
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--gray-50)' }}>
              <tr>{['Tên đề tài','Sinh viên','Năm','Độ tương đồng',''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {highRiskTheses.map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--gray-100)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '12px 16px' }}>
                    <span onClick={() => onOpenDetail(t.id)} style={{ fontWeight: 600, color: 'var(--gray-800)', cursor: 'pointer' }}
                      onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                      onMouseLeave={e => e.target.style.color = 'var(--gray-800)'}>{t.title}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-600)' }}>{t.student}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--gray-500)' }}>{t.year}</td>
                  <td style={{ padding: '12px 16px', minWidth: 140 }}><SimilarityBar value={t.similarity || 0} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => onOpenDetail(t.id)} style={{ padding: '4px 10px', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--gray-600)' }}>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
