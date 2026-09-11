const fs = require('fs');
const path = require('path');

class StorageService {
    constructor(filePath) {
        this.filePath = filePath || path.join(__dirname, '../../data/laporan.json');
        this.ensureFileExists();
    }

    ensureFileExists() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
        }
    }

    async readAll() {
        try {
            const data = await fs.promises.readFile(this.filePath, 'utf-8');
            return JSON.parse(data || '[]');
        } catch (error) {
            console.error('[StorageService] Error reading file:', error.message);
            return [];
        }
    }

    async writeAll(data) {
        try {
            // Tulis secara atomik menggunakan file sementara untuk mencegah korupsi file saat crash
            const tempFile = `${this.filePath}.tmp.${Date.now()}`;
            await fs.promises.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
            await fs.promises.rename(tempFile, this.filePath);
            return true;
        } catch (error) {
            console.error('[StorageService] Error writing file:', error.message);
            throw error;
        }
    }
}

module.exports = StorageService;
