// src/lib/similarity.js
// Tính độ tương đồng văn bản bằng TF-IDF + Cosine Similarity

// Chuẩn hóa văn bản tiếng Việt — bỏ dấu, lowercase
function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tách từ
function tokenize(text) {
  return normalize(text).split(' ').filter(w => w.length > 1);
}

// Tính TF
function termFreq(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = tokens.length || 1;
  Object.keys(tf).forEach(k => { tf[k] = tf[k] / total; });
  return tf;
}

// Cosine similarity giữa 2 TF vector
function cosineSim(tf1, tf2) {
  const keys = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  let dot = 0, mag1 = 0, mag2 = 0;
  keys.forEach(k => {
    const a = tf1[k] || 0;
    const b = tf2[k] || 0;
    dot += a * b;
    mag1 += a * a;
    mag2 += b * b;
  });
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// Tạo vector từ đề tài — title x3, keywords x2, abstract x1
function buildTokens(thesis) {
  const title    = tokenize(thesis.title || '');
  const keywords = tokenize((thesis.keywords || []).join(' '));
  const abstract = tokenize(thesis.abstract || '');
  return [...title, ...title, ...title, ...keywords, ...keywords, ...abstract];
}

// Tính % tương đồng giữa 2 đề tài (0-100)
export function calcSimilarity(a, b) {
  const t1 = buildTokens(a);
  const t2 = buildTokens(b);
  if (t1.length === 0 || t2.length === 0) return 0;
  return Math.round(cosineSim(termFreq(t1), termFreq(t2)) * 100);
}

// Tìm các đề tài tương đồng, sắp xếp giảm dần theo %
export function findSimilar(target, allTheses, minScore = 5) {
  return allTheses
    .filter(t => t.id !== target.id && t.status === 'approved')
    .map(t => ({ ...t, simScore: calcSimilarity(target, t) }))
    .filter(t => t.simScore >= minScore)
    .sort((a, b) => b.simScore - a.simScore)
    .slice(0, 5);
}

// Tính similarity tối đa của mỗi đề tài so với các đề tài khác
// Trả về map: { [thesis.id]: maxSimilarity }
export function calcAllSimilarities(theses) {
  const approved = theses.filter(t => t.status === 'approved');
  const result = {};
  approved.forEach(t => {
    const others = approved.filter(o => o.id !== t.id);
    result[t.id] = others.length === 0 ? 0 : Math.max(...others.map(o => calcSimilarity(t, o)));
  });
  return result;
}
