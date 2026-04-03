export const buildUserDashboard = async (req, res, next) => {
	try {
		res.render('dashboard', {
			title: 'User Dashboard',
			dashboardTitle: 'User Dashboard',
			dashboardIntro: `Welcome ${req.session?.user?.name || 'Driver'}. Manage your reviews and service requests here.`,
			dashboardSectionTitle: 'User Tools',
			dashboardCards: [
				{
					title: 'Review Tools',
					description: 'Leave reviews on vehicles you have driven and manage your own posts.',
					primaryLink: '/reviews/new',
					primaryLabel: 'Write a Review',
					secondaryLink: '/reviews',
					secondaryLabel: 'View My Reviews'
				},
				{
					title: 'Service Request Tools',
					description: 'Submit new requests and track each status update.',
					primaryLink: '/services',
					primaryLabel: 'Open Service Center',
					secondaryLink: '/services/request',
					secondaryLabel: 'Submit Service Request'
				}
			]
		});
	} catch (error) {
		next(error);
	}
};

