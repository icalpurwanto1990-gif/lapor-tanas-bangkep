class SessionStore {
    constructor(ttlMinutes = 30) {
        this.sessions = new Map();
        this.ttlMs = ttlMinutes * 60 * 1000;

        // Rutin pembersihan berkala setiap 10 menit
        const timer = setInterval(() => this.cleanupExpired(), 10 * 60 * 1000);
        if (timer && timer.unref) {
            timer.unref();
        }
    }

    get(userId) {
        const item = this.sessions.get(userId);
        if (!item) return null;

        if (Date.now() - item.lastActivity > this.ttlMs) {
            this.sessions.delete(userId);
            return null;
        }

        item.lastActivity = Date.now();
        return item.session;
    }

    set(userId, sessionData) {
        this.sessions.set(userId, {
            session: sessionData,
            lastActivity: Date.now()
        });
    }

    delete(userId) {
        this.sessions.delete(userId);
    }

    cleanupExpired() {
        const now = Date.now();
        for (const [userId, item] of this.sessions.entries()) {
            if (now - item.lastActivity > this.ttlMs) {
                this.sessions.delete(userId);
            }
        }
    }
}

module.exports = new SessionStore();
