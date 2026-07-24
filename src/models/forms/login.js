import bcrypt from 'bcrypt';
import db from '../db.js';

/**
 * Find a user by email address for login verification.
 */
const findUserByEmail = async (email) => {
    const query = `
        SELECT
            account_id AS id,
            account_firstname || ' ' || account_lastname AS name,
            account_email AS email,
            account_password AS password,
            account_type AS "roleName"
        FROM accounts
        WHERE LOWER(account_email) = LOWER($1)
        LIMIT 1
    `;

    const result = await db.query(query, [email]);
    return result.rows[0] || null;
};

/**
 * Verify a plain text password against a stored bcrypt hash.
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

export { findUserByEmail, verifyPassword };
export default { findUserByEmail, verifyPassword };
