// Route handlers for static pages
const homePage = (req, res) => {
    if (typeof res.addStyle === 'function') {
        res.addStyle('<link rel="stylesheet" href="/css/home.css">');
    }

    res.render('home', { title: 'Home' });
};

const aboutPage = (req, res) => {
    res.render('about', { title: 'About' });
};

const testErrorPage = (req, res, next) => {
    const err = new Error('This is a test error');
    err.status = 500;
    next(err);
};

export { homePage, aboutPage, testErrorPage };