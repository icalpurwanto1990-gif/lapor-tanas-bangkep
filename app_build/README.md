# Lapor Tanas Bangkep v2.0 (Arsitektur Modular)

Sistem Layanan Pengaduan, Aspirasi, dan Permohonan Informasi Masyarakat Kabupaten Banggai Kepulauan berbasis Chatbot WhatsApp Terintegrasi dengan Web Admin Dashboard Modern.

---

## 🚀 Fitur Utama
1. **Chatbot WhatsApp Otomatis**:
   - Menu alur mandiri (Pengaduan, Aspirasi, Permohonan Informasi).
   - Validasi data identitas (Nama, NIK, Alamat, Kontak, Gender, Disabilitas).
   - Pengunggahan bukti foto/dokumen lampiran otomatis.
   - Pembuatan nomor tiket unik otomatis (`TKT-YYYYMMDD-XXXX`).
   - Fitur pelacakan status laporan secara instan via WhatsApp.
2. **Disposisi & Respon Dua Arah OPD**:
   - Meneruskan notifikasi pengaduan ke WhatsApp OPD terkait secara otomatis.
   - OPD dapat membalas via WhatsApp, dan sistem langsung meneruskan tanggapan ke WhatsApp pelapor.
3. **Admin Dashboard Modern**:
   - Ringkasan metrik statistik interaktif (Total, Menunggu, Diproses, Selesai).
   - Pencarian real-time dan multi-filtering status laporan.
   - Manajemen disposisi OPD, balasan langsung ke pelapor, dan penanda status selesai.
   - Cetak tiket laporan satuan dan cetak rekapitulasi laporan keseluruhan dengan format siap cetak.

---

## 📁 Struktur Direktori
```
app_build/
├── config/
│   ├── default.json          # Konfigurasi aplikasi & bot
│   └── opd.json              # Daftar nomor WhatsApp resmi OPD
├── data/
│   └── laporan.json          # File database laporan
├── public/
│   ├── css/
│   │   └── dashboard.css     # Style dashboard & media cetak
│   ├── js/
│   │   └── dashboard.js      # Logika interaktif admin panel
│   └── uploads/              # Direktori berkas bukti/lampiran
├── src/
│   ├── bot/
│   │   ├── botClient.js      # WhatsApp client & QR listener
│   │   ├── botHandler.js     # State machine percakapan & alur bot
│   │   └── sessionStore.js   # Penyimpanan sesi chat dengan TTL
│   ├── controllers/
│   │   ├── dashboardController.js
│   │   └── reportController.js
│   ├── routes/
│   │   ├── apiRoutes.js
│   │   └── webRoutes.js
│   ├── services/
│   │   ├── notificationService.js
│   │   ├── reportService.js
│   │   └── storageService.js
│   └── app.js                # Server entry point
├── .env.example              # Template variabel lingkungan
├── package.json
└── README.md
```

---

## 🛠️ Cara Menjalankan
1. Masuk ke direktori `app_build`:
   ```bash
   cd app_build
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Sesuaikan konfigurasi di `.env` (jika diperlukan):
   ```env
   PORT=3000
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=lapor
   ```
4. Jalankan aplikasi:
   ```bash
   npm start
   ```
5. Buka dashboard di peramban web:
   **http://localhost:3000/dashboard**
   *(Gunakan username dan password sesuai konfigurasi .env)*
6. Pindai (Scan) QR code di terminal untuk menghubungkan akun WhatsApp bot.
