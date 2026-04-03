export const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login?error=Please log in first');
    }
    next();
};

// Backward-compatible alias used by some controllers
export const requireLogin = requireAuth;

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }
        
        const userRole = req.session.user.roleName || req.session.user.account_type || req.session.user.role;
        if (!roles.includes(userRole)) {
            return res.status(403).send('Forbidden: You do not have permission to access this resource.');
        }
        next();
    };
};

// Aliases
export const requireEmployee = requireRole(['Employee', 'Admin']);
export const requireAdmin = requireRole(['Admin']);
