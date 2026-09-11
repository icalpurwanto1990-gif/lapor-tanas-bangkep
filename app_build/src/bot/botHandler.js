const fs = require('fs');
const path = require('path');
const sessionStore = require('./sessionStore');
const reportService = require('../services/reportService');
const notificationService = require('../services/notificationService');

class BotHandler {
    constructor() {
        this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
        this.ensureUploadDir();
        this.keywords = [
            'MENU', 'HALO', 'P', 'START', 'INFO', 'HI', 'HELLO', 'HOLA', 'HALLO', 
            'ASSALAMUALAIKUM', 'SALAM', 'MULAI'
        ];
    }

    ensureUploadDir() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async handleMessage(client, msg) {
        try {
            if (msg.from === 'status@broadcast') return;

            const chat = await msg.getChat();
            if (chat.isGroup) return;

            const userId = msg.from;
            const pesan = (msg.body || '').trim().toUpperCase();

            // 1. Logika Balasan dari OPD (dua arah)
            const wasHandledByOPD = await this.handleOPDReply(client, msg);
            if (wasHandledByOPD) return;

            // 2. Periksa apakah user memulai sesi baru atau mengetik kata kunci menu
            const activeSession = sessionStore.get(userId);
            if (!activeSession || this.keywords.includes(pesan)) {
                sessionStore.set(userId, { step: 'home', data: {} });
                await chat.sendMessage(
                    `🏛️ *HALO, SELAMAT DATANG DI LAYANAN LAPOR BANGGAI KEPULAUAN* 🏛️\n\n` +
                    `Silakan pilih menu layanan kami:\n` +
                    `1️⃣ Buat Laporan *Lapor Tanas* (via ChatBot)\n` +
                    `2️⃣ Cek Status Laporan *(khusus Lapor Tanas)*\n` +
                    `3️⃣ Buat Laporan *SP4N Lapor*\n\n` +
                    `4️⃣ *Edukasi Layanan SP4N Lapor & Chatbot Lapor Tanas*\n\n` +
                    `__________________________________\n` +
                    `👉 _Balas dengan angka *1, 2, 3, atau 4*_`
                );
                return;
            }

            const session = activeSession;

            // 3. Navigasi Menu Utama
            if (session.step === 'home') {
                if (msg.body === '3') {
                    await chat.sendMessage(
                        'Apakah Anda belum Punya Akun? Silahkan Registrasi akun SP4N-LAPOR! berikut: https://lapor.go.id/account/register\n\n' +
                        'Apakah Sudah Punya Akun? Silahkan langsung login ke akun SP4N-LAPOR! https://lapor.go.id/#\n\n' +
                        '_Ketik *MENU* untuk kembali._'
                    );
                    sessionStore.delete(userId);
                } else if (msg.body === '2') {
                    session.step = 'proses_cek_tiket';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('🔍 Silakan masukkan *Nomor Tiket* laporan Anda:');
                } else if (msg.body === '1') {
                    session.step = 'tanya_nama';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Baik, mari melapor secara cepat.\nSiapa *Nama Lengkap* Anda?');
                } else if (msg.body === '4') {
                    await chat.sendMessage(
                        `📚 *EDUKASI LAYANAN LAPOR !*\n\n` +
                        `SP4N-LAPOR! adalah kanal pengaduan resmi pemerintah.\n` +
                        `🎥 *Video:* https://www.youtube.com/watch?v=pVJlNv0Zgd0&t=191s\n` +
                        `📖 *Panduan Tentang SP4N-Lapor:* https://lapor.go.id/tentang\n\n` +
                        `📖 *Panduan Fitur Anonim & Rahasia:* https://drive.google.com/file/d/1hX5vPAgC7HxMG-gjo81bNc9cvtSSD-CQ/view?usp=sharing\n\n` +
                        `📖 *Panduan Fitur Tanpa Akun ChatBot:* https://drive.google.com/file/d/1ZYojy_NzsvPZysJoUq49i8fENCx8E878/view?usp=sharing\n\n` +
                        `_Ketik *MENU* untuk kembali._`
                    );
                    sessionStore.delete(userId);
                }
                return;
            }

            // 4. Alur Input Data Identitas
            switch (session.step) {
                case 'tanya_nama':
                    session.data.nama = msg.body;
                    session.step = 'tanya_nik';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Masukkan *NIK* Anda (16 digit):');
                    break;

                case 'tanya_nik':
                    session.data.nik = msg.body;
                    session.step = 'tanya_alamat';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Masukkan *Alamat Lengkap* (Desa/Kelurahan dan Kecamatan) Anda:');
                    break;

                case 'tanya_alamat':
                    session.data.alamat = msg.body;
                    session.step = 'tanya_gender';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Jenis Kelamin (Laki-Laki/Perempuan):');
                    break;

                case 'tanya_gender':
                    session.data.gender = msg.body;
                    session.step = 'tanya_disabilitas';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Status Disabilitas (Ya/Tidak):');
                    break;

                case 'tanya_disabilitas':
                    session.data.disabilitas = msg.body;
                    session.step = 'tanya_kontak';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Masukkan *Email atau No. HP* aktif:');
                    break;

                case 'tanya_kontak':
                    session.data.kontak = msg.body;
                    session.step = 'pilih_laporan';
                    sessionStore.set(userId, session);
                    await chat.sendMessage(
                        '✅ *Data Identitas Tersimpan.*\n\n' +
                        'Silakan pilih jenis laporan yang ingin Anda sampaikan:\n' +
                        'A. *Pengaduan* (Masalah Layanan Publik)\n' +
                        'B. *Aspirasi* (Saran/Ide)\n' +
                        'C. *Permohonan Informasi*\n\n' +
                        '_Balas dengan huruf A, B, atau C_'
                    );
                    break;

                // 5. Alur Pilih Jenis Laporan
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
                        return;
                    }
                    sessionStore.set(userId, session);
                    break;

                // 6. Alur Detail Pengaduan
                case 'tanya_judul_P':
                    session.data.judul = msg.body;
                    session.step = 'tanya_isi_P';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Isi Laporan* (Detail kejadian):');
                    break;

                case 'tanya_isi_P':
                    session.data.isi = msg.body;
                    session.step = 'tanya_tanggal_P';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Tanggal Laporan* (DD/MM/YYYY):');
                    break;

                case 'tanya_tanggal_P':
                    session.data.tanggal = msg.body;
                    session.step = 'tanya_lokasi_P';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Asal Pelapor* (Kecamatan/Desa):');
                    break;

                case 'tanya_lokasi_P':
                    session.data.lokasi = msg.body;
                    session.step = 'tanya_instansi_P';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Instansi Tujuan*:');
                    break;

                case 'tanya_instansi_P':
                    session.data.instansi = msg.body;
                    session.step = 'tanya_bukti';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Kirim *Bukti Foto/Dokumen* (Atau ketik "Tidak ada"):');
                    break;

                // 7. Alur Detail Aspirasi
                case 'tanya_judul_A':
                    session.data.judul = msg.body;
                    session.step = 'tanya_isi_A';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Isi Laporan* (Detail saran/ide):');
                    break;

                case 'tanya_isi_A':
                    session.data.isi = msg.body;
                    session.step = 'tanya_tanggal_A';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Tanggal Laporan* (DD/MM/YYYY):');
                    break;

                case 'tanya_tanggal_A':
                    session.data.tanggal = msg.body;
                    session.step = 'tanya_lokasi_A';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Asal Pelapor* (Kecamatan/Desa):');
                    break;

                case 'tanya_lokasi_A':
                    session.data.lokasi = msg.body;
                    session.step = 'tanya_instansi_A';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Instansi Tujuan*:');
                    break;

                case 'tanya_instansi_A':
                    session.data.instansi = msg.body;
                    session.step = 'tanya_bukti';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Kirim *Bukti Foto/Dokumen* (Atau ketik "Tidak ada"):');
                    break;

                // 8. Alur Detail Permohonan Informasi
                case 'tanya_judul_I':
                    session.data.judul = msg.body;
                    session.step = 'tanya_isi_I';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Isi Laporan* (Detail permohonan informasi):');
                    break;

                case 'tanya_isi_I':
                    session.data.isi = msg.body;
                    session.step = 'tanya_tanggal_I';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Tanggal Kejadian/Kebutuhan* (DD/MM/YYYY):');
                    break;

                case 'tanya_tanggal_I':
                    session.data.tanggal = msg.body;
                    session.step = 'tanya_lokasi_I';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Lokasi* (Kecamatan/Desa):');
                    break;

                case 'tanya_lokasi_I':
                    session.data.lokasi = msg.body;
                    session.step = 'tanya_instansi_I';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Ketikkan *Instansi Tujuan*:');
                    break;

                case 'tanya_instansi_I':
                    session.data.instansi = msg.body;
                    session.step = 'tanya_bukti';
                    sessionStore.set(userId, session);
                    await chat.sendMessage('Kirim *Bukti Foto/Dokumen* (Atau ketik "Tidak ada"):');
                    break;

                // 9. Penanganan Bukti Media & Finalisasi Laporan
                case 'tanya_bukti': {
                    if (msg.hasMedia) {
                        try {
                            const media = await msg.downloadMedia();
                            if (media) {
                                const extension = (media.mimetype.split('/')[1] || 'bin').split(';')[0];
                                const fileName = `${Date.now()}_bukti.${extension}`;
                                const targetPath = path.join(this.uploadDir, fileName);

                                await fs.promises.writeFile(targetPath, media.data, { encoding: 'base64' });
                                session.data.buktiPath = `/uploads/${fileName}`;
                                session.data.isMedia = true;
                                session.data.mimetype = media.mimetype;
                            }
                        } catch (errMedia) {
                            console.error('[BotHandler] Gagal mengunduh media:', errMedia.message);
                            session.data.buktiPath = 'Gagal unduh media';
                            session.data.isMedia = false;
                        }
                    } else {
                        session.data.buktiPath = msg.body;
                        session.data.isMedia = false;
                    }

                    // Metadata pelapor
                    session.data.wa_id = userId;
                    session.data.kontak_asli = msg.from;

                    // Generate Nomor Tiket & Waktu
                    const tgl = new Date();
                    const nomorTiket = `TKT-${tgl.toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

                    session.data.no_tiket = nomorTiket;
                    session.data.status = 'Menunggu Verifikasi';
                    session.data.waktu = tgl.toLocaleString('id-ID');

                    // Simpan ke storage melalui reportService
                    await reportService.addReport(session.data);

                    // Kirim notifikasi konfirmasi ke pelapor
                    await chat.sendMessage(
                        `✅ *LAPORAN BERHASIL TERARSIP*\n\n` +
                        `Terima kasih, *${session.data.nama}*. Laporan Anda telah kami terima.\n\n` +
                        `🎫 Nomor Tiket: *${nomorTiket}*\n` +
                        `📱 Cek status laporan Anda melalui Menu Utama (Angka 2).`
                    );

                    sessionStore.delete(userId);
                    break;
                }

                // 10. Pengecekan Status Tiket
                case 'proses_cek_tiket': {
                    const tiketDicari = (msg.body || '').trim().toUpperCase();
                    const result = await reportService.getByTicket(tiketDicari);

                    if (result && result.report) {
                        const item = result.report;
                        await chat.sendMessage(
                            `🔎 *DETAIL STATUS LAPORAN*\n\n` +
                            `🎫 Tiket: *${item.no_tiket}*\n` +
                            `👤 Nama: ${item.nama}\n` +
                            `📝 Judul: ${item.judul}\n` +
                            `📍 Status: *${item.status}*\n` +
                            `⏰ Waktu: ${item.waktu}\n` +
                            `🏢 Disposisi: ${item.disposisi ? item.disposisi.opd : '-'}`
                        );
                    } else {
                        await chat.sendMessage('❌ Nomor Tiket tidak ditemukan. Pastikan format tiket benar (Contoh: TKT-20260405-8972).');
                    }

                    sessionStore.delete(userId);
                    break;
                }

                default:
                    sessionStore.delete(userId);
                    break;
            }
        } catch (err) {
            console.error('[BotHandler] Error saat memproses pesan:', err);
        }
    }

    async handleOPDReply(client, msg) {
        try {
            const contacts = notificationService.getOPDContacts();
            const senderNumber = msg.from;

            // Periksa apakah nomor pengirim adalah salah satu OPD
            const matchedOPD = Object.keys(contacts).find(key => contacts[key] === senderNumber);
            if (!matchedOPD) return false;

            // Cari pola nomor tiket (contoh: TKT-20260405-8972 atau TKT-12345)
            const regexTiket = /TKT-[0-9A-Z-]+/i;
            const match = msg.body.match(regexTiket);

            if (match) {
                const noTiket = match[0].toUpperCase();
                const result = await reportService.getByTicket(noTiket);

                if (result && result.report) {
                    const laporan = result.report;
                    const reporterWa = laporan.wa_id || laporan.kontak_asli;

                    if (reporterWa) {
                        await notificationService.forwardOPDReply(
                            client,
                            reporterWa,
                            matchedOPD,
                            laporan.no_tiket,
                            msg.body
                        );
                        await msg.reply(`✅ Balasan Anda telah diteruskan ke Pelapor (${laporan.nama}).`);
                        return true;
                    }
                } else {
                    await msg.reply(`❌ Nomor Tiket *${noTiket}* tidak ditemukan di database.`);
                    return true;
                }
            } else {
                await msg.reply(`⚠️ Mohon sertakan Nomor Tiket (Contoh: TKT-2026...) agar balasan Anda otomatis diteruskan ke pelapor yang tepat.`);
                return true;
            }
        } catch (err) {
            console.error('[BotHandler] Error saat verifikasi balasan OPD:', err.message);
        }
        return false;
    }
}

module.exports = new BotHandler();
