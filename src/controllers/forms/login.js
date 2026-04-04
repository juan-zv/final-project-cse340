import { validationResult } from 'express-validator';
import { findUserByEmail, verifyPassword } from '../../models/forms/login.js';
import { Router } from 'express';
import { loginValidation } from '../../middleware/validation/forms.js';

const router = Router();

/** Display the login form. */
const showLoginForm = (req, res) => {
    res.render('forms/login/form', { title: 'User Login' });
};

/** Process login form submission. */
const processLogin = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        req.flash('error', 'Invalid email or password format. Please try again.');
        return res.redirect('/login');
    }

    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);
        if (!user) {
            console.log('User not found');
            req.flash('error', 'User not found');
            return res.redirect('/login');
        }
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password');
            req.flash('error', 'Invalid password');
            return res.redirect('/login');
        }

        delete user.password;

        req.session.user = user;
        req.flash('success', 'Login successful! Welcome back.');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error processing login:', error);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
};

/** Handle user logout. */
const processLogout = (req, res) => {
    if (!req.session) {
        return res.redirect('/');
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.clearCookie('connect.sid');
            return res.redirect('/');
        }

        res.clearCookie('connect.sid');
        res.redirect('/');
    });
};

/** Display the protected dashboard. */
const showDashboard = (req, res) => {
    const user = req.session.user;
    const sessionData = req.session;

    if (user && user.password) {
        console.error('Security error: password found in user object');
        delete user.password;
    }
    if (sessionData.user && sessionData.user.password) {
        console.error('Security error: password found in sessionData.user');
        delete sessionData.user.password;
    }

    const roleName = String(user?.roleName || user?.account_type || 'User');
    const normalizedRole = roleName.toLowerCase();

    const roleConfig = {
        admin: {
            dashboardTitle: 'Admin Dashboard',
            dashboardIntro: 'Complete system control overview.',
            dashboardSectionTitle: 'Admin Tools',
            dashboardCards: [
                {
                    title: 'Inventory',
                    description: 'Manage vehicle records and pricing.',
                    primaryLink: '/admin/inventory',
                    primaryLabel: 'Open Inventory'
                },
                {
                    title: 'Categories',
                    description: 'Create or remove inventory categories.',
                    primaryLink: '/admin/categories',
                    primaryLabel: 'Manage Categories'
                },
                {
                    title: 'Services',
                    description: 'Maintain the dealership service catalog.',
                    primaryLink: '/admin/services',
                    primaryLabel: 'Manage Services'
                },
                {
                    title: 'System Activity',
                    description: 'Review accounts, requests, and platform data.',
                    primaryLink: '/admin/system',
                    primaryLabel: 'View Activity'
                },
                {
                    title: 'Staff Accounts',
                    description: 'Review and manage employee access.',
                    primaryLink: '/admin/employees',
                    primaryLabel: 'Manage Staff'
                }
            ],
            showDataModelNotes: true
        },
        employee: {
            dashboardTitle: 'Employee Dashboard',
            dashboardIntro: 'Handle service requests, inventory updates, and customer communication.',
            dashboardSectionTitle: 'Employee Tools',
            dashboardCards: [
                {
                    title: 'Service Queue',
                    description: 'Review and update assigned service requests.',
                    primaryLink: '/services',
                    primaryLabel: 'Open Queue'
                },
                {
                    title: 'Vehicle Updates',
                    description: 'Update vehicle descriptions, price, and availability.',
                    primaryLink: '/catalog',
                    primaryLabel: 'Open Inventory'
                },
                {
                    title: 'Review Moderation',
                    description: 'Monitor customer reviews for quality and policy.',
                    primaryLink: '/reviews',
                    primaryLabel: 'Moderate Reviews'
                },
                {
                    title: 'Contact Inbox',
                    description: 'Read and follow up on contact submissions.',
                    primaryLink: '/employee/contact-form-submissions',
                    primaryLabel: 'View Messages'
                }
            ],
            showDataModelNotes: false
        },
        user: {
            dashboardTitle: 'User Dashboard',
            dashboardIntro: `Welcome ${user && user.name ? user.name : 'Driver'}. Manage your reviews and service requests here.`,
            dashboardSectionTitle: 'Your Tools',
            dashboardCards: [
                {
                    title: 'Browse Inventory',
                    description: 'View available vehicles and details.',
                    primaryLink: '/catalog',
                    primaryLabel: 'Open Catalog'
                },
                {
                    title: 'My Reviews',
                    description: 'Create and manage your vehicle reviews.',
                    primaryLink: '/reviews',
                    primaryLabel: 'Open Reviews'
                },
                {
                    title: 'Service Requests',
                    description: 'Track or edit your current requests.',
                    primaryLink: '/services',
                    primaryLabel: 'Open Services'
                },
                {
                    title: 'Request Service',
                    description: 'Submit a new maintenance request.',
                    primaryLink: '/services/request',
                    primaryLabel: 'New Request'
                },
                {
                    title: 'Contact Team',
                    description: 'Send a message to the dealership.',
                    primaryLink: '/contact',
                    primaryLabel: 'Open Contact'
                }
            ],
            showDataModelNotes: false
        }
    };

    const dashboardConfig = roleConfig[normalizedRole] || roleConfig.user;

    res.render('dashboard', {
        title: 'Dashboard',
        user,
        sessionData,
        dashboardTitle: dashboardConfig.dashboardTitle,
        dashboardIntro: dashboardConfig.dashboardIntro,
        dashboardSectionTitle: dashboardConfig.dashboardSectionTitle,
        dashboardCards: dashboardConfig.dashboardCards,
        showDataModelNotes: dashboardConfig.showDataModelNotes
    });
};

router.get('/', showLoginForm);
router.post('/', loginValidation, processLogin);

export default router;
export { processLogout, showDashboard };