import {
	addReview,
	deleteReview,
	getAllReviews,
	getReviewById,
	getReviewsByAccountId,
	updateReview
} from '../../models/reviews/index.js';
import db from '../../models/db.js';
import { getInventory } from '../../models/inventory/index.js';
import { validationResult } from 'express-validator';

const getSessionUserId = (req) => req.session?.user?.id ?? req.session?.user?.account_id ?? null;
const getSessionRole = (req) => req.session?.user?.roleName || req.session?.user?.account_type || req.session?.user?.role;
const canModerate = (role) => role === 'Employee' || role === 'Admin';

const requireSessionAccountId = (req) => {
	const accountId = Number(getSessionUserId(req));
	return Number.isInteger(accountId) ? accountId : null;
};

const resolveSessionAccountId = async (req) => {
	const sessionAccountId = requireSessionAccountId(req);
	if (sessionAccountId) {
		const idCheck = await db.query('SELECT account_id FROM accounts WHERE account_id = $1 LIMIT 1', [sessionAccountId]);
		if (idCheck.rows[0]) {
			return idCheck.rows[0].account_id;
		}
	}

	const email = req.session?.user?.email;
	if (typeof email === 'string' && email.trim()) {
		const emailCheck = await db.query(
			'SELECT account_id FROM accounts WHERE LOWER(account_email) = LOWER($1) LIMIT 1',
			[email.trim()]
		);

		if (emailCheck.rows[0]) {
			const resolvedId = emailCheck.rows[0].account_id;
			req.session.user.id = resolvedId;
			req.session.user.account_id = resolvedId;
			return resolvedId;
		}
	}

	return null;
};

export const buildReviewsList = async (req, res, next) => {
	try {
		const accountId = requireSessionAccountId(req);
		if (!accountId) {
			return res.redirect('/login');
		}

		const role = getSessionRole(req);
		const isModerator = canModerate(role);
		const sortBy = String(req.query.sortBy || 'newest').toLowerCase();
		const vehicle = String(req.query.vehicle || '').trim().toLowerCase();
		const reviewer = String(req.query.reviewer || '').trim().toLowerCase();
		const keyword = String(req.query.q || '').trim().toLowerCase();

		let reviews = isModerator
			? await getAllReviews()
			: await getReviewsByAccountId(accountId);

		reviews = reviews.filter((item) => {
			const vehicleName = [item.invYear, item.invMake, item.invModel].filter(Boolean).join(' ').toLowerCase();
			const reviewerName = [item.accountFirstName, item.accountLastName].filter(Boolean).join(' ').toLowerCase();
			const text = String(item.reviewText || '').toLowerCase();

			if (vehicle && !vehicleName.includes(vehicle)) {
				return false;
			}
			if (isModerator && reviewer && !reviewerName.includes(reviewer)) {
				return false;
			}
			if (keyword && !text.includes(keyword) && !vehicleName.includes(keyword) && !reviewerName.includes(keyword)) {
				return false;
			}
			return true;
		});

		const byNewest = (a, b) => new Date(b.reviewDate || b.createdAt || 0) - new Date(a.reviewDate || a.createdAt || 0);
		const byOldest = (a, b) => new Date(a.reviewDate || a.createdAt || 0) - new Date(b.reviewDate || b.createdAt || 0);
		const byVehicle = (a, b) => String(a.vehicleName || '').localeCompare(String(b.vehicleName || ''));
		const byReviewer = (a, b) => String(`${a.accountFirstName || ''} ${a.accountLastName || ''}`).localeCompare(String(`${b.accountFirstName || ''} ${b.accountLastName || ''}`));

		const sortMap = {
			newest: byNewest,
			oldest: byOldest,
			vehicle: byVehicle,
			reviewer: byReviewer
		};

		reviews.sort(sortMap[sortBy] || byNewest);

		res.render('reviews/reviews', {
			title: 'Reviews',
			reviews,
			filters: {
				sortBy,
				vehicle: String(req.query.vehicle || ''),
				reviewer: String(req.query.reviewer || ''),
				q: String(req.query.q || '')
			},
			isModeratorView: isModerator
		});
	} catch (error) {
		next(error);
	}
};

export const buildReviewNew = async (req, res, next) => {
	try {
		const invId = String(req.query.inv_id || '');
		const vehicles = await getInventory('', 'newest');
		const vehicleOptions = vehicles.map((vehicle) => ({
			id: String(vehicle.id),
			name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
		}));

		res.render('reviews/new', {
			title: 'New Review',
			inv_id: invId,
			vehicleOptions
		});
	} catch (error) {
		next(error);
	}
};

export const submitReview = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		const { inv_id, review_text } = req.body;
		if (!errors.isEmpty()) {
			errors.array().forEach((error) => req.flash('error', error.msg));
			const nextUrl = inv_id ? `/reviews/new?inv_id=${encodeURIComponent(inv_id)}` : '/reviews/new';
			return res.redirect(nextUrl);
		}

		const accountId = await resolveSessionAccountId(req);
		if (!accountId) {
			req.flash('error', 'Your session account could not be resolved. Please log in again.');
			return res.redirect('/login');
		}
		await addReview(review_text, inv_id, accountId);
		req.flash('success', 'Review submitted successfully.');
		res.redirect('/reviews');
	} catch (error) {
		next(error);
	}
};

export const buildReviewEdit = async (req, res, next) => {
	try {
		const review = await getReviewById(req.params.reviewId);
		if (Object.keys(review).length === 0) {
			const err = new Error('Review not found');
			err.status = 404;
			return next(err);
		}

		const accountId = await resolveSessionAccountId(req);
		if (!accountId) {
			req.flash('error', 'Your session account could not be resolved. Please log in again.');
			return res.redirect('/login');
		}
		const role = getSessionRole(req);
		if (review.accountId !== accountId && !canModerate(role)) {
			return res.status(403).send('Forbidden: You do not have permission to edit this review.');
		}

		res.render('reviews/edit', { title: 'Edit Review', review });
	} catch (error) {
		next(error);
	}
};

export const updateReviewById = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			errors.array().forEach((error) => req.flash('error', error.msg));
			return res.redirect(`/reviews/${req.params.reviewId}/edit`);
		}

		const review = await getReviewById(req.params.reviewId);
		if (Object.keys(review).length === 0) {
			const err = new Error('Review not found');
			err.status = 404;
			return next(err);
		}

		const accountId = await resolveSessionAccountId(req);
		if (!accountId) {
			req.flash('error', 'Your session account could not be resolved. Please log in again.');
			return res.redirect('/login');
		}
		const role = getSessionRole(req);
		if (review.accountId !== accountId && !canModerate(role)) {
			return res.status(403).send('Forbidden: You do not have permission to edit this review.');
		}

		await updateReview(req.params.reviewId, req.body.review_text);
		req.flash('success', 'Review updated successfully.');
		res.redirect('/reviews');
	} catch (error) {
		next(error);
	}
};

export const deleteReviewById = async (req, res, next) => {
	try {
		const review = await getReviewById(req.params.reviewId);
		if (Object.keys(review).length === 0) {
			const err = new Error('Review not found');
			err.status = 404;
			return next(err);
		}

		const accountId = await resolveSessionAccountId(req);
		if (!accountId) {
			req.flash('error', 'Your session account could not be resolved. Please log in again.');
			return res.redirect('/login');
		}
		const role = getSessionRole(req);
		if (review.accountId !== accountId && !canModerate(role)) {
			return res.status(403).send('Forbidden: You do not have permission to delete this review.');
		}

		await deleteReview(req.params.reviewId);
		req.flash('success', 'Review deleted successfully.');
		const returnTo = typeof req.body?.returnTo === 'string' && req.body.returnTo.startsWith('/')
			? req.body.returnTo
			: '/reviews';
		res.redirect(returnTo);
	} catch (error) {
		next(error);
	}
};

