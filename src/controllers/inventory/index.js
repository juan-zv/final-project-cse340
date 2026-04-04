import { addVehicleImage, getInventory, getVehicleByRouteId, getVehicleImages } from '../../models/inventory/index.js';
import { syncVehicleImages } from '../../models/inventory/index.js';
import { getAllCategories, getVehicleForAdminById, updateVehicle, updateVehicleEmployeeDetails } from '../../models/admin/index.js';
import { getReviewsByVehicleId } from '../../models/reviews/index.js';

const buildCatalogList = async (req, res, next) => {
    try {
        const category = req.query.category || '';
        const sortBy = req.query.sortBy || 'newest';
        const vehicles = await getInventory(category, sortBy);

        res.render('inventory/inventory', {
            title: 'Vehicle Inventory',
            vehicles,
            currentCategory: category,
            currentSort: sortBy
        });
    } catch (error) {
        next(error);
    }
};

const buildCatalogDetail = async (req, res, next) => {
    try {
        const slugId = req.params.slugId;
        const vehicle = await getVehicleByRouteId(slugId);

        if (Object.keys(vehicle).length === 0) {
            const err = new Error(`Vehicle ${slugId} not found`);
            err.status = 404;
            return next(err);
        }

        const [reviews, vehicleImages] = await Promise.all([
            getReviewsByVehicleId(vehicle.id),
            getVehicleImages(vehicle.id)
        ]);

        const galleryImages = vehicleImages.length > 0
            ? vehicleImages
            : [
                { imagePath: vehicle.image, imageLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model} main image`, isPrimary: true },
                ...(vehicle.thumbnail && vehicle.thumbnail !== vehicle.image ? [{ imagePath: vehicle.thumbnail, imageLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model} thumbnail`, isPrimary: false }] : [])
            ];

        res.render('inventory/detail', {
            title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle,
            reviews,
            vehicleImages: galleryImages
        });
    } catch (error) {
        next(error);
    }
};

const buildAddVehicleImage = async (req, res, next) => {
    try {
        const slugId = req.params.slugId;
        const vehicle = await getVehicleByRouteId(slugId);

        if (Object.keys(vehicle).length === 0) {
            const err = new Error(`Vehicle ${slugId} not found`);
            err.status = 404;
            return next(err);
        }

        res.render('inventory/add-image', {
            title: 'Add Vehicle Image',
            vehicle
        });
    } catch (error) {
        next(error);
    }
};

const addVehicleImageAction = async (req, res, next) => {
    try {
        const slugId = req.params.slugId;
        const vehicle = await getVehicleByRouteId(slugId);

        if (Object.keys(vehicle).length === 0) {
            const err = new Error(`Vehicle ${slugId} not found`);
            err.status = 404;
            return next(err);
        }

        const imagePath = String(req.body.image_path || '').trim();
        const imageLabel = String(req.body.image_label || '').trim();

        if (!imagePath) {
            req.flash('error', 'Image path is required.');
            return res.redirect(`/catalog/${vehicle.slug}/images/new`);
        }

        await addVehicleImage(vehicle.id, imagePath, imageLabel || 'Vehicle image');
        req.flash('success', 'Vehicle image added successfully.');
        return res.redirect(`/catalog/${vehicle.slug}`);
    } catch (error) {
        next(error);
    }
};

const buildInventoryEdit = async (req, res, next) => {
    try {
        const slugId = req.params.slugId;
        const role = req.session?.user?.roleName || req.session?.user?.account_type || req.session?.user?.role;
        const isAdmin = role === 'Admin';

        const vehicle = await getVehicleByRouteId(slugId);
        if (Object.keys(vehicle).length === 0) {
            const err = new Error(`Vehicle ${slugId} not found`);
            err.status = 404;
            return next(err);
        }

        const adminVehicle = await getVehicleForAdminById(vehicle.id);
        const vehicleImages = await getVehicleImages(vehicle.id);
        const existingImagePaths = vehicleImages.map((image) => image.imagePath).join('\n');
        const categories = isAdmin ? await getAllCategories() : [];

        res.render('inventory/edit', {
            title: `Edit ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle,
            adminVehicle,
            categories,
            existingImagePaths,
            isAdmin
        });
    } catch (error) {
        next(error);
    }
};

const updateInventoryEdit = async (req, res, next) => {
    try {
        const slugId = req.params.slugId;
        const role = req.session?.user?.roleName || req.session?.user?.account_type || req.session?.user?.role;
        const isAdmin = role === 'Admin';

        const vehicle = await getVehicleByRouteId(slugId);
        if (Object.keys(vehicle).length === 0) {
            const err = new Error(`Vehicle ${slugId} not found`);
            err.status = 404;
            return next(err);
        }

        if (isAdmin) {
            const invMake = String(req.body.inv_make || '').trim();
            const invModel = String(req.body.inv_model || '').trim();
            const invYear = String(req.body.inv_year || '').trim();
            const invDescription = String(req.body.inv_description || '').trim();
            const invImage = String(req.body.inv_image || '').trim();
            const invThumbnail = String(req.body.inv_thumbnail || '').trim();
            const invPrice = Number.parseFloat(req.body.inv_price || '0');
            const invMiles = Number.parseInt(req.body.inv_miles || '0', 10);
            const categoryId = Number.parseInt(req.body.category_id || '0', 10);
            const isAvailable = String(req.body.is_available || '').toLowerCase() === 'true';
            const imagePaths = String(req.body.vehicle_images || '')
                .split(/\r?\n|,/) 
                .map((pathValue) => pathValue.trim())
                .filter(Boolean);

            if (!invMake || !invModel || !invYear || !invDescription || !invImage || !invThumbnail) {
                req.flash('error', 'All vehicle fields are required for admin edits.');
                return res.redirect(`/catalog/${vehicle.slug}/edit`);
            }
            if (!Number.isFinite(invPrice) || invPrice < 0 || !Number.isInteger(invMiles) || invMiles < 0) {
                req.flash('error', 'Price and miles must be valid non-negative values.');
                return res.redirect(`/catalog/${vehicle.slug}/edit`);
            }
            if (!Number.isInteger(categoryId) || categoryId < 1) {
                req.flash('error', 'A valid category is required.');
                return res.redirect(`/catalog/${vehicle.slug}/edit`);
            }

            const resolvedImagePaths = imagePaths.length > 0 ? imagePaths : [invImage, invThumbnail];
            await updateVehicle(vehicle.id, {
                invMake,
                invModel,
                invYear,
                invDescription,
                invImage: resolvedImagePaths[0] || invImage,
                invThumbnail: resolvedImagePaths[1] || invThumbnail,
                invPrice,
                invMiles,
                isAvailable,
                categoryId
            });
            await syncVehicleImages(vehicle.id, resolvedImagePaths);
        } else {
            const invDescription = String(req.body.inv_description || '').trim();
            const invPrice = Number.parseFloat(req.body.inv_price || '0');
            const isAvailable = String(req.body.is_available || '').toLowerCase() === 'true';

            if (!invDescription) {
                req.flash('error', 'Vehicle description is required.');
                return res.redirect(`/catalog/${vehicle.slug}/edit`);
            }
            if (!Number.isFinite(invPrice) || invPrice < 0) {
                req.flash('error', 'Vehicle price must be a valid non-negative number.');
                return res.redirect(`/catalog/${vehicle.slug}/edit`);
            }

            await updateVehicleEmployeeDetails(vehicle.id, {
                invDescription,
                invPrice,
                isAvailable
            });
        }

        req.flash('success', 'Vehicle updated successfully.');
        return res.redirect(`/catalog/${vehicle.slug}`);
    } catch (error) {
        next(error);
    }
};

export { buildCatalogList, buildCatalogDetail, buildAddVehicleImage, addVehicleImageAction, buildInventoryEdit, updateInventoryEdit };
export default { buildCatalogList, buildCatalogDetail, buildAddVehicleImage, addVehicleImageAction, buildInventoryEdit, updateInventoryEdit };
