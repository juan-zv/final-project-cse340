import { createServiceRequest } from '../../models/services/index.js';
import { getAllServiceRequests, getServiceRequestsByAccount } from '../../models/services/index.js';
import { getServiceRequestById, updateServiceRequestStatus } from '../../models/services/index.js';
import { getInventory } from '../../models/inventory/index.js';
import { validationResult } from 'express-validator';

const getSessionUserId = (req) => req.session?.user?.id || req.session?.user?.account_id;
const getSessionRole = (req) => req.session?.user?.roleName || req.session?.user?.account_type || req.session?.user?.role;
const canManageAll = (role) => role === 'Employee' || role === 'Admin';

export const buildServicesList = async (req, res, next) => {
	try {
		const accountId = getSessionUserId(req);
		const role = getSessionRole(req);

		const serviceRequests = canManageAll(role)
			? await getAllServiceRequests()
			: await getServiceRequestsByAccount(accountId);

		res.render('services/services', {
			title: 'Services',
			serviceRequests
		});
	} catch (error) {
		next(error);
	}
};

export const buildServiceRequest = async (req, res, next) => {
	try {
		const invId = String(req.query.inv_id || '');
		const vehicles = await getInventory('', 'newest');
		const vehicleOptions = vehicles.map((vehicle) => ({
			id: String(vehicle.id),
			name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
		}));

		res.render('services/request', {
			title: 'Request Service',
			inv_id: invId,
			vehicleOptions
		});
	} catch (error) {
		next(error);
	}
};

export const submitServiceRequest = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		const { inv_id, service_type, request_notes } = req.body;
		if (!errors.isEmpty()) {
			errors.array().forEach((error) => req.flash('error', error.msg));
			const nextUrl = inv_id ? `/services/request?inv_id=${encodeURIComponent(inv_id)}` : '/services/request';
			return res.redirect(nextUrl);
		}

		const accountId = getSessionUserId(req);
		const numericInvId = inv_id ? Number.parseInt(inv_id, 10) : null;

		await createServiceRequest(
			service_type,
			request_notes,
			accountId,
			Number.isNaN(numericInvId) ? null : numericInvId
		);

		req.flash('success', 'Service request submitted successfully.');
		res.redirect('/services');
	} catch (error) {
		next(error);
	}
};

export const buildServiceRequestEdit = async (req, res, next) => {
	try {
		const request = await getServiceRequestById(req.params.requestId);
		if (Object.keys(request).length === 0) {
			const err = new Error('Service request not found');
			err.status = 404;
			return next(err);
		}

		const accountId = getSessionUserId(req);
		const role = getSessionRole(req);
		if (request.accountId !== accountId && !canManageAll(role)) {
			return res.status(403).send('Forbidden: You do not have permission to access this service request.');
		}

		res.render('services/edit', {
			title: 'Edit Service Request',
			request
		});
	} catch (error) {
		next(error);
	}
};

export const updateServiceRequest = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			errors.array().forEach((error) => req.flash('error', error.msg));
			return res.redirect(`/services/${req.params.requestId}/edit`);
		}

		const request = await getServiceRequestById(req.params.requestId);
		if (Object.keys(request).length === 0) {
			const err = new Error('Service request not found');
			err.status = 404;
			return next(err);
		}

		const accountId = getSessionUserId(req);
		const role = getSessionRole(req);
		if (request.accountId !== accountId && !canManageAll(role)) {
			return res.status(403).send('Forbidden: You do not have permission to update this service request.');
		}

		await updateServiceRequestStatus(
			req.params.requestId,
			req.body.service_status,
			req.body.request_notes
		);

		req.flash('success', 'Service request updated successfully.');
		res.redirect('/services');
	} catch (error) {
		next(error);
	}
};

