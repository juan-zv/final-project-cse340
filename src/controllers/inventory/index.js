import { getInventory, getVehicleByRouteId } from '../../models/inventory/index.js';
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

        const reviews = await getReviewsByVehicleId(vehicle.id);

        res.render('inventory/detail', {
            title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle,
            reviews,
            vehicleImages: [{ imagePath: vehicle.image }]
        });
    } catch (error) {
        next(error);
    }
};

export { buildCatalogList, buildCatalogDetail };
export default { buildCatalogList, buildCatalogDetail };
