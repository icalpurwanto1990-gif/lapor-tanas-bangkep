# Panduan Workflow Git & Sinkronisasi Langsung ke VPS

Repositori Git lokal Anda telah berhasil diinisialisasi pada branch `main` dengan commit awal yang bersih (file sensitif seperti sesi login WhatsApp `.wwebjs_auth`, cache Puppeteer, dan `node_modules` telah dilindungi oleh `.gitignore`).

---

## 📌 Langkah 1: Hubungkan ke GitHub (Komputer Lokal)

1. Buka [GitHub](https://github.com/new) dan buat repositori baru (misalnya diberi nama: `lapor-tanas-bangkep`).
   > *Catatan: Jangan centang opsi "Add a README file" atau ".gitignore" karena proyek lokal sudah memilikinya.*

2. Di terminal komputer lokal Anda, jalankan perintah berikut (ganti URL dengan URL repo GitHub Anda):
   ```bash
   git remote add origin https://github.com/icalpurwanto1990-gif/lapor-tanas-bangkep.git
   git branch -M main
   git push -u origin main
   ```

---

## 🚀 Langkah 2: Clone ke Server VPS Anda

Masuk ke VPS Anda melalui terminal SSH, lalu jalankan:

```bash
# 1. Clone repositori dari GitHub
cd /var/www
git clone https://github.com/icalpurwanto1990-gif/lapor-tanas-bangkep.git lapor-tanas

# 2. Masuk ke folder proyek
cd /var/www/lapor-tanas

# 3. Berikan izin eksekusi script
chmod +x setup-vps.sh vps-update.sh

# 4. Jalankan instalasi otomatis dependensi (Node.js, library Puppeteer, PM2)
./setup-vps.sh
```

---

## 📱 Langkah 3: Scan QR Code WhatsApp Pertama Kali di VPS

```bash
node app.js
```
- Pindai QR Code menggunakan aplikasi WhatsApp di HP Anda.
- Setelah muncul notifikasi `Chatbot Kominfo Berhasil Terhubung!`, tekan `CTRL + C`.
- Jalankan di background 24/7 dengan PM2:
  ```bash
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup
  ```

---

## 🔄 Langkah 4: Cara Update / Konfigurasi Langsung Selanjutnya

Setiap kali Anda mengubah kode, teks template pesan bot, atau tampilan dashboard di komputer lokal:

### Di Komputer Lokal:
```bash
git add .
git commit -m "update: pembaruan konfigurasi dan alur bot"
git push origin main
```

### Di VPS:
Cukup jalankan 1 script ini:
```bash
cd /var/www/lapor-tanas
./vps-update.sh
```
Script `vps-update.sh` akan otomatis:
1. Menarik commit terbaru (`git pull origin main`).
2. Memperbarui dependensi jika ada (`npm install`).
3. Me-reload proses PM2 tanpa mematikan sesi login WhatsApp.
4. Menampilkan status aplikasi secara langsung.
