/** Flash message middleware. */

/** Initialize flash message storage and access methods. */
const flashMiddleware = (req, res, next) => {
    let sessionNeedsSave = false;

    const originalRedirect = res.redirect.bind(res);
    res.redirect = (...args) => {
        if (sessionNeedsSave && req.session) {
            req.session.save(() => {
                originalRedirect.apply(res, args);
            });
        } else {
            originalRedirect.apply(res, args);
        }
    };

    req.flash = function(type, message) {
        if (!req.session) {
            if (type && message) {
                return;
            }
            return { success: [], error: [], warning: [], info: [] };
        }

        if (!req.session.flash) {
            req.session.flash = {
                success: [],
                error: [],
                warning: [],
                info: []
            };
        }

        if (type && message) {
            if (!req.session.flash[type]) {
                req.session.flash[type] = [];
            }
            req.session.flash[type].push(message);
            sessionNeedsSave = true;
            return;
        }

        if (type && !message) {
            const messages = req.session.flash[type] || [];
            req.session.flash[type] = [];
            return messages;
        }

        const allMessages = req.session.flash || {
            success: [],
            error: [],
            warning: [],
            info: []
        };

        req.session.flash = {
            success: [],
            error: [],
            warning: [],
            info: []
        };

        return allMessages;
    };

    next();
};

/** Make flash available to templates. */
const flashLocals = (req, res, next) => {
    res.locals.flash = req.flash;
    next();
};

/** Combined flash middleware. */
const flash = (req, res, next) => {
    flashMiddleware(req, res, () => {
        flashLocals(req, res, next);
    });
};

export default flash;