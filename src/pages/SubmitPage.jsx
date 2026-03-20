// src/pages/SubmitPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, Input, Textarea, Select, Spinner } from '../components/ui';
import { useAICheck } from '../hooks/useTheses';
import { supabase } from '../lib/supabase';
import { FIELDS, TYPES } from '../data/constants';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);


export default function SubmitPage({ theses, onAddThesis }) {
  const [form, setForm] = useState({
    title: '', type: 'do_an', field: FIELDS[0],
    abstract: '', keywords: '', year: currentYear,
    budget: '', award: '',
  });
  const [students, setStudents] = useState([{ full_name: '', mssv: '', class: '' }]);
  const [advisorName, setAdvisorName] = useState('');
  const [advisorList, setAdvisorList] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const { result, loading, error, check, reset } = useAICheck();

  // Load danh sách GVHD từ Supabase
  useEffect(() => {
    supabase.from('advisors').select('*').order('full_name')
      .then(({ data }) => { if (data) setAdvisorList(data); });
  }, []);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); reset(); setSubmitted(false); };

  const setStudent = (i, k, v) => {
    setStudents((prev) => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  };

  const addStudent = () => setStudents((prev) => [...prev, { full_name: '', mssv: '', class: '' }]);
  const removeStudent = (i) => setStudents((prev) => prev.filter((_, idx) => idx !== i));

  const handlePreCheck = () => {
    if (!form.title) { alert('Vui lòng nhập tên đề tài trước'); return; }
    check(form.title, form.abstract, theses);
  };

  const handleSubmit = async () => {
    if (!form.title) { alert('Vui lòng nhập tên đề tài'); return; }
    if (!students[0].full_name || !students[0].mssv) { alert('Vui lòng nhập thông tin sinh viên chủ nhiệm'); return; }
    setSaving(true);
    try {
      // 1. Upsert sinh viên
      const studentRecords = [];
      for (const s of students.filter(s => s.full_name && s.mssv)) {
        const { data: existing } = await supabase.from('students').select('id').eq('mssv', s.mssv).maybeSingle();
        if (existing) {
          studentRecords.push(existing);
        } else {
          const { data: newS } = await supabase.from('students').insert(s).select().single();
          if (newS) studentRecords.push(newS);
        }
      }

      // 2. Upsert GVHD
      let advisorId = null;
      if (advisorName.trim()) {
        const existing = advisorList.find(a => a.full_name.toLowerCase() === advisorName.toLowerCase());
        if (existing) {
          advisorId = existing.id;
        } else {
          const { data: newA } = await supabase.from('advisors').insert({ full_name: advisorName }).select().single();
          if (newA) advisorId = newA.id;
        }
      }

      // 3. Thêm đề tài
      const newThesis = await onAddThesis(
        { ...form, keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()) : [] },
        studentRecords,
        advisorId
      );

      // 4. Upload file nếu có
      if (file && newThesis?.id) {
        const ext = file.name.split('.').pop();
        await supabase.storage.from('thesis-files').upload(`${newThesis.id}/baocao.${ext}`, file, { upsert: true });
        await supabase.from('theses').update({ file_url: `${newThesis.id}/baocao.${ext}` }).eq('id', newThesis.id);
      }

      setSubmitted(true);
      setForm({ title: '', type: 'do_an', field: FIELDS[0], abstract: '', keywords: '', year: currentYear, budget: '', award: '' });
      setStudents([{ full_name: '', mssv: '', class: '' }]);
      setAdvisorName('');
      setFile(null);
      reset();
    } catch (e) {
      alert('Có lỗi xảy ra: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Card>
        <SectionHeader title="Nộp đề tài mới" />
        <div style={{ padding: 24 }}>
          {submitted && (
            <div style={{ padding: '12px 16px', background: 'var(--success-light)', borderRadius: 8, fontSize: 13, color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Đề tài đã nộp thành công! Đang chờ giảng viên duyệt.
            </div>
          )}

          {/* Thông tin đề tài */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>Thông tin đề tài</div>

          {/* Tên đề tài — full width */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Tên đề tài <span style={{ color: 'var(--danger)' }}>*</span></label>
            <Input placeholder="Nhập tên đề tài" value={form.title} onChange={set('title')} />
          </div>

          {/* Lĩnh vực (1/2) | Loại đề tài (1/4) | Năm (1/4) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Lĩnh vực</label>
              <Input
                placeholder="Chọn hoặc gõ lĩnh vực..."
                value={form.field}
                onChange={set('field')}
                list="field-list-admin"
              />
              <datalist id="field-list-admin">
                {FIELDS.map((f) => <option key={f} value={f} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Loại đề tài <span style={{ color: 'var(--danger)' }}>*</span></label>
              <Select value={form.type} onChange={set('type')}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Năm</label>
              <Select value={form.year} onChange={set('year')}>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </Select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Tóm tắt đề tài</label>
            <Textarea placeholder="Mô tả ngắn về mục tiêu, phương pháp và kết quả mong đợi..." rows={3} value={form.abstract} onChange={set('abstract')} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Từ khóa (phân cách bằng dấu phẩy)</label>
            <Input placeholder="VD: deep learning, nhận diện khuôn mặt, MTCNN" value={form.keywords} onChange={set('keywords')} />
          </div>

          {/* NCKH thêm kinh phí / giải thưởng */}
          {form.type === 'nckh' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Kinh phí (VNĐ)</label>
                <Input type="number" placeholder="VD: 5000000" value={form.budget} onChange={set('budget')} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Giải thưởng (nếu có)</label>
                <Input placeholder="VD: Giải Ba cấp trường 2024" value={form.award} onChange={set('award')} />
              </div>
            </div>
          )}

          {/* Sinh viên */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '20px 0 12px' }}>
            Sinh viên thực hiện
          </div>
          {students.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
              <div>
                {i === 0 && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Họ tên <span style={{ color: 'var(--danger)' }}>*</span></label>}
                <Input placeholder="Họ và tên" value={s.full_name} onChange={(e) => setStudent(i, 'full_name', e.target.value)} />
              </div>
              <div>
                {i === 0 && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>MSSV <span style={{ color: 'var(--danger)' }}>*</span></label>}
                <Input placeholder="B20DCAT001" value={s.mssv} onChange={(e) => setStudent(i, 'mssv', e.target.value)} />
              </div>
              <div>
                {i === 0 && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Lớp</label>}
                <Input placeholder="D20CQCN01-N" value={s.class} onChange={(e) => setStudent(i, 'class', e.target.value)} />
              </div>
              <div>
                {i === 0 && <div style={{ height: 24 }} />}
                {i > 0 ? (
                  <button onClick={() => removeStudent(i)} style={{ width: 34, height: 34, borderRadius: 7, border: '1px solid var(--danger)', background: 'var(--danger-light)', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                ) : <div style={{ width: 34 }} />}
              </div>
            </div>
          ))}
          {form.type === 'nckh' && (
            <Button variant="outline" onClick={addStudent} style={{ fontSize: 12, padding: '5px 12px' }}>+ Thêm sinh viên</Button>
          )}

          {/* GVHD */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '20px 0 12px' }}>Giảng viên hướng dẫn</div>
          <div style={{ position: 'relative' }}>
            <Input
              placeholder="Nhập tên hoặc chọn từ danh sách..."
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              list="advisor-list"
            />
            <datalist id="advisor-list">
              {advisorList.map((a) => <option key={a.id} value={a.full_name} />)}
            </datalist>
          </div>

          {/* Upload file */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '20px 0 12px' }}>File báo cáo</div>
          <div
            style={{ border: '2px dashed var(--gray-200)', borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer', transition: 'all .2s', background: file ? 'var(--success-light)' : 'transparent' }}
            onMouseEnter={(e) => { if (!file) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}}
            onMouseLeave={(e) => { if (!file) { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'transparent'; }}}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
            <div style={{ fontSize: 13, fontWeight: 600, color: file ? 'var(--success)' : 'var(--gray-600)' }}>
              {file ? `✅ ${file.name}` : 'Tải lên file báo cáo'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>PDF, DOCX — tối đa 50MB</div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button variant="outline" onClick={handlePreCheck} disabled={loading} style={{ flex: 1, justifyContent: 'center', padding: 10 }}>
              {loading ? <Spinner size={14} /> : null}
              Kiểm tra trùng lặp trước
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving} style={{ flex: 1, justifyContent: 'center', padding: 10 }}>
              {saving ? <Spinner size={14} /> : null}
              {saving ? 'Đang lưu...' : 'Nộp đề tài'}
            </Button>
          </div>

          {error && <div style={{ marginTop: 12, padding: 12, background: 'var(--danger-light)', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>{error}</div>}
          {result && (
            <div style={{ marginTop: 14, background: 'var(--primary-light)', border: '1px solid rgba(26,86,219,.2)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>🤖 Kết quả kiểm tra trùng lặp</div>
              <div style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{result}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
