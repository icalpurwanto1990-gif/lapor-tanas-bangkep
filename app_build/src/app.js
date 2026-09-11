// Memuat konfigurasi .env dengan fallback native jika modul dotenv belum terpasang
try {
    require('dotenv').config();
} catch (e) {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [k, ...v] = trimmed.split('=');
                const key = k.trim();
                if (!process.env[key]) {
                    process.env[key] = v.join('=').trim();
                }
            }
        }
    }
}

const path = require('path');
const express = require('express');
const basicAuth = require('express-basic-auth');

const botClient = require('./bot/botClient');
const botHandler = require('./bot/botHandler');
const apiRoutes = require('./routes/apiRoutes');
const webRoutes = require('./routes/webRoutes');

const app = express();
const port = process.env.PORT || 3000;
const adminUser = process.env.ADMIN_USERNAME || 'admin';
const adminPass = process.env.ADMIN_PASSWORD || 'lapor';

// 1. Middleware CORS Native
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// 2. Parser Body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Static Assets
const publicDir = path.join(__dirname, '../public');
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../public/uploads');

app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadDir));

// 4. Autentikasi Basic Auth untuk Dashboard & Endpoint Terproteksi
const authMiddleware = basicAuth({
    users: {
        [adminUser]: adminPass
    },
    challenge: true,
    unauthorizedResponse: 'Akses Ditolak. Masukkan nama pengguna dan kata sandi yang sah.'
});

// Lindungi dashboard dan API mutasi data
app.use('/dashboard', authMiddleware);
app.use('/api', authMiddleware);
app.use('/disposisi', authMiddleware);
app.use('/balas', authMiddleware);
app.use('/update-status', authMiddleware);
app.use('/hapus', authMiddleware);

// 5. Daftarkan Routes
app.use('/', webRoutes);
app.use('/', apiRoutes);

// 6. Jalankan Server Express
const server = app.listen(port, () => {
    console.log('====================================================');
    console.log(`🏛️  SISTEM LAPOR TANAS BANGKEP v2.0 BERJALAN`);
    console.log(`🌐 Web Dashboard : http://localhost:${port}/dashboard`);
    console.log(`🔑 Kredensial     : User: ${adminUser} | Sandi: ${adminPass}`);
    console.log('====================================================');
});

// 7. Jalankan WhatsApp Web Bot Client & Event Listeners
const wa = botClient.getClient();

wa.on('message', async (msg) => {
    await botHandler.handleMessage(wa, msg);
});

// Inisialisasi WhatsApp
botClient.initialize();

// Penanganan Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('Menerima sinyal SIGTERM, mematikan server...');
    server.close(() => {
        console.log('Server HTTP telah dimatikan.');
        process.exit(0);
    });
});
