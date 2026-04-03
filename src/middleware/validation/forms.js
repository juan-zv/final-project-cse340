import { body } from 'express-validator';

const registrationValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email address is too long'),
    body('emailConfirm')
        .trim()
        .custom((value, { req }) => value === req.body.email)
        .withMessage('Email addresses must match'),
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/)
        .withMessage('Password must contain at least one special character'),
    body('passwordConfirm')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords must match')
];

const editValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email address is too long')
        .normalizeEmail()
];

const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email address is too long')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required.')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
];

const contactValidation = [
    body('sender_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name contains invalid characters'),
    body('sender_email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .isLength({ max: 150 })
        .withMessage('Email address is too long')
        .normalizeEmail(),
    body('message')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Message must be between 10 and 2000 characters')
        .custom((value) => {
            const words = value.split(/\s+/);
            const uniqueWords = new Set(words);
            if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
                throw new Error('Message appears to be spam');
            }
            return true;
        })
];

const reviewValidation = [
    body('inv_id')
        .trim()
        .notEmpty()
        .withMessage('Vehicle ID is required')
        .isInt({ min: 1 })
        .withMessage('Vehicle ID must be a valid number'),
    body('review_text')
        .trim()
        .isLength({ min: 10, max: 1200 })
        .withMessage('Review must be between 10 and 1200 characters')
];

const serviceRequestValidation = [
    body('inv_id')
        .trim()
        .notEmpty()
        .withMessage('Please select a vehicle')
        .isInt({ min: 1 })
        .withMessage('Vehicle ID must be a valid number'),
    body('service_type')
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage('Service type must be between 2 and 120 characters'),
    body('request_notes')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Request notes must be between 10 and 2000 characters')
];

const serviceRequestUpdateValidation = [
    body('service_status')
        .trim()
        .isIn(['Open', 'Submitted', 'In Progress', 'Completed'])
        .withMessage('Invalid service request status'),
    body('request_notes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Request notes cannot exceed 2000 characters')
];

export {
    registrationValidation,
    editValidation,
    loginValidation,
    contactValidation,
    reviewValidation,
    serviceRequestValidation,
    serviceRequestUpdateValidation
};
