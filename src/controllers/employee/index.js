import { getAllContactForms } from '../../models/forms/contact.js';

export const buildEmployeeDashboard = async (req, res, next) => {
	try {
		res.render('employee/dashboard', { title: 'Employee Dashboard' });
	} catch (error) {
		next(error);
	}
};

export const buildContactSubmissions = async (req, res, next) => {
	try {
		const sortBy = String(req.query.sortBy || 'newest').toLowerCase();
		const readStatus = String(req.query.readStatus || '').toLowerCase();
		const keyword = String(req.query.q || '').trim().toLowerCase();

		let contactForms = await getAllContactForms();

		contactForms = contactForms.filter((item) => {
			const sender = String(item.senderName || '').toLowerCase();
			const email = String(item.senderEmail || '').toLowerCase();
			const message = String(item.message || '').toLowerCase();
			const isRead = item.isRead === true;

			if (readStatus === 'open' && isRead) {
				return false;
			}
			if (readStatus === 'read' && !isRead) {
				return false;
			}
			if (keyword && !sender.includes(keyword) && !email.includes(keyword) && !message.includes(keyword)) {
				return false;
			}
			return true;
		});

		const byNewest = (a, b) => new Date(b.submitted || 0) - new Date(a.submitted || 0);
		const byOldest = (a, b) => new Date(a.submitted || 0) - new Date(b.submitted || 0);
		const bySender = (a, b) => String(a.senderName || '').localeCompare(String(b.senderName || ''));

		const sortMap = {
			newest: byNewest,
			oldest: byOldest,
			sender: bySender
		};

		contactForms.sort(sortMap[sortBy] || byNewest);

		res.render('employee/contact-form-submissions', {
			title: 'Contact Submissions',
			contactForms,
			filters: {
				sortBy,
				readStatus: String(req.query.readStatus || ''),
				q: String(req.query.q || '')
			}
		});
	} catch (error) {
		next(error);
	}
};

