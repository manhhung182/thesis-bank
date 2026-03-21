// src/components/ThesisDetail.jsx
import React, { useState } from 'react';
import { Badge, Button, Spinner, Input, Textarea, Select } from './ui';
import { useAICheck } from '../hooks/useTheses';
import { findSimilar } from '../lib/similarity';
import { FIELDS, TYPES } from '../data/constants';

const STATUS_CONFIG = {
  approved:      { label: 'Đã duyệt',       color: 'green' },
  pending:       { label: 'Chờ duyệt',       color: 'yellow' },
  'in-progress': { label: 'Đang thực hiện',  color: 'blue' },
  rejected:      { label: 'Không duyệt',     color: 'red' },
};


const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function DetailItem({ label, value }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>{label}</label>
      <span style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

export default function ThesisDetail({ thesis, allTheses, onClose, onUpdate, isAdmin }) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFile, setEditFile] = useState(null);
  const [form, setForm] = useState({
    title: thesis?.title || '',
    type: thesis?.type || 'do_an',
    field: thesis?.field || '',
    year: thesis?.year || currentYear,
    abstract: thesis?.abstract || '',
    keywords: thesis?.keywords?.join(', ') || '',
    advisor: thesis?.advisor || '',
    student: thesis?.student || '',
    mssv: thesis?.mssv || '',
    class: thesis?.class || '',
    budget: thesis?.budget || '',
    award: thesis?.award || '',
  });
  const { result, loading: aiLoading, error: aiError, check } = useAICheck();

  if (!thesis) return null;

  const status = STATUS_CONFIG[thesis.status] || { label: thesis.status, color: 'gray' };
  const similar = findSimilar(thesis, allTheses, 5);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Vui lòng nhập tên đề tài'); return; }
    setSaving(true);
    try {
      const updates = {
        title: form.title,
        type: form.type,
        field: form.field,
        year: Number(form.year),
        abstract: form.abstract,
        keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        budget: form.budget || null,
        award: form.award || null,
      };
      // Upload file mới nếu có
      if (editFile) {
        const { supabase } = await import('../lib/supabase');
        const ext = editFile.name.split('.').pop();
        const path = `${thesis.id}/baocao.${ext}`;
        await supabase.storage.from('thesis-files').upload(path, editFile, { upsert: true });
        updates.file_url = path;
      }
      await onUpdate(thesis.id, updates, { advisor: form.advisor, student: form.student, mssv: form.mssv, class: form.class });
      setEditMode(false);
    } catch (e) {
      alert('Lỗi khi lưu: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn .2s ease' }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 700, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--gray-100)', position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '18px 18px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              {editMode ? (
                <Input value={form.title} onChange={set('title')} style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }} />
              ) : (
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.4, marginBottom: 8 }}>{thesis.title}</h2>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge color={thesis.type === 'do_an' ? 'blue' : 'gray'}>{thesis.type === 'do_an' ? 'Tốt nghiệp' : 'NCKH'}</Badge>
                <Badge color={status.color}>{status.label}</Badge>
                {thesis.field && <Badge color="gray">{thesis.field}</Badge>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {/* Nút Sửa / Lưu — chỉ hiện với admin */}
              {isAdmin && !editMode && (
                <button onClick={() => setEditMode(true)}
                  style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Sửa
                </button>
              )}
              {isAdmin && editMode && (
                <>
                  <button onClick={() => setEditMode(false)}
                    style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--gray-200)', background: '#fff', color: 'var(--gray-600)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Hủy
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {saving ? <Spinner size={12} /> : null}
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </>
              )}
              <button onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--gray-200)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {editMode ? (
            /* EDIT MODE */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Lĩnh vực</label>
                  <Input value={form.field} onChange={set('field')} list="edit-field-list" placeholder="Chọn hoặc gõ lĩnh vực..." />
                  <datalist id="edit-field-list">{FIELDS.map(f => <option key={f} value={f} />)}</datalist>
                </div>
                <div>
                  <label style={labelStyle}>Loại đề tài</label>
                  <Select value={form.type} onChange={set('type')}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </div>
                <div>
                  <label style={labelStyle}>Năm</label>
                  <Select value={form.year} onChange={set('year')}>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </Select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Tóm tắt</label>
                <Textarea value={form.abstract} onChange={set('abstract')} rows={4} placeholder="Tóm tắt đề tài..." />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Từ khóa (phân cách bằng dấu phẩy)</label>
                <Input value={form.keywords} onChange={set('keywords')} placeholder="VD: deep learning, nhận diện khuôn mặt" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '4px 0 10px' }}>Thông tin sinh viên & GVHD</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Họ tên sinh viên</label>
                  <Input value={form.student} onChange={set('student')} placeholder="Họ và tên" />
                </div>
                <div>
                  <label style={labelStyle}>MSSV</label>
                  <Input value={form.mssv} onChange={set('mssv')} placeholder="B20DCAT001" />
                </div>
                <div>
                  <label style={labelStyle}>Lớp</label>
                  <Input value={form.class} onChange={set('class')} placeholder="D20CQCN01" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Giảng viên hướng dẫn</label>
                <Input value={form.advisor} onChange={set('advisor')} placeholder="Tên giảng viên" />
              </div>
              {form.type === 'nckh' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Kinh phí (VNĐ)</label>
                    <Input type="number" value={form.budget} onChange={set('budget')} placeholder="VD: 5000000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Giải thưởng</label>
                    <Input value={form.award} onChange={set('award')} placeholder="VD: Giải Ba cấp trường 2024" />
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '4px 0 10px' }}>File báo cáo</div>
              <div
                onClick={() => document.getElementById('edit-file-input').click()}
                style={{ border: `2px dashed ${editFile ? 'var(--success)' : 'var(--gray-200)'}`, borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer', background: editFile ? 'var(--success-light)' : 'transparent', transition: 'all .2s', marginBottom: 4 }}
                onMouseEnter={e => { if (!editFile) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { if (!editFile) e.currentTarget.style.borderColor = 'var(--gray-200)'; }}
              >
                <input id="edit-file-input" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setEditFile(e.target.files[0])} />
                <div style={{ fontSize: 13, fontWeight: 600, color: editFile ? 'var(--success)' : 'var(--gray-600)' }}>
                  {editFile ? `✅ ${editFile.name}` : thesis.file_url ? '📎 Đã có file — click để thay thế' : 'Tải lên file báo cáo (PDF, DOCX)'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>Tối đa 50MB</div>
              </div>
            </>
          ) : (
            /* VIEW MODE */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>
                    {thesis.allStudents?.length > 1 ? `Nhóm sinh viên (${thesis.allStudents.length})` : 'Sinh viên'}
                  </label>
                  {thesis.allStudents?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {thesis.allStudents.map((s, i) => s && (
                        <div key={i} style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 500 }}>
                          {s.full_name}
                          {i === 0 && thesis.allStudents.length > 1 && <span style={{ fontSize: 11, color: 'var(--primary)', marginLeft: 6, fontWeight: 600 }}>chủ nhiệm</span>}
                          <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 6 }}>{s.mssv}</span>
                          {s.class && <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 4 }}>· {s.class}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 500 }}>{thesis.student || '—'}</span>
                  )}
                </div>
                <DetailItem label="Giảng viên hướng dẫn" value={thesis.advisor} />
                <DetailItem label="Năm" value={thesis.year} />
                <DetailItem label="MSSV" value={thesis.mssv} />
                {thesis.budget && <DetailItem label="Kinh phí" value={`${Number(thesis.budget).toLocaleString('vi-VN')} VNĐ`} />}
                {thesis.award && <DetailItem label="Giải thưởng" value={thesis.award} />}
              </div>

              {thesis.keywords?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 8 }}>Từ khóa</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {thesis.keywords.map(k => (
                      <span key={k} style={{ padding: '3px 10px', background: 'var(--gray-100)', borderRadius: 20, fontSize: 12, color: 'var(--gray-600)' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {thesis.abstract && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 8 }}>Tóm tắt</label>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7, background: 'var(--gray-50)', padding: 14, borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                    {thesis.abstract}
                  </div>
                </div>
              )}

              {similar.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 10 }}>Đề tài tương tự trong kho</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {similar.map(s => (
                      <div key={s.id} style={{ padding: 12, border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontWeight: 600, color: 'var(--gray-800)', flex: 1 }}>{s.title}</div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.simScore >= 70 ? 'var(--danger)' : s.simScore >= 40 ? 'var(--warning)' : 'var(--success)', marginLeft: 10, flexShrink: 0 }}>{s.simScore}%</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', display: 'flex', gap: 8 }}>
                          <span>{s.student}</span><span>•</span><span>{s.year}</span><span>•</span><span>{s.field}</span>
                        </div>
                        <div style={{ marginTop: 6, height: 4, background: 'var(--gray-100)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: s.simScore + '%', height: '100%', background: s.simScore >= 70 ? 'var(--danger)' : s.simScore >= 40 ? 'var(--warning)' : 'var(--success)', borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis — chỉ admin */}
              {isAdmin && (
                <>
                  {!result && !aiLoading && (
                    <Button variant="primary" onClick={() => check(thesis.title, thesis.abstract, allTheses)} style={{ width: '100%', justifyContent: 'center', padding: 10 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      Phân tích AI trùng lặp
                    </Button>
                  )}
                  {aiLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'var(--gray-50)', borderRadius: 8 }}>
                      <Spinner /> <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>AI đang phân tích...</span>
                    </div>
                  )}
                  {result && (
                    <div style={{ background: 'var(--primary-light)', border: '1px solid rgba(26,86,219,.15)', borderRadius: 10, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)' }}>Kết quả phân tích AI</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{result}</div>
                    </div>
                  )}
                  {aiError && <div style={{ padding: 12, background: 'var(--danger-light)', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>{aiError}</div>}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
