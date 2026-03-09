export const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login?error=Please log in first');
    }
    next();
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        
        const userRole = req.session.role;
        if (!roles.includes(userRole)) {
            return res.status(403).send('Forbidden: You do not have permission to access this resource.');
        }
        next();
    };
};

// Aliases
export const requireEmployee = requireRole(['Employee', 'Admin']);
export const requireAdmin = requireRole(['Admin']);
