// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ThesisDetail from './components/ThesisDetail';
import Dashboard from './pages/Dashboard';
import ThesesList from './pages/ThesesList';
import CheckPage from './pages/CheckPage';
import SubmitPage from './pages/SubmitPage';
import Analytics from './pages/Analytics';
import LoginPage from './pages/LoginPage';
import PublicPage from './pages/PublicPage';
import { useTheses } from './hooks/useTheses';
import { Spinner } from './components/ui';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedThesisId, setSelectedThesisId] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const {
    theses, filtered, loading,
    search, setSearch,
    filterType, setFilterType,
    filterField, setFilterField,
    addThesis, getById, fetchTheses,
    approveThesis, rejectThesis, deleteThesis, updateThesis,
    stats,
  } = useTheses();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowLogin(false);
  };

  const handleSearch = (val) => {
    setSearch(val);
    if (val) setActivePage('theses');
  };

  const handlePublicSubmit = async (thesis, students, advisorName, file) => {
    // 1. Insert đề tài trực tiếp (không qua hook để tránh session conflict)
    const { data: newThesis, error: thesisError } = await supabase
      .from('theses')
      .insert({
        title: thesis.title,
        type: thesis.type,
        abstract: thesis.abstract,
        keywords: thesis.keywords || [],
        field: thesis.field,
        year: Number(thesis.year) || new Date().getFullYear(),
        status: 'pending',
        budget: thesis.budget || null,
        award: thesis.award || null,
      })
      .select()
      .single();
    if (thesisError) throw new Error(thesisError.message);

    // 2. Upsert sinh viên và tạo liên kết
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.full_name || !s.mssv) continue;
      let studentId = null;
      const { data: existing } = await supabase.from('students').select('id').eq('mssv', s.mssv).maybeSingle();
      if (existing) {
        studentId = existing.id;
      } else {
        const { data: newS, error: sErr } = await supabase.from('students').insert({ full_name: s.full_name, mssv: s.mssv, class: s.class || null }).select().single();
        if (sErr) console.warn('Student insert error:', sErr.message);
        if (newS) studentId = newS.id;
      }
      if (studentId) {
        await supabase.from('thesis_students').insert({ thesis_id: newThesis.id, student_id: studentId, is_leader: i === 0 });
      }
    }

    // 3. Upsert GVHD và tạo liên kết
    if (advisorName?.trim()) {
      let advisorId = null;
      const { data: existing } = await supabase.from('advisors').select('id').ilike('full_name', advisorName).maybeSingle();
      if (existing) {
        advisorId = existing.id;
      } else {
        const { data: newA, error: aErr } = await supabase.from('advisors').insert({ full_name: advisorName }).select().single();
        if (aErr) console.warn('Advisor insert error:', aErr.message);
        if (newA) advisorId = newA.id;
      }
      if (advisorId) {
        await supabase.from('thesis_advisors').insert({ thesis_id: newThesis.id, advisor_id: advisorId });
      }
    }

    // 4. Upload file nếu có
    if (file && newThesis.id) {
      const ext = file.name.split('.').pop();
      const { error: uploadErr } = await supabase.storage
        .from('thesis-files')
        .upload(`${newThesis.id}/baocao.${ext}`, file, { upsert: true });
      if (!uploadErr) {
        await supabase.from('theses').update({ file_url: `${newThesis.id}/baocao.${ext}` }).eq('id', newThesis.id);
      }
    }

    // Reload danh sách
    await fetchTheses();
  };

  const selectedThesis = selectedThesisId ? getById(selectedThesisId) : null;

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--gray-400)', fontSize: 14 }}>
        <Spinner size={20} /> Đang tải...
      </div>
    );
  }

  if (showLogin && !user) {
    return <LoginPage onLogin={(u) => { setUser(u); setShowLogin(false); }} />;
  }

  if (!user) {
    return (
      <PublicPage
        theses={theses}
        loading={loading}
        onSubmit={handlePublicSubmit}
        onShowLogin={() => setShowLogin(true)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} thesisCount={stats.total} />
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar
          activePage={activePage}
          search={search}
          onSearch={handleSearch}
          onNavigate={setActivePage}
          user={user}
          onLogout={handleLogout}
        />
        <main style={{ padding: 24, flex: 1 }}>
          {loading && activePage === 'dashboard' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--gray-400)', fontSize: 14 }}>
              <Spinner size={20} /> Đang tải dữ liệu...
            </div>
          ) : (
            <>
              {activePage === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  theses={theses}
                  onOpenDetail={setSelectedThesisId}
                  onApprove={approveThesis}
                  onReject={rejectThesis}
                  onNavigate={setActivePage}
                />
              )}
              {activePage === 'theses' && (
                <ThesesList
                  theses={filtered}
                  loading={loading}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  filterField={filterField}
                  setFilterField={setFilterField}
                  onOpenDetail={setSelectedThesisId}
                  onApprove={approveThesis}
                  onReject={rejectThesis}
                  onDelete={deleteThesis}
                />
              )}
              {activePage === 'check' && <CheckPage theses={theses} />}
              {activePage === 'submit' && (
                <SubmitPage theses={theses} onAddThesis={async (thesis, students, advisorId) => {
                  const result = await addThesis(thesis, students, advisorId, true);
                  setActivePage('theses');
                  return result;
                }} />
              )}
              {activePage === 'analytics' && (
                <Analytics stats={stats} theses={theses} onOpenDetail={setSelectedThesisId} />
              )}
            </>
          )}
        </main>
      </div>
      {selectedThesis && (
        <ThesisDetail
          thesis={selectedThesis}
          allTheses={theses}
          onClose={() => setSelectedThesisId(null)}
          onUpdate={updateThesis}
          isAdmin={true}
        />
      )}
    </div>
  );
}
