import { Router } from 'express';
import { validationResult } from 'express-validator';
import { createContactForm, getAllContactForms } from '../../models/forms/contact.js';
import { contactValidation } from '../../middleware/validation/forms.js';

const router = Router();

/** Display the contact form page. */
const showContactForm = (req, res) => {
    res.render('forms/contact/form', {
        title: 'Contact Us'
    });
};

/** Handle contact form submission. */
const handleContactSubmission = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        return res.redirect('/contact');
    }

    const { sender_name, sender_email, message } = req.body;

    try {
        await createContactForm(sender_name, sender_email, message);
        console.log('Contact form submitted successfully');
        req.flash('success', 'Thank you for contacting us! We will respond soon.');
        res.redirect('/contact');
    } catch (error) {
        console.error('Error saving contact form:', error);
        req.flash('error', 'Unable to submit your message. Please try again later.');
        res.redirect('/contact');
    }
};

/** Display all contact form submissions. */
const showContactResponses = async (req, res) => {
    let contactForms = [];

    try {
        contactForms = await getAllContactForms();
    } catch (error) {
        console.error('Error retrieving contact forms:', error);
        req.flash('error', 'Unable to retrieve contact form submissions. Please try again later.');
        return res.redirect('/contact');
    }

    res.render('forms/contact/responses', {
        title: 'Contact Form Submissions',
        contactForms
    });
};

router.get('/', showContactForm);

router.post('/', contactValidation, handleContactSubmission);

router.get('/responses', showContactResponses);

export default router;