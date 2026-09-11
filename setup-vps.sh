#!/usr/bin/env bash

# ==============================================================================
# Script Otomatis Setup VPS Ubuntu/Debian untuk Lapor Tanas Bangkep
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 MEMULAI SETUP VPS UNTUK LAPOR TANAS BANGKEP"
echo "=========================================================="

# 1. Update paket sistem
echo "📦 1. Memperbarui repositori paket Linux..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Instalasi dependensi Chromium untuk Puppeteer (WhatsApp Web)
echo "🌐 2. Menginstal library Chromium / Puppeteer..."
# Deteksi libasound yang tersedia (Ubuntu 24.04 menggunakan libasound2t64)
LIB_ASOUND="libasound2"
if apt-cache show libasound2t64 >/dev/null 2>&1; then
    LIB_ASOUND="libasound2t64"
fi

sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    $LIB_ASOUND \
    libc6 \
    libcairo2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    curl \
    git

# 3. Instalasi Node.js 20 LTS (jika belum terpasang)
if ! command -v node &> /dev/null; then
    echo "🟢 3. Menginstal Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js sudah terpasang: $(node -v)"
fi

# 4. Instalasi PM2 Process Manager secara Global
if ! command -v pm2 &> /dev/null; then
    echo "⚙️  4. Menginstal PM2 Process Manager..."
    sudo npm install -g pm2
else
    echo "✅ PM2 sudah terpasang: $(pm2 -v)"
fi

# 5. Pasang dependensi npm aplikasi
echo "📚 5. Menginstal dependensi NPM aplikasi..."
npm install

# 6. Buka Firewall Port 3000 (jika UFW aktif)
if command -v ufw &> /dev/null; then
    echo "🛡️  6. Mengizinkan Port 3000 pada Firewall UFW..."
    sudo ufw allow 3000/tcp || true
fi

echo "=========================================================="
echo "🎉 SETUP DEPENDENSI VPS SELESAI!"
echo ""
echo "👉 Untuk menjalankan aplikasi pertama kali (agar bisa scan QR):"
echo "   node app.js"
echo ""
echo "👉 Setelah tersambung, jalankan 24/7 di background dengan PM2:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "👉 Akses Dashboard Admin di browser:"
echo "   http://IP_VPS_ANDA:3000/dashboard"
echo "=========================================================="
