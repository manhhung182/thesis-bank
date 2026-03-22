// src/pages/PublicPage.jsx
import React, { useState, useMemo } from 'react';
import { Badge, SimilarityBar, Button, Input, Textarea, Select, Spinner, Card, SectionHeader } from '../components/ui';
import ThesisDetail from '../components/ThesisDetail';
import { FIELDS, TYPES } from '../data/constants';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
const FIELD_COLORS = ['#1A56DB','#0E9F6E','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#F97316','#84CC16'];

function StatBox({ icon, value, label, bg }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #E5E7EB' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function PublicPage({ theses, loading, onSubmit, onShowLogin }) {
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'do_an', field: '', abstract: '', keywords: '', year: currentYear, budget: '', award: '' });
  const [students, setStudents] = useState([{ full_name: '', mssv: '', class: '' }]);
  const [advisorName, setAdvisorName] = useState('');
  const [file, setFile] = useState(null);
  const [selectedThesis, setSelectedThesis] = useState(null);

  const approvedTheses = useMemo(() => theses.filter(t => t.status === 'approved'), [theses]);

  const filtered = useMemo(() => approvedTheses.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.title?.toLowerCase().includes(q) ||
      t.student?.toLowerCase().includes(q) ||
      t.advisor?.toLowerCase().includes(q) ||
      t.keywords?.some(k => k.toLowerCase().includes(q)) ||
      t.allStudentNames?.some(n => n.toLowerCase().includes(q)) ||
      t.allStudentMSSV?.some(m => m.toLowerCase().includes(q)) ||
      t.field?.toLowerCase().includes(q);
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchType;
  }).sort((a, b) => {
    if (b.year !== a.year) return (b.year || 0) - (a.year || 0);
    return (a.title || '').localeCompare(b.title || '', 'vi');
  }), [approvedTheses, search, filterType]);

  const fieldStats = useMemo(() => {
    const map = {};
    approvedTheses.forEach(t => { const f = t.field || 'Khác'; map[f] = (map[f] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count], i) => ({ name, count, color: FIELD_COLORS[i % FIELD_COLORS.length] }));
  }, [approvedTheses]);

  const maxField = fieldStats.length > 0 ? Math.max(...fieldStats.map(f => f.count)) : 1;
  const recent = approvedTheses.slice(0, 5);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setStudent = (i, k, v) => setStudents(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));

  const handleSubmit = async () => {
    if (!form.title) { alert('Vui lòng nhập tên đề tài'); return; }
    if (!students[0].full_name || !students[0].mssv) { alert('Vui lòng nhập họ tên và MSSV'); return; }
    setSaving(true);
    try {
      await onSubmit(
        { ...form, keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()) : [], status: 'pending' },
        students.filter(s => s.full_name && s.mssv),
        advisorName, file
      );
      setSubmitted(true);
      setForm({ title: '', type: 'do_an', field: '', abstract: '', keywords: '', year: currentYear });
      setStudents([{ full_name: '', mssv: '', class: '' }]);
      setAdvisorName(''); setFile(null);
    } catch (e) { alert('Có lỗi xảy ra: ' + e.message); }
    finally { setSaving(false); }
  };

  const TABS = [
    { id: 'dashboard', label: 'Tổng quan' },
    { id: 'theses', label: 'Kho đề tài' },
    { id: 'submit', label: 'Nộp đề tài' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#1A56DB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>ResearchHub</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>Ngân hàng đề tài khoa học</div>
          </div>
        </div>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', gap: 2, marginLeft: 24 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '6px 16px', borderRadius: 7, fontSize: 13, fontWeight: tab === t.id ? 600 : 500,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              background: tab === t.id ? '#EBF2FF' : 'transparent',
              color: tab === t.id ? '#1A56DB' : '#4B5563',
            }}>{t.label}</button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />
        <button onClick={onShowLogin} style={{
          fontSize: 12, color: '#4B5563', background: '#fff', border: '1px solid #E5E7EB',
          borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
          Quản lý khoa
        </button>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px' }}>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              <StatBox bg="#EBF2FF" value={approvedTheses.length} label="Tổng đề tài"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>} />
              <StatBox bg="#ECFDF5" value={new Set(approvedTheses.flatMap(t => t.allStudentMSSV?.length > 0 ? t.allStudentMSSV : (t.mssv ? [t.mssv] : [])).filter(Boolean)).size} label="Sinh viên tham gia"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E9F6E" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
              <StatBox bg="#FFFBEB" value={fieldStats.length} label="Lĩnh vực nghiên cứu"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>} />
              <StatBox bg="#F3F4F6" value={approvedTheses.length > 0 ? Math.max(...approvedTheses.map(t => t.year || 0)) : '—'} label="Năm gần nhất"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
              <Card>
                <SectionHeader title="Đề tài gần đây">
                  <button onClick={() => setTab('theses')} style={{ fontSize: 12, color: '#1A56DB', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Xem tất cả</button>
                </SectionHeader>
                {loading ? (
                  <div style={{ padding: 32, textAlign: 'center' }}><Spinner size={20} /></div>
                ) : recent.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Chưa có đề tài nào</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ background: '#F9FAFB' }}>
                      <tr>{['Tên đề tài','Sinh viên','Loại','Năm'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {recent.map(t => (
                        <tr key={t.id} style={{ borderTop: '1px solid #F3F4F6' }}
                          onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '#F9FAFB')}
                          onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '')}>
                          <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                            <div
                              onClick={() => { setSelectedThesis(t); setTab('theses'); }}
                              style={{ fontWeight: 600, color: '#1A56DB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.target.style.textDecoration = 'none'}
                            >{t.title}</div>
                            {t.field && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{t.field}</div>}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>
                            <div>{t.student}</div>
                            {t.allStudentNames?.length > 1 && (
                              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>+{t.allStudentNames.length - 1} TV</div>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px' }}><Badge color={t.type === 'do_an' ? 'blue' : 'gray'}>{t.type === 'do_an' ? 'Tốt nghiệp' : 'NCKH'}</Badge></td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{t.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>

              <Card>
                <SectionHeader title="Phân bố lĩnh vực" />
                <div style={{ padding: '12px 16px' }}>
                  {fieldStats.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Chưa có dữ liệu</div>
                  ) : fieldStats.map(f => (
                    <div key={f.name} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{f.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{f.count}</span>
                      </div>
                      <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(f.count / maxField) * 100}%`, height: '100%', background: f.color, borderRadius: 3, transition: 'width .6s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* KHO ĐỀ TÀI TAB */}
        {tab === 'theses' && (
          <Card>
            <SectionHeader title={`Kho đề tài (${filtered.length})`}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#9CA3AF' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
                    style={{ padding: '6px 10px 6px 28px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 200 }} />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: '#fff', cursor: 'pointer' }}>
                  <option value="all">Tất cả loại</option>
                  <option value="do_an">Tốt nghiệp</option>
                  <option value="nckh">NCKH</option>
                </select>
              </div>
            </SectionHeader>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}><Spinner size={24} /></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Không tìm thấy đề tài phù hợp</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: '#F9FAFB' }}>
                    <tr>{['Tên đề tài','Loại','Sinh viên','GVHD','Năm'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} style={{ borderTop: '1px solid #F3F4F6' }}
                        onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '#F9FAFB')}
                        onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '')}>
                        <td style={{ padding: '11px 14px', maxWidth: 260 }}>
                          <div
                            onClick={() => setSelectedThesis(t)}
                            style={{ fontWeight: 600, color: '#1A56DB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.target.style.textDecoration = 'none'}
                          >{t.title}</div>
                          {t.field && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{t.field}</div>}
                        </td>
                        <td style={{ padding: '11px 14px' }}><Badge color={t.type === 'do_an' ? 'blue' : 'gray'}>{t.type === 'do_an' ? 'Tốt nghiệp' : 'NCKH'}</Badge></td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#4B5563' }}>
                          <div style={{ fontWeight: 500 }}>{t.student}</div>
                          {t.allStudentNames?.length > 1 && (
                            <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                              +{t.allStudentNames.length - 1} thành viên khác
                            </div>
                          )}
                          {t.mssv && <div style={{ color: '#9CA3AF', marginTop: 1 }}>{t.mssv}</div>}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{t.advisor || '—'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280' }}>{t.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* NỘP ĐỀ TÀI TAB */}
        {tab === 'submit' && (
          <Card>
            <SectionHeader title="Nộp đề tài để lưu vào kho" />
            <div style={{ padding: 24 }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>Gửi thành công!</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Đề tài đã được gửi đến quản lý khoa để xem xét và duyệt.</div>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>Nộp đề tài khác</Button>
                </div>
              ) : (
                <>
                  {/* Tên đề tài — full width */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tên đề tài <span style={{ color: '#EF4444' }}>*</span></label>
                    <Input placeholder="Nhập tên đề tài" value={form.title} onChange={set('title')} />
                  </div>

                  {/* Lĩnh vực (1/2) | Loại đề tài (1/4) | Năm (1/4) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Lĩnh vực</label>
                      <Input
                        placeholder="Chọn hoặc gõ lĩnh vực..."
                        value={form.field}
                        onChange={set('field')}
                        list="field-list-public"
                      />
                      <datalist id="field-list-public">
                        {FIELDS.map(f => <option key={f} value={f} />)}
                      </datalist>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Loại đề tài <span style={{ color: '#EF4444' }}>*</span></label>
                      <Select value={form.type} onChange={set('type')}>
                        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </Select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Năm</label>
                      <Select value={form.year} onChange={set('year')}>{YEARS.map(y => <option key={y}>{y}</option>)}</Select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tóm tắt</label>
                    <Textarea rows={3} placeholder="Mô tả ngắn về mục tiêu và phương pháp..." value={form.abstract} onChange={set('abstract')} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Từ khóa (phân cách bằng dấu phẩy)</label>
                    <Input placeholder="VD: deep learning, nhận diện khuôn mặt, MTCNN" value={form.keywords} onChange={set('keywords')} />
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px', margin: '16px 0 10px' }}>Thông tin sinh viên</div>
                  {students.map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
                      <div>
                        {i === 0 && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Họ tên <span style={{ color: '#EF4444' }}>*</span></label>}
                        <Input placeholder="Họ và tên" value={s.full_name} onChange={e => setStudent(i, 'full_name', e.target.value)} />
                      </div>
                      <div>
                        {i === 0 && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>MSSV <span style={{ color: '#EF4444' }}>*</span></label>}
                        <Input placeholder="B20DCAT001" value={s.mssv} onChange={e => setStudent(i, 'mssv', e.target.value)} />
                      </div>
                      <div>
                        {i === 0 && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Lớp</label>}
                        <Input placeholder="D20CQCN01" value={s.class} onChange={e => setStudent(i, 'class', e.target.value)} />
                      </div>
                      <div>
                        {i === 0 && <div style={{ height: 24 }} />}
                        {i > 0 ? (
                          <button onClick={() => setStudents(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ width: 34, height: 34, borderRadius: 7, border: '1px solid #EF4444', background: '#FEF2F2', cursor: 'pointer', color: '#EF4444', fontSize: 18 }}>×</button>
                        ) : <div style={{ width: 34 }} />}
                      </div>
                    </div>
                  ))}
                  {form.type === 'nckh' && (
                    <>
                      <Button variant="outline" onClick={() => setStudents(prev => [...prev, { full_name: '', mssv: '', class: '' }])} style={{ fontSize: 12, padding: '5px 12px', marginBottom: 14 }}>+ Thêm sinh viên</Button>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Kinh phí (VNĐ)</label>
                          <Input type="number" placeholder="VD: 5000000" value={form.budget || ''} onChange={set('budget')} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Giải thưởng (nếu có)</label>
                          <Input placeholder="VD: Giải Ba cấp trường 2024" value={form.award || ''} onChange={set('award')} />
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Giảng viên hướng dẫn</label>
                    <Input placeholder="Tên giảng viên" value={advisorName} onChange={e => setAdvisorName(e.target.value)} />
                  </div>

                  <div onClick={() => document.getElementById('pub-file').click()}
                    style={{ border: `2px dashed ${file ? '#0E9F6E' : '#E5E7EB'}`, borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', marginBottom: 16, background: file ? '#ECFDF5' : 'transparent', transition: 'all .2s' }}
                    onMouseEnter={e => { if (!file) e.currentTarget.style.borderColor = '#1A56DB'; }}
                    onMouseLeave={e => { if (!file) e.currentTarget.style.borderColor = '#E5E7EB'; }}>
                    <input id="pub-file" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: file ? '#0E9F6E' : '#4B5563' }}>{file ? `✅ ${file.name}` : 'Tải lên file báo cáo (PDF, DOCX)'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>Tối đa 50MB</div>
                  </div>

                  <Button variant="primary" onClick={handleSubmit} disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
                    {saving ? <Spinner size={14} /> : null}
                    {saving ? 'Đang gửi...' : 'Gửi đề tài lên hệ thống'}
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modal xem chi tiết đề tài cho khách */}
      {selectedThesis && (
        <ThesisDetail
          thesis={selectedThesis}
          allTheses={theses}
          onClose={() => setSelectedThesis(null)}
          onUpdate={null}
          isAdmin={false}
        />
      )}
    </div>
  );
}