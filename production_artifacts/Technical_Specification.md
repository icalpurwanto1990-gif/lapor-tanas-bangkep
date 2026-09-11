# Technical Specification: Implementasi Manajemen Versi Git & Workflow Sinkronisasi VPS

## 1. Executive Summary
Spesifikasi ini disusun untuk memenuhi kebutuhan pengelolaan kode sumber berbasis **Git Version Control System (VCS)** pada sistem **Lapor Tanas Bangkep**. 

Dengan integrasi Git:
- Pengembang dan administrator dapat mengelola kode sumber secara terpusat (misalnya via GitHub / GitLab).
- Konfigurasi dan perubahan kode di komputer lokal dapat langsung disinkronisasikan ke VPS secara aman menggunakan `git pull` tanpa perlu transfer file manual (SCP/SFTP).
- Berkas sensitif (seperti kredensial `.env`, sesi WhatsApp `.wwebjs_auth`, dan cache puppeteer) terisolasi secara ketat dan tidak akan bocor ke repositori publik melalui konfigurasi `.gitignore` yang tepat.

---

## 2. Requirements

### 2.1. Functional Requirements
1. **Inisialisasi Repositori Git**:
   - Inisialisasi Git repository lokal dengan branch utama standar (`main`).
   - Pembuatan file `.gitignore` komprehensif untuk melindungi:
     - `node_modules/` (dependensi pihak ketiga).
     - `.wwebjs_auth/` dan `.wwebjs_cache/` (sesi dan token otentikasi login WhatsApp).
     - `.env` (kredensial sandi admin dan port server).
     - Berkas bukti upload (`uploads/*`, dengan mempertahankan folder).
     - Log sistem (`*.log`, `npm-debug.log*`, `.pm2/`).
     - Berkas sistem operasi (`.DS_Store`, `Thumbs.db`).
2. **Template Konfigurasi Lingkungan (`.env.example`)**:
   - Menyediakan contoh konfigurasi yang aman dikomit ke repositori agar saat di-clone di VPS, pengguna cukup menyalin `.env.example` menjadi `.env`.
3. **Alur Sinkronisasi VPS (Git CI/CD Workflow)**:
   - Script pembantu di VPS (`vps-update.sh`) untuk menarik update terbaru (`git pull origin main`), memperbarui dependensi (`npm install`), dan merestart proses daemon PM2 secara otomatis tanpa downtime yang lama.
4. **Petunjuk Koneksi Remote GitHub / GitLab**:
   - Panduan menghubungkan repositori lokal ke akun GitHub / GitLab pengguna.

### 2.2. Non-Functional Requirements
- **Keamanan Kredensial**: Jaminan 100% berkas rahasia (token sesi WA dan password admin) tidak terunggah ke repositori.
- **Efisiensi Ukuran Repositori**: Menjaga ukuran repo tetap ramping (<5MB) dengan mengecualikan dependensi binary dan berkas cache.

---

## 3. Architecture & Tech Stack

### 3.1. Komponen & Alur Data Git
```
[Komputer Lokal Pengembang]
       │
       ├── (1) Edit Kode & Konfigurasi
       ├── (2) git add . && git commit -m "Update"
       └── (3) git push origin main
                     │
                     ▼
          [GitHub / GitLab Remote]
                     │
                     ▼ (4) git pull / ./vps-update.sh
           [Server VPS Linux]
                     │
                     ├── Perbarui Berkas Kode
                     └── pm2 reload lapor-tanas (Auto-Restart 24/7)
```

### 3.2. Struktur Berkas Git Tambahan
```
├── .gitignore               # Aturan pengecualian berkas sensitif & cache
├── .env.example             # Template variabel lingkungan
├── vps-update.sh            # Script 1-baris untuk auto-update di VPS
└── production_artifacts/
    └── Git_VPS_Workflow.md  # Panduan step-by-step setup GitHub & VPS
```

---

## 4. Approval Gate
Do you approve of this tech stack and specification? You can safely open `production_artifacts/Technical_Specification.md` and add comments or modifications if you want me to rework anything!
