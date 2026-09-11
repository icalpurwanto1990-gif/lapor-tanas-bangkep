# Technical Specification: Solusi EINTEGRITY Checksum Error pada npm install

## 1. Executive Summary
Saat menjalankan `npm install` di server VPS, terjadi galat kegagalan checksum integritas (*Integrity Checksum Failed*):
```
npm error code EINTEGRITY
npm error sha512-... integrity checksum failed when using sha512: wanted sha512-5C1toAq... but got sha512-x9K0o...
```

### Analisis Akar Masalah (Root Cause):
Galat ini terjadi karena dependensi `whatsapp-web.js` di `package.json` menggunakan URL tarball dinamis GitHub:
`"whatsapp-web.js": "https://github.com/pedroslopez/whatsapp-web.js/tarball/master"`

URL arsip tarball GitHub di-generate secara dinamis dan hash checksum sha512-nya berubah setiap kali repositori di-update oleh pengembangnya atau saat GitHub me-refresh kompresi arsip. Karena `package-lock.json` mengunci hash tarball lama, NPM menolak memasang paket demi keamanan integritas.

---

## 2. Requirements & Solusi

### 2.1. Solusi Kode Sumber:
1. Mengubah dependensi `whatsapp-web.js` di `package.json` menggunakan versi stabil npm registry atau format Git ref yang aman:
   ```json
   "whatsapp-web.js": "^1.26.0"
   ```
   atau
   ```json
   "whatsapp-web.js": "github:pedroslopez/whatsapp-web.js"
   ```
2. Menghapus referensi cache lama di `package-lock.json` agar NPM memperbarui checksum sha512 yang valid.

### 2.2. Solusi Langsung di VPS:
Memberikan perintah perbaikan cepat di terminal VPS:
- Menghapus `package-lock.json` dan folder `node_modules` jika ada.
- Menghapus cache npm (`npm cache clean --force`).
- Memasang dependensi secara bersih dengan `npm install --no-audit`.

---

## 3. Approval Gate
Do you approve of this tech stack and specification? You can safely open Technical_Specification.md and add comments or modifications if you want me to rework anything!
