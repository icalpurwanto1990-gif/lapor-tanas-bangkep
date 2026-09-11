# Panduan Lengkap Deploy "Lapor Tanas Bangkep" ke VPS (Ubuntu / Debian)

Dokumen ini menjelaskan langkah demi langkah untuk menjalankan aplikasi **Lapor Tanas Bangkep** di Virtual Private Server (VPS) Anda agar aktif 24 jam nonstop.

---

## 📋 Prasyarat VPS
- **Sistem Operasi Disarankan**: Ubuntu 20.04 / 22.04 / 24.04 LTS atau Debian 11/12.
- **Spesifikasi Minimal**: RAM 1 GB (Disarankan 2 GB karena Puppeteer/Chromium membutuhkan memori untuk menjalankan browser WhatsApp).
- **Akses**: Root / Sudo via SSH.

---

## 🚀 Opsi 1: Setup Otomatis (Direkomendasikan)

Kami telah menyertakan script otomatisasi `setup-vps.sh` yang akan memasang seluruh dependensi sistem (Node.js 20, library Chromium Puppeteer, PM2, dan dependensi npm).

### Langkah 1: Upload / Clone Proyek ke VPS
Anda dapat meng-upload folder proyek ke VPS menggunakan `git clone` atau `scp`/`rsync`:
```bash
# Dari komputer lokal ke VPS (opsi SCP):
scp -r "d:/project LATSAR/Lapor Tanas Bangkep" root@IP_VPS_ANDA:/var/www/lapor-tanas
```
Atau jika menggunakan Git:
```bash
cd /var/www
git clone <URL_REPOSITORY_ANDA> lapor-tanas
```

### Langkah 2: Jalankan Script Setup
Masuk ke folder proyek di terminal SSH VPS Anda:
```bash
cd /var/www/lapor-tanas

# Berikan izin eksekusi
chmod +x setup-vps.sh

# Jalankan script
./setup-vps.sh
```

---

## 📱 Langkah 3: Scan QR Code WhatsApp Pertama Kali

Untuk pertama kali, jalankan aplikasi secara langsung di terminal agar Anda dapat memindai QR Code WhatsApp:
```bash
node app.js
# atau jika menggunakan versi app_build:
# cd app_build && npm start
```

1. Terminal akan menampilkan **QR Code**.
2. Buka aplikasi WhatsApp di HP Anda: **Perangkat Tertaut (Linked Devices) > Tautkan Perangkat (Link a Device)**.
3. Arahkan kamera HP ke QR Code di terminal SSH.
4. Tunggu sampai muncul pesan: `🚀 Chatbot Kominfo Berhasil Terhubung!`.
5. Tekan `CTRL + C` untuk keluar dari mode terminal langsung (sesi login Anda sudah tersimpan di folder `.wwebjs_auth/`).

---

## 🔄 Langkah 4: Jalankan 24/7 di Background Menggunakan PM2

Agar aplikasi tetap berjalan meskipun Anda menutup terminal SSH:

```bash
# Jalankan menggunakan file konfigurasi PM2
pm2 start ecosystem.config.js

# Simpan konfigurasi agar otomatis berjalan saat VPS reboot
pm2 save
pm2 startup
```

### Perintah Penting PM2:
- Cek status: `pm2 status`
- Lihat log langsung: `pm2 logs lapor-tanas`
- Restart aplikasi: `pm2 restart lapor-tanas`
- Stop aplikasi: `pm2 stop lapor-tanas`

---

## 🌐 Langkah 5: Akses Dashboard Admin
Buka browser Anda dan akses:
```
http://IP_VPS_ANDA:3000/dashboard
```
- **Username**: `admin`
- **Password**: `lapor` *(bisa diubah di `.env`)*

---

## 🔒 Langkah 6 (Opsional): Pasang Domain & HTTPS (SSL Gratis)

Jika Anda memiliki domain (contoh: `lapor.bangkepkab.go.id`), Anda bisa menggunakan Nginx sebagai Reverse Proxy:

### 1. Pasang Nginx & Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Buat Konfigurasi Nginx
```bash
sudo nano /etc/nginx/sites-available/lapor-tanas
```
Isi dengan:
```nginx
server {
    server_name lapor.bangkepkab.go.id; # Ganti dengan domain Anda

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. Aktifkan & Dapatkan SSL
```bash
sudo ln -s /etc/nginx/sites-available/lapor-tanas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Pasang SSL Let's Encrypt gratis
sudo certbot --nginx -d lapor.bangkepkab.go.id
```

---

## 🐳 Opsi 2: Menggunakan Docker & Docker Compose

Jika VPS Anda sudah terpasang Docker:
```bash
cd app_build
docker compose up -d
docker compose logs -f lapor-tanas
```
Pindai QR code dari output logs container.
