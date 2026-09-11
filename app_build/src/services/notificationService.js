const fs = require('fs');
const path = require('path');

class NotificationService {
    constructor() {
        this.opdFilePath = process.env.OPD_FILE_PATH || path.join(__dirname, '../../config/opd.json');
    }

    getOPDContacts() {
        try {
            if (fs.existsSync(this.opdFilePath)) {
                return JSON.parse(fs.readFileSync(this.opdFilePath, 'utf-8'));
            }
        } catch (e) {
            console.error('[NotificationService] Gagal membaca opd.json:', e.message);
        }
        return {};
    }

    async notifyOPD(client, opdName, laporan, catatan) {
        if (!client) {
            console.warn('[NotificationService] WhatsApp client belum siap');
            return false;
        }

        const contacts = this.getOPDContacts();
        const targetNumber = contacts[opdName];

        if (!targetNumber) {
            console.warn(`[NotificationService] Nomor WhatsApp untuk OPD ${opdName} tidak ditemukan.`);
            return false;
        }

        const pesanOPD = 
            `🔔 *NOTIFIKASI DISPOSISI LAPORAN*\n\n` +
            `Halo Tim *${opdName}*,\n\n` +
            `Anda menerima disposisi laporan baru:\n` +
            `🎫 Tiket: *${laporan.no_tiket}*\n` +
            `👤 Pelapor: ${laporan.nama}\n` +
            `📝 Perihal: ${laporan.judul}\n` +
            `📄 Isi: ${laporan.isi}\n\n` +
            `Catatan Admin: ${catatan || '-'}\n\n` +
            `Mohon tindak lanjuti. Balas pesan ini dengan menyertakan nomor tiket untuk menjawab pelapor.`;

        try {
            await client.sendMessage(targetNumber, pesanOPD);
            console.log(`[NotificationService] Notifikasi disposisi terkirim ke ${opdName} (${targetNumber})`);
            return true;
        } catch (err) {
            console.error(`[NotificationService] Gagal kirim notif ke ${opdName}:`, err.message);
            return false;
        }
    }

    async replyReporter(client, waId, reporterName, noTiket, pesan) {
        if (!client || !waId) {
            console.warn('[NotificationService] WhatsApp client belum siap atau nomor pelapor tidak valid');
            return false;
        }

        const pesanTeks = 
            `🏛️ *TANGGAPAN LAPORAN*\n\n` +
            `Halo *${reporterName || 'Pelapor'}*,\n\n` +
            `Berikut tanggapan untuk laporan Anda (Tiket: *${noTiket}*):\n\n` +
            `"${pesan}"\n\n` +
            `Terima kasih telah menggunakan Layanan Lapor Tanas Bangkep.`;

        try {
            await client.sendMessage(waId, pesanTeks);
            console.log(`[NotificationService] Berhasil membalas pelapor tiket ${noTiket} (${waId})`);
            return true;
        } catch (err) {
            console.error(`[NotificationService] Gagal membalas pelapor:`, err.message);
            return false;
        }
    }

    async forwardOPDReply(client, reporterWaId, opdName, noTiket, pesan) {
        if (!client || !reporterWaId) return false;

        const pesanKePelapor = 
            `🏛️ *TANGGAPAN DARI ${opdName}*\n\n` +
            `Terkait laporan Anda dengan Tiket: *${noTiket}*\n\n` +
            `"${pesan}"\n\n` +
            `_Terima kasih atas partisipasi Anda._`;

        try {
            await client.sendMessage(reporterWaId, pesanKePelapor);
            return true;
        } catch (err) {
            console.error(`[NotificationService] Gagal meneruskan pesan OPD:`, err.message);
            return false;
        }
    }
}

module.exports = new NotificationService();
