-- Database seed file for Car Dealership
BEGIN;

-- Drop existing tables
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS vehicle_images CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS account_type CASCADE;
DROP TYPE IF EXISTS service_status CASCADE;

-- Create valid enum types
CREATE TYPE account_type AS ENUM ('User', 'Employee', 'Admin');
CREATE TYPE service_status AS ENUM ('Submitted', 'In Progress', 'Completed');

-- Create accounts table
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    account_firstname VARCHAR(100) NOT NULL,
    account_lastname VARCHAR(100) NOT NULL,
    account_email VARCHAR(150) UNIQUE NOT NULL,
    account_password VARCHAR(255) NOT NULL,
    account_type account_type DEFAULT 'User',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL
);

-- Create inventory table (vehicles)
CREATE TABLE inventory (
    inv_id SERIAL PRIMARY KEY,
    inv_make VARCHAR(50) NOT NULL,
    inv_model VARCHAR(50) NOT NULL,
    inv_year VARCHAR(4) NOT NULL,
    inv_description TEXT NOT NULL,
    inv_image VARCHAR(100) NOT NULL,
    inv_thumbnail VARCHAR(100) NOT NULL,
    inv_price NUMERIC(10, 2) NOT NULL,
    inv_miles INTEGER NOT NULL,
    is_available BOOLEAN DEFAULT true,
    category_id INTEGER NOT NULL,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Create vehicle images table (one vehicle to many images)
CREATE TABLE vehicle_images (
    image_id SERIAL PRIMARY KEY,
    inv_id INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    image_label VARCHAR(120),
    sort_order INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_images_inventory
        FOREIGN KEY (inv_id) REFERENCES inventory(inv_id) ON DELETE CASCADE
);

-- Create reviews table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    review_text TEXT NOT NULL,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inv_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    CONSTRAINT fk_review_inventory FOREIGN KEY (inv_id) REFERENCES inventory(inv_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- Create service requests table
CREATE TABLE service_requests (
    request_id SERIAL PRIMARY KEY,
    service_type VARCHAR(100) NOT NULL,
    service_status service_status DEFAULT 'Submitted',
    request_notes TEXT,
    account_id INTEGER NOT NULL,
    inv_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- Create contact messages table
CREATE TABLE contact_messages (
    message_id SERIAL PRIMARY KEY,
    sender_name VARCHAR(100) NOT NULL,
    sender_email VARCHAR(150) NOT NULL,
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    ('Employee', 'Account', 'employee@exampl.ecom', '$2b$10$JbBLnRVfGvIcfC.Ovtiae.dDQnuN0pm8PGkber1dwBFEy4bKEM.Lm', 'Employee'),
    ('User', 'Account', 'user@example.com', '$2b$10$JbBLnRVfGvIcfC.Ovtiae.dDQnuN0pm8PGkber1dwBFEy4bKEM.Lm', 'User');

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
    (1, '/images/ford-f-150.jpg', 'Primary image', 1, true),
    (1, '/images/ford-f-150.jpg', 'Secondary image', 2, false),
    (2, '/images/chevrolet-silverado-1500.jpg', 'Primary image', 1, true),
    (2, '/images/chevrolet-silverado-1500.jpg', 'Secondary image', 2, false),
    (3, '/images/ram-1500.jpg', 'Primary image', 1, true),
    (3, '/images/ram-1500.jpg', 'Secondary image', 2, false),
    (4, '/images/honda-odyssey.jpg', 'Primary image', 1, true),
    (4, '/images/honda-odyssey.jpg', 'Secondary image', 2, false),
    (5, '/images/toyota-sienna.jpg', 'Primary image', 1, true),
    (5, '/images/toyota-sienna.jpg', 'Secondary image', 2, false),
    (6, '/images/dodge-grand-caravan.webp', 'Primary image', 1, true),
    (6, '/images/dodge-grand-caravan.webp', 'Secondary image', 2, false),
    (7, '/images/toyota-camry.jpg', 'Primary image', 1, true),
    (7, '/images/toyota-camry.jpg', 'Secondary image', 2, false),
    (8, '/images/honda-civic.webp', 'Primary image', 1, true),
    (8, '/images/honda-civic.webp', 'Secondary image', 2, false),
    (9, '/images/nissan-altima.webp', 'Primary image', 1, true),
    (9, '/images/nissan-altima.webp', 'Secondary image', 2, false),
    (10, '/images/toyota-rav4.jpg', 'Primary image', 1, true),
    (10, '/images/toyota-rav4.jpg', 'Secondary image', 2, false),
    (11, '/images/honda-cr-v.jpg', 'Primary image', 1, true),
    (11, '/images/honda-cr-v.jpg', 'Secondary image', 2, false),
    (12, '/images/ford-escape.jpg', 'Primary image', 1, true),
    (12, '/images/ford-escape.jpg', 'Secondary image', 2, false);

COMMIT;

