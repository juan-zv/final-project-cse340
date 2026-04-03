import {
	addReview,
	deleteReview,
	getReviewById,
	getReviewsByAccountId,
	updateReview
} from '../../models/reviews/index.js';
import { validationResult } from 'express-validator';

const getSessionUserId = (req) => req.session?.user?.id || req.session?.user?.account_id;
const getSessionRole = (req) => req.session?.user?.roleName || req.session?.user?.account_type || req.session?.user?.role;
const canModerate = (role) => role === 'Employee' || role === 'Admin';

export const buildReviewsList = async (req, res, next) => {
	try {
		const accountId = getSessionUserId(req);
		const reviews = await getReviewsByAccountId(accountId);
		res.render('reviews/reviews', { title: 'Reviews', reviews });
	} catch (error) {
		next(error);
	}
};

export const buildReviewNew = async (req, res, next) => {
	try {
		res.render('reviews/new', {
			title: 'New Review',
			inv_id: req.query.inv_id || ''
		});
	} catch (error) {
		next(error);
	}
};

export const submitReview = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			errors.array().forEach((error) => req.flash('error', error.msg));
			return res.redirect('/reviews/new');
		}

		const accountId = getSessionUserId(req);
		const { inv_id, review_text } = req.body;
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

		const accountId = getSessionUserId(req);
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

		const accountId = getSessionUserId(req);
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

		const accountId = getSessionUserId(req);
		const role = getSessionRole(req);
		if (review.accountId !== accountId && !canModerate(role)) {
			return res.status(403).send('Forbidden: You do not have permission to delete this review.');
		}

		await deleteReview(req.params.reviewId);
		req.flash('success', 'Review deleted successfully.');
		res.redirect('/reviews');
	} catch (error) {
		next(error);
	}
};

