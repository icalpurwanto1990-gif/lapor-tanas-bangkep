const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inisialisasi Client
const client = new Client({
    authStrategy: new LocalAuth(), // Menyimpan sesi login agar tidak scan QR terus-menerus
    puppeteer: {
        headless: true,
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Menampilkan QR Code di Terminal
client.on('qr', (qr) => {
    console.log('SCAN QR CODE INI DI WHATSAPP ANDA:');
    qrcode.generate(qr, { small: true });
});

// Notifikasi jika sudah terhubung
client.on('ready', () => {
    console.log('Chatbot Kominfo Berhasil Terhubung!');
});

// Logika Auto-Reply berdasarkan Diagram
const userSteps = {}; // Penyimpanan status alur tiap user

client.on('message', async (msg) => {
    try {
        if (!msg || !msg.from) return;
        if (msg.from === 'status@broadcast' || msg.from.endsWith('@broadcast') || msg.from.endsWith('@newsletter') || msg.isStatus) return;

        const chat = await msg.getChat();
        if (!chat || chat.isGroup) return;

        const userId = msg.from;
        const pesan = (msg.body || '').trim().toUpperCase();
        // --- 1. MENYAPA & MENU UTAMA ---
        const keywordSapaan = ['MENU', 'HALO', 'P', 'START', 'INFO','HI', 'HELLO', 'HOLA','hallo', 'ASSALAMUALAIKUM', 'SALAM', 'MULAI'];
    
    if (!userSteps[userId] || keywordSapaan.includes(pesan)) {
        // Inisialisasi sesi baru
        userSteps[userId] = { step: 'home', data: {} }
        
        await chat.sendMessage(
            `🏛️ *HALO, SELAMAT DATANG DI LAYANAN LAPOR BANGGAI KEPULAUAN* 🏛️\n\n` +
            `Silakan pilih menu layanan kami:\n` +
            `1️⃣ Buat Laporan *Lapor Tanas*(via ChatBot)\n` +
            `2️⃣ Cek Status Laporan*(khusus Lapor Tanas)*\n` +
            `3️⃣ Buat Laporan *SP4N Lapor*\n\n` +
            `4️⃣ *Edukasi Layanan SP4N Lapor & Chatbot Lapor Tanas*\n\n` +
            `__________________________________\n` +
            `👉 _Balas dengan angka *1, 2, 3, atau 4*_`
        );
        return;
    }

    const session = userSteps[userId];

    // --- 2. NAVIGASI MENU UTAMA ---
    if (session.step === 'home') {
        if (msg.body === '3') {
            await chat.sendMessage(
                'Apakah Anda belum Punya Akun? Silahkan Registrasi akun SP4N-LAPOR! berikut: https://lapor.go.id/account/register\n\n' +
                'Apakah Sudah Punya Akun? Silahkan langsung login ke akun SP4N-LAPOR! https://lapor.go.id/#\n\n' +
                '_Ketik *MENU* untuk kembali._'
            )
                ;
            delete userSteps[userId];
        } 
        else if (msg.body === '2') {
            session.step = 'proses_cek_tiket';
            await chat.sendMessage('🔍 Silakan masukkan *Nomor Tiket* laporan Anda:');
        } 
        else if (msg.body === '1') {
            // MASUK KE ALUR YANG SUDAH KITA BUAT SEBELUMNYA
            session.step = 'tanya_nama'; 
            await chat.sendMessage('Baik, mari melapor secara cepat.\nSiapa *Nama Lengkap* Anda?');
        } 
        else if (msg.body === '4') {
            await chat.sendMessage(
                `📚 *EDUKASI LAYANAN LAPOR !*\n\n` +
                `SP4N-LAPOR! adalah kanal pengaduan resmi pemerintah.\n` +
                `🎥 *Video:* https://www.youtube.com/watch?v=pVJlNv0Zgd0&t=191s\n` +
                `📖 *Panduan Tentang SP4N-Lapor:* https://lapor.go.id/tentang\n\n` +
                `📖 *Panduan Fitur Anonim & Rahasia:* https://drive.google.com/file/d/1hX5vPAgC7HxMG-gjo81bNc9cvtSSD-CQ/view?usp=sharing\n\n` +
                `📖 *Panduan Fitur Tanpa Akun ChatBot:* https://drive.google.com/file/d/1ZYojy_NzsvPZysJoUq49i8fENCx8E878/view?usp=sharing\n\n` +
                `_Ketik *MENU* untuk kembali._`
            );
            delete userSteps[userId];
        }
        return;
    }

    // --- 2. ALUR INPUT DATA IDENTITAS (Sesuai Kotak Hijau di Diagram) ---
    switch (session.step) {
        case 'tanya_nama':
            session.data.nama = msg.body;
            session.step = 'tanya_nik';
            await chat.sendMessage('Masukkan *NIK* Anda (16 digit):');
            break;

        case 'tanya_nik':
            session.data.nik = msg.body;
            session.step = 'tanya_alamat';
            await chat.sendMessage('Masukkan *Alamat Lengkap* (Desa/Kelurahan dan Kecamatan) Anda:');
            break;

        case 'tanya_alamat':
            session.data.alamat = msg.body;
            session.step = 'tanya_gender';
            await chat.sendMessage('Jenis Kelamin (Laki-Laki/Perempuan):');
            break;

        case 'tanya_gender':
            session.data.gender = msg.body;
            session.step = 'tanya_disabilitas';
            await chat.sendMessage('Status Disabilitas (Ya/Tidak):');
            break;

        case 'tanya_disabilitas':
            session.data.disabilitas = msg.body;
            session.step = 'tanya_kontak';
            await chat.sendMessage('Masukkan *Email atau No. HP* aktif:');
            break;

        case 'tanya_kontak':
            session.data.kontak = msg.body;
            // Selesai identitas, masuk ke PILIH JENIS LAPORAN (Kotak Biru di Diagram)
            session.step = 'pilih_laporan';
            await chat.sendMessage(
                '✅ *Data Identitas Tersimpan.*\n\n' +
                'Silakan pilih jenis laporan yang ingin Anda sampaikan:\n' +
                'A. *Pengaduan* (Masalah Layanan Publik)\n' +
                'B. *Aspirasi* (Saran/Ide)\n' +
                'C. *Permohonan Informasi*\n\n' +
                '_Balas dengan huruf A, B, atau C_'
            );
            break;

        // --- 3. ALUR PILIH JENIS LAPORAN ---
        case 'pilih_laporan':
            if (pesan === 'A') {
                session.data.jenis = 'Pengaduan';
                session.step = 'tanya_judul_P';
                await chat.sendMessage('--- *FORM PENGADUAN LAPOR TANAS BANGKEP!* ---\n\nSilakan masukkan *Judul Laporan*:');
            } else if (pesan === 'B') {
                session.data.jenis = 'Aspirasi';
                session.step = 'tanya_judul_A';
                await chat.sendMessage('--- *FORM ASPIRASI LAPOR TANAS BANGKEP!* ---\n\nSilakan masukkan *Judul Laporan*:');
            } else if (pesan === 'C') {
                session.data.jenis = 'Permohonan Informasi';
                session.step = 'tanya_judul_I';
                await chat.sendMessage('--- *FORM PERMINTAAN INFORMASI LAPOR TANAS BANGKEP!* ---\n\nSilakan masukkan *Judul Laporan*:');
            } else {
                await chat.sendMessage('Mohon balas dengan huruf A, B, atau C.');
            }
            break;

        // --- 4. ALUR DETAIL PENGADUAN (Sesuai Juknis SP4N-LAPOR!) ---
        case 'tanya_judul_P':
            session.data.judul = msg.body;
            session.step = 'tanya_isi_P';
            await chat.sendMessage('Ketikkan *Isi Laporan* (Detail kejadian):');
            break;

        case 'tanya_isi_P':
            session.data.isi = msg.body;
            session.step = 'tanya_tanggal_P';
            await chat.sendMessage('Ketikkan *Tanggal Laporan* (DD/MM/YYYY):');
            break;

        case 'tanya_tanggal_P':
            session.data.tanggal = msg.body;
            session.step = 'tanya_lokasi_P';
            await chat.sendMessage('Ketikkan *Asal Pelapor* (Kecamatan/Desa):');
            break;

        case 'tanya_lokasi_P':
            session.data.lokasi = msg.body;
            session.step = 'tanya_instansi_P';
            await chat.sendMessage('Ketikkan *Instansi Tujuan*:');
            break;

        case 'tanya_instansi_P':
            session.data.instansi = msg.body;
            session.step = 'tanya_bukti';
            await chat.sendMessage('Kirim *Bukti Foto/Dokumen* (Atau ketik "Tidak ada"):');
            break;

              
     // --- 5. ALUR DETAIL ASPIRASI (Sesuai Juknis SP4N-LAPOR!) ---
        case 'tanya_judul_A':
            session.data.judul = msg.body;
            session.step = 'tanya_isi_A';
            await chat.sendMessage('Ketikkan *Isi Laporan* (Detail kejadian):');
            break;

        case 'tanya_isi_A':
            session.data.isi = msg.body;
            session.step = 'tanya_tanggal_A';
            await chat.sendMessage('Ketikkan *Tanggal Laporan* (DD/MM/YYYY):');
            break;

        case 'tanya_tanggal_A':
            session.data.tanggal = msg.body;
            session.step = 'tanya_lokasi_A';
            await chat.sendMessage('Ketikkan *Asal Pelapor* (Kecamatan/Desa):');
            break;

        case 'tanya_lokasi_A':
            session.data.lokasi = msg.body;
            session.step = 'tanya_instansi_A';
            await chat.sendMessage('Ketikkan *Instansi Tujuan*:');
            break;

        case 'tanya_instansi_A':
            session.data.instansi = msg.body;
            session.step = 'tanya_bukti';
            await chat.sendMessage('Kirim *Bukti Foto/Dokumen* (Atau ketik "Tidak ada"):');
            break;
// --- 6. ALUR DETAIL Permohonan Informasi (Sesuai Juknis SP4N-LAPOR!) ---
        case 'tanya_judul_I':
            session.data.judul = msg.body;
            session.step = 'tanya_isi_I';
            await chat.sendMessage('Ketikkan *Isi Laporan* (Detail kejadian):');
            break;

        case 'tanya_isi_I':
            session.data.isi = msg.body;
            session.step = 'tanya_tanggal_I';
            await chat.sendMessage('Ketikkan *Tanggal Kejadian* (DD/MM/YYYY):');
            break;

        case 'tanya_tanggal_I':
            session.data.tanggal = msg.body;
            session.step = 'tanya_lokasi_I';
            await chat.sendMessage('Ketikkan *Lokasi Kejadian* (Kecamatan/Desa):');
            break;

        case 'tanya_lokasi_I':
            session.data.lokasi = msg.body;
            session.step = 'tanya_instansi_I';
            await chat.sendMessage('Ketikkan *Instansi Tujuan*:');
            break;

        case 'tanya_instansi_I':
            session.data.instansi = msg.body;
            session.step = 'tanya_bukti';
            await chat.sendMessage('Kirim *Bukti Foto/Dokumen* (Atau ketik "Tidak ada"):');
            break;

        case 'tanya_bukti':{
            // 1. Logika Download Media (Gambar/File)
            if (msg.hasMedia) {
                const media = await msg.downloadMedia();
                if (media) {
                    const extension = media.mimetype.split('/')[1].split(';')[0];
                    const fileName = `${Date.now()}_bukti.${extension}`;
                    fs.writeFileSync(`./uploads/${fileName}`, media.data, { encoding: 'base64' });
                    session.data.buktiPath = `/uploads/${fileName}`;
                    session.data.isMedia = true;
                    session.data.mimetype = media.mimetype;
                    
                }
            } else {
                session.data.buktiPath = msg.body;
                session.data.isMedia = false;
            }
            // TAMBAHKAN BARIS INI PENTING: Simpan ID WhatsApp agar bisa dibalas nanti
            session.data.wa_id = userId; 
            session.data.kontak_asli = msg.from; // Simpan format asli @c.us

            // 2. Generate Nomor Tiket & Waktu
            const tgl = new Date();
            const nomorTiket = `TKT-${tgl.toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
            
            session.data.no_tiket = nomorTiket;
            session.data.status = 'Menunggu Verifikasi';
            session.data.waktu = tgl.toLocaleString('id-ID');

            // 3. SIMPAN KE JSON (PENTING!)
            const dataLaporan = JSON.parse(fs.readFileSync('./laporan.json', 'utf-8'));
            dataLaporan.push(session.data);
            fs.writeFileSync('./laporan.json', JSON.stringify(dataLaporan, null, 2));

            // 4. PESAN TERAKHIR (SESI AKHIR)
            await chat.sendMessage(
                `✅ *LAPORAN BERHASIL TERARSIP*\n\n` +
                `Terima kasih, *${session.data.nama}*. Laporan Anda telah kami terima.\n\n` +
                `🎫 Nomor Tiket: *${nomorTiket}*\n` +
                `📱 Cek status laporan Anda melalui Menu Utama (Angka 2).`
            );

            // 5. HAPUS SESI (Agar bisa kembali ke menu utama)
            delete userSteps[userId]; 
            break;
        }  
        case 'proses_cek_tiket': { // Pakai { } untuk isolasi variabel
            const tiketDicari = msg.body.trim().toUpperCase();
            let dataLengkap = [];
            
            if (fs.existsSync('./laporan.json')) {
                dataLengkap = JSON.parse(fs.readFileSync('./laporan.json', 'utf-8'));
            }

            const ketemu = dataLengkap.find(l => l.no_tiket === tiketDicari);

            if (ketemu) {
                await chat.sendMessage(
                    `🔎 *DETAIL STATUS*\n` +
                    `🎫 Tiket: *${ketemu.no_tiket}*\n` +
                    `👤 Nama: ${ketemu.nama}\n` +
                    `📍 Status: *${ketemu.status}*\n` +
                    `⏰ Waktu: ${ketemu.waktu}`
                );
            } else {
                await chat.sendMessage('❌ Nomor Tiket tidak ditemukan.');
            }
            delete userSteps[userId];
            break;
        }
    // --- LOGIKA BALASAN DARI OPD ---
    // Kita letakkan di paling bawah event listener 'message'
    
    // 1. Cek apakah pengirim adalah OPD (dengan baca opd.json)
    let pengirimAdalahOPD = null;
    try {
        const dataOPD = JSON.parse(fs.readFileSync('./opd.json', 'utf-8'));
        const nomorPengirim = msg.from; // format: 628xxx@c.us
        
        // Cari nama OPD yang punya nomor ini
        const namaOPDTemu = Object.keys(dataOPD).find(key => dataOPD[key] === nomorPengirim);
        if (namaOPDTemu) {
            pengirimAdalahOPD = namaOPDTemu;
        }
    } catch (err) {
        // Abaikan jika file error
    }

    // Jika pengirim terdaftar sebagai OPD
    if (pengirimAdalahOPD) {
        // Cek apakah pesan adalah balasan (reply) ke pesan bot sebelumnya?
        // Atau kita cari tiket di dalam pesan?
        
        // Cara paling aman: Cari Nomor Tiket dalam format TKT-xxxxx di pesan OPD
        const regexTiket = /TKT-\d+/;
        const tiketDicari = msg.body.match(regexTiket);

        if (tiketDicari) {
            const noTiket = tiketDicari[0];
            
            // Cari data laporan berdasarkan nomor tiket
            const dataLaporan = JSON.parse(fs.readFileSync('./laporan.json', 'utf-8'));
            const laporan = dataLaporan.find(l => l.no_tiket === noTiket);

            if (laporan) {
                // Kirim balasan OPD ke Pelapor
                const pesanKePelapor = `🏛️ *TANGGAPAN DARI ${pengirimAdalahOPD}*\n\n` +
                                      `Terkait laporan Anda dengan Tiket: *${laporan.no_tiket}*\n\n` +
                                      `"${msg.body}"\n\n` +
                                      `_Terima kasih._`;
                
                // Kirim ke WA Pelapor
                if (client && laporan.wa_id) {
                    await client.sendMessage(laporan.wa_id, pesanKePelapor);
                    await msg.reply(`✅ Balasan Anda telah diteruskan ke Pelapor (${laporan.nama}).`);
                }
            } else {
                await msg.reply(`❌ Tiket ${noTiket} tidak ditemukan.`);
            }
        } else {
            // Jika OPD mengirim pesan tapi tidak menyebutkan Tiket, beri instruksi
            await msg.reply(`⚠️ Mohon sertakan Nomor Tiket (Contoh: TKT-2023...) agar balasan Anda sampai ke pelapor yang benar.`);
        }
    }
}
} catch (err) {
    console.error('Error message handler:', err.message);
}
});

                      
// event ini untuk memantau proses
client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN:', percent, message);
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED! Silakan scan:');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED: Berhasil login!');
});

client.on('ready', () => {
    console.log('BOT READY: Chatbot Kominfo sudah aktif!');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE:', msg);
});

//Dasboard untuk menampilkan laporan yang masuk
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;
const basicAuth = require('express-basic-auth');
app.use('/uploads', express.static('uploads'));
app.use(basicAuth({
    users: {
        'admin': 'lapor'
    },
    challenge: true,
    unauthorizedResponse: 'Akses Ditolak. Silakan masukkan username dan password.'
}));

// Middleware untuk memastikan dashboard bisa membaca file JSON
// Route Dashboard yang sudah ditingkatkan dengan Monitoring Statistik
// Route Dashboard Gabungan (Monitoring + Disposisi + Balas)
app.get('/dashboard', (req, res) => {
    try {
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Dashboard Admin - Lapor Tanas</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
                <style>
                    body { background: #f4f6f9; font-family: 'Segoe UI', sans-serif; }
                    .navbar { background: #1a237e; border-bottom: 4px solid #3949ab; }
                    .card-stat { border: none; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; }
                    .card-stat:hover { transform: translateY(-5px); }
                    .icon-box { font-size: 2.5rem; opacity: 0.8; }
                    
                    /* --- CSS KHUSUS PRINT (SAAT DICETAK) --- */
                    @media print {
                        body * { visibility: hidden; }
                        
                        /* Tampilkan area cetak tabel (Cetak Semua) */
                        #area-cetak-laporan, #area-cetak-laporan * { visibility: visible; }
                        #area-cetak-laporan { position: absolute; left: 0; top: 0; width: 100%; margin-top: 0; padding: 20px; background: white; }

                        /* Tampilkan area cetak tiket (Cetak Satuan) */
                        #cetakTiket, #cetakTiket * { visibility: visible; }
                        #cetakTiket { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                        
                        /* Sembunyikan elemen lain */
                        .no-print { display: none !important; }
                        .modal { position: absolute; left: 0; top: 0; width: 100%; overflow: visible; }
                        .modal-content { box-shadow: none; border: none; }
                    }
                </style>
            </head>
            <body>
                <nav class="navbar navbar-dark p-3 shadow-sm no-print">
                    <div class="container d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-speedometer2 me-2 fs-4"></i>
                            <span class="navbar-brand mb-0 h1">Dashboard Lapor Tanas</span>
                        </div>
                        <div>
                            <!-- Tombol Cetak Semua Laporan -->
                            <button class="btn btn-warning text-dark me-2" onclick="cetakLaporanSemua()"><i class="bi bi-printer-fill"></i> Cetak Laporan</button>
                            <button class="btn btn-outline-light btn-sm" onclick="location.reload()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
                        </div>
                    </div>
                </nav>

                <div class="container mt-4 no-print">
                    
                    <!-- 1. WIDGET MONITORING STATISTIK -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-3">
                            <div class="card card-stat bg-primary text-white">
                                <div class="card-body d-flex justify-content-between align-items-center">
                                    <div><h6 class="card-title mb-0">Total Laporan</h6><h2 class="fw-bold mb-0" id="stat-total">0</h2></div>
                                    <div class="icon-box"><i class="bi bi-file-earmark-bar-graph-fill"></i></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card card-stat bg-warning text-dark">
                                <div class="card-body d-flex justify-content-between align-items-center">
                                    <div><h6 class="card-title mb-0">Menunggu</h6><h2 class="fw-bold mb-0" id="stat-pending">0</h2></div>
                                    <div class="icon-box"><i class="bi bi-hourglass-split"></i></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card card-stat bg-info text-white">
                                <div class="card-body d-flex justify-content-between align-items-center">
                                    <div><h6 class="card-title mb-0">Diproses</h6><h2 class="fw-bold mb-0" id="stat-proses">0</h2></div>
                                    <div class="icon-box"><i class="bi bi-gear-fill"></i></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card card-stat bg-success text-white">
                                <div class="card-body d-flex justify-content-between align-items-center">
                                    <div><h6 class="card-title mb-0">Selesai</h6><h2 class="fw-bold mb-0" id="stat-selesai">0</h2></div>
                                    <div class="icon-box"><i class="bi bi-check-circle-fill"></i></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. PENCARIAN & FILTER -->
                    <div class="card mb-4 border-0 shadow-sm">
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-5">
                                    <label class="form-label fw-bold"><i class="bi bi-search"></i> Cari (Nama / NIK / Tiket)</label>
                                    <input type="text" id="inputCari" class="form-control" placeholder="Ketik kata kunci..." onkeyup="muatData()">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Filter Status</label>
                                    <select id="filterStatus" class="form-select" onchange="muatData()">
                                        <option value="Semua">Semua Status</option>
                                        <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                                        <option value="Sedang Diproses">Sedang Diproses</option>
                                        <option value="Selesai">Selesai</option>
                                        <option value="Ditolak">Ditolak</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. TABEL DATA -->
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white fw-bold text-primary">
                            <i class="bi bi-table me-2"></i> Daftar Laporan Masuk
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="text-start">INFO LAPORAN</th>
                                            <th>PELAPOR</th>
                                            <th>STATUS & DISPOSISI</th>
                                            <th class="text-end">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabel-laporan"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AREA KHUSUS UNTUK CETAK TABEL (HIDDEN) -->
                <div id="area-cetak-laporan" style="display: none;">
                    <div class="text-center mb-4">
                        <h3>LAPORAN MASYARAKAT</h3>
                        <p>Sistem Lapor Tanas Bangkep</p>
                        <p class="small">Dicetak pada: <span id="print-tgl"></span></p>
                        <hr>
                    </div>
                    <table class="table table-bordered table-sm" style="font-size: 12px;">
                        <thead>
                            <tr style="background: #eee;">
                                <th>No</th>
                                <th>Tiket</th>
                                <th>Tanggal</th>
                                <th>Nama Pelapor</th>
                                <th>Judul Laporan</th>
                                <th>Status</th>
                                <th>Disposisi</th>
                            </tr>
                        </thead>
                        <tbody id="tabel-print-body">
                            <!-- Data akan diisi via JS saat tombol cetak ditekan -->
                        </tbody>
                    </table>
                </div>

                <!-- MODAL 1: DISPOSISI -->
                <div class="modal fade" id="modalDisposisi" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title"><i class="bi bi-share-forward"></i> Disposisi ke OPD</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <input type="hidden" id="disp_index">
                                <div class="mb-3"><label class="form-label">Pilih OPD</label><select id="disp_opd" class="form-select">
                                    <option value="Dinas Kominfo">Dinas Kominfo</option>
                                    <option value="Dinas Pendidikan">Dinas Pendidikan</option>
                                    <option value="Dinas Kesehatan">Dinas Kesehatan</option>
                                    <option value="Dinas PUPR">Dinas PUPR</option>
                                    <option value="Dinas Sosial">Dinas Sosial</option>
                                    <option value="Kecamatan">Kecamatan</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select></div>
                                <div class="mb-3"><label class="form-label">Catatan</label><textarea id="disp_catatan" class="form-control" rows="3"></textarea></div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                                <button type="button" class="btn btn-warning" onclick="kirimDisposisi()">Teruskan</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODAL 2: BALAS PELAPOR -->
                <div class="modal fade" id="modalBalas" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title"><i class="bi bi-chat-dots"></i> Balas Pelapor</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <input type="hidden" id="balas_index">
                                <div class="alert alert-info small">Pesan dikirim langsung ke WA Pelapor.</div>
                                <div class="mb-3"><label class="form-label">Isi Tanggapan</label><textarea id="balas_pesan" class="form-control" rows="5"></textarea></div>
                                <div class="form-check"><input class="form-check-input" type="checkbox" id="check_selesai" checked><label class="form-check-label" for="check_selesai">Tandai Selesai</label></div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                                <button type="button" class="btn btn-success" onclick="kirimBalasan()">Kirim</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODAL 3: BUKTI (GAMBAR/DOKUMEN) -->
                <div class="modal fade" id="modalBukti" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Bukti Laporan</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-center">
                                <div id="bukti-container"></div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODAL 4: CETAK TIKET (SATUAN) -->
                <div class="modal fade" id="modalCetak" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header no-print">
                                <h5 class="modal-title">Pratinjau Cetak Tiket</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div id="cetakTiket" class="p-4 border">
                                    <div class="text-center mb-4">
                                        <h4 class="fw-bold text-uppercase">Laporan Masyarakat</h4>
                                        <p class="mb-0">Sistem Lapor Tanas Bangkep</p>
                                        <hr>
                                    </div>
                                    <table class="table table-bordered">
                                        <tr><td width="30%">Nomor Tiket</td><td><b id="cetak_no_tiket"></b></td></tr>
                                        <tr><td>Tanggal Masuk</td><td id="cetak_waktu"></td></tr>
                                        <tr><td>Nama Pelapor</td><td id="cetak_nama"></td></tr>
                                        <tr><td>NIK</td><td id="cetak_nik"></td></tr>
                                        <tr><td>Jenis Laporan</td><td id="cetak_jenis"></td></tr>
                                        <tr><td>Instansi Tujuan</td><td id="cetak_instansi"></td></tr>
                                        <tr><td>Lokasi Kejadian</td><td id="cetak_lokasi"></td></tr>
                                        <tr><td>Status</td><td id="cetak_status"></td></tr>
                                    </table>
                                    <h6 class="fw-bold">Isi Laporan:</h6>
                                    <p id="cetak_isi" class="text-justify border p-3 bg-light"></p>
                                    <h6 class="fw-bold mt-3">Disposisi:</h6>
                                    <p id="cetak_disposisi" class="fst-italic"></p>
                                    <div class="mt-5 text-end">
                                        <p>Banggai Laut, <span id="cetak_tgl_ttd"></span></p>
                                        <p>( Admin Sistem )</p>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer no-print">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                                <button type="button" class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer"></i> Cetak Sekarang</button>
                            </div>
                        </div>
                    </div>
                </div>

                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
                <script>
                    let dataLaporanGlobal = []; // Simpan data global untuk keperluan cetak
                    let modalDisp, modalBalas, modalBukti, modalCetak;

                    async function muatData() {
                        try {
                            const response = await fetch('/api/laporan');
                            const data = await response.json();
                            dataLaporanGlobal = data; // Simpan ke variabel global
                            
                            // 1. UPDATE STATISTIK
                            const total = data.length;
                            document.getElementById('stat-total').innerText = total;
                            document.getElementById('stat-pending').innerText = data.filter(d => d.status === 'Menunggu Verifikasi').length;
                            document.getElementById('stat-proses').innerText = data.filter(d => d.status === 'Sedang Diproses').length;
                            document.getElementById('stat-selesai').innerText = data.filter(d => d.status === 'Selesai').length;

                            // 2. LOGIKA FILTER & PENCARIAN
                            const kataKunci = document.getElementById('inputCari').value.toLowerCase();
                            const statusTerpilih = document.getElementById('filterStatus').value;

                            const dataFilter = data.filter(item => {
                                const matchKeyword = 
                                    item.nama.toLowerCase().includes(kataKunci) || 
                                    item.nik.includes(kataKunci) || 
                                    (item.no_tiket && item.no_tiket.toLowerCase().includes(kataKunci));
                                const matchStatus = (statusTerpilih === 'Semua' || item.status === statusTerpilih);
                                return matchKeyword && matchStatus;
                            });

                            // 3. RENDER TABEL
                            let html = '';
                            if (dataFilter.length === 0) {
                                html = '<tr><td colspan="4" class="text-center p-4 text-muted">Data tidak ditemukan / Tidak ada filter.</td></tr>';
                            } else {
                                dataFilter.forEach((item, index) => {
                                    // Cari index asli di data utama untuk keperluan hapus/edit
                                    const asliIndex = data.indexOf(item);

                                    let badgeStatus = 'bg-secondary';
                                    if(item.status === 'Menunggu Verifikasi') badgeStatus = 'bg-warning text-dark';
                                    if(item.status === 'Sedang Diproses') badgeStatus = 'bg-info text-white';
                                    if(item.status === 'Selesai') badgeStatus = 'bg-success';

                                    let btnBukti = item.isMedia 
                                        ? \`<button class="btn btn-sm btn-info text-white mb-1" onclick="lihatBukti(\${asliIndex})"><i class="bi bi-image"></i> Bukti</button>\`
                                        : \`<button class="btn btn-sm btn-light text-muted mb-1" disabled><i class="bi bi-x-circle"></i> Tidak ada</button>\`;

                                    html += \`
                                    <tr>
                                        <td class="text-start">
                                            <span class="badge bg-secondary mb-1">#\${item.no_tiket}</span><br>
                                            <b>\${item.judul}</b><br>
                                            <small class="text-muted text-wrap d-block" style="max-width: 250px;">\${item.isi.substring(0, 80)}...</small>
                                        </td>
                                        <td>
                                            <b>\${item.nama}</b><br>
                                            <small>\${item.nik}</small>
                                        </td>
                                        <td>
                                            <span class="badge \${badgeStatus} mb-1">\${item.status}</span><br>
                                            <small class="text-muted">Disposisi: \${item.disposisi ? item.disposisi.opd : '-'}</small>
                                        </td>
                                        <td class="text-end">
                                            <div class="btn-group-vertical">
                                                \${btnBukti}
                                                <button class="btn btn-sm btn-dark mb-1" onclick="lihatCetak(\${asliIndex})"><i class="bi bi-printer"></i> Tiket</button>
                                                <button class="btn btn-sm btn-warning mb-1" onclick="bukaDisposisi(\${asliIndex})"><i class="bi bi-share"></i> Disposisi</button>
                                                <button class="btn btn-sm btn-success mb-1" onclick="bukaBalas(\${asliIndex})"><i class="bi bi-reply"></i> Balas</button>
                                                <button class="btn btn-sm btn-danger" onclick="hapusLaporan(\${asliIndex})"><i class="bi bi-trash"></i> Hapus</button>
                                            </div>
                                        </td>
                                    </tr>\`;
                                });
                            }
                            document.getElementById('tabel-laporan').innerHTML = html;
                        } catch (e) { console.error(e); }
                    }

                    document.addEventListener('DOMContentLoaded', () => {
                        modalDisp = new bootstrap.Modal(document.getElementById('modalDisposisi'));
                        modalBalas = new bootstrap.Modal(document.getElementById('modalBalas'));
                        modalBukti = new bootstrap.Modal(document.getElementById('modalBukti'));
                        modalCetak = new bootstrap.Modal(document.getElementById('modalCetak'));
                        muatData();
                        setInterval(muatData, 10000);
                    });

                    // --- FITUR CETAK SEMUA (CETAK TABEL YANG SEDANG DIFILTER) ---
                    async function cetakLaporanSemua() {
                        // 1. Ambil data yang sedang tampil di tabel (Sesuai Filter)
                        const kataKunci = document.getElementById('inputCari').value.toLowerCase();
                        const statusTerpilih = document.getElementById('filterStatus').value;

                        const dataFilter = dataLaporanGlobal.filter(item => {
                            const matchKeyword = 
                                item.nama.toLowerCase().includes(kataKunci) || 
                                item.nik.includes(kataKunci) || 
                                (item.no_tiket && item.no_tiket.toLowerCase().includes(kataKunci));
                            const matchStatus = (statusTerpilih === 'Semua' || item.status === statusTerpilih);
                            return matchKeyword && matchStatus;
                        });

                        // 2. Siapkan HTML untuk dicetak
                        document.getElementById('print-tgl').innerText = new Date().toLocaleString('id-ID');
                        let html = '';
                        dataFilter.forEach((item, idx) => {
                            html += \`
                            <tr>
                                <td>\${idx + 1}</td>
                                <td>\${item.no_tiket}</td>
                                <td>\${item.waktu}</td>
                                <td>\${item.nama}</td>
                                <td>\${item.judul}</td>
                                <td>\${item.status}</td>
                                <td>\${item.disposisi ? item.disposisi.opd : '-'}</td>
                            </tr>\`;
                        });
                        document.getElementById('tabel-print-body').innerHTML = html;

                        // 3. Cetak
                        window.print();
                    }

                    // --- FUNGSI MODAL BUKTI ---
                    async function lihatBukti(index) {
                        const item = dataLaporanGlobal[index];
                        const container = document.getElementById('bukti-container');
                        if (item.isMedia) {
                            if (item.mimetype.includes('image')) {
                                container.innerHTML = \`<img src="\${item.buktiPath}" class="img-fluid rounded border" alt="Bukti">\`;
                            } else {
                                container.innerHTML = \`<a href="\${item.buktiPath}" target="_blank" class="btn btn-primary"><i class="bi bi-download"></i> Download Dokumen</a>\`;
                            }
                        }
                        modalBukti.show();
                    }

                    // --- FUNGSI CETAK TIKET (SATUAN) ---
                    async function lihatCetak(index) {
                        const item = dataLaporanGlobal[index];
                        document.getElementById('cetak_no_tiket').innerText = item.no_tiket;
                        document.getElementById('cetak_waktu').innerText = item.waktu;
                        document.getElementById('cetak_nama').innerText = item.nama;
                        document.getElementById('cetak_nik').innerText = item.nik;
                        document.getElementById('cetak_jenis').innerText = item.jenis;
                        document.getElementById('cetak_instansi').innerText = item.instansi || '-';
                        document.getElementById('cetak_lokasi').innerText = item.lokasi || '-';
                        document.getElementById('cetak_status').innerText = item.status;
                        document.getElementById('cetak_isi').innerText = item.isi;
                        document.getElementById('cetak_disposisi').innerText = item.disposisi ? \`Ke: \${item.disposisi.opd} (\${item.disposisi.catatan})\` : 'Belum ada disposisi';
                        document.getElementById('cetak_tgl_ttd').innerText = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        modalCetak.show();
                    }

                    // --- FUNGSI DISPOSISI ---
                    function bukaDisposisi(index) {
                        document.getElementById('disp_index').value = index;
                        document.getElementById('disp_opd').value = 'Dinas Kominfo';
                        document.getElementById('disp_catatan').value = '';
                        modalDisp.show();
                    }
                    async function kirimDisposisi() {
                        const index = document.getElementById('disp_index').value;
                        const opd = document.getElementById('disp_opd').value;
                        const catatan = document.getElementById('disp_catatan').value;
                        await fetch('/disposisi/' + index, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ opd, catatan }) });
                        modalDisp.hide(); muatData();
                    }

                    // --- FUNGSI BALAS ---
                    function bukaBalas(index) {
                        document.getElementById('balas_index').value = index;
                        document.getElementById('balas_pesan').value = '';
                        modalBalas.show();
                    }
                    async function kirimBalasan() {
                        const index = document.getElementById('balas_index').value;
                        const pesan = document.getElementById('balas_pesan').value;
                        const selesai = document.getElementById('check_selesai').checked;
                        if(!pesan) return alert('Pesan kosong!');
                        await fetch('/balas/' + index, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ pesan, selesai }) });
                        modalBalas.hide(); alert('Terkirim!'); muatData();
                    }

                    // --- FUNGSI HAPUS ---
                    async function hapusLaporan(index) {
                        if(confirm('Yakin ingin menghapus data ini permanen?')) {
                            await fetch('/hapus/' + index, { method: 'DELETE' });
                            muatData();
                        }
                    }
                </script>
            </body>
            </html>
        `;
        res.send(content);
    } catch (e) { 
        console.error(e); 
        res.send("Error Dashboard"); 
    }
});
// Route khusus untuk menghapus data
app.delete('/hapus/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index); // Ambil indeks dari URL
        const data = JSON.parse(fs.readFileSync('./laporan.json', 'utf-8'));
        
        if (index >= 0 && index < data.length) {
            data.splice(index, 1); // Hapus 1 data pada indeks tersebut
            fs.writeFileSync('./laporan.json', JSON.stringify(data, null, 2));
            console.log(`Laporan indeks ${index} berhasil dihapus.`);
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "Data tidak ditemukan" });
        }
    } catch (error) {
        console.error("Error hapus:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Route untuk update status laporan
app.post('/update-status/:index', express.json(), (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const statusBaru = req.body.status;
        const data = JSON.parse(fs.readFileSync('./laporan.json', 'utf-8'));

        if (index >= 0 && index < data.length) {
            data[index].status = statusBaru; // Update status di file JSON
            fs.writeFileSync('./laporan.json', JSON.stringify(data, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ success: false });
    }
});
app.get('/api/laporan', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('./laporan.json', 'utf-8'));
        res.json(data);
    } catch (e) {
        res.json([]);
    }
});
// --- API DISPOSISI ---
// --- API DISPOSISI (UPDATE: KIRIM NOTIF KE OPD) ---
app.post('/disposisi/:index', express.json(), (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const { opd, catatan } = req.body;
        
        // 1. Baca Data Laporan
        const data = JSON.parse(fs.readFileSync('./laporan.json', 'utf-8'));

        // 2. Baca Data OPD
        let nomorOPD = null;
        try {
            const dataOPD = JSON.parse(fs.readFileSync('./opd.json', 'utf-8'));
            nomorOPD = dataOPD[opd]; // Cari nomor berdasarkan nama OPD
        } catch (err) {
            console.log("File opd.json tidak ditemukan atau error");
        }

        if (index >= 0 && index < data.length) {
            const laporan = data[index];

            // 3. Update Data Laporan
            data[index].disposisi = {
                opd: opd,
                catatan: catatan,
                waktu: new Date().toLocaleString('id-ID')
            };
            data[index].status = 'Sedang Diproses';
            
            fs.writeFileSync('./laporan.json', JSON.stringify(data, null, 2));

            // 4. KIRIM NOTIFIKASI KE WHATSAPP OPD
            if (nomorOPD && client) {
                const pesanOPD = `🔔 *NOTIFIKASI DISPOSISI LAPORAN*\n\n` +
                                `Halo Tim *${opd}*,\n\n` +
                                `Anda menerima disposisi laporan baru:\n` +
                                `🎫 Tiket: *${laporan.no_tiket}*\n` +
                                `👤 Pelapor: ${laporan.nama}\n` +
                                `📝 Perihal: ${laporan.judul}\n` +
                                `📄 Isi: ${laporan.isi}\n\n` +
                                `Catatan Admin: ${catatan || '-'}\n\n` +
                                `Mohon tindak lanjuti. Balas pesan ini untuk menjawab pelapor.`;
                
                client.sendMessage(nomorOPD, pesanOPD).then(() => {
                    console.log(`Notifikasi disposisi terkirim ke ${opd} (${nomorOPD})`);
                }).catch(err => {
                    console.error(`Gagal kirim notif ke ${opd}:`, err);
                });
            } else {
                console.warn(`Nomor WhatsApp untuk ${opd} tidak ditemukan di opd.json`);
            }

            res.json({ success: true, message: `Disposisi dikirim ke ${opd}` });
        } else {
            res.status(404).json({ success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// --- API BALAS PELAPOR (KIRIM WA) ---
app.post('/balas/:index', express.json(), (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const { pesan, selesai } = req.body;
        const data = JSON.parse(fs.readFileSync('./laporan.json', 'utf-8'));

        if (index >= 0 && index < data.length) {
            const laporan = data[index];
            
            // 1. Format Nomor WA
            // Pastikan nomor dalam format 628xxx@c.us
            let nomorWA = laporan.wa_id; // Menggunakan wa_id yang kita simpan di Langkah 1
            
            // Validasi sederhana jika wa_id kosong (fallback ke kontak_asli)
            if (!nomorWA && laporan.kontak_asli) {
                nomorWA = laporan.kontak_asli;
            }

            // 2. Kirim Pesan via WhatsApp Client
            if (client) {
                const pesanTeks = `🏛️ *TANGGAPAN LAPORAN*\n\n` +
                                  `Halo *${laporan.nama}*,\n\n` +
                                  `Berikut adalah tanggapan untuk laporan Anda:\n` +
                                  `"${pesan}"\n\n` +
                                  `Terima kasih telah menggunakan Lapor Tanas.`;
                
                // Mengirim pesan
                client.sendMessage(nomorWA, pesanTeks).then(() => {
                    console.log(`Berhasil membalas laporan ${laporan.no_tiket}`);
                }).catch(err => {
                    console.error(`Gagal membalas: ${err}`);
                });
            }

            // 3. Update Status di JSON
            if (selesai) {
                data[index].status = 'Selesai';
            }
            // Simpan histori balasan (opsional, jika ingin ditampilkan di dashboard nanti)
            if (!data[index].balasan) data[index].balasan = [];
            data[index].balasan.push({
                pesan: pesan,
                waktu: new Date().toLocaleString('id-ID')
            });

            fs.writeFileSync('./laporan.json', JSON.stringify(data, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});
// JALANKAN SERVER EXPRESS DULU
app.listen(port, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🌐 DASHBOARD AKTIF: http://localhost:${port}/dashboard`);
    console.log(`--------------------------------------------------`);
});

// BARU JALANKAN WHATSAPP CLIENT
client.initialize().catch(err => {
    console.error('⚠️ Inisialisasi awal client:', err.message);
});

// Tangani unhandled rejection agar server tidak mati saat Chrome melakukan background reload
process.on('unhandledRejection', (reason) => {
    console.warn('⚠️ Peringatan background browser:', reason && reason.message ? reason.message : reason);
});
