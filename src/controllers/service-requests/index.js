import {
	getAllServiceRequests,
	getServiceRequestById,
	getServiceRequestsByAccount,
	updateServiceRequestStatus
} from '../../models/service-requests/index.js';
import { validationResult } from 'express-validator';

const getSessionUserId = (req) => req.session?.user?.id || req.session?.user?.account_id;
const getSessionRole = (req) => req.session?.user?.roleName || req.session?.user?.account_type || req.session?.user?.role;
const canManageAll = (role) => role === 'Employee' || role === 'Admin';

export const buildServiceRequestsList = async (req, res, next) => {
	try {
		const accountId = getSessionUserId(req);
		const role = getSessionRole(req);

		const serviceRequests = canManageAll(role)
			? await getAllServiceRequests()
			: await getServiceRequestsByAccount(accountId);

		res.render('service-requests/service-requests', {
			title: 'Service Requests',
			serviceRequests
		});
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

		res.render('service-requests/edit', {
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
			return res.redirect(`/service-requests/${req.params.requestId}/edit`);
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
		res.redirect('/service-requests');
	} catch (error) {
		next(error);
	}
};

