import db from '../models/db.js';

/**
 * Removes expired sessions from the database.
 */
const cleanupExpiredSessions = async () => {
    try {
        const result = await db.query(
            `DELETE FROM sessions WHERE expired < datetime('now')`
        );

        if (result.rowCount > 0) {
            console.log(`Cleaned up ${result.rowCount} expired sessions`);
        }
    } catch {
        // Table might not exist yet or managed by connect-sqlite3
    }
};

/**
 * Starts automatic session cleanup that runs periodically.
 */
const startSessionCleanup = () => {
    cleanupExpiredSessions();
    const twelveHours = 12 * 60 * 60 * 1000;
    setInterval(cleanupExpiredSessions, twelveHours);
};

export { startSessionCleanup };