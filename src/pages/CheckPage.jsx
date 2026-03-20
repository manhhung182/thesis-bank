// src/pages/CheckPage.jsx
import React, { useState } from 'react';
import { Card, SectionHeader, Button, Input, Textarea, Spinner } from '../components/ui';
import { findSimilar, calcSimilarity } from '../lib/similarity';

export default function CheckPage({ theses }) {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [result, setResult] = useState(null);

  const handleCheck = () => {
    if (!title && !abstract) { alert('Vui lòng nhập tên đề tài hoặc tóm tắt'); return; }
    const target = {
      id: '__check__',
      title,
      abstract,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
      status: 'approved',
    };
    const similar = findSimilar(target, theses, 1);
    const maxSim = similar.length > 0 ? similar[0].simScore : 0;
    setResult({ target, similar, maxSim });
  };

  const simColor = (s) => s >= 70 ? 'var(--danger)' : s >= 40 ? 'var(--warning)' : 'var(--success)';
  const simLabel = (s) => s >= 70 ? 'Rủi ro cao' : s >= 40 ? 'Cần xem xét' : 'An toàn';
  const simBadgeBg = (s) => s >= 70 ? 'var(--danger-light)' : s >= 40 ? 'var(--warning-light)' : 'var(--success-light)';

  return (
    <div className="animate-fade-in">
      <Card>
        <SectionHeader title="Kiểm tra trùng lặp đề tài" />
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Tên đề tài cần kiểm tra</label>
            <Input placeholder="Nhập tên đề tài..." value={title} onChange={e => { setTitle(e.target.value); setResult(null); }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Từ khóa (phân cách bằng dấu phẩy)</label>
            <Input placeholder="VD: deep learning, nhận diện khuôn mặt, MTCNN" value={keywords} onChange={e => { setKeywords(e.target.value); setResult(null); }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Tóm tắt / Mô tả đề tài</label>
            <Textarea rows={5} placeholder="Dán nội dung tóm tắt để kiểm tra độ tương đồng..." value={abstract} onChange={e => { setAbstract(e.target.value); setResult(null); }} />
          </div>

          <Button variant="primary" onClick={handleCheck} style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Kiểm tra trùng lặp ({theses.filter(t => t.status === 'approved').length} đề tài trong kho)
          </Button>

          {result && (
            <div style={{ marginTop: 20 }}>
              {/* Kết quả tổng quát */}
              <div style={{ background: simBadgeBg(result.maxSim), border: `1px solid ${simColor(result.maxSim)}30`, borderRadius: 12, padding: 18, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: simColor(result.maxSim), lineHeight: 1 }}>{result.maxSim}%</div>
                  <div style={{ fontSize: 11, color: simColor(result.maxSim), fontWeight: 600, marginTop: 4 }}>{simLabel(result.maxSim)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, background: 'rgba(0,0,0,.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: result.maxSim + '%', height: '100%', background: simColor(result.maxSim), borderRadius: 4, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-700)' }}>
                    {result.maxSim === 0 && 'Không tìm thấy đề tài tương đồng trong kho.'}
                    {result.maxSim > 0 && result.maxSim < 40 && `Đề tài có độ tương đồng thấp với các đề tài trong kho. Có thể tiến hành.`}
                    {result.maxSim >= 40 && result.maxSim < 70 && `Đề tài có một số điểm tương đồng. Cần xem xét kỹ và làm rõ điểm khác biệt.`}
                    {result.maxSim >= 70 && `Đề tài có độ tương đồng cao với đề tài trong kho. Cần điều chỉnh hướng nghiên cứu.`}
                  </div>
                </div>
              </div>

              {/* Danh sách đề tài tương đồng */}
              {result.similar.length > 0 ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
                    Đề tài tương đồng ({result.similar.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.similar.map((t, i) => (
                      <div key={t.id} style={{ padding: '14px 16px', border: `1px solid ${simColor(t.simScore)}40`, borderRadius: 10, background: '#fff', borderLeft: `4px solid ${simColor(t.simScore)}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', marginRight: 6 }}>#{i + 1}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{t.title}</span>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: simColor(t.simScore), lineHeight: 1 }}>{t.simScore}%</div>
                            <div style={{ fontSize: 10, color: simColor(t.simScore), fontWeight: 600 }}>{simLabel(t.simScore)}</div>
                          </div>
                        </div>
                        <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ width: t.simScore + '%', height: '100%', background: simColor(t.simScore), borderRadius: 2 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                          {t.student && <span>👤 {t.student}</span>}
                          {t.advisor && <span>🎓 {t.advisor}</span>}
                          {t.year && <span>📅 {t.year}</span>}
                          {t.field && <span>🏷 {t.field}</span>}
                        </div>
                        {t.abstract && (
                          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.5 }}>
                            {t.abstract.length > 120 ? t.abstract.slice(0, 120) + '...' : t.abstract}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', fontSize: 13 }}>
                  ✅ Không tìm thấy đề tài nào tương đồng trong kho
                </div>
              )}

              <button onClick={() => setResult(null)} style={{ marginTop: 16, width: '100%', padding: '8px 0', border: '1px solid var(--gray-200)', borderRadius: 8, background: '#fff', fontSize: 13, color: 'var(--gray-500)', cursor: 'pointer', fontFamily: 'inherit' }}>
                Kiểm tra đề tài khác
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
