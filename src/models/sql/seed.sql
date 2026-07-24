-- Database seed file for Car Dealership (SQLite / libSQL compatible)
BEGIN TRANSACTION;

-- Drop existing tables
DROP TABLE IF EXISTS service_requests;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS vehicle_images;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS accounts;

-- Create accounts table
CREATE TABLE accounts (
    account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_firstname VARCHAR(100) NOT NULL,
    account_lastname VARCHAR(100) NOT NULL,
    account_email VARCHAR(150) UNIQUE NOT NULL,
    account_password VARCHAR(255) NOT NULL,
    account_type TEXT DEFAULT 'User' CHECK (account_type IN ('User', 'Employee', 'Admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(50) UNIQUE NOT NULL
);

-- Create inventory table (vehicles)
CREATE TABLE inventory (
    inv_id INTEGER PRIMARY KEY AUTOINCREMENT,
    inv_make VARCHAR(50) NOT NULL,
    inv_model VARCHAR(50) NOT NULL,
    inv_year VARCHAR(4) NOT NULL,
    inv_description TEXT NOT NULL,
    inv_image VARCHAR(100) NOT NULL,
    inv_thumbnail VARCHAR(100) NOT NULL,
    inv_price NUMERIC(10, 2) NOT NULL,
    inv_miles INTEGER NOT NULL,
    is_available INTEGER DEFAULT 1,
    category_id INTEGER NOT NULL,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Create vehicle images table (one vehicle to many images)
CREATE TABLE vehicle_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    inv_id INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    image_label VARCHAR(120),
    sort_order INTEGER DEFAULT 1,
    is_primary INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_images_inventory
        FOREIGN KEY (inv_id) REFERENCES inventory(inv_id) ON DELETE CASCADE
);

-- Create reviews table
CREATE TABLE reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_text TEXT NOT NULL,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    inv_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    CONSTRAINT fk_review_inventory FOREIGN KEY (inv_id) REFERENCES inventory(inv_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- Create services catalog table
CREATE TABLE services (
    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name VARCHAR(100) UNIQUE NOT NULL,
    service_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create service requests table
CREATE TABLE service_requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    service_status TEXT DEFAULT 'Submitted' CHECK (service_status IN ('Submitted', 'In Progress', 'Completed')),
    request_notes TEXT,
    account_id INTEGER NOT NULL,
    inv_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    CONSTRAINT fk_service_catalog FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT
);

-- Create contact messages table
CREATE TABLE contact_messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_name VARCHAR(100) NOT NULL,
    sender_email VARCHAR(150) NOT NULL,
    message_body TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial categories
INSERT INTO categories (category_name) VALUES
    ('Trucks'),
    ('Vans'),
    ('Cars'),
    ('SUVs');

-- Seed default accounts (all use password: P@$$w0rd! via bcrypt hash)
INSERT INTO accounts (account_firstname, account_lastname, account_email, account_password, account_type) VALUES
    ('Admin', 'Account', 'admin@example.com', '$2b$10$JbBLnRVfGvIcfC.Ovtiae.dDQnuN0pm8PGkber1dwBFEy4bKEM.Lm', 'Admin'),
    ('Employee', 'Account', 'employee@example.com', '$2b$10$JbBLnRVfGvIcfC.Ovtiae.dDQnuN0pm8PGkber1dwBFEy4bKEM.Lm', 'Employee'),
    ('User', 'Account', 'user@example.com', '$2b$10$JbBLnRVfGvIcfC.Ovtiae.dDQnuN0pm8PGkber1dwBFEy4bKEM.Lm', 'User');

-- Seed service offerings
INSERT INTO services (service_name, service_description) VALUES
    ('Oil Change', 'Oil and filter replacement based on manufacturer recommendations.'),
    ('Inspection', 'Multi-point inspection and diagnostics for your vehicle.'),
    ('Brake Service', 'Brake pad, rotor, fluid checks, and recommended brake repairs.'),
    ('Tire Service', 'Tire rotation, balancing, pressure checks, and alignment recommendations.'),
    ('General Maintenance', 'General preventive maintenance and follow-up support.');

-- Seed inventory (3 per category)
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
) VALUES
    ('Ford', 'F-150', '2018', 'Well-kept full-size pickup with proven durability and towing power.', '/images/ford-f-150.jpg', '/images/ford-f-150.jpg', 31995, 74500, 1),
    ('Chevrolet', 'Silverado 1500', '2017', 'Popular used truck with strong V8 capability and roomy cabin.', '/images/chevrolet-silverado-1500.jpg', '/images/chevrolet-silverado-1500.jpg', 29995, 81200, 1),
    ('Ram', '1500', '2019', 'Comfortable work truck with a smooth ride and strong resale value.', '/images/ram-1500.jpg', '/images/ram-1500.jpg', 34995, 63800, 1),
    ('Honda', 'Odyssey', '2018', 'Reliable family van with sliding doors, space, and easy access.', '/images/honda-odyssey.jpg', '/images/honda-odyssey.jpg', 23995, 69100, 2),
    ('Toyota', 'Sienna', '2017', 'Dependable minivan with great space for families and road trips.', '/images/toyota-sienna.jpg', '/images/toyota-sienna.jpg', 22995, 74800, 2),
    ('Dodge', 'Grand Caravan', '2016', 'Budget-friendly used van with flexible seating and cargo room.', '/images/dodge-grand-caravan.webp', '/images/dodge-grand-caravan.webp', 16995, 95400, 2),
    ('Toyota', 'Camry', '2018', 'Well-known sedan with strong reliability and low ownership costs.', '/images/toyota-camry.jpg', '/images/toyota-camry.jpg', 19995, 66300, 3),
    ('Honda', 'Civic', '2017', 'Compact car with excellent fuel economy and everyday comfort.', '/images/honda-civic.webp', '/images/honda-civic.webp', 17995, 72100, 3),
    ('Nissan', 'Altima', '2019', 'Popular midsize sedan with a comfortable ride and modern features.', '/images/nissan-altima.webp', '/images/nissan-altima.webp', 18995, 58900, 3),
    ('Toyota', 'RAV4', '2018', 'Practical used SUV with strong reliability and high demand.', '/images/toyota-rav4.jpg', '/images/toyota-rav4.jpg', 24995, 70200, 4),
    ('Honda', 'CR-V', '2017', 'Compact SUV known for comfort, space, and good fuel economy.', '/images/honda-cr-v.jpg', '/images/honda-cr-v.jpg', 22995, 76900, 4),
    ('Ford', 'Escape', '2016', 'Affordable used SUV with good versatility and easy city driving.', '/images/ford-escape.jpg', '/images/ford-escape.jpg', 15995, 88200, 4);

-- Seed vehicle images (one-to-many relationship)
INSERT INTO vehicle_images (
    inv_id,
    image_path,
    image_label,
    sort_order,
    is_primary
) VALUES
    (1, '/images/ford-f-150.jpg', 'Primary image', 1, 1),
    (1, '/images/ford-f-150.jpg', 'Secondary image', 2, 0),
    (2, '/images/chevrolet-silverado-1500.jpg', 'Primary image', 1, 1),
    (2, '/images/chevrolet-silverado-1500.jpg', 'Secondary image', 2, 0),
    (3, '/images/ram-1500.jpg', 'Primary image', 1, 1),
    (3, '/images/ram-1500.jpg', 'Secondary image', 2, 0),
    (4, '/images/honda-odyssey.jpg', 'Primary image', 1, 1),
    (4, '/images/honda-odyssey.jpg', 'Secondary image', 2, 0),
    (5, '/images/toyota-sienna.jpg', 'Primary image', 1, 1),
    (5, '/images/toyota-sienna.jpg', 'Secondary image', 2, 0),
    (6, '/images/dodge-grand-caravan.webp', 'Primary image', 1, 1),
    (6, '/images/dodge-grand-caravan.webp', 'Secondary image', 2, 0),
    (7, '/images/toyota-camry.jpg', 'Primary image', 1, 1),
    (7, '/images/toyota-camry.jpg', 'Secondary image', 2, 0),
    (8, '/images/honda-civic.webp', 'Primary image', 1, 1),
    (8, '/images/honda-civic.webp', 'Secondary image', 2, 0),
    (9, '/images/nissan-altima.webp', 'Primary image', 1, 1),
    (9, '/images/nissan-altima.webp', 'Secondary image', 2, 0),
    (10, '/images/toyota-rav4.jpg', 'Primary image', 1, 1),
    (10, '/images/toyota-rav4.jpg', 'Secondary image', 2, 0),
    (11, '/images/honda-cr-v.jpg', 'Primary image', 1, 1),
    (11, '/images/honda-cr-v.jpg', 'Secondary image', 2, 0),
    (12, '/images/ford-escape.jpg', 'Primary image', 1, 1),
    (12, '/images/ford-escape.jpg', 'Secondary image', 2, 0);

COMMIT;
