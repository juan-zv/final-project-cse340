import { getAllContactForms } from '../../models/forms/contact.js';
import { getAllVehiclesForAdmin, updateVehicleEmployeeDetails } from '../../models/admin/index.js';

export const buildEmployeeDashboard = async (req, res, next) => {
	try {
		res.render('dashboard', {
			title: 'Employee Dashboard',
			dashboardTitle: 'Employee Dashboard',
			dashboardIntro: 'Manage inventory, moderate content, and update service operations in one place.',
			dashboardSectionTitle: 'Employee Tools',
			dashboardCards: [
				{
					title: 'Vehicle Editing',
					description: 'Open the catalog and edit one vehicle at a time from its detail page.',
					primaryLink: '/catalog',
					primaryLabel: 'Open Catalog',
					secondaryLink: '/dashboard',
					secondaryLabel: 'Back to Shared Dashboard'
				},
				{
					title: 'Review Moderation',
					description: 'Flag or remove inappropriate reviews and keep vehicle pages professional.',
					primaryLink: '/reviews',
					primaryLabel: 'Moderate Reviews'
				},
				{
					title: 'Service Request Queue',
					description: 'Move requests through Open, In Progress, and Completed states with notes.',
					primaryLink: '/services',
					primaryLabel: 'Manage Service Requests'
				},
				{
					title: 'Contact Submissions',
					description: 'Review incoming public messages and follow up quickly.',
					primaryLink: '/employee/contact-form-submissions',
					primaryLabel: 'View Contact Messages'
				}
			]
		});
	} catch (error) {
		next(error);
	}
};

export const buildEmployeeVehicleEditing = async (req, res, next) => {
	try {
		const vehicles = await getAllVehiclesForAdmin();
		res.render('employee/vehicles', {
			title: 'Employee Vehicle Editing',
			vehicles
		});
	} catch (error) {
		next(error);
	}
};

export const updateEmployeeVehicleDetailsAction = async (req, res, next) => {
	try {
		const invId = Number.parseInt(req.params.invId, 10);
		const invDescription = String(req.body.inv_description || '').trim();
		const invPrice = Number.parseFloat(req.body.inv_price || '0');
		const isAvailable = String(req.body.is_available || '').toLowerCase() === 'true';

		if (!Number.isInteger(invId) || invId < 1) {
			req.flash('error', 'Invalid vehicle update request.');
			return res.redirect('/catalog');
		}

		if (!invDescription) {
			req.flash('error', 'Vehicle description is required.');
			return res.redirect('/catalog');
		}

		if (!Number.isFinite(invPrice) || invPrice < 0) {
			req.flash('error', 'Vehicle price must be a valid non-negative number.');
			return res.redirect('/catalog');
		}

		await updateVehicleEmployeeDetails(invId, {
			invDescription,
			invPrice,
			isAvailable
		});

		req.flash('success', 'Vehicle details updated successfully.');
		res.redirect('/catalog');
	} catch (error) {
		req.flash('error', 'Unable to update vehicle details.');
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

