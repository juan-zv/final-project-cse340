import { addVehicleImage, getInventory, getVehicleByRouteId, getVehicleImages } from '../../models/inventory/index.js';
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

export { buildCatalogList, buildCatalogDetail, buildAddVehicleImage, addVehicleImageAction };
export default { buildCatalogList, buildCatalogDetail, buildAddVehicleImage, addVehicleImageAction };
