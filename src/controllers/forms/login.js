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

    res.render('dashboard', {
        title: 'Dashboard',
        user,
        sessionData,
        dashboardTitle: 'Dashboard',
        dashboardIntro: `Welcome ${user && user.name ? user.name : 'User'}. You are signed in as ${user && user.roleName ? user.roleName : 'User'}.`,
        dashboardSectionTitle: 'Role Tools',
        dashboardCards: []
    });
};

router.get('/', showLoginForm);
router.post('/', loginValidation, processLogin);

export default router;
export { processLogout, showDashboard };