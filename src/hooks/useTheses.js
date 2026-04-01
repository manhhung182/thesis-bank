// src/hooks/useTheses.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calcAllSimilarities } from '../lib/similarity';

export function useTheses() {
  const [theses, setTheses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterField, setFilterField] = useState('all');

  const fetchTheses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('theses')
      .select(`*, thesis_students(is_leader, students(full_name, mssv, class)), thesis_advisors(advisors(full_name, email))`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const normalized = data.map((t) => {
        const leader = t.thesis_students?.find(ts => ts.is_leader);
        const allStudents = t.thesis_students?.map(ts => ts.students) || [];
        const advisor = t.thesis_advisors?.[0]?.advisors;
        const allStudentNames = allStudents.map(s => s?.full_name || '').filter(Boolean);
        const allStudentMSSV = allStudents.map(s => s?.mssv || '').filter(Boolean);
        return {
          ...t,
          student: leader?.students?.full_name || allStudents[0]?.full_name || '',
          mssv: leader?.students?.mssv || allStudents[0]?.mssv || '',
          class: leader?.students?.class || allStudents[0]?.class || '',
          advisor: advisor?.full_name || '',
          allStudents,
          allStudentNames,
          allStudentMSSV,
          keywords: t.keywords || [],
          similarity: t.similarity || 0,
        };
      });
      // Tính similarity cho các đề tài đã duyệt
      const simMap = calcAllSimilarities(normalized);
      const withSim = normalized.map(t => ({
        ...t,
        similarity: simMap[t.id] !== undefined ? simMap[t.id] : (t.similarity || 0),
      }));
      setTheses(withSim);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTheses(); }, [fetchTheses]);

  const filtered = theses.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.title?.toLowerCase().includes(q) ||
      t.student?.toLowerCase().includes(q) ||
      t.advisor?.toLowerCase().includes(q) ||
      t.keywords?.some(k => k.toLowerCase().includes(q)) ||
      t.allStudentNames?.some(n => n.toLowerCase().includes(q)) ||
      t.allStudentMSSV?.some(m => m.toLowerCase().includes(q)) ||
      t.field?.toLowerCase().includes(q);
    const matchType = filterType === 'all' 
      || filterType === 'pending' 
      || filterType === 'rejected'
      || t.type === filterType;
    const matchField = filterField === 'all' || t.field === filterField;
    return matchSearch && matchType && matchField;
  });

  const addThesis = useCallback(async (thesis, students, advisorId, autoApprove = false) => {
    const { data: newThesis, error } = await supabase
      .from('theses')
      .insert({ title: thesis.title, type: thesis.type, abstract: thesis.abstract, keywords: thesis.keywords || [], field: thesis.field, year: thesis.year || new Date().getFullYear(), semester: thesis.semester, status: autoApprove ? 'approved' : 'pending', budget: thesis.budget || null, award: thesis.award || null })
      .select().single();
    if (error) throw error;
    if (students?.length) {
      await supabase.from('thesis_students').insert(students.map((s, i) => ({ thesis_id: newThesis.id, student_id: s.id, is_leader: i === 0 })));
    }
    if (advisorId) {
      await supabase.from('thesis_advisors').insert({ thesis_id: newThesis.id, advisor_id: advisorId });
    }
    await fetchTheses();
    return newThesis;
  }, [fetchTheses]);

  // Duyệt đề tài
  const approveThesis = useCallback(async (id) => {
    const { error } = await supabase.from('theses').update({ status: 'approved' }).eq('id', id);
    if (error) throw error;
    setTheses(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' } : t));
  }, []);

  // Từ chối đề tài (giữ lại với status rejected)
  const rejectThesis = useCallback(async (id) => {
    const { error } = await supabase.from('theses').update({ status: 'rejected' }).eq('id', id);
    if (error) throw error;
    setTheses(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t));
  }, []);

  // Xóa đề tài hoàn toàn
  const deleteThesis = useCallback(async (id) => {
    const { error } = await supabase.from('theses').delete().eq('id', id);
    if (error) throw error;
    setTheses(prev => prev.filter(t => t.id !== id));
  }, []);

  // Cập nhật thông tin đề tài (kèm cập nhật sinh viên/GVHD nếu có)
  const updateThesis = useCallback(async (id, updates, extra = {}) => {
    const { error } = await supabase.from('theses').update(updates).eq('id', id);
    if (error) throw error;

    // Cập nhật GVHD nếu có thay đổi
    if (extra.advisor !== undefined) {
      // Xóa liên kết cũ
      await supabase.from('thesis_advisors').delete().eq('thesis_id', id);
      if (extra.advisor?.trim()) {
        let advisorId = null;
        const { data: existing } = await supabase.from('advisors').select('id').ilike('full_name', extra.advisor).maybeSingle();
        if (existing) {
          advisorId = existing.id;
        } else {
          const { data: newA } = await supabase.from('advisors').insert({ full_name: extra.advisor }).select().single();
          if (newA) advisorId = newA.id;
        }
        if (advisorId) await supabase.from('thesis_advisors').insert({ thesis_id: id, advisor_id: advisorId });
      }
    }

    // Cập nhật sinh viên chủ nhiệm nếu có thay đổi
    if (extra.student !== undefined && extra.mssv !== undefined) {
      const { data: leaders } = await supabase.from('thesis_students').select('student_id').eq('thesis_id', id).eq('is_leader', true);
      if (extra.student?.trim() && extra.mssv?.trim()) {
        let studentId = null;
        const { data: existing } = await supabase.from('students').select('id').eq('mssv', extra.mssv).maybeSingle();
        if (existing) {
          studentId = existing.id;
          await supabase.from('students').update({ full_name: extra.student, class: extra.studentClass?.trim() || null }).eq('id', studentId);
        } else {
          const { data: newS } = await supabase.from('students').insert({ full_name: extra.student, mssv: extra.mssv, class: extra.studentClass?.trim() || null }).select().single();
          if (newS) studentId = newS.id;
        }
        if (studentId) {
          // Cập nhật hoặc thêm mới liên kết sinh viên chủ nhiệm
          if (leaders?.length > 0) {
            await supabase.from('thesis_students').update({ student_id: studentId }).eq('thesis_id', id).eq('is_leader', true);
          } else {
            await supabase.from('thesis_students').insert({ thesis_id: id, student_id: studentId, is_leader: true });
          }
        }
      }
    }

    await fetchTheses();
  }, [fetchTheses]);

  const getById = useCallback((id) => theses.find(t => t.id === id), [theses]);

  const stats = {
    total: theses.filter(t => t.status === 'approved').length,
    students: new Set(
      theses
        .filter(t => t.status === 'approved')
        .flatMap(t => t.allStudentMSSV?.length > 0 ? t.allStudentMSSV : (t.mssv ? [t.mssv] : []))
        .filter(Boolean)
    ).size,
    warnings: theses.filter(t => (t.similarity || 0) >= 50).length,
    highRisk: theses.filter(t => (t.similarity || 0) >= 70).length,
    pending: theses.filter(t => t.status === 'pending').length,
    approved: theses.filter(t => t.status === 'approved').length,
    rejected: theses.filter(t => t.status === 'rejected').length,
  };

  return {
    theses, filtered, loading,
    search, setSearch,
    filterType, setFilterType,
    filterField, setFilterField,
    addThesis, getById, fetchTheses,
    approveThesis, rejectThesis, deleteThesis, updateThesis,
    stats,
  };
}

export function useAICheck() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const check = useCallback(async (title, abstract, thesisList) => {
    setLoading(true);
    setResult(null);
    setError(null);
    const listText = thesisList.map((t, i) => `${i + 1}. "${t.title}" (${t.student}, ${t.year}) - ${t.field}`).join('\n');
    const prompt = `Bạn là hệ thống kiểm tra trùng lặp đề tài nghiên cứu khoa học sinh viên.

Đề tài cần kiểm tra:
- Tên: "${title || '(chưa có tên)'}"
- Tóm tắt: "${abstract || '(chưa có tóm tắt)'}"

Danh sách đề tài trong kho:
${listText}

Hãy phân tích:
1. Đề tài trên có trùng lặp với đề tài nào trong kho không? (liệt kê cụ thể)
2. Ước lượng % độ tương đồng tổng thể (0-100%)
3. Đánh giá mức độ rủi ro: An toàn / Cần xem xét / Rủi ro cao
4. Gợi ý cụ thể để phân biệt hoặc làm mới hướng nghiên cứu

Trả lời ngắn gọn, thân thiện bằng tiếng Việt, dùng định dạng rõ ràng với emoji.`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      setResult(data.content?.map(c => c.text || '').join('') || '');
    } catch (e) {
      setError('Lỗi kết nối API. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);
  return { result, loading, error, check, reset };
}
