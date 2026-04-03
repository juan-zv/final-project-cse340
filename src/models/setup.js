import db from './db.js';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Reads a SQL file as UTF-8.
 *
 * @param {string} filePath - Absolute path to SQL file
 * @returns {string} SQL text
 */
const readSqlFile = (filePath) => {
    const sql = fs.readFileSync(filePath, 'utf8');
    return sql.replace(/^\uFEFF/, '');
};

/**
 * Keeps default login accounts available for local testing.
 * Uses upsert so it works for both fresh and existing databases.
 */
const syncDefaultAccounts = async () => {
    const accountsTableCheck = await db.query(
        "SELECT to_regclass('public.accounts') IS NOT NULL AS table_exists"
    );

    if (!accountsTableCheck.rows[0]?.table_exists) {
        return;
    }

    const seededHash = '$2b$10$JbBLnRVfGvIcfC.Ovtiae.dDQnuN0pm8PGkber1dwBFEy4bKEM.Lm';

    const query = `
        INSERT INTO accounts (account_firstname, account_lastname, account_email, account_password, account_type)
        VALUES
            ('Admin', 'Account', 'admin@example.com', $1, 'Admin'),
            ('Employee', 'Account', 'employee@example.com', $1, 'Employee'),
            ('User', 'Account', 'user@example.com', $1, 'User')
        ON CONFLICT (account_email)
        DO UPDATE SET
            account_firstname = EXCLUDED.account_firstname,
            account_lastname = EXCLUDED.account_lastname,
            account_password = EXCLUDED.account_password,
            account_type = EXCLUDED.account_type
    `;

    await db.query(query, [seededHash]);
    console.log('Default accounts synced');
};

/**
 * Sets up the database by running the seed.sql file if needed.
 * Checks if inventory/classification data exists before reseeding.
 */
const setupDatabase = async () => {
    // First check if the expected table exists to avoid relation-not-found errors.
    const tableCheck = await db.query(
        "SELECT to_regclass('public.classifications') IS NOT NULL AS table_exists"
    );

    let hasData = false;
    if (tableCheck.rows[0]?.table_exists) {
        const result = await db.query(
            'SELECT EXISTS (SELECT 1 FROM classifications LIMIT 1) AS has_data'
        );
        hasData = result.rows[0]?.has_data || false;
    }
    
    if (hasData) {
        console.log('Database already seeded');
        await syncDefaultAccounts();
        return true;
    }
    
    // No classification data found - run full seed
    console.log('Seeding database...');
    const seedPath = join(__dirname, 'sql', 'seed.sql');
    const seedSQL = readSqlFile(seedPath);
    await db.query(seedSQL);

    // Run practice.sql if it exists (for student assignments)
    const practicePath = join(__dirname, 'sql', 'practice.sql');
    if (fs.existsSync(practicePath)) {
        const practiceSQL = readSqlFile(practicePath);
        await db.query(practiceSQL);
        console.log('Practice database tables initialized');
    }
    
    console.log('Database seeded successfully');
    await syncDefaultAccounts();
    
    return true;
};

/**
 * Tests the database connection by executing a simple query.
 */
const testConnection = async () => {
    const result = await db.query('SELECT NOW() as current_time');
    console.log('Database connection successful:', result.rows[0].current_time);
    return true;
};

export { setupDatabase, testConnection };