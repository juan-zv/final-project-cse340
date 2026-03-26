// Route handlers for static pages
const homePage = (req, res) => {
    res.render('home', { title: 'Home' });
};

const aboutPage = (req, res) => {
    res.render('about', { title: 'About' });
};

const testErrorPage = (req, res, next) => {
    const err = new Error('This is a test error');
    err.status = 500;
    next(err);
};

export { homePage, aboutPage, demoPage, testErrorPage };

// Export all domain controllers from here to act as a central hub
export * as adminController from './admin/index.js';
export * as catalogController from './catalog/index.js';
export * as employeeController from './employee/index.js';
export * as inventoryController from './inventory/index.js';
export * as reviewsController from './reviews/index.js';
export * as serviceRequestsController from './service-requests/index.js';
export * as servicesController from './services/index.js';
export * as userController from './user/index.js';