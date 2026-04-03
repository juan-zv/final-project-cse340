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

export { getAllAccounts, getAccountById, updateAccountType, deleteAccount };
