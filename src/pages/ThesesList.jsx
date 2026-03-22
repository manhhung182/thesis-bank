// src/pages/ThesesList.jsx
import React, { useState } from 'react';
import { Card, SectionHeader, Badge, SimilarityBar, FilterTabs, EmptyState, Button, Spinner } from '../components/ui';

const STATUS_CONFIG = {
  approved:    { label: 'Đã duyệt',    color: 'green' },
  pending:     { label: 'Chờ duyệt',   color: 'yellow' },
  'in-progress': { label: 'Đang thực hiện', color: 'blue' },
  rejected:    { label: 'Không duyệt', color: 'red' },
};

const TYPE_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'do_an', label: 'Tốt nghiệp' },
  { value: 'nckh', label: 'NCKH SV' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'rejected', label: 'Không duyệt' },
];

export default function ThesesList({ theses, loading, filterType, setFilterType, filterField, setFilterField, onOpenDetail, onApprove, onReject, onDelete }) {
  const [actionLoading, setActionLoading] = useState(null);

  // Lọc theo tab trạng thái
  const displayed = theses.filter(t => {
    if (filterType === 'pending') return t.status === 'pending';
    if (filterType === 'rejected') return t.status === 'rejected';
    if (filterType === 'do_an') return t.type === 'do_an';
    if (filterType === 'nckh') return t.type === 'nckh';
    return true;
  }).sort((a, b) => {
    if (b.year !== a.year) return (b.year || 0) - (a.year || 0);
    return (a.title || '').localeCompare(b.title || '', 'vi');
  });

  const handleApprove = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Duyệt đề tài này?')) return;
    setActionLoading(id + '_approve');
    try { await onApprove(id); } finally { setActionLoading(null); }
  };

  const handleReject = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Không duyệt đề tài này? Đề tài sẽ được đánh dấu "Không duyệt" và lưu lại.')) return;
    setActionLoading(id + '_reject');
    try { await onReject(id); } finally { setActionLoading(null); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Xóa hoàn toàn đề tài này khỏi hệ thống? Hành động này không thể hoàn tác.')) return;
    setActionLoading(id + '_delete');
    try { await onDelete(id); } finally { setActionLoading(null); }
  };

  return (
    <div className="animate-fade-in">
      <Card>
        <SectionHeader title={`Danh sách đề tài (${displayed.length})`}>
          <FilterTabs
            tabs={TYPE_TABS}
            active={filterType}
            onChange={setFilterType}
          />
        </SectionHeader>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12, color: 'var(--gray-400)', fontSize: 14 }}>
            <Spinner size={20} /> Đang tải...
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState icon="📭" title="Không có đề tài nào" description="Thử thay đổi bộ lọc hoặc tìm kiếm" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: 'var(--gray-50)' }}>
                <tr>
                  {['Tên đề tài', 'Loại', 'Sinh viên', 'GVHD', 'Năm', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map(t => {
                  const st = STATUS_CONFIG[t.status] || { label: t.status, color: 'gray' };
                  const isPending = t.status === 'pending';
                  return (
                    <tr key={t.id}
                      style={{ borderTop: '1px solid var(--gray-100)', transition: 'background .1s', background: isPending ? '#FFFBEB' : '' }}
                      onMouseEnter={e => e.currentTarget.style.background = isPending ? '#FEF9C3' : 'var(--gray-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = isPending ? '#FFFBEB' : ''}
                    >
                      <td style={{ padding: '11px 14px', maxWidth: 240 }}>
                        <span onClick={() => onOpenDetail(t.id)}
                          style={{ fontWeight: 600, color: 'var(--gray-800)', cursor: 'pointer', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                          onMouseLeave={e => e.target.style.color = 'var(--gray-800)'}
                        >{t.title}</span>
                        {t.field && <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.field}</span>}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <Badge color={t.type === 'do_an' ? 'blue' : 'gray'}>{t.type === 'do_an' ? 'Tốt nghiệp' : 'NCKH'}</Badge>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--gray-600)' }}>
                        <div style={{ fontWeight: 500 }}>{t.student}</div>
                        {t.allStudentNames?.length > 1 && (
                          <div style={{ color: 'var(--gray-400)', marginTop: 2, fontSize: 11 }}>
                            +{t.allStudentNames.length - 1} thành viên khác
                          </div>
                        )}
                        <div style={{ color: 'var(--gray-400)', marginTop: 1 }}>{t.mssv}</div>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{t.advisor || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--gray-500)' }}>{t.year}</td>
                      <td style={{ padding: '11px 14px' }}><Badge color={st.color}>{st.label}</Badge></td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {/* Nút duyệt / không duyệt chỉ hiện khi pending */}
                          {isPending && (
                            <>
                              <button onClick={e => handleApprove(e, t.id)} disabled={!!actionLoading}
                                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid var(--success)', background: 'var(--success-light)', color: 'var(--success)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {actionLoading === t.id + '_approve' ? <Spinner size={12} /> : '✓'} Duyệt
                              </button>
                              <button onClick={e => handleReject(e, t.id)} disabled={!!actionLoading}
                                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid var(--warning)', background: 'var(--warning-light)', color: 'var(--warning)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {actionLoading === t.id + '_reject' ? <Spinner size={12} /> : '✗'} Không duyệt
                              </button>
                            </>
                          )}
                          {/* Nút xem chi tiết */}
                          <button onClick={() => onOpenDetail(t.id)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--gray-200)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          {/* Nút xóa */}
                          <button onClick={e => handleDelete(e, t.id)} disabled={!!actionLoading}
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--danger)', background: 'var(--danger-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {actionLoading === t.id + '_delete' ? <Spinner size={12} /> : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
