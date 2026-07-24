import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DB_URL && !process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
    try {
        process.loadEnvFile(path.join(__dirname, '../../.env'));
    } catch {
        // Ignore missing .env and rely on environment variables when deployed.
    }
}

let dbUrl = process.env.DB_URL || process.env.DATABASE_URL || 'file:local.db';

// Ensure local file paths are resolved relative to workspace root if needed
if (dbUrl.startsWith('file:') && !path.isAbsolute(dbUrl.replace('file:', ''))) {
    const relativePath = dbUrl.replace('file:', '');
    const absolutePath = path.resolve(path.join(__dirname, '../../'), relativePath);
    dbUrl = `file:${absolutePath}`;
}

const authToken = process.env.DB_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url: dbUrl,
    authToken
});

/**
 * Normalizes PostgreSQL $1, $2 parameter placeholders and maps arguments array accordingly.
 */
function normalizeSqlAndParams(text, params = []) {
    if (!params || params.length === 0) {
        return { sql: text, args: [] };
    }

    const matches = Array.from(text.matchAll(/\$(\d+)/g));
    if (matches.length === 0) {
        return { sql: text, args: params };
    }

    const newArgs = [];
    for (const match of matches) {
        const paramIndex = parseInt(match[1], 10) - 1;
        newArgs.push(params[paramIndex]);
    }

    const sql = text.replace(/\$(\d+)/g, '?');
    return { sql, args: newArgs };
}

/**
 * Database wrapper compatible with PostgreSQL `pg` response structure ({ rows, rowCount }).
 * Automatically translates `$1, $2, ...` positional parameter markers to `?` for SQLite compatibility.
 */
const db = {
    async query(text, params = []) {
        try {
            // Handle multi-statement scripts (e.g. seed scripts)
            if (params.length === 0 && text.includes(';') && (text.includes('CREATE TABLE') || text.includes('DROP TABLE'))) {
                await client.executeMultiple(text);
                return { rows: [], rowCount: 0 };
            }

            const { sql, args } = normalizeSqlAndParams(text, params);

            const start = Date.now();
            const res = await client.execute({ sql, args });
            const duration = Date.now() - start;

            const rows = res.rows ? Array.from(res.rows).map(row => ({ ...row })) : [];
            const rowCount = res.rowsAffected !== undefined ? res.rowsAffected : rows.length;

            if (process.env.NODE_ENV?.includes('dev') && process.env.ENABLE_SQL_LOGGING === 'true') {
                console.log('Executed query:', {
                    text: text.replace(/\s+/g, ' ').trim(),
                    duration: `${duration}ms`,
                    rows: rowCount
                });
            }

            return {
                rows,
                rowCount,
                insertId: res.lastInsertRowid
            };
        } catch (error) {
            console.error('Error in query:', {
                text: text.replace(/\s+/g, ' ').trim(),
                error: error.message
            });
            throw error;
        }
    },

    async close() {
        await client.close();
    }
};

export default db;
export { client as libsqlClient };
