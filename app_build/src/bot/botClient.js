const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class BotClient {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: process.env.WWEBJS_AUTH_PATH || './.wwebjs_auth'
            }),
            puppeteer: {
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

        this.isReady = false;
        this.setupListeners();
    }

    setupListeners() {
        this.client.on('qr', (qr) => {
            console.log('==============================================');
            console.log('SCAN QR CODE DI WHATSAPP ANDA:');
            qrcode.generate(qr, { small: true });
            console.log('==============================================');
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log(`[WhatsApp] Loading: ${percent}% - ${message}`);
        });

        this.client.on('authenticated', () => {
            console.log('✅ [WhatsApp] Sesi berhasil diautentikasi!');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ [WhatsApp] Gagal otentikasi:', msg);
        });

        this.client.on('ready', () => {
            this.isReady = true;
            console.log('🚀 [WhatsApp] Chatbot Kominfo Lapor Tanas Siap Digunakan!');
        });

        this.client.on('disconnected', (reason) => {
            this.isReady = false;
            console.warn('⚠️ [WhatsApp] Terputus:', reason);
        });
    }

    initialize() {
        this.client.initialize().catch(err => {
            console.error('❌ [WhatsApp] Gagal inisialisasi client:', err.message);
        });
    }

    getClient() {
        return this.client;
    }
}

module.exports = new BotClient();
