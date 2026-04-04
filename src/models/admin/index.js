import db from '../db.js';

const getAllAccounts = async () => {
    const query = `
        SELECT
            account_id,
            account_firstname,
            account_lastname,
            account_email,
            account_type,
            created_at
        FROM accounts
        ORDER BY account_lastname, account_firstname
    `;

    const result = await db.query(query);
    return result.rows;
};

const getAllCategories = async () => {
    const query = `
        SELECT category_id, category_name
        FROM categories
        ORDER BY category_name ASC
    `;

    const result = await db.query(query);
    return result.rows;
};

const createCategory = async (categoryName) => {
    const query = `
        INSERT INTO categories (category_name)
        VALUES ($1)
        RETURNING category_id, category_name
    `;

    const result = await db.query(query, [categoryName]);
    return result.rows[0] || null;
};

const updateCategory = async (categoryId, categoryName) => {
    const query = `
        UPDATE categories
        SET category_name = $1
        WHERE category_id = $2
        RETURNING category_id, category_name
    `;

    const result = await db.query(query, [categoryName, categoryId]);
    return result.rows[0] || null;
};

const deleteCategory = async (categoryId) => {
    const query = `
        DELETE FROM categories
        WHERE category_id = $1
        RETURNING category_id
    `;

    const result = await db.query(query, [categoryId]);
    return result.rows[0] || null;
};

const getAllServices = async () => {
    const query = `
        SELECT service_id, service_name, service_description, created_at
        FROM services
        ORDER BY service_name ASC
    `;

    const result = await db.query(query);
    return result.rows;
};

const createService = async (serviceName, serviceDescription = '') => {
    const query = `
        INSERT INTO services (service_name, service_description)
        VALUES ($1, NULLIF($2, ''))
        RETURNING service_id, service_name, service_description, created_at
    `;

    const result = await db.query(query, [serviceName, serviceDescription]);
    return result.rows[0] || null;
};

const deleteService = async (serviceId) => {
    const query = `
        DELETE FROM services
        WHERE service_id = $1
        RETURNING service_id
    `;

    const result = await db.query(query, [serviceId]);
    return result.rows[0] || null;
};

const getAllVehiclesForAdmin = async () => {
    const query = `
        SELECT
            i.inv_id,
            i.inv_make,
            i.inv_model,
            i.inv_year,
            i.inv_description,
            i.inv_image,
            i.inv_thumbnail,
            i.inv_price,
            i.inv_miles,
            i.is_available,
            i.category_id,
            c.category_name
        FROM inventory i
        JOIN categories c ON c.category_id = i.category_id
        ORDER BY i.inv_year DESC, i.inv_make ASC, i.inv_model ASC
    `;

    const result = await db.query(query);
    return result.rows;
};

const createVehicle = async (vehicle) => {
    const query = `
        INSERT INTO inventory (
            inv_make,
            inv_model,
            inv_year,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_miles,
            is_available,
            category_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING inv_id
    `;

    const params = [
        vehicle.invMake,
        vehicle.invModel,
        vehicle.invYear,
        vehicle.invDescription,
        vehicle.invImage,
        vehicle.invThumbnail,
        vehicle.invPrice,
        vehicle.invMiles,
        vehicle.isAvailable,
        vehicle.categoryId
    ];

    const result = await db.query(query, params);
    return result.rows[0] || null;
};

const updateVehicle = async (invId, vehicle) => {
    const query = `
        UPDATE inventory
        SET
            inv_make = $1,
            inv_model = $2,
            inv_year = $3,
            inv_description = $4,
            inv_image = $5,
            inv_thumbnail = $6,
            inv_price = $7,
            inv_miles = $8,
            is_available = $9,
            category_id = $10
        WHERE inv_id = $11
        RETURNING inv_id
    `;

    const params = [
        vehicle.invMake,
        vehicle.invModel,
        vehicle.invYear,
        vehicle.invDescription,
        vehicle.invImage,
        vehicle.invThumbnail,
        vehicle.invPrice,
        vehicle.invMiles,
        vehicle.isAvailable,
        vehicle.categoryId,
        invId
    ];

    const result = await db.query(query, params);
    return result.rows[0] || null;
};

const updateVehicleEmployeeDetails = async (invId, vehicle) => {
    const query = `
        UPDATE inventory
        SET
            inv_description = $1,
            inv_price = $2,
            is_available = $3
        WHERE inv_id = $4
        RETURNING inv_id
    `;

    const params = [
        vehicle.invDescription,
        vehicle.invPrice,
        vehicle.isAvailable,
        invId
    ];

    const result = await db.query(query, params);
    return result.rows[0] || null;
};

const deleteVehicle = async (invId) => {
    const query = `
        DELETE FROM inventory
        WHERE inv_id = $1
        RETURNING inv_id
    `;

    const result = await db.query(query, [invId]);
    return result.rows[0] || null;
};

const deleteContactMessage = async (messageId) => {
    const query = `
        DELETE FROM contact_messages
        WHERE message_id = $1
        RETURNING message_id
    `;

    const result = await db.query(query, [messageId]);
    return result.rows[0] || null;
};

const getSystemActivity = async () => {
    const countsQuery = `
        SELECT
            (SELECT COUNT(*) FROM accounts) AS total_accounts,
            (SELECT COUNT(*) FROM categories) AS total_categories,
            (SELECT COUNT(*) FROM inventory) AS total_inventory,
            (SELECT COUNT(*) FROM reviews) AS total_reviews,
            (SELECT COUNT(*) FROM service_requests) AS total_service_requests,
            (SELECT COUNT(*) FROM contact_messages) AS total_contact_messages
    `;

    const recentAccountsQuery = `
        SELECT account_id, account_firstname, account_lastname, account_email, account_type, created_at
        FROM accounts
        ORDER BY created_at DESC
        LIMIT 10
    `;

    const recentReviewsQuery = `
        SELECT
            r.review_id,
            r.review_date,
            r.review_text,
            a.account_firstname,
            a.account_lastname,
            i.inv_year,
            i.inv_make,
            i.inv_model
        FROM reviews r
        JOIN accounts a ON a.account_id = r.account_id
        JOIN inventory i ON i.inv_id = r.inv_id
        ORDER BY r.review_date DESC
        LIMIT 10
    `;

    const recentServicesQuery = `
        SELECT
            s.request_id,
            sv.service_name,
            s.service_status,
            s.created_at,
            a.account_firstname,
            a.account_lastname
        FROM service_requests s
        JOIN accounts a ON a.account_id = s.account_id
        JOIN services sv ON sv.service_id = s.service_id
        ORDER BY s.created_at DESC
        LIMIT 10
    `;

    const recentContactsQuery = `
        SELECT
            message_id,
            sender_name,
            sender_email,
            created_at,
            is_read
        FROM contact_messages
        ORDER BY created_at DESC
        LIMIT 10
    `;

    const [counts, accounts, reviews, services, contacts] = await Promise.all([
        db.query(countsQuery),
        db.query(recentAccountsQuery),
        db.query(recentReviewsQuery),
        db.query(recentServicesQuery),
        db.query(recentContactsQuery)
    ]);

    return {
        counts: counts.rows[0] || {},
        recentAccounts: accounts.rows,
        recentReviews: reviews.rows,
        recentServices: services.rows,
        recentContacts: contacts.rows
    };
};

const getAccountById = async (accountId) => {
    const query = `
        SELECT
            account_id,
            account_firstname,
            account_lastname,
            account_email,
            account_type,
            created_at
        FROM accounts
        WHERE account_id = $1
    `;

    const result = await db.query(query, [accountId]);
    return result.rows[0] || null;
};

const updateAccountType = async (accountId, accountType) => {
    const query = `
        UPDATE accounts
        SET account_type = $1
        WHERE account_id = $2
        RETURNING *
    `;

    const result = await db.query(query, [accountType, accountId]);
    return result.rows[0] || null;
};

const deleteAccount = async (accountId) => {
    const query = `
        DELETE FROM accounts
        WHERE account_id = $1
        RETURNING *
    `;

    const result = await db.query(query, [accountId]);
    return result.rows[0] || null;
};

export {
    getAllAccounts,
    getAccountById,
    updateAccountType,
    deleteAccount,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllServices,
    createService,
    deleteService,
    getAllVehiclesForAdmin,
    createVehicle,
    updateVehicle,
    updateVehicleEmployeeDetails,
    deleteVehicle,
    deleteContactMessage,
    getSystemActivity
};
