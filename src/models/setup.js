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
 * Ensures the one-to-many vehicle_images table exists for existing databases.
 */
const ensureVehicleImagesTable = async () => {
    const inventoryTableCheck = await db.query(
        "SELECT to_regclass('public.inventory') IS NOT NULL AS table_exists"
    );

    if (!inventoryTableCheck.rows[0]?.table_exists) {
        return;
    }

    const tableCheck = await db.query(
        "SELECT to_regclass('public.vehicle_images') IS NOT NULL AS table_exists"
    );

    if (tableCheck.rows[0]?.table_exists) {
        return;
    }

    await db.query(`
        CREATE TABLE vehicle_images (
            image_id SERIAL PRIMARY KEY,
            inv_id INTEGER NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            image_label VARCHAR(120),
            sort_order INTEGER DEFAULT 1,
            is_primary BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    const inventoryTableCheck = await db.query(
        "SELECT to_regclass('public.inventory') IS NOT NULL AS table_exists"
    );

    if (!inventoryTableCheck.rows[0]?.table_exists) {
        return;
    }

    const inventoryDataCheck = await db.query(
        'SELECT EXISTS (SELECT 1 FROM inventory LIMIT 1) AS has_data'
    );

    if (inventoryDataCheck.rows[0]?.has_data) {
        return;
    }

    const query = `
        WITH seeded_inventory (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, category_name) AS (
            VALUES
                ('Ford', 'F-150', '2018', 'Well-kept full-size pickup with proven durability and towing power.', '/images/ford-f-150.jpg', '/images/ford-f-150.jpg', 31995, 74500, 'Trucks'),
                ('Chevrolet', 'Silverado 1500', '2017', 'Popular used truck with strong V8 capability and roomy cabin.', '/images/chevrolet-silverado-1500.jpg', '/images/chevrolet-silverado-1500.jpg', 29995, 81200, 'Trucks'),
                ('Ram', '1500', '2019', 'Comfortable work truck with a smooth ride and strong resale value.', '/images/ram-1500.jpg', '/images/ram-1500.jpg', 34995, 63800, 'Trucks'),
                ('Honda', 'Odyssey', '2018', 'Reliable family van with sliding doors, space, and easy access.', '/images/honda-odyssey.jpg', '/images/honda-odyssey.jpg', 23995, 69100, 'Vans'),
                ('Toyota', 'Sienna', '2017', 'Dependable minivan with great space for families and road trips.', '/images/toyota-sienna.jpg', '/images/toyota-sienna.jpg', 22995, 74800, 'Vans'),
                ('Dodge', 'Grand Caravan', '2016', 'Budget-friendly used van with flexible seating and cargo room.', '/images/dodge-grand-caravan.webp', '/images/dodge-grand-caravan.webp', 16995, 95400, 'Vans'),
                ('Toyota', 'Camry', '2018', 'Well-known sedan with strong reliability and low ownership costs.', '/images/toyota-camry.jpg', '/images/toyota-camry.jpg', 19995, 66300, 'Cars'),
                ('Honda', 'Civic', '2017', 'Compact car with excellent fuel economy and everyday comfort.', '/images/honda-civic.webp', '/images/honda-civic.webp', 17995, 72100, 'Cars'),
                ('Nissan', 'Altima', '2019', 'Popular midsize sedan with a comfortable ride and modern features.', '/images/nissan-altima.webp', '/images/nissan-altima.webp', 18995, 58900, 'Cars'),
                ('Toyota', 'RAV4', '2018', 'Practical used SUV with strong reliability and high demand.', '/images/toyota-rav4.jpg', '/images/toyota-rav4.jpg', 24995, 70200, 'SUVs'),
                ('Honda', 'CR-V', '2017', 'Compact SUV known for comfort, space, and good fuel economy.', '/images/honda-cr-v.jpg', '/images/honda-cr-v.jpg', 22995, 76900, 'SUVs'),
                ('Ford', 'Escape', '2016', 'Affordable used SUV with good versatility and easy city driving.', '/images/ford-escape.jpg', '/images/ford-escape.jpg', 15995, 88200, 'SUVs')
        )
        INSERT INTO inventory (
            inv_make,
            inv_model,
            inv_year,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_miles,
            category_id
        )
        SELECT
            s.inv_make,
            s.inv_model,
            s.inv_year,
            s.inv_description,
            s.inv_image,
            s.inv_thumbnail,
            s.inv_price,
            s.inv_miles,
            c.category_id
        FROM seeded_inventory s
        JOIN categories c ON c.category_name = s.category_name
    `;

    await db.query(query);
    console.log('Sample inventory synced');
};

/**
 * Backfills the vehicle_images table from inventory fallback image fields.
 */
const syncSampleVehicleImages = async () => {
    const vehicleImagesTableCheck = await db.query(
        "SELECT to_regclass('public.vehicle_images') IS NOT NULL AS table_exists"
    );

    if (!vehicleImagesTableCheck.rows[0]?.table_exists) {
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
            true
        FROM inventory
        UNION ALL
        SELECT
            inv_id,
            inv_thumbnail,
            'Thumbnail image',
            2,
            false
        FROM inventory
    `;

    await db.query(query);
    console.log('Sample vehicle images synced');
};

/**
 * Sets up the database by running the seed.sql file if needed.
 * Checks if categories and inventory data exist before reseeding.
 */
const setupDatabase = async () => {
    // First check if the expected table exists to avoid relation-not-found errors.
    await ensureVehicleImagesTable();
    const tableCheck = await db.query(
        "SELECT to_regclass('public.categories') IS NOT NULL AS table_exists"
    );

    let hasData = false;
    if (tableCheck.rows[0]?.table_exists) {
        const result = await db.query(
            'SELECT EXISTS (SELECT 1 FROM categories LIMIT 1) AS has_data'
        );
        hasData = result.rows[0]?.has_data || false;
    }
    
    if (hasData) {
        console.log('Database already seeded');
        await syncDefaultAccounts();
        await syncSampleInventory();
        await ensureVehicleImagesTable();
        await syncSampleVehicleImages();
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