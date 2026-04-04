import db from '../db.js';

let hasLegacyServiceTypeColumnCache = null;

const hasLegacyServiceTypeColumn = async () => {
    if (typeof hasLegacyServiceTypeColumnCache === 'boolean') {
        return hasLegacyServiceTypeColumnCache;
    }

    const query = `
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'service_requests'
              AND column_name = 'service_type'
        ) AS has_service_type
    `;

    const result = await db.query(query);
    hasLegacyServiceTypeColumnCache = result.rows[0]?.has_service_type === true;
    return hasLegacyServiceTypeColumnCache;
};

const mapServiceRequest = (row) => ({
    requestId: row.request_id,
    serviceId: row.service_id,
    serviceName: row.service_name || row.service_type,
    serviceType: row.service_name || row.service_type,
    serviceStatus: row.service_status,
    requestNotes: row.request_notes,
    accountId: row.account_id,
    invId: row.inv_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    accountFirstName: row.account_firstname,
    accountLastName: row.account_lastname,
    accountEmail: row.account_email,
    invMake: row.inv_make,
    invModel: row.inv_model,
    invYear: row.inv_year
});

const getAllServiceRequests = async () => {
    const query = `
        SELECT
            s.*, a.account_firstname, a.account_lastname, a.account_email,
            i.inv_make, i.inv_model, i.inv_year,
            sv.service_name
        FROM service_requests s
        JOIN accounts a ON s.account_id = a.account_id
        JOIN services sv ON s.service_id = sv.service_id
        LEFT JOIN inventory i ON s.inv_id = i.inv_id
        ORDER BY s.created_at DESC
    `;

    const result = await db.query(query);
    return result.rows.map(mapServiceRequest);
};

const getServiceRequestsByAccount = async (accountId) => {
    const query = `
        SELECT
            s.*, i.inv_make, i.inv_model, i.inv_year,
            sv.service_name
        FROM service_requests s
        JOIN services sv ON s.service_id = sv.service_id
        LEFT JOIN inventory i ON s.inv_id = i.inv_id
        WHERE s.account_id = $1
        ORDER BY s.created_at DESC
    `;

    const result = await db.query(query, [accountId]);
    return result.rows.map(mapServiceRequest);
};

const getServiceRequestById = async (requestId) => {
    const query = `
        SELECT
            s.*, a.account_firstname, a.account_lastname, a.account_email,
            i.inv_make, i.inv_model, i.inv_year,
            sv.service_name
        FROM service_requests s
        JOIN accounts a ON s.account_id = a.account_id
        JOIN services sv ON s.service_id = sv.service_id
        LEFT JOIN inventory i ON s.inv_id = i.inv_id
        WHERE s.request_id = $1
    `;

    const result = await db.query(query, [requestId]);
    return result.rows[0] ? mapServiceRequest(result.rows[0]) : {};
};

const createServiceRequest = async (serviceId, requestNotes, accountId, invId = null) => {
    const hasLegacyServiceType = await hasLegacyServiceTypeColumn();

    const query = hasLegacyServiceType
        ? `
            INSERT INTO service_requests (service_id, service_type, request_notes, account_id, inv_id)
            VALUES (
                $1,
                COALESCE((SELECT service_name FROM services WHERE service_id = $1), 'General Maintenance'),
                $2,
                $3,
                $4
            )
            RETURNING request_id
        `
        : `
            INSERT INTO service_requests (service_id, request_notes, account_id, inv_id)
            VALUES ($1, $2, $3, $4)
            RETURNING request_id
        `;

    const result = await db.query(query, [serviceId, requestNotes, accountId, invId]);
    return result.rows[0] ? getServiceRequestById(result.rows[0].request_id) : {};
};

const updateServiceRequestStatus = async (requestId, status, notes = null) => {
    const query = `
        UPDATE service_requests
        SET service_status = $1,
            request_notes = COALESCE($2, request_notes)
        WHERE request_id = $3
        RETURNING request_id
    `;

    const result = await db.query(query, [status, notes, requestId]);
    return result.rows[0] ? getServiceRequestById(result.rows[0].request_id) : {};
};

const deleteServiceRequest = async (requestId) => {
    const query = `
        DELETE FROM service_requests
        WHERE request_id = $1
        RETURNING request_id
    `;

    const result = await db.query(query, [requestId]);
    return result.rows[0] ? { requestId: result.rows[0].request_id } : {};
};

const getServiceCatalog = async () => {
    const query = `
        SELECT service_id, service_name, service_description, created_at
        FROM services
        ORDER BY service_name ASC
    `;

    const result = await db.query(query);
    return result.rows;
};

const createServiceCatalogItem = async (serviceName, serviceDescription = '') => {
    const query = `
        INSERT INTO services (service_name, service_description)
        VALUES ($1, NULLIF($2, ''))
        RETURNING service_id, service_name, service_description, created_at
    `;

    const result = await db.query(query, [serviceName, serviceDescription]);
    return result.rows[0] || null;
};

const deleteServiceCatalogItem = async (serviceId) => {
    const query = `
        DELETE FROM services
        WHERE service_id = $1
        RETURNING service_id
    `;

    const result = await db.query(query, [serviceId]);
    return result.rows[0] || null;
};

export {
    getAllServiceRequests,
    getServiceRequestsByAccount,
    getServiceRequestById,
    createServiceRequest,
    updateServiceRequestStatus,
    deleteServiceRequest,
    getServiceCatalog,
    createServiceCatalogItem,
    deleteServiceCatalogItem
};
