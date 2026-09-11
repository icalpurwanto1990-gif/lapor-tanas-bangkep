const reportService = require('../services/reportService');
const notificationService = require('../services/notificationService');
const botClient = require('../bot/botClient');

class ReportController {
    async getAll(req, res) {
        try {
            const data = await reportService.getAll();
            res.json(data);
        } catch (error) {
            console.error('[ReportController] getAll error:', error);
            res.status(500).json({ error: 'Gagal mengambil data laporan' });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await reportService.getStats();
            res.json(stats);
        } catch (error) {
            console.error('[ReportController] getStats error:', error);
            res.status(500).json({ error: 'Gagal mengambil statistik' });
        }
    }

    async updateStatus(req, res) {
        try {
            const index = parseInt(req.params.index, 10);
            const { status } = req.body;
            const updated = await reportService.updateStatus(index, status);

            if (updated) {
                res.json({ success: true, data: updated });
            } else {
                res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
            }
        } catch (error) {
            console.error('[ReportController] updateStatus error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async disposisi(req, res) {
        try {
            const index = parseInt(req.params.index, 10);
            const { opd, catatan } = req.body;

            const target = await reportService.getByIndex(index);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
            }

            // 1. Update data laporan
            const updated = await reportService.updateDisposisi(index, opd, catatan);

            // 2. Kirim notifikasi via WhatsApp bot jika bot ready
            const client = botClient.getClient();
            await notificationService.notifyOPD(client, opd, updated, catatan);

            res.json({ success: true, message: `Laporan berhasil didisposisikan ke ${opd}`, data: updated });
        } catch (error) {
            console.error('[ReportController] disposisi error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async balas(req, res) {
        try {
            const index = parseInt(req.params.index, 10);
            const { pesan, selesai } = req.body;

            const target = await reportService.getByIndex(index);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
            }

            const laporan = target.report;
            const targetWa = laporan.wa_id || laporan.kontak_asli;

            // 1. Kirim pesan balasan via WhatsApp
            const client = botClient.getClient();
            if (targetWa) {
                await notificationService.replyReporter(
                    client,
                    targetWa,
                    laporan.nama,
                    laporan.no_tiket,
                    pesan
                );
            }

            // 2. Simpan histori balasan & update status
            const updated = await reportService.addBalasan(index, pesan, selesai === true);

            res.json({ success: true, message: 'Balasan berhasil dikirim', data: updated });
        } catch (error) {
            console.error('[ReportController] balas error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const index = parseInt(req.params.index, 10);
            const deleted = await reportService.deleteReport(index);

            if (deleted) {
                res.json({ success: true, message: 'Laporan berhasil dihapus', deleted });
            } else {
                res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
            }
        } catch (error) {
            console.error('[ReportController] delete error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ReportController();
