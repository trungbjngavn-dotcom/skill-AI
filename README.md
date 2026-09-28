# AI Media Skills Hub (skill-AI)

Hệ thống chuẩn hóa và báo cáo năng lực **33 Mô hình AI Media** (Video, Hình ảnh, Kỹ xảo, Âm thanh & Nhân vật ảo) phục vụ tự động hóa sản xuất nội dung số cho doanh nghiệp.

---

## 🌟 Tính Năng Nổi Bật

- **6 Phân Hệ Năng Lực Chuẩn Hóa**:
  1. **Video Generation**: ByteDance Seedance 2.5/2.0, Wan-AI 2.7/3.0, Kling 3.0, HappyHorse 1.0, Image-to-Video.
  2. **Image Generation**: FLUX.2 Klein, FLUX Kontext, GPT Image 2, Nano Banana 2.
  3. **Editing & VFX**: Wan 2.7 Edit, Google Veo 3 Extend, Inpainting, Outpainting, Relight, ControlNet.
  4. **Avatar & Faces**: AI Avatar Talking Video, Face Swap, Audio Lipsync.
  5. **Music & Audio**: ElevenLabs Music, ACE-Step, AI Music.
  6. **CLI & System**: RunComfy CLI, Codex Pet.
- **✨ Mẫu Prompt Thực Tế (Số 1)**: Cung cấp câu lệnh prompt tiếng Anh chuẩn kèm phân tích kịch bản và giải nghĩa tiếng Việt chi tiết cho từng mô hình.
- **📋 Thông Số Kỹ Thuật (API Schema)**: Bảng đặc tả tham số đầu vào (Field, Type, Required, Default, Notes) chính xác 100%.
- **💻 Mã Nguồn Tích Hợp Đa Nền Tảng**: Sẵn sàng tích hợp qua Python 3 (Requests - chạy mượt trên Windows), Node.js (Fetch API), RunComfy CLI và cURL.
- **🏢 Tích Hợp AI Agent**: Cung cấp cấu hình nạp tri thức vào Cursor (`.cursorrules`), Claude Code và Antigravity IDE.

---

## 🚀 Hướng Dẫn Khởi Động Nhanh

### Cách 1: Chạy trực tiếp trên Windows (1-Click)
Nhấp đúp vào file **`start.bat`**. Trình duyệt sẽ tự động mở tại `http://localhost:3300`.

### Cách 2: Chạy bằng Node.js / NPM
Dự án được tối ưu **Zero-Dependency** (không cần cài thêm thư viện ngoài):
```bash
npm start
# Hoặc:
node server.js
```
Sau đó truy cập trình duyệt tại: **`http://localhost:3300`**

---

## 📁 Cấu Trúc Thư Mục

```text
├── public/                 # Giao diện Web Executive Dashboard
│   ├── index.html          # Cấu trúc giao diện & các tab nội dung
│   ├── style.css           # Hệ thống giao diện hiện đại, tone sáng sang trọng
│   └── app.js              # Logic điều khiển, danh mục accordion & mẫu prompt
├── skills/                 # 33 thư mục đặc tả kỹ thuật (SKILL.md)
│   ├── seedance-2-5-image-to-video/
│   ├── wan-2-7/
│   ├── kling-3-0/
│   ├── flux-2-klein/
│   └── ...
├── server.js               # Máy chủ Node.js backend phục vụ API & Static UI
├── package.json            # Cấu hình dự án
├── start.bat               # Script khởi động nhanh trên Windows
└── README.md               # Tài liệu dự án
```
