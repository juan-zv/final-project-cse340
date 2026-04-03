import db from '../db.js';

const toSlug = (row) => {
    const base = `${row.inv_year}-${row.inv_make}-${row.inv_model}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `${base}-${row.inv_id}`;
};

const getInventory = async (category = '', sortBy = 'newest') => {
    const hasCategory = typeof category === 'string' && category.trim() !== '';
    const normalizedSort = String(sortBy || 'newest').toLowerCase();

    const sortMap = {
        newest: 'i.inv_year DESC, i.inv_make ASC, i.inv_model ASC',
        oldest: 'i.inv_year ASC, i.inv_make ASC, i.inv_model ASC',
        make_asc: 'i.inv_make ASC, i.inv_model ASC, i.inv_year DESC',
        make_desc: 'i.inv_make DESC, i.inv_model DESC, i.inv_year DESC',
        price_low: 'i.inv_price ASC, i.inv_year DESC',
        price_high: 'i.inv_price DESC, i.inv_year DESC'
    };

    const orderBy = sortMap[normalizedSort] || sortMap.newest;

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
            JOIN categories c ON i.classification_id = c.classification_id
            WHERE LOWER(c.classification_name) = LOWER($1)
            ORDER BY ${orderBy}
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
            JOIN categories c ON i.classification_id = c.classification_id
            ORDER BY ${orderBy}
        `;

    const result = hasCategory
        ? await db.query(query, [category.trim()])
        : await db.query(query);

    return result.rows.map((row) => ({
        id: row.inv_id,
        slug: toSlug(row),
        make: row.inv_make,
        model: row.inv_model,
        year: row.inv_year,
        description: row.inv_description,
        image: row.inv_image,
        thumbnail: row.inv_thumbnail,
        price: row.inv_price,
        miles: row.inv_miles,
        status: row.is_available ? 'Available' : 'Unavailable',
        availability: row.is_available ? 'Available' : 'Unavailable',
        category: row.classification_name
    }));
};

const getVehicleByRouteId = async (slugId) => {
    const raw = String(slugId || '').trim();
    const idMatch = raw.match(/(\d+)$/);

    if (!idMatch) {
        return {};
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
        JOIN categories c ON i.classification_id = c.classification_id
        WHERE i.inv_id = $1
        LIMIT 1
    `;

    const result = await db.query(query, [invId]);
    const row = result.rows[0];

    if (!row) {
        return {};
    }

    return {
        id: row.inv_id,
        slug: toSlug(row),
        make: row.inv_make,
        model: row.inv_model,
        year: row.inv_year,
        description: row.inv_description,
        image: row.inv_image,
        thumbnail: row.inv_thumbnail,
        price: row.inv_price,
        miles: row.inv_miles,
        status: row.is_available ? 'Available' : 'Unavailable',
        category: row.classification_name
    };
};

export { getInventory, getVehicleByRouteId };
