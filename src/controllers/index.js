import { getInventory } from '../models/inventory/index.js';

// Route handlers for static pages
const homePage = async (req, res, next) => {
    if (typeof res.addStyle === 'function') {
        res.addStyle('<link rel="stylesheet" href="/css/home.css">');
    }

    try {
        const inventory = await getInventory('', 'newest');
        const featuredVehicles = inventory.slice(0, 3);

        res.render('home', {
            title: 'Home',
            featuredVehicles
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