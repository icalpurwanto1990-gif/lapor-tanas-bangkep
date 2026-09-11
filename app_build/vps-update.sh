#!/usr/bin/env bash

# ==============================================================================
# Script Pembaruan Otomatis Lapor Tanas Bangkep di VPS via Git
# ==============================================================================

set -e

echo "🔄 [1/4] Menarik perubahan kode terbaru dari repositori Git..."
git pull origin main

echo "📦 [2/4] Memeriksa dan memperbarui dependensi NPM..."
npm install --omit=dev

echo "🚀 [3/4] Me-reload proses PM2 (Zero-downtime reload)..."
if pm2 describe lapor-tanas > /dev/null 2>&1; then
    pm2 reload lapor-tanas || pm2 restart lapor-tanas
else
    pm2 start ecosystem.config.js
fi

pm2 save

echo "✅ [4/4] Pembaruan selesai! Status aplikasi:"
pm2 status lapor-tanas
