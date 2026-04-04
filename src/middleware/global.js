/** Get a greeting based on the time of day. */
const getCurrentGreeting = () => {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
        return 'Good Morning!';
    }

    if (currentHour < 18) {
        return 'Good Afternoon!';
    }

    return 'Good Evening!';
};


/** Set up shared head assets for templates. */
const setHeadAssetsFunctionality = (res) => {
    res.locals.styles = [];
    res.locals.scripts = [];

    res.addStyle = (css, priority = 0) => {
        res.locals.styles.push({ content: css, priority });
    };

    res.addScript = (js, priority = 0) => {
        res.locals.scripts.push({ content: js, priority });
    };

    res.locals.renderStyles = () => {
        return res.locals.styles
            .sort((a, b) => b.priority - a.priority)
            .map(item => item.content)
            .join('\n');
    };

    res.locals.renderScripts = () => {
        return res.locals.scripts
            .sort((a, b) => b.priority - a.priority)
            .map(item => item.content)
            .join('\n');
    };
};

/** Add shared template locals. */
const addLocalVariables = (req, res, next) => {
    res.locals.currentYear = new Date().getFullYear();

    res.locals.NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

    res.locals.queryParams = { ...req.query };
    res.locals.currentPath = req.path || '/';

    res.locals.greeting = `<p>${getCurrentGreeting()}</p>`;

    const themes = ['blue-theme', 'green-theme', 'red-theme'];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    res.locals.bodyClass = randomTheme;

    res.locals.user = null;
    res.locals.role = null;
    res.locals.isLoggedIn = false;

    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        res.locals.role = req.session.user.roleName || req.session.user.account_type || req.session.user.role || null;
        res.locals.isLoggedIn = true;
    }

    setHeadAssetsFunctionality(res);

    next();
};

export { addLocalVariables };