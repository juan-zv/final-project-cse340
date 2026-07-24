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
 * Helper to check if a table exists in SQLite.
 */
const checkTableExists = async (tableName) => {
    const res = await db.query(
        "SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name=?) AS table_exists",
        [tableName]
    );
    return Boolean(res.rows[0]?.table_exists);
};

/**
 * Keeps default login accounts available for local testing.
 * Uses upsert so it works for both fresh and existing databases.
 */
const syncDefaultAccounts = async () => {
    if (!(await checkTableExists('accounts'))) {
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
 * Ensures the one-to-many vehicle_images table exists for existing databases.
 */
const ensureVehicleImagesTable = async () => {
    if (!(await checkTableExists('inventory'))) {
        return;
    }

    if (await checkTableExists('vehicle_images')) {
        return;
    }

    await db.query(`
        CREATE TABLE vehicle_images (
            image_id INTEGER PRIMARY KEY AUTOINCREMENT,
            inv_id INTEGER NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            image_label VARCHAR(120),
            sort_order INTEGER DEFAULT 1,
            is_primary INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_vehicle_images_inventory
                FOREIGN KEY (inv_id)
                REFERENCES inventory(inv_id)
                ON DELETE CASCADE
        )
    `);
    console.log('vehicle_images table created');
};

/**
 * Seeds sample inventory rows when the inventory table exists but is empty.
 */
const syncSampleInventory = async () => {
    if (!(await checkTableExists('inventory'))) {
        return;
    }

    const inventoryDataCheck = await db.query(
        'SELECT EXISTS (SELECT 1 FROM inventory LIMIT 1) AS has_data'
    );

    if (inventoryDataCheck.rows[0]?.has_data) {
        return;
    }

    const categoriesRes = await db.query('SELECT category_id, category_name FROM categories');
    const categoriesMap = {};
    for (const row of categoriesRes.rows) {
        categoriesMap[row.category_name] = row.category_id;
    }

    const sampleData = [
        ['Ford', 'F-150', '2018', 'Well-kept full-size pickup with proven durability and towing power.', '/images/ford-f-150.jpg', '/images/ford-f-150.jpg', 31995, 74500, 'Trucks'],
        ['Chevrolet', 'Silverado 1500', '2017', 'Popular used truck with strong V8 capability and roomy cabin.', '/images/chevrolet-silverado-1500.jpg', '/images/chevrolet-silverado-1500.jpg', 29995, 81200, 'Trucks'],
        ['Ram', '1500', '2019', 'Comfortable work truck with a smooth ride and strong resale value.', '/images/ram-1500.jpg', '/images/ram-1500.jpg', 34995, 63800, 'Trucks'],
        ['Honda', 'Odyssey', '2018', 'Reliable family van with sliding doors, space, and easy access.', '/images/honda-odyssey.jpg', '/images/honda-odyssey.jpg', 23995, 69100, 'Vans'],
        ['Toyota', 'Sienna', '2017', 'Dependable minivan with great space for families and road trips.', '/images/toyota-sienna.jpg', '/images/toyota-sienna.jpg', 22995, 74800, 'Vans'],
        ['Dodge', 'Grand Caravan', '2016', 'Budget-friendly used van with flexible seating and cargo room.', '/images/dodge-grand-caravan.webp', '/images/dodge-grand-caravan.webp', 16995, 95400, 'Vans'],
        ['Toyota', 'Camry', '2018', 'Well-known sedan with strong reliability and low ownership costs.', '/images/toyota-camry.jpg', '/images/toyota-camry.jpg', 19995, 66300, 'Cars'],
        ['Honda', 'Civic', '2017', 'Compact car with excellent fuel economy and everyday comfort.', '/images/honda-civic.webp', '/images/honda-civic.webp', 17995, 72100, 'Cars'],
        ['Nissan', 'Altima', '2019', 'Popular midsize sedan with a comfortable ride and modern features.', '/images/nissan-altima.webp', '/images/nissan-altima.webp', 18995, 58900, 'Cars'],
        ['Toyota', 'RAV4', '2018', 'Practical used SUV with strong reliability and high demand.', '/images/toyota-rav4.jpg', '/images/toyota-rav4.jpg', 24995, 70200, 'SUVs'],
        ['Honda', 'CR-V', '2017', 'Compact SUV known for comfort, space, and good fuel economy.', '/images/honda-cr-v.jpg', '/images/honda-cr-v.jpg', 22995, 76900, 'SUVs'],
        ['Ford', 'Escape', '2016', 'Affordable used SUV with good versatility and easy city driving.', '/images/ford-escape.jpg', '/images/ford-escape.jpg', 15995, 88200, 'SUVs']
    ];

    for (const row of sampleData) {
        const catId = categoriesMap[row[8]];
        if (catId) {
            await db.query(
                `INSERT INTO inventory (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, category_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], catId]
            );
        }
    }

    console.log('Sample inventory synced');
};

/**
 * Backfills the vehicle_images table from inventory fallback image fields.
 */
const syncSampleVehicleImages = async () => {
    if (!(await checkTableExists('vehicle_images'))) {
        return;
    }

    const imagesDataCheck = await db.query(
        'SELECT EXISTS (SELECT 1 FROM vehicle_images LIMIT 1) AS has_data'
    );

    if (imagesDataCheck.rows[0]?.has_data) {
        return;
    }

    const query = `
        INSERT INTO vehicle_images (inv_id, image_path, image_label, sort_order, is_primary)
        SELECT
            inv_id,
            inv_image,
            'Primary image',
            1,
            1
        FROM inventory
        UNION ALL
        SELECT
            inv_id,
            inv_thumbnail,
            'Thumbnail image',
            2,
            0
        FROM inventory
    `;

    await db.query(query);
    console.log('Sample vehicle images synced');
};

/**
 * Ensures the services catalog table exists and that service_requests references it via service_id.
 */
const ensureServicesSchema = async () => {
    if (!(await checkTableExists('service_requests'))) {
        return;
    }

    await db.query(`
        CREATE TABLE IF NOT EXISTS services (
            service_id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_name VARCHAR(100) UNIQUE NOT NULL,
            service_description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        INSERT INTO services (service_name, service_description)
        VALUES
            ('Oil Change', 'Oil and filter replacement based on manufacturer recommendations.'),
            ('Inspection', 'Multi-point inspection and diagnostics for your vehicle.'),
            ('Brake Service', 'Brake pad, rotor, fluid checks, and recommended brake repairs.'),
            ('Tire Service', 'Tire rotation, balancing, pressure checks, and alignment recommendations.'),
            ('General Maintenance', 'General preventive maintenance and follow-up support.')
        ON CONFLICT (service_name) DO NOTHING
    `);
};

/**
 * Sets up the database by running the seed.sql file if needed.
 * Checks if categories and inventory data exist before reseeding.
 */
const setupDatabase = async () => {
    await ensureVehicleImagesTable();
    await ensureServicesSchema();

    let hasData = false;
    if (await checkTableExists('categories')) {
        const result = await db.query(
            'SELECT EXISTS (SELECT 1 FROM categories LIMIT 1) AS has_data'
        );
        hasData = Boolean(result.rows[0]?.has_data);
    }
    
    if (hasData) {
        console.log('Database already seeded');
        await syncDefaultAccounts();
        await syncSampleInventory();
        await ensureVehicleImagesTable();
        await syncSampleVehicleImages();
        await ensureServicesSchema();
        return true;
    }
    
    // No category data found - run full seed
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
    await syncSampleInventory();
    await ensureVehicleImagesTable();
    await syncSampleVehicleImages();
    await ensureServicesSchema();
    
    return true;
};

/**
 * Tests the database connection by executing a simple query.
 */
const testConnection = async () => {
    const result = await db.query("SELECT datetime('now') as current_time");
    console.log('Database connection successful:', result.rows[0].current_time);
    return true;
};

export { setupDatabase, testConnection };