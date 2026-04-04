import db from '../db.js';

const splitName = (name = '') => {
    const trimmed = name.trim();
    if (!trimmed) {
        return { firstName: '', lastName: '' };
    }

    const parts = trimmed.split(/\s+/);
    const firstName = parts.shift() || '';
    const lastName = parts.length > 0 ? parts.join(' ') : 'User';

    return { firstName, lastName };
};

/**
 * Checks if an email address is already registered in the database.
 * 
 * @param {string} email - The email address to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
const emailExists = async (email) => {
    const query = `
        SELECT EXISTS(SELECT 1 FROM accounts WHERE LOWER(account_email) = LOWER($1)) as exists
    `;
    const result = await db.query(query, [email]);
    return result.rows[0].exists;
};

/**
 * Saves a new user to the database with a hashed password.
 * 
 * @param {string} name - The user's full name
 * @param {string} email - The user's email address
 * @param {string} hashedPassword - The bcrypt-hashed password
 * @returns {Promise<Object>} The newly created user record (without password)
 */
const saveUser = async (name, email, hashedPassword) => {
    const { firstName, lastName } = splitName(name);

    const query = `
        INSERT INTO accounts (
            account_firstname,
            account_lastname,
            account_email,
            account_password,
            account_type
        )
        VALUES ($1, $2, $3, $4, 'User')
        RETURNING
            account_id AS id,
            account_firstname || ' ' || account_lastname AS name,
            account_email AS email,
            created_at,
            account_type::text AS "roleName"
    `;
    const result = await db.query(query, [firstName, lastName, email, hashedPassword]);
    return result.rows[0];
};

/**
 * Retrieves all registered users from the database.
 * 
 * @returns {Promise<Array>} Array of user records (without passwords)
 */
const getAllUsers = async () => {
    const query = `
        SELECT
            account_id AS id,
            account_firstname || ' ' || account_lastname AS name,
            account_email AS email,
            created_at,
            account_type::text AS "roleName"
        FROM accounts
        ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
};

/**
 * Retrieve a single user by ID with role information
 */
const getUserById = async (id) => {
    const query = `
        SELECT 
            account_id AS id,
            account_firstname || ' ' || account_lastname AS name,
            account_email AS email,
            created_at,
            account_type::text AS "roleName"
        FROM accounts
        WHERE account_id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

/**
 * Update a user's name and email
 */
const updateUser = async (id, name, email, accountType = null) => {
    const { firstName, lastName } = splitName(name);

    const query = `
        UPDATE accounts
        SET account_firstname = $1,
            account_lastname = $2,
            account_email = $3,
            account_type = COALESCE($4, account_type)
        WHERE account_id = $5
        RETURNING
            account_id AS id,
            account_firstname || ' ' || account_lastname AS name,
            account_email AS email,
            created_at,
            account_type::text AS "roleName"
    `;
    const result = await db.query(query, [firstName, lastName, email, accountType, id]);
    return result.rows[0] || null;
};

/**
 * Delete a user account
 */
const deleteUser = async (id) => {
    const query = 'DELETE FROM accounts WHERE account_id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
};

export { 
    emailExists, 
    saveUser, 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser 
};