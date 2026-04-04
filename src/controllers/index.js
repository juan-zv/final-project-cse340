import { getInventory } from '../models/inventory/index.js';
import { getAllCategories } from '../models/admin/index.js';

// Route handlers for static pages
const homePage = async (req, res, next) => {
    if (typeof res.addStyle === 'function') {
        res.addStyle('<link rel="stylesheet" href="/css/home.css">');
    }

    try {
        const [inventory, categories] = await Promise.all([
            getInventory('', 'newest'),
            getAllCategories()
        ]);
        const featuredVehicles = inventory.slice(0, 3);

        const representativeByCategory = inventory.reduce((map, vehicle) => {
            if (!vehicle.category || map.has(vehicle.category)) {
                return map;
            }

            map.set(vehicle.category, vehicle);
            return map;
        }, new Map());

        const browseCategories = categories.map((category) => {
            const name = category.category_name;
            const vehicle = representativeByCategory.get(name);
            return {
                name,
                href: `/catalog?category=${encodeURIComponent(name)}`,
                image: vehicle ? (vehicle.thumbnail || vehicle.image || '') : ''
            };
        });

        res.render('home', {
            title: 'Home',
            featuredVehicles,
            browseCategories
        });
    } catch (error) {
        next(error);
    }
};

const aboutPage = (req, res) => {
    res.render('about', { title: 'About' });
};

const testErrorPage = (req, res, next) => {
    const err = new Error('This is a test error');
    err.status = 500;
    next(err);
};

export { homePage, aboutPage, testErrorPage };