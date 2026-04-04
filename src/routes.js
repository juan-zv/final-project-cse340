import { buildCatalogList, buildCatalogDetail, buildAddVehicleImage, addVehicleImageAction } from './controllers/inventory/index.js';
import { homePage } from './controllers/index.js';
import registrationRoutes from './controllers/forms/registration.js';
import { showAllUsers } from './controllers/forms/registration.js';
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
    submitServiceRequest,
    buildServiceRequestEdit,
    updateServiceRequest
} from './controllers/services/index.js';
import {
    buildAdminDashboard,
    buildEmployeesList,
    buildCategoriesManagement,
    buildServicesManagement,
    createCategoryAction,
    createServiceAction,
    updateCategoryAction,
    deleteCategoryAction,
    deleteServiceAction,
    buildInventoryManagement,
    createVehicleAction,
    updateVehicleAction,
    deleteVehicleAction,
    buildSystemActivity,
    deleteContactMessageAction
} from './controllers/admin/index.js';
import {
    buildEmployeeDashboard,
    buildContactSubmissions,
    buildEmployeeVehicleEditing,
    updateEmployeeVehicleDetailsAction
} from './controllers/employee/index.js';
import { buildUserDashboard } from './controllers/user/index.js';
import {
    reviewValidation,
    serviceRequestUpdateValidation,
    serviceRequestValidation
} from './middleware/validation/forms.js';
import { requireLogin, requireAdmin, requireEmployee } from './middleware/auth.js';
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
router.get('/catalog/:slugId/images/new', requireEmployee, buildAddVehicleImage);
router.post('/catalog/:slugId/images', requireEmployee, addVehicleImageAction);

// Registration routes
router.use('/register', registrationRoutes);

// Login routes (form and submission)
router.use('/login', loginRoutes);

// Contact routes are public
router.use('/contact', contactRoutes);

// Authentication-related routes at root level
router.get('/logout', processLogout);
router.get('/dashboard', requireLogin, showDashboard);
router.get('/admin/dashboard', requireAdmin, buildAdminDashboard);
router.get('/admin/employees', requireAdmin, buildEmployeesList);
router.get('/admin/categories', requireAdmin, buildCategoriesManagement);
router.post('/admin/categories', requireAdmin, createCategoryAction);
router.post('/admin/categories/:categoryId/edit', requireAdmin, updateCategoryAction);
router.post('/admin/categories/:categoryId/delete', requireAdmin, deleteCategoryAction);
router.get('/admin/services', requireAdmin, buildServicesManagement);
router.post('/admin/services', requireAdmin, createServiceAction);
router.post('/admin/services/:serviceId/delete', requireAdmin, deleteServiceAction);
router.get('/admin/inventory', requireAdmin, buildInventoryManagement);
router.post('/admin/inventory', requireAdmin, createVehicleAction);
router.post('/admin/inventory/:invId/edit', requireAdmin, updateVehicleAction);
router.post('/admin/inventory/:invId/delete', requireAdmin, deleteVehicleAction);
router.get('/admin/system', requireAdmin, buildSystemActivity);
router.post('/admin/system/contact-messages/:messageId/delete', requireAdmin, deleteContactMessageAction);
router.post('/admin/contact-messages/:messageId/delete', requireAdmin, deleteContactMessageAction);
router.get('/dashboard/users', requireAdmin, showAllUsers);
router.get('/employee/dashboard', requireEmployee, buildEmployeeDashboard);
router.get('/employee/contact-form-submissions', requireEmployee, buildContactSubmissions);
router.get('/employee/vehicles', requireEmployee, buildEmployeeVehicleEditing);
router.post('/employee/vehicles/:invId/edit', requireEmployee, updateEmployeeVehicleDetailsAction);
router.get('/user/dashboard', requireLogin, buildUserDashboard);

// Reviews
router.get('/reviews', requireLogin, buildReviewsList);
router.get('/reviews/new', requireLogin, buildReviewNew);
router.post('/reviews', requireLogin, reviewValidation, submitReview);
router.get('/reviews/:reviewId/edit', requireLogin, buildReviewEdit);
router.post('/reviews/:reviewId/edit', requireLogin, reviewValidation, updateReviewById);
router.post('/reviews/:reviewId/delete', requireLogin, deleteReviewById);

// Services
router.get('/services', requireLogin, buildServicesList);
router.get('/services/request', requireLogin, buildServiceRequest);
router.post('/services/request', requireLogin, serviceRequestValidation, submitServiceRequest);

// Service request history and updates
router.get('/service-requests', requireLogin, (req, res) => res.redirect('/services'));
router.get('/service-requests/:requestId/edit', requireLogin, (req, res) => res.redirect(`/services/${req.params.requestId}/edit`));
router.post('/service-requests/:requestId/edit', requireLogin, (req, res) => res.redirect(307, `/services/${req.params.requestId}/edit`));
router.get('/services/:requestId/edit', requireLogin, buildServiceRequestEdit);
router.post('/services/:requestId/edit', requireLogin, serviceRequestUpdateValidation, updateServiceRequest);

// Export the router to be used in the main app
export default router;