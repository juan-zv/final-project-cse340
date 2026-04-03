import db from '../db.js';

const getAllServiceRequests = async () => {
    const query = `
        SELECT
            s.*, a.account_firstname, a.account_lastname, a.account_email,
            i.inv_make, i.inv_model, i.inv_year
        FROM service_requests s
        JOIN accounts a ON s.account_id = a.account_id
        LEFT JOIN inventory i ON s.inv_id = i.inv_id
        ORDER BY s.created_at DESC
    `;

    const result = await db.query(query);
    return result.rows;
};

const getServiceRequestsByAccount = async (accountId) => {
    const query = `
        SELECT
            s.*, i.inv_make, i.inv_model, i.inv_year
        FROM service_requests s
        LEFT JOIN inventory i ON s.inv_id = i.inv_id
        WHERE s.account_id = $1
        ORDER BY s.created_at DESC
    `;

    const result = await db.query(query, [accountId]);
    return result.rows;
};

const getServiceRequestById = async (requestId) => {
    const query = `
        SELECT
            s.*, a.account_firstname, a.account_lastname, a.account_email,
            i.inv_make, i.inv_model, i.inv_year
        FROM service_requests s
        JOIN accounts a ON s.account_id = a.account_id
        LEFT JOIN inventory i ON s.inv_id = i.inv_id
        WHERE s.request_id = $1
    `;

    const result = await db.query(query, [requestId]);
    return result.rows[0] || null;
};

const createServiceRequest = async (serviceType, requestNotes, accountId, invId = null) => {
    const query = `
        INSERT INTO service_requests (service_type, request_notes, account_id, inv_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;

    const result = await db.query(query, [serviceType, requestNotes, accountId, invId]);
    return result.rows[0] || null;
};

const updateServiceRequestStatus = async (requestId, status, notes = null) => {
    const query = `
        UPDATE service_requests
        SET service_status = $1,
            request_notes = COALESCE($2, request_notes)
        WHERE request_id = $3
        RETURNING *
    `;

    const result = await db.query(query, [status, notes, requestId]);
    return result.rows[0] || null;
};

const deleteServiceRequest = async (requestId) => {
    const query = `
        DELETE FROM service_requests
        WHERE request_id = $1
        RETURNING *
    `;

    const result = await db.query(query, [requestId]);
    return result.rows[0] || null;
};

export {
    getAllServiceRequests,
    getServiceRequestsByAccount,
    getServiceRequestById,
    createServiceRequest,
    updateServiceRequestStatus,
    deleteServiceRequest
};
