import session from 'express-session';
import db from '../models/db.js';

export class LibsqlSessionStore extends session.Store {
    constructor(options = {}) {
        super(options);
        this.tableName = options.tableName || 'sessions';
        this.init();
    }

    async init() {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    sid TEXT PRIMARY KEY,
                    sess TEXT NOT NULL,
                    expired DATETIME NOT NULL
                )
            `);
        } catch (err) {
            console.error('Failed to initialize session table:', err);
        }
    }

    async get(sid, callback) {
        try {
            const res = await db.query(
                `SELECT sess FROM ${this.tableName} WHERE sid = $1 AND expired > datetime('now')`,
                [sid]
            );
            if (res.rows.length === 0) {
                return callback(null, null);
            }
            const sess = JSON.parse(res.rows[0].sess);
            return callback(null, sess);
        } catch (err) {
            return callback(err);
        }
    }

    async set(sid, sess, callback) {
        try {
            const maxAge = sess.cookie?.maxAge || 24 * 60 * 60 * 1000;
            const expired = new Date(Date.now() + maxAge).toISOString();
            const sessStr = JSON.stringify(sess);

            await db.query(
                `INSERT INTO ${this.tableName} (sid, sess, expired) VALUES ($1, $2, $3)
                 ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expired = EXCLUDED.expired`,
                [sid, sessStr, expired]
            );
            if (callback) callback(null);
        } catch (err) {
            if (callback) callback(err);
        }
    }

    async destroy(sid, callback) {
        try {
            await db.query(`DELETE FROM ${this.tableName} WHERE sid = $1`, [sid]);
            if (callback) callback(null);
        } catch (err) {
            if (callback) callback(err);
        }
    }

    async touch(sid, sess, callback) {
        try {
            const maxAge = sess.cookie?.maxAge || 24 * 60 * 60 * 1000;
            const expired = new Date(Date.now() + maxAge).toISOString();
            await db.query(
                `UPDATE ${this.tableName} SET expired = $1 WHERE sid = $2`,
                [expired, sid]
            );
            if (callback) callback(null);
        } catch (err) {
            if (callback) callback(err);
        }
    }
}
