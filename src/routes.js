import { buildCatalogList, buildCatalogDetail } from './controllers/inventory/index.js';
import { homePage } from './controllers/index.js';
import registrationRoutes from './controllers/forms/registration.js';
import loginRoutes from './controllers/forms/login.js';
import contactRoutes from './controllers/forms/contact.js';
import { processLogout, showDashboard } from './controllers/forms/login.js';
import {
    buildReviewsList,
    buildReviewEdit,
    buildReviewNew,
    deleteReviewById,
    submitReview,
    updateReviewById
} from './controllers/reviews/index.js';
import {
    buildServicesList,
    buildServiceRequest,
    submitServiceRequest
} from './controllers/services/index.js';
import {
    buildServiceRequestsList,
    buildServiceRequestEdit,
    updateServiceRequest
} from './controllers/service-requests/index.js';
import { buildAdminDashboard, buildEmployeesList } from './controllers/admin/index.js';
import { buildEmployeeDashboard, buildContactSubmissions } from './controllers/employee/index.js';
import {
    reviewValidation,
    serviceRequestUpdateValidation,
    serviceRequestValidation
} from './middleware/validation/forms.js';
import { requireAuth, requireAdmin, requireEmployee } from './middleware/auth.js';
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

router.use('/contact', (req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/contact.css">');
    next();
});

router.use('/dashboard', (req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/login.css">');
    next();
});

// Home and basic pages
router.get('/', homePage);

// Course catalog routes
router.get('/catalog', buildCatalogList);
router.get('/catalog/:slugId', buildCatalogDetail);

// Registration routes
router.use('/register', registrationRoutes);

// Login routes (form and submission)
router.use('/login', loginRoutes);

// Contact routes are public
router.use('/contact', contactRoutes);

// Authentication-related routes at root level
router.get('/logout', processLogout);
router.get('/dashboard', requireAuth, showDashboard);
router.get('/admin/dashboard', requireAdmin, buildAdminDashboard);
router.get('/admin/employees', requireAdmin, buildEmployeesList);
router.get('/employee/dashboard', requireEmployee, buildEmployeeDashboard);
router.get('/employee/contact-form-submissions', requireEmployee, buildContactSubmissions);
router.get('/user/dashboard', requireAuth, (req, res) => res.redirect('/dashboard'));

// Reviews
router.get('/reviews', requireAuth, buildReviewsList);
router.get('/reviews/new', requireAuth, buildReviewNew);
router.post('/reviews', requireAuth, reviewValidation, submitReview);
router.get('/reviews/:reviewId/edit', requireAuth, buildReviewEdit);
router.post('/reviews/:reviewId/edit', requireAuth, reviewValidation, updateReviewById);
router.post('/reviews/:reviewId/delete', requireAuth, deleteReviewById);

// Services
router.get('/services', buildServicesList);
router.get('/services/request', requireAuth, buildServiceRequest);
router.post('/services/request', requireAuth, serviceRequestValidation, submitServiceRequest);

// Service request history and updates
router.get('/service-requests', requireAuth, buildServiceRequestsList);
router.get('/service-requests/:requestId/edit', requireAuth, buildServiceRequestEdit);
router.post('/service-requests/:requestId/edit', requireAuth, serviceRequestUpdateValidation, updateServiceRequest);

// Export the router to be used in the main app
export default router;