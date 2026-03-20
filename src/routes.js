import { catalogPage, courseDetailPage } from './controllers/catalog/catalog.js';
import { homePage } from './controllers/index.js';
import registrationRoutes from './controllers/forms/registration.js';
import loginRoutes from './controllers/forms/login.js';
import { processLogout, showDashboard } from './controllers/forms/login.js';
import { requireLogin } from './middleware/auth.js';
import { Router } from 'express';

// Create a new router instance
const router = Router();

// Add main.css to all routes globally
router.use((req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/main.css">');
    next();
});

// Add module-specific styles
router.use('/catalog', (req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/catalog.css">');
    next();
});

router.use('/register', (req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/registration.css">');
    next();
});

router.use('/login', (req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/login.css">');
    next();
});

router.use('/dashboard', (req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/login.css">');
    next();
});

// Home and basic pages
router.get('/', homePage);

// Course catalog routes
router.get('/catalog', catalogPage);
router.get('/catalog/:slugId', courseDetailPage);

// Registration routes
router.use('/register', registrationRoutes);

// Login routes (form and submission)
router.use('/login', loginRoutes);

// Authentication-related routes at root level
router.get('/logout', processLogout);
router.get('/dashboard', requireLogin, showDashboard);

// Export the router to be used in the main app
export default router;