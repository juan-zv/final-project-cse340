import {
	createCategory,
	createService,
	createVehicle,
	deleteCategory,
	deleteService,
	deleteContactMessage,
	deleteVehicle,
	getAllAccounts,
	getAllCategories,
	getAllServices,
	getAllVehiclesForAdmin,
	getSystemActivity,
	updateCategory,
	updateVehicle
} from '../../models/admin/index.js';
import { getAllVehicleImages, syncVehicleImages } from '../../models/inventory/index.js';

export const buildAdminDashboard = async (req, res, next) => {
	try {
		res.render('dashboard', {
			title: 'Admin Dashboard',
			dashboardTitle: 'Admin Dashboard',
			dashboardIntro: 'Complete system control overview.',
			dashboardSectionTitle: 'Admin Tools',
			dashboardCards: [
				{
					title: 'Inventory Management',
					description: 'Add, edit, and delete inventory vehicles.',
					primaryLink: '/admin/inventory',
					primaryLabel: 'Manage Inventory',
					secondaryLink: '/catalog',
					secondaryLabel: 'Browse Inventory'
				},
				{
					title: 'Category Management',
					description: 'Add, edit, and delete categories.',
					primaryLink: '/admin/categories',
					primaryLabel: 'Manage Categories',
					secondaryLink: '/admin/dashboard',
					secondaryLabel: 'Back to Shared Dashboard'
				},
				{
					title: 'Service Catalog',
					description: 'Add and delete dealership service offerings.',
					primaryLink: '/admin/services',
					primaryLabel: 'Manage Services',
					secondaryLink: '/services',
					secondaryLabel: 'View Requests'
				},
				{
					title: 'Employee Accounts',
					description: 'Review and manage staff accounts.',
					primaryLink: '/admin/employees',
					primaryLabel: 'Manage Staff Accounts',
					secondaryLink: '/employee/dashboard',
					secondaryLabel: 'Access Employee View'
				},
				{
					title: 'System Activity',
					description: 'View system-wide services, reviews, contacts, and data summaries.',
					primaryLink: '/admin/system',
					primaryLabel: 'All System Data',
					secondaryLink: '/services',
					secondaryLabel: 'Service Activity'
				}
			],
			showDataModelNotes: true
		});
	} catch (error) {
		next(error);
	}
};

export const buildEmployeesList = async (req, res, next) => {
	try {
		const accounts = await getAllAccounts();
		const employees = accounts.filter((account) => account.account_type !== 'User');
		res.render('admin/employees', {
			title: 'Manage Employees',
			employees
		});
	} catch (error) {
		next(error);
	}
};

export const buildCategoriesManagement = async (req, res, next) => {
	try {
		const categories = await getAllCategories();
		res.render('admin/categories', {
			title: 'Manage Categories',
			categories
		});
	} catch (error) {
		next(error);
	}
};

export const createCategoryAction = async (req, res, next) => {
	try {
		const categoryName = String(req.body.category_name || '').trim();
		if (!categoryName) {
			req.flash('error', 'Category name is required.');
			return res.redirect('/admin/categories');
		}

		await createCategory(categoryName);
		req.flash('success', 'Category created successfully.');
		res.redirect('/admin/categories');
	} catch (error) {
		req.flash('error', 'Unable to create category. It may already exist.');
		next(error);
	}
};

export const updateCategoryAction = async (req, res, next) => {
	try {
		const categoryId = Number.parseInt(req.params.categoryId, 10);
		const categoryName = String(req.body.category_name || '').trim();

		if (!Number.isInteger(categoryId) || categoryId < 1 || !categoryName) {
			req.flash('error', 'Invalid category update request.');
			return res.redirect('/admin/categories');
		}

		await updateCategory(categoryId, categoryName);
		req.flash('success', 'Category updated successfully.');
		res.redirect('/admin/categories');
	} catch (error) {
		req.flash('error', 'Unable to update category.');
		next(error);
	}
};

export const deleteCategoryAction = async (req, res, next) => {
	try {
		const categoryId = Number.parseInt(req.params.categoryId, 10);
		if (!Number.isInteger(categoryId) || categoryId < 1) {
			req.flash('error', 'Invalid category delete request.');
			return res.redirect('/admin/categories');
		}

		await deleteCategory(categoryId);
		req.flash('success', 'Category deleted successfully.');
		res.redirect('/admin/categories');
	} catch (error) {
		req.flash('error', 'Unable to delete category.');
		next(error);
	}
};

export const buildServicesManagement = async (req, res, next) => {
	try {
		const services = await getAllServices();
		res.render('admin/services', {
			title: 'Manage Services',
			services
		});
	} catch (error) {
		next(error);
	}
};

export const createServiceAction = async (req, res, next) => {
	try {
		const serviceName = String(req.body.service_name || '').trim();
		const serviceDescription = String(req.body.service_description || '').trim();

		if (!serviceName) {
			req.flash('error', 'Service name is required.');
			return res.redirect('/admin/services');
		}

		await createService(serviceName, serviceDescription);
		req.flash('success', 'Service created successfully.');
		res.redirect('/admin/services');
	} catch (error) {
		req.flash('error', 'Unable to create service. It may already exist.');
		next(error);
	}
};

export const deleteServiceAction = async (req, res, next) => {
	try {
		const serviceId = Number.parseInt(req.params.serviceId, 10);
		if (!Number.isInteger(serviceId) || serviceId < 1) {
			req.flash('error', 'Invalid service delete request.');
			return res.redirect('/admin/services');
		}

		await deleteService(serviceId);
		req.flash('success', 'Service deleted successfully.');
		res.redirect('/admin/services');
	} catch (error) {
		req.flash('error', 'Unable to delete service. It may be in use by service requests.');
		next(error);
	}
};

const mapVehiclePayload = (body) => ({
	invMake: String(body.inv_make || '').trim(),
	invModel: String(body.inv_model || '').trim(),
	invYear: String(body.inv_year || '').trim(),
	invDescription: String(body.inv_description || '').trim(),
	invImage: String(body.inv_image || '').trim(),
	invThumbnail: String(body.inv_thumbnail || '').trim(),
	invPrice: Number.parseFloat(body.inv_price || '0'),
	invMiles: Number.parseInt(body.inv_miles || '0', 10),
	isAvailable: String(body.is_available || '').toLowerCase() === 'true',
	categoryId: Number.parseInt(body.category_id || '0', 10)
});

const parseImagePaths = (value) => String(value || '')
	.split(/\r?\n|,/)
	.map((pathValue) => pathValue.trim())
	.filter(Boolean);

const validateVehiclePayload = (vehicle) => {
	if (!vehicle.invMake || !vehicle.invModel || !vehicle.invYear || !vehicle.invDescription) {
		return 'Make, model, year, and description are required.';
	}
	if (!vehicle.invImage || !vehicle.invThumbnail) {
		return 'Image and thumbnail paths are required.';
	}
	if (!Number.isFinite(vehicle.invPrice) || vehicle.invPrice < 0) {
		return 'Price must be a valid non-negative number.';
	}
	if (!Number.isInteger(vehicle.invMiles) || vehicle.invMiles < 0) {
		return 'Miles must be a valid non-negative whole number.';
	}
	if (!Number.isInteger(vehicle.categoryId) || vehicle.categoryId < 1) {
		return 'A valid category is required.';
	}
	return null;
};

export const buildInventoryManagement = async (req, res, next) => {
	try {
		const [vehicles, categories] = await Promise.all([
			getAllVehiclesForAdmin(),
			getAllCategories()
		]);
		const vehicleImages = await getAllVehicleImages();
		const vehicleImagesById = vehicleImages.reduce((groups, image) => {
			if (!groups[image.invId]) {
				groups[image.invId] = [];
			}
			groups[image.invId].push(image);
			return groups;
		}, {});

		res.render('admin/inventory', {
			title: 'Manage Inventory',
			vehicles,
			categories,
			vehicleImagesById
		});
	} catch (error) {
		next(error);
	}
};

export const createVehicleAction = async (req, res, next) => {
	try {
		const vehicle = mapVehiclePayload(req.body);
		const validationMessage = validateVehiclePayload(vehicle);
		if (validationMessage) {
			req.flash('error', validationMessage);
			return res.redirect('/admin/inventory');
		}
		const imagePaths = parseImagePaths(req.body.vehicle_images);
		const resolvedImagePaths = imagePaths.length > 0 ? imagePaths : [req.body.inv_image, req.body.inv_thumbnail];

		const createdVehicle = await createVehicle({
			...vehicle,
			invImage: resolvedImagePaths[0] || vehicle.invImage,
			invThumbnail: resolvedImagePaths[1] || vehicle.invThumbnail
		});
		if (createdVehicle?.inv_id) {
			await syncVehicleImages(createdVehicle.inv_id, resolvedImagePaths);
		}
		req.flash('success', 'Vehicle created successfully.');
		res.redirect('/admin/inventory');
	} catch (error) {
		req.flash('error', 'Unable to create vehicle.');
		next(error);
	}
};

export const updateVehicleAction = async (req, res, next) => {
	try {
		const invId = Number.parseInt(req.params.invId, 10);
		if (!Number.isInteger(invId) || invId < 1) {
			req.flash('error', 'Invalid vehicle update request.');
			return res.redirect('/admin/inventory');
		}

		const vehicle = mapVehiclePayload(req.body);
		const validationMessage = validateVehiclePayload(vehicle);
		if (validationMessage) {
			req.flash('error', validationMessage);
			return res.redirect('/admin/inventory');
		}
		const imagePaths = parseImagePaths(req.body.vehicle_images);
		const resolvedImagePaths = imagePaths.length > 0 ? imagePaths : [req.body.inv_image, req.body.inv_thumbnail];

		await updateVehicle(invId, {
			...vehicle,
			invImage: resolvedImagePaths[0] || vehicle.invImage,
			invThumbnail: resolvedImagePaths[1] || vehicle.invThumbnail
		});
		await syncVehicleImages(invId, resolvedImagePaths);
		req.flash('success', 'Vehicle updated successfully.');
		res.redirect('/admin/inventory');
	} catch (error) {
		req.flash('error', 'Unable to update vehicle.');
		next(error);
	}
};

export const deleteVehicleAction = async (req, res, next) => {
	try {
		const invId = Number.parseInt(req.params.invId, 10);
		if (!Number.isInteger(invId) || invId < 1) {
			req.flash('error', 'Invalid vehicle delete request.');
			return res.redirect('/admin/inventory');
		}

		await deleteVehicle(invId);
		req.flash('success', 'Vehicle deleted successfully.');
		res.redirect('/admin/inventory');
	} catch (error) {
		req.flash('error', 'Unable to delete vehicle.');
		next(error);
	}
};

export const buildSystemActivity = async (req, res, next) => {
	try {
		const activity = await getSystemActivity();
		res.render('admin/system', {
			title: 'System Activity',
			activity
		});
	} catch (error) {
		next(error);
	}
};

export const deleteContactMessageAction = async (req, res, next) => {
	try {
		const messageId = Number.parseInt(req.params.messageId, 10);
		const returnTo = typeof req.body?.returnTo === 'string' && req.body.returnTo.startsWith('/')
			? req.body.returnTo
			: '/admin/system';
		if (!Number.isInteger(messageId) || messageId < 1) {
			req.flash('error', 'Invalid contact message delete request.');
			return res.redirect(returnTo);
		}

		await deleteContactMessage(messageId);
		req.flash('success', 'Contact message deleted successfully.');
		res.redirect(returnTo);
	} catch (error) {
		req.flash('error', 'Unable to delete contact message.');
		next(error);
	}
};

