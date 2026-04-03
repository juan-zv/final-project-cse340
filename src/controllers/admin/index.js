import {
	createCategory,
	createVehicle,
	deleteCategory,
	deleteVehicle,
	getAllAccounts,
	getAllCategories,
	getAllVehiclesForAdmin,
	getSystemActivity,
	updateCategory,
	updateVehicle
} from '../../models/admin/index.js';

export const buildAdminDashboard = async (req, res, next) => {
	try {
		res.render('admin/dashboard', { title: 'Admin Dashboard' });
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

		res.render('admin/inventory', {
			title: 'Manage Inventory',
			vehicles,
			categories
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

		await createVehicle(vehicle);
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

		await updateVehicle(invId, vehicle);
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

