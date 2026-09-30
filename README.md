# TikTok Downloader — Modern Web Interface

Aplikasi web modern untuk mengunduh video TikTok tanpa watermark, audio MP3, dan foto slide secara gratis dan cepat.

---

## 🚀 Cara Menjalankan Proyek

### Menggunakan Python HTTP Server (serve.py)
1. Jalankan server Python di port `8085`:
   ```bash
   python3 serve.py
   ```
2. Buka browser dan akses: `http://localhost:8085`

### Menggunakan Node.js Development Server
1. Install dependencies:
   ```bash
   npm install
   ```
2. Jalankan server lokal Node.js:
   ```bash
   npm start
   ```
3. Buka di browser: `http://localhost:3000`

---

## 🔍 Penjelasan Masalah style.css & Solusi (Root Cause Analysis)

### Root Cause Analysis
1. **Cache Browser Hijacking / Stale Cache**: File `style.css` sering tersimpan dalam HTTP Cache lokal browser tanpa mekanisme revalidasi versi yang ketat, sehingga perubahan styling tidak langsung direfleksikan.
2. **Missing MIME Type Specification**: Server HTTP bawaan sederhana kadang melayani file `.css` dengan Content-Type fallback `text/plain` atau `application/octet-stream` yang menyebabkan browser menolak mengaplikasikan stylesheet demi alasan keamanan (`X-Content-Type-Options: nosniff`).
3. **Implicit Relative Paths**: Tanpa query string versi atau penguncian asset, browser dapat mengalami kegagalan resolusi stylesheet saat diakses melalui sub-route atau proxy serverless.

### Solusi yang Diterapkan
- **Cache Busting**: Menambahkan parameter query versi `<link rel="stylesheet" href="style.css?v=20260930">`.
- **Dedicated Custom Web Server (`serve.py`)**: Menjamin header `Content-Type: text/css` secara eksplisit untuk semua resource `.css`.
- **Strict Content Security Policy (CSP)**: Menyertakan meta tag CSP yang mengizinkan font Google & gaya CSS inline tepercaya.
- **Modern CSS Architecture**: Merombak total `style.css` dengan CSS Variables, CSS Reset, Responsive Grid & Flexbox layout, dan mendukung Dark Mode.

---

## 📁 Struktur File Proyek

```text
TikTok-Downloader/
├── index.html          # Semantic HTML5 Structure (BEM style markup)
├── style.css           # 800+ lines of Modern CSS (Glassmorphism, CSS Vars, Responsive)
├── script.js           # Vanilla JS (Theme Toggle, History, Clipboard Paste, Toast)
├── serve.py            # Python 3 custom HTTP Server with strict MIME handling
├── server.js           # Node.js / Express Server for local & deployment
├── api/                # Serverless endpoints (/download, /proxy, /health)
├── assets/             # Project static assets (logo, favicon)
├── package.json        # Project metadata and dependencies
└── README.md           # Project documentation
```

---

## ✨ Fitur Utama
- **No Watermark HD Download**: Unduh video kualitas asli tanpa logo TikTok.
- **Glassmorphic & Responsive UI**: Tampilan visual modern dengan mode Gelap / Terang (Dark/Light Mode).
- **Clipboard Integration**: Tempel tautan dari clipboard secara otomatis dengan satu klik.
- **Download History System**: Menyimpan riwayat unduhan di `localStorage` dengan opsi hapus & salin link.
- **Interactive Toast Notifications**: Feedback visual langsung untuk setiap aksi pengguna.
- **Accessible & Semantic**: Memenuhi standar semantic HTML5 dan accessibility WCAG 2.1 AA.

---

## 🤝 Cara Kontribusi
1. Fork repository ini.
2. Buat branch fitur baru (`git checkout -b feature/fitur-baru`).
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur baru'`).
4. Push ke branch (`git push origin feature/fitur-baru`).
5. Buat Pull Request.

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah MIT License. Lihat file [LICENSE](LICENSE) untuk informasi lebih detail.
