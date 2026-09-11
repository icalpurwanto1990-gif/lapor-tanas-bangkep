const StorageService = require('./storageService');
const path = require('path');

class ReportService {
    constructor() {
        const dataPath = process.env.DATA_FILE_PATH || path.join(__dirname, '../../data/laporan.json');
        this.storage = new StorageService(dataPath);
    }

    async getAll() {
        return await this.storage.readAll();
    }

    async getStats() {
        const data = await this.getAll();
        return {
            total: data.length,
            menunggu: data.filter(d => d.status === 'Menunggu Verifikasi').length,
            proses: data.filter(d => d.status === 'Sedang Diproses').length,
            selesai: data.filter(d => d.status === 'Selesai').length,
            ditolak: data.filter(d => d.status === 'Ditolak').length
        };
    }

    async getByIndex(index) {
        const data = await this.getAll();
        if (index >= 0 && index < data.length) {
            return { index, report: data[index] };
        }
        return null;
    }

    async getByTicket(noTiket) {
        const data = await this.getAll();
        const search = (noTiket || '').trim().toUpperCase();
        const index = data.findIndex(d => (d.no_tiket || '').toUpperCase() === search);
        if (index !== -1) {
            return { index, report: data[index] };
        }
        return null;
    }

    async addReport(reportData) {
        const data = await this.getAll();
        data.push(reportData);
        await this.storage.writeAll(data);
        return reportData;
    }

    async updateStatus(index, newStatus) {
        const data = await this.getAll();
        if (index >= 0 && index < data.length) {
            data[index].status = newStatus;
            await this.storage.writeAll(data);
            return data[index];
        }
        return null;
    }

    async updateDisposisi(index, opd, catatan) {
        const data = await this.getAll();
        if (index >= 0 && index < data.length) {
            data[index].disposisi = {
                opd: opd,
                catatan: catatan || '',
                waktu: new Date().toLocaleString('id-ID')
            };
            data[index].status = 'Sedang Diproses';
            await this.storage.writeAll(data);
            return data[index];
        }
        return null;
    }

    async addBalasan(index, pesan, markSelesai = true) {
        const data = await this.getAll();
        if (index >= 0 && index < data.length) {
            if (!data[index].balasan) {
                data[index].balasan = [];
            }
            data[index].balasan.push({
                pesan: pesan,
                waktu: new Date().toLocaleString('id-ID')
            });

            if (markSelesai) {
                data[index].status = 'Selesai';
            }

            await this.storage.writeAll(data);
            return data[index];
        }
        return null;
    }

    async deleteReport(index) {
        const data = await this.getAll();
        if (index >= 0 && index < data.length) {
            const removed = data.splice(index, 1);
            await this.storage.writeAll(data);
            return removed[0];
        }
        return null;
    }
}

module.exports = new ReportService();
