import { Router } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { 
    emailExists, 
    saveUser, 
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../../models/forms/registration.js';
import { requireLogin } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/auth.js';
import { registrationValidation, editValidation } from '../../middleware/validation/forms.js';

const router = Router();

/** Display the registration form page. */
const showRegistrationForm = (req, res) => {
    res.render('forms/registration/form', { title: 'User Registration' });
};

/** Handle user registration. */
const processRegistration = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        errors.array().forEach((error) => req.flash('error', error.msg));
        return res.redirect('/register');
    }

    const { name, email, password } = req.body;

    try {
        const emailAlreadyExists = await emailExists(email);

        if (emailAlreadyExists) {
            console.log('Email already registered');
            req.flash('warning', 'This email is already registered.');
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await saveUser(name, email, hashedPassword);

        console.log('User registered successfully:', newUser);
        req.flash('success', 'Registration successful! Please log in.');
        return res.redirect('/login');
    } catch (error) {
        console.error('Error during registration:', error);
        req.flash('error', 'Registration failed. Please try again.');
        return res.redirect('/register');
    }
};

/** Display all registered users. */
const showAllUsers = async (req, res) => {
    let users = [];

    try {
        users = await getAllUsers();
    } catch (error) {
        console.error('Error retrieving users:', error);
    }

    res.render('forms/registration/list', {
        title: 'Registered Users',
        users,
        user: req.session && req.session.user ? req.session.user : null
    });
};
/** Display the edit account form. */
const showEditAccountForm = async (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const currentUser = req.session.user;

    const targetUser = await getUserById(targetUserId);

    if (!targetUser) {
        req.flash('error', 'User not found.');
        return res.redirect('/dashboard/users');
    }

    const currentRole = (currentUser.roleName || '').toLowerCase();
    const canEdit = currentUser.id === targetUserId || currentRole === 'admin';

    if (!canEdit) {
        req.flash('error', 'You do not have permission to edit this account.');
        return res.redirect('/dashboard/users');
    }

    res.render('forms/registration/edit', {
        title: 'Edit Account',
        user: targetUser,
        isAdminEditing: currentRole === 'admin'
    });
};

/** Process account edit form submission. */
const processEditAccount = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        return res.redirect(`/register/${req.params.id}/edit`);
    }

    const targetUserId = parseInt(req.params.id);
    const currentUser = req.session.user;
    const { name, email, account_type } = req.body;

    try {
        const targetUser = await getUserById(targetUserId);

        if (!targetUser) {
            req.flash('error', 'User not found.');
            return res.redirect('/dashboard/users');
        }

        const currentRole = (currentUser.roleName || '').toLowerCase();
        const canEdit = currentUser.id === targetUserId || currentRole === 'admin';

        if (!canEdit) {
            req.flash('error', 'You do not have permission to edit this account.');
            return res.redirect('/dashboard/users');
        }

        const emailTaken = await emailExists(email);
        if (emailTaken && targetUser.email !== email) {
            req.flash('error', 'An account with this email already exists.');
            return res.redirect(`/register/${targetUserId}/edit`);
        }

        const allowedRoles = ['User', 'Employee', 'Admin'];
        const accountType = currentRole === 'admin' && allowedRoles.includes(account_type)
            ? account_type
            : null;

        await updateUser(targetUserId, name, email, accountType);

        if (currentUser.id === targetUserId) {
            req.session.user.name = name;
            req.session.user.email = email;
            if (accountType) {
                req.session.user.roleName = accountType;
                req.session.user.account_type = accountType;
            }
        }

        req.flash('success', 'Account updated successfully.');
        res.redirect('/dashboard/users');
    } catch (error) {
        console.error('Error updating account:', error);
        req.flash('error', 'An error occurred while updating the account.');
        res.redirect(`/register/${targetUserId}/edit`);
    }
};

/** Process account deletion. */
const processDeleteAccount = async (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const currentUser = req.session.user;

    if ((currentUser.roleName || '').toLowerCase() !== 'admin') {
        req.flash('error', 'You do not have permission to delete accounts.');
        return res.redirect('/dashboard/users');
    }

    if (currentUser.id === targetUserId) {
        req.flash('error', 'You cannot delete your own account.');
        return res.redirect('/dashboard/users');
    }

    try {
        const deleted = await deleteUser(targetUserId);

        if (deleted) {
            req.flash('success', 'User account deleted successfully.');
        } else {
            req.flash('error', 'User not found or already deleted.');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        req.flash('error', 'An error occurred while deleting the account.');
    }

    res.redirect('/dashboard/users');
};

router.get('/', showRegistrationForm);

router.post('/', registrationValidation, processRegistration);

router.get('/list', requireAdmin, (req, res) => res.redirect('/dashboard/users'));

router.get('/:id/edit', requireLogin, showEditAccountForm);

router.post('/:id/edit', requireLogin, editValidation, processEditAccount);

router.post('/:id/delete', requireLogin, processDeleteAccount);

export default router;
export { showAllUsers };