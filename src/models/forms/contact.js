import db from '../db.js';

/**
 * Inserts a new contact form submission into the database.
 * 
 * @param {string} senderName - The sender name
 * @param {string} senderEmail - The sender email
 * @param {string} messageBody - The message content
 * @returns {Promise<Object>} The newly created contact form record
 */
const createContactForm = async (senderName, senderEmail, messageBody) => {
    const query = `
        INSERT INTO contact_messages (sender_name, sender_email, message_body)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const result = await db.query(query, [senderName, senderEmail, messageBody]);
    return result.rows[0];
};

/**
 * Retrieves all contact form submissions, ordered by most recent first.
 * 
 * @returns {Promise<Array>} Array of contact form records
 */
const getAllContactForms = async () => {
    const query = `
        SELECT
            message_id AS "id",
            sender_name AS "senderName",
            sender_email AS "senderEmail",
            message_body AS "message",
            is_read AS "isRead",
            created_at AS "submitted"
        FROM contact_messages
        ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows.map((row) => ({
        id: row.id,
        senderName: row.senderName ?? row.sendername ?? row.sender_name ?? null,
        senderEmail: row.senderEmail ?? row.senderemail ?? row.sender_email ?? null,
        message: row.message ?? row.message_body ?? null,
        isRead: row.isRead ?? row.isread ?? row.is_read ?? false,
        submitted: row.submitted ?? row.created_at ?? null
    }));
};

export { createContactForm, getAllContactForms };