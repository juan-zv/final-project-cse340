import db from '../db.js';

const getInventory = async (category = '') => {
    const hasCategory = typeof category === 'string' && category.trim() !== '';

    const query = hasCategory
        ? `
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
                c.classification_name
            FROM inventory i
            JOIN classifications c ON i.classification_id = c.classification_id
            WHERE LOWER(c.classification_name) = LOWER($1)
            ORDER BY i.inv_year DESC, i.inv_make, i.inv_model
        `
        : `
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
                c.classification_name
            FROM inventory i
            JOIN classifications c ON i.classification_id = c.classification_id
            ORDER BY i.inv_year DESC, i.inv_make, i.inv_model
        `;

    const result = hasCategory
        ? await db.query(query, [category.trim()])
        : await db.query(query);

    return result.rows.map((row) => ({
        id: row.inv_id,
        make: row.inv_make,
        model: row.inv_model,
        year: row.inv_year,
        description: row.inv_description,
        image: row.inv_image,
        thumbnail: row.inv_thumbnail,
        price: row.inv_price,
        miles: row.inv_miles,
        availability: row.is_available ? 'Available' : 'Unavailable',
        category: row.classification_name
    }));
};

const getVehicleByRouteId = async (slugId) => {
    const raw = String(slugId || '').trim();
    const idMatch = raw.match(/(\d+)$/);

    if (!idMatch) {
        return null;
    }

    const invId = Number(idMatch[1]);
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
            c.classification_name
        FROM inventory i
        JOIN classifications c ON i.classification_id = c.classification_id
        WHERE i.inv_id = $1
        LIMIT 1
    `;

    const result = await db.query(query, [invId]);
    const row = result.rows[0];

    if (!row) {
        return null;
    }

    return {
        inv_id: row.inv_id,
        inv_make: row.inv_make,
        inv_model: row.inv_model,
        inv_year: row.inv_year,
        inv_description: row.inv_description,
        inv_image: row.inv_image,
        inv_thumbnail: row.inv_thumbnail,
        inv_price: row.inv_price,
        inv_miles: row.inv_miles,
        status: row.is_available ? 'Available' : 'Unavailable',
        classification_name: row.classification_name
    };
};

export { getInventory, getVehicleByRouteId };
