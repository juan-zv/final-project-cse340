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
                c.category_name
            FROM inventory i
            JOIN categories c ON i.category_id = c.category_id
            WHERE LOWER(c.category_name) = LOWER($1)
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
                c.category_name
            FROM inventory i
            JOIN categories c ON i.category_id = c.category_id
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
        category: row.category_name
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
            c.category_name
        FROM inventory i
        JOIN categories c ON i.category_id = c.category_id
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
        category: row.category_name
    };
};

const getVehicleById = async (invId) => {
    const numericId = Number(invId);
    if (!Number.isInteger(numericId) || numericId < 1) {
        return {};
    }

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
            c.category_name
        FROM inventory i
        JOIN categories c ON i.category_id = c.category_id
        WHERE i.inv_id = $1
        LIMIT 1
    `;

    const result = await db.query(query, [numericId]);
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
        category: row.category_name
    };
};

const normalizeImagePaths = (imagePaths = []) => {
    const seen = new Set();
    const normalized = [];

    imagePaths.forEach((pathValue) => {
        const value = String(pathValue || '').trim();
        if (!value || seen.has(value)) {
            return;
        }

        seen.add(value);
        normalized.push(value);
    });

    return normalized;
};

const getVehicleImages = async (invId) => {
    const numericId = Number(invId);
    if (!Number.isInteger(numericId) || numericId < 1) {
        return [];
    }

    const query = `
        SELECT
            image_id,
            inv_id,
            image_path,
            image_label,
            sort_order,
            is_primary
        FROM vehicle_images
        WHERE inv_id = $1
        ORDER BY is_primary DESC, sort_order ASC, image_id ASC
    `;

    const result = await db.query(query, [numericId]);
    return result.rows.map((row) => ({
        imageId: row.image_id,
        invId: row.inv_id,
        imagePath: row.image_path,
        imageLabel: row.image_label,
        sortOrder: row.sort_order,
        isPrimary: row.is_primary
    }));
};

const getAllVehicleImages = async () => {
    const query = `
        SELECT
            image_id,
            inv_id,
            image_path,
            image_label,
            sort_order,
            is_primary
        FROM vehicle_images
        ORDER BY inv_id ASC, is_primary DESC, sort_order ASC, image_id ASC
    `;

    const result = await db.query(query);
    return result.rows.map((row) => ({
        imageId: row.image_id,
        invId: row.inv_id,
        imagePath: row.image_path,
        imageLabel: row.image_label,
        sortOrder: row.sort_order,
        isPrimary: row.is_primary
    }));
};

const syncVehicleImages = async (invId, imagePaths = []) => {
    const numericId = Number(invId);
    if (!Number.isInteger(numericId) || numericId < 1) {
        return [];
    }

    const normalizedPaths = normalizeImagePaths(imagePaths);
    await db.query('DELETE FROM vehicle_images WHERE inv_id = $1', [numericId]);

    if (normalizedPaths.length === 0) {
        return [];
    }

    const inserted = [];
    for (let index = 0; index < normalizedPaths.length; index += 1) {
        const imagePath = normalizedPaths[index];
        const query = `
            INSERT INTO vehicle_images (inv_id, image_path, image_label, sort_order, is_primary)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING image_id, inv_id, image_path, image_label, sort_order, is_primary
        `;
        const result = await db.query(query, [
            numericId,
            imagePath,
            `Vehicle image ${index + 1}`,
            index + 1,
            index === 0
        ]);
        if (result.rows[0]) {
            inserted.push({
                imageId: result.rows[0].image_id,
                invId: result.rows[0].inv_id,
                imagePath: result.rows[0].image_path,
                imageLabel: result.rows[0].image_label,
                sortOrder: result.rows[0].sort_order,
                isPrimary: result.rows[0].is_primary
            });
        }
    }

    return inserted;
};

const addVehicleImage = async (invId, imagePath, imageLabel = 'Vehicle image') => {
    const numericId = Number(invId);
    const normalizedPath = String(imagePath || '').trim();
    if (!Number.isInteger(numericId) || numericId < 1 || !normalizedPath) {
        return null;
    }

    const orderQuery = `
        SELECT
            COALESCE(MAX(sort_order), 0) AS max_sort_order,
            COUNT(*) AS image_count
        FROM vehicle_images
        WHERE inv_id = $1
    `;
    const orderResult = await db.query(orderQuery, [numericId]);
    const maxSortOrder = Number(orderResult.rows[0]?.max_sort_order || 0);
    const imageCount = Number(orderResult.rows[0]?.image_count || 0);

    const insertQuery = `
        INSERT INTO vehicle_images (inv_id, image_path, image_label, sort_order, is_primary)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING image_id, inv_id, image_path, image_label, sort_order, is_primary
    `;

    const result = await db.query(insertQuery, [
        numericId,
        normalizedPath,
        String(imageLabel || 'Vehicle image').trim() || 'Vehicle image',
        maxSortOrder + 1,
        imageCount === 0
    ]);

    if (!result.rows[0]) {
        return null;
    }

    return {
        imageId: result.rows[0].image_id,
        invId: result.rows[0].inv_id,
        imagePath: result.rows[0].image_path,
        imageLabel: result.rows[0].image_label,
        sortOrder: result.rows[0].sort_order,
        isPrimary: result.rows[0].is_primary
    };
};

export { getInventory, getVehicleByRouteId, getVehicleById, getVehicleImages, getAllVehicleImages, syncVehicleImages, addVehicleImage };
