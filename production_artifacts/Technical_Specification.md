# Technical Specification: Panduan & Solusi Instalasi Node.js 20 LTS di VPS

## 1. Executive Summary
Pada saat menjalankan `node app.js` di server VPS (`root@srv1798679:/var/www/lapor-tanas#`), muncul galat:
```
Command 'node' not found, but can be installed with:
apt install nodejs
```
Masalah ini terjadi karena lingkungan VPS belum memiliki runtime **Node.js** dan **NPM**. Perintah standar `apt install nodejs` dari repositori bawaan Linux tidak disarankan karena:
1. Sering kali memasang versi Node.js yang sudah usang (outdated).
2. Sering kali **tidak menyertakan NPM** secara otomatis.
3. Belum menyertakan paket pustaka C++/grafis (Chromium dependencies) yang mutlak dibutuhkan oleh browser Puppeteer pada library `whatsapp-web.js`.

Spesifikasi ini memberikan solusi teknis instalasi Node.js 20 LTS resmi (NodeSource), dependensi Puppeteer, serta skrip 1-baris siap pakai (*one-liner command*).

---

## 2. Requirements

### 2.1. Functional Requirements
1. **Instalasi Node.js 20.x LTS & NPM Resmi**:
   - Menambahkan repository resmi NodeSource untuk Ubuntu/Debian.
   - Memasang `nodejs` (yang mencakup runtime `node` dan paket manajer `npm`).
2. **Instalasi Pustaka Sistem Chromium (Puppeteer Dependencies)**:
   - Memasang library wajib: `libnss3`, `libatk-bridge2.0-0`, `libcups2`, `libgbm1`, `libasound2`, `fonts-liberation`, dll. agar browser headless WhatsApp Web dapat terbuka di Linux tanpa antarmuka GUI.
3. **Instalasi Dependensi Proyek**:
   - Menjalankan `npm install` di dalam direktori `/var/www/lapor-tanas`.
4. **Instalasi PM2 (Process Manager)**:
   - Memasang PM2 secara global (`npm install -g pm2`) agar bot WhatsApp dan dashboard Express berjalan 24 jam di background.

---

## 3. Implementation Steps (One-Liner Command)

Perintah lengkap yang harus dieksekusi pengguna di terminal VPS (`root@srv1798679`):

```bash
# 1. Update paket sistem & pasang curl
apt-get update -y && apt-get install -y curl ca-certificates

# 2. Tambahkan repo NodeSource Node.js 20 LTS & instal Node.js + NPM
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Instal dependensi Chromium untuk WhatsApp Web (Puppeteer)
apt-get install -y \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libglib2.0-0 \
  libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libx11-xcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxrandr2 libxss1 libxtst6

# 4. Verifikasi versi
node -v && npm -v

# 5. Pasang dependensi aplikasi & jalankan
cd /var/www/lapor-tanas
npm install
node app.js
```

---

## 4. Approval Gate
Do you approve of this tech stack and specification? You can safely open Technical_Specification.md and add comments or modifications if you want me to rework anything!
