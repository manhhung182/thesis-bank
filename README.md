# ResearchHub – Ngân hàng Đề tài Khoa học Sinh viên

Ứng dụng React để lưu trữ, quản lý và kiểm tra trùng lặp đề tài NCKH và đồ án tốt nghiệp.

## Cài đặt & Chạy

```bash
# 1. Cài dependencies
npm install

# 2. Chạy development server
npm start
# Mở http://localhost:3000
```

## Cấu trúc project

```
src/
├── App.jsx                  # Root component, routing giữa các trang
├── index.js                 # Entry point
├── index.css                # CSS variables & global styles
│
├── components/
│   ├── ui.jsx               # Shared UI: Badge, Button, Card, Input...
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── Topbar.jsx           # Header với search
│   └── ThesisDetail.jsx     # Modal chi tiết đề tài + AI analysis
│
├── pages/
│   ├── Dashboard.jsx        # Tổng quan thống kê
│   ├── ThesesList.jsx       # Danh sách & lọc đề tài
│   ├── CheckPage.jsx        # Kiểm tra trùng lặp AI
│   ├── SubmitPage.jsx       # Form nộp đề tài mới
│   └── Analytics.jsx        # Biểu đồ & báo cáo
│
├── hooks/
│   └── useTheses.js         # Custom hooks: useTheses, useAICheck
│
└── data/
    └── mockData.js          # Dữ liệu mẫu & constants
```

## Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 📚 Kho đề tài | Xem, tìm kiếm, lọc toàn bộ đề tài |
| 🤖 Kiểm tra AI | Dùng Claude API phân tích độ trùng lặp |
| 📝 Nộp đề tài | Form nộp mới với kiểm tra trùng lặp trước |
| 📊 Thống kê | Biểu đồ theo năm, lĩnh vực, cảnh báo rủi ro |
| 🔍 Tìm kiếm | Tìm theo tên, sinh viên, GVHD, từ khóa |

## Tích hợp Backend (bước tiếp theo)

Thay `mockData.js` bằng API calls thực:

```js
// hooks/useTheses.js – thay useState bằng React Query
import { useQuery, useMutation } from '@tanstack/react-query';

export function useTheses() {
  const { data: theses } = useQuery({
    queryKey: ['theses'],
    queryFn: () => fetch('/api/theses').then(r => r.json()),
  });
  // ...
}
```

Gợi ý backend stack:
- **Node.js + Express + MongoDB** (nhanh, dễ deploy)
- **Django + PostgreSQL** (nếu team quen Python)
- **Supabase** (backend-as-a-service, không cần server)

## Biến môi trường

Tạo file `.env` ở root:

```env
# Không cần – API key được inject qua proxy của Claude.ai
# Nếu chạy standalone, thêm:
REACT_APP_API_URL=http://localhost:5000/api
```
