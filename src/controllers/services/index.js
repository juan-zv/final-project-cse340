import { createServiceRequest } from '../../models/services/index.js';
import { getAllServiceRequests, getServiceRequestsByAccount } from '../../models/services/index.js';
import { getServiceRequestById, updateServiceRequestStatus } from '../../models/services/index.js';
import { getInventory } from '../../models/inventory/index.js';
import { validationResult } from 'express-validator';

const getSessionUserId = (req) => req.session?.user?.id || req.session?.user?.account_id;
const getSessionRole = (req) => req.session?.user?.roleName || req.session?.user?.account_type || req.session?.user?.role;
const canManageAll = (role) => role === 'Employee' || role === 'Admin';
const toDisplayStatus = (status) => (status === 'Submitted' ? 'Open' : status);
const toDbStatus = (status) => (String(status || '').toLowerCase() === 'open' ? 'Submitted' : status);

export const buildServicesList = async (req, res, next) => {
	try {
		const accountId = getSessionUserId(req);
		const role = getSessionRole(req);
		const isManagerView = canManageAll(role);
		const sortBy = String(req.query.sortBy || 'newest').toLowerCase();
		const status = String(req.query.status || '').trim().toLowerCase();
		const serviceType = String(req.query.serviceType || '').trim().toLowerCase();
		const keyword = String(req.query.q || '').trim().toLowerCase();

		const serviceRequests = canManageAll(role)
			? await getAllServiceRequests()
			: await getServiceRequestsByAccount(accountId);

		const filteredRequests = serviceRequests
			.map((request) => ({
				...request,
				displayStatus: toDisplayStatus(request.serviceStatus)
			}))
			.filter((request) => {
				const normalizedStatus = String(request.displayStatus || '').toLowerCase();
				const normalizedType = String(request.serviceType || '').toLowerCase();
				const vehicleName = [request.invYear, request.invMake, request.invModel].filter(Boolean).join(' ').toLowerCase();
				const notes = String(request.requestNotes || '').toLowerCase();
				const requester = `${request.accountFirstName || ''} ${request.accountLastName || ''}`.trim().toLowerCase();

				if (status && normalizedStatus !== status) {
					return false;
				}
				if (serviceType && !normalizedType.includes(serviceType)) {
					return false;
				}
				if (keyword && !notes.includes(keyword) && !vehicleName.includes(keyword) && !requester.includes(keyword)) {
					return false;
				}
				return true;
			});

		const byNewest = (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
		const byOldest = (a, b) => new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
		const byStatus = (a, b) => String(a.displayStatus || '').localeCompare(String(b.displayStatus || ''));
		const byType = (a, b) => String(a.serviceType || '').localeCompare(String(b.serviceType || ''));

		const sortMap = {
			newest: byNewest,
			oldest: byOldest,
			status: byStatus,
			type: byType
		};

		filteredRequests.sort(sortMap[sortBy] || byNewest);

		res.render('services/services', {
			title: 'Services',
			serviceRequests: filteredRequests,
			filters: {
				sortBy,
				status: String(req.query.status || ''),
				serviceType: String(req.query.serviceType || ''),
				q: String(req.query.q || '')
			},
			isManagerView
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

		const requestWithDisplayStatus = {
			...request,
			displayStatus: toDisplayStatus(request.serviceStatus)
		};

		res.render('services/edit', {
			title: 'Edit Service Request',
			request: requestWithDisplayStatus
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
			toDbStatus(req.body.service_status),
			req.body.request_notes
		);

		req.flash('success', 'Service request updated successfully.');
		res.redirect('/services');
	} catch (error) {
		next(error);
	}
};

