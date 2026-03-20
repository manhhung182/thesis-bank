// src/lib/exportExcel.js
import * as XLSX from 'xlsx';

// Trích số khóa từ tên lớp: "TUD K61" -> "61", "K64 CNTT" -> "64"
function extractKhoa(className) {
  if (!className) return null;
  const match = className.match(/K(\d{2,3})/i);
  return match ? match[1] : null;
}

// Format loại đề tài
function formatType(type) {
  return type === 'do_an' ? 'Đồ án tốt nghiệp' : 'NCKH Sinh viên';
}

// Lấy tất cả sinh viên của đề tài dạng string
function formatStudents(thesis) {
  if (thesis.allStudents?.length > 0) {
    return thesis.allStudents
      .filter(s => s?.full_name)
      .map(s => s.full_name)
      .join(', ');
  }
  return thesis.student || '';
}

function formatMSSV(thesis) {
  if (thesis.allStudentMSSV?.length > 0) return thesis.allStudentMSSV.join(', ');
  return thesis.mssv || '';
}

function formatClass(thesis) {
  if (thesis.allStudents?.length > 0) {
    const classes = [...new Set(thesis.allStudents.filter(s => s?.class).map(s => s.class))];
    return classes.join(', ');
  }
  return thesis.class || '';
}

export function exportThesesExcel(theses, selectedKhoa = null) {
  const approved = theses.filter(t => t.status === 'approved');
  const wb = XLSX.utils.book_new();

  // ── SHEET 1: Tổng hợp thống kê ─────────────────────────────
  const statsData = [];
  statsData.push(['THỐNG KÊ TỔNG HỢP ĐỀ TÀI KHOA HỌC SINH VIÊN']);
  statsData.push([`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`]);
  statsData.push([]);

  // Theo năm
  statsData.push(['THỐNG KÊ THEO NĂM']);
  statsData.push(['Năm', 'Đồ án tốt nghiệp', 'NCKH Sinh viên', 'Tổng']);
  const yearMap = {};
  approved.forEach(t => {
    const y = t.year || 'Khác';
    if (!yearMap[y]) yearMap[y] = { do_an: 0, nckh: 0 };
    yearMap[y][t.type === 'do_an' ? 'do_an' : 'nckh']++;
  });
  Object.entries(yearMap).sort((a, b) => b[0] - a[0]).forEach(([year, v]) => {
    statsData.push([year, v.do_an, v.nckh, v.do_an + v.nckh]);
  });
  statsData.push(['Tổng',
    approved.filter(t => t.type === 'do_an').length,
    approved.filter(t => t.type === 'nckh').length,
    approved.length
  ]);
  statsData.push([]);

  // Theo lĩnh vực
  statsData.push(['THỐNG KÊ THEO LĨNH VỰC']);
  statsData.push(['Lĩnh vực', 'Số đề tài', 'Tỷ lệ (%)']);
  const fieldMap = {};
  approved.forEach(t => { const f = t.field || 'Chưa phân loại'; fieldMap[f] = (fieldMap[f] || 0) + 1; });
  Object.entries(fieldMap).sort((a, b) => b[1] - a[1]).forEach(([field, count]) => {
    statsData.push([field, count, ((count / approved.length) * 100).toFixed(1) + '%']);
  });
  statsData.push([]);

  // Số sinh viên
  const allMSSV = new Set(
    approved.flatMap(t => t.allStudentMSSV?.length > 0 ? t.allStudentMSSV : (t.mssv ? [t.mssv] : []))
  );
  statsData.push(['TỔNG SỐ SINH VIÊN THAM GIA', allMSSV.size]);

  const ws1 = XLSX.utils.aoa_to_sheet(statsData);
  ws1['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Tổng hợp');

  // ── SHEET 2: Danh sách đề tài ───────────────────────────────
  const headers = ['STT', 'Tên đề tài', 'Loại', 'Lĩnh vực', 'Sinh viên', 'MSSV', 'Lớp', 'GVHD', 'Năm'];
  const rows = approved.map((t, i) => [
    i + 1,
    t.title,
    formatType(t.type),
    t.field || '',
    formatStudents(t),
    formatMSSV(t),
    formatClass(t),
    t.advisor || '',
    t.year || '',
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws2['!cols'] = [
    { wch: 5 }, { wch: 50 }, { wch: 20 }, { wch: 20 },
    { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 8 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Danh sách đề tài');

  // ── SHEET 3: Theo khóa ──────────────────────────────────────
  // Thu thập tất cả khóa có trong dữ liệu
  const khoaMap = {};
  approved.forEach(t => {
    const classes = t.allStudents?.length > 0
      ? t.allStudents.map(s => s?.class).filter(Boolean)
      : (t.class ? [t.class] : []);
    const khoaSet = new Set(classes.map(c => extractKhoa(c)).filter(Boolean));
    khoaSet.forEach(k => {
      if (!khoaMap[k]) khoaMap[k] = [];
      if (!khoaMap[k].find(x => x.id === t.id)) khoaMap[k].push(t);
    });
  });

  const khoaList = Object.keys(khoaMap).sort((a, b) => Number(b) - Number(a));

  if (selectedKhoa && khoaMap[selectedKhoa]) {
    // Xuất 1 khóa được chọn
    const khoaRows = khoaMap[selectedKhoa].map((t, i) => [
      i + 1, t.title, formatType(t.type), t.field || '',
      formatStudents(t), formatMSSV(t), formatClass(t), t.advisor || '', t.year || '',
    ]);
    const wsK = XLSX.utils.aoa_to_sheet([
      [`DANH SÁCH ĐỀ TÀI KHÓA ${selectedKhoa}`],
      [],
      headers,
      ...khoaRows,
    ]);
    wsK['!cols'] = [{ wch: 5 },{ wch: 50 },{ wch: 20 },{ wch: 20 },{ wch: 30 },{ wch: 20 },{ wch: 15 },{ wch: 25 },{ wch: 8 }];
    XLSX.utils.book_append_sheet(wb, wsK, `Khóa ${selectedKhoa}`);
  } else {
    // Xuất tất cả khóa, mỗi khóa 1 sheet
    khoaList.forEach(khoa => {
      const khoaRows = khoaMap[khoa].map((t, i) => [
        i + 1, t.title, formatType(t.type), t.field || '',
        formatStudents(t), formatMSSV(t), formatClass(t), t.advisor || '', t.year || '',
      ]);
      const wsK = XLSX.utils.aoa_to_sheet([
        [`DANH SÁCH ĐỀ TÀI KHÓA ${khoa}`],
        [`Tổng: ${khoaRows.length} đề tài`],
        [],
        headers,
        ...khoaRows,
      ]);
      wsK['!cols'] = [{ wch: 5 },{ wch: 50 },{ wch: 20 },{ wch: 20 },{ wch: 30 },{ wch: 20 },{ wch: 15 },{ wch: 25 },{ wch: 8 }];
      XLSX.utils.book_append_sheet(wb, wsK, `Khóa ${khoa}`);
    });
  }

  // Xuất file
  const fileName = selectedKhoa
    ? `detai_khoa${selectedKhoa}_${new Date().getFullYear()}.xlsx`
    : `detai_tonghop_${new Date().getFullYear()}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return { khoaList }; // Trả về danh sách khóa để hiển thị trong UI
}
