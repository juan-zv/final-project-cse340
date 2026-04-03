import db from '../db.js';

const getReviewsByVehicleId = async (invId) => {
    const query = `
        SELECT r.*, a.account_firstname, a.account_lastname
        FROM reviews r
        JOIN accounts a ON r.account_id = a.account_id
        WHERE r.inv_id = $1
        ORDER BY r.created_at DESC
    `;

    const result = await db.query(query, [invId]);
    return result.rows;
};

const getReviewsByAccountId = async (accountId) => {
    const query = `
        SELECT r.*, i.inv_year, i.inv_make, i.inv_model
        FROM reviews r
        JOIN inventory i ON r.inv_id = i.inv_id
        WHERE r.account_id = $1
        ORDER BY r.created_at DESC
    `;

    const result = await db.query(query, [accountId]);
    return result.rows;
};

const getReviewById = async (reviewId) => {
    const query = `
        SELECT *
        FROM reviews
        WHERE review_id = $1
    `;

    const result = await db.query(query, [reviewId]);
    return result.rows[0] || null;
};

const addReview = async (reviewText, invId, accountId) => {
    const query = `
        INSERT INTO reviews (review_text, inv_id, account_id)
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    const result = await db.query(query, [reviewText, invId, accountId]);
    return result.rows[0] || null;
};

const updateReview = async (reviewId, reviewText) => {
    const query = `
        UPDATE reviews
        SET review_text = $1
        WHERE review_id = $2
        RETURNING *
    `;

    const result = await db.query(query, [reviewText, reviewId]);
    return result.rows[0] || null;
};

const deleteReview = async (reviewId) => {
    const query = `
        DELETE FROM reviews
        WHERE review_id = $1
        RETURNING *
    `;

    const result = await db.query(query, [reviewId]);
    return result.rows[0] || null;
};

export {
    getReviewsByVehicleId,
    getReviewsByAccountId,
    getReviewById,
    addReview,
    updateReview,
    deleteReview
};
