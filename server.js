import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Import MVC components
import routes from './src/routes.js';
import { addLocalVariables } from './src/middleware/global.js';

// Database
import { setupDatabase, testConnection } from './src/models/setup.js';
import connectPgSimple from 'connect-pg-simple';
import { pgPool } from './src/models/db.js';

// Utils / Middleware
import { startSessionCleanup } from './src/utils/session-cleanup.js';
import flash from './src/middleware/flash.js';

// Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

const app = express();
const PORT = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET || 'dev_only_fallback_secret';

if (NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET is not set in production. Using fallback secret is not recommended.');
}

if (process.env.RENDER === 'true') {
    app.set('trust proxy', 1);
}

// Initialize PostgreSQL session store
const pgSession = connectPgSimple(session);

// Session Configuration using Database
app.use(session({
    store: new pgSession({
        pool: pgPool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV.includes('dev') !== true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Start automatic session cleanup
startSessionCleanup();

// Setup View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Static files and Body Parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Global Middleware (replaces inline locals setup)
app.use(addLocalVariables);

// Flash message middleware (must come after session and global middleware)
app.use(flash);

// Routes Component from MVC
app.use('/', routes);

// 404 Error Handler
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
    // Prevent infinite loops if response was already sent
    if (res.headersSent || res.finished) {
        return next(err);
    }
    
    // Determine status and template
    const status = err.status || 500;
    const template = status === 404 ? 'errors/404' : 'errors/500';
    
    // Prepare data for the template
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        message: NODE_ENV === 'production' && status === 500 ? 'An error occurred' : err.message,
        error: err.message,
        stack: NODE_ENV === 'production' ? null : err.stack,
        NODE_ENV 
    };

    if (status !== 404) {
        console.error(err.stack);
    }

    try {
        // Assuming templates are at src/views/404.ejs or similar, fallback implemented
        res.status(status).render(template, context);
    } catch (renderErr) {
        if (!res.headersSent) {
            res.status(status).send(`<h1>Error ${status}</h1><p>An error occurred.</p>`);
        }
    }
});

/**
 * Start WebSocket Server in Development Mode; used for live reloading
 */
if (NODE_ENV.includes('dev')) {
    import('ws').then(ws => {
        try {
            const wsPort = parseInt(PORT) + 1;
            const wsServer = new ws.WebSocketServer({ port: wsPort });

            wsServer.on('listening', () => {
                console.log(`WebSocket server is running on port ${wsPort}`);
            });

            wsServer.on('error', (error) => {
                console.error('WebSocket server error:', error);
            });
        } catch (error) {
            console.error('Failed to start WebSocket server:', error);
        }
    }).catch(err => console.error('Failed to import ws:', err));
}

app.listen(PORT, async () => {
    await setupDatabase();
    await testConnection();
    console.log(`Server running at http://localhost:${PORT}`);
});
