require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
//const helmet = require('helmet');
const compression = require('compression');
const { attachUser } = require('../middleware/auth');
const { apiLimiter, securityHeaders } = require('../middleware/security');
const { ADMIN_API_BASE_PATH, ADMIN_BASE_PATH } = require('../utils/adminPaths');
const { wantsJson } = require('../utils/httpResponseUtils');

const router = require('../routes/routes.js');

const app = express();
app.disable('x-powered-by');
app.set('etag', false);

// View engine
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger(process.env.NODE_ENV === 'development' ? 'dev' : 'tiny'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.locals.adminBasePath = ADMIN_BASE_PATH;
app.locals.adminApiPath = ADMIN_API_BASE_PATH;

// Security
//app.use(helmet());
app.use(securityHeaders);

// Custom headers
const fingerprintHeaders = function (req, res, next)
{
    const serverValues = ['edge', 'gateway', 'origin', 'cdn', 'proxy'];
    const serverValue = serverValues[Math.floor(Math.random() * serverValues.length)];

    res.removeHeader('X-Powered-By');
    res.setHeader('Server', serverValue);
    next();
};

app.use(fingerprintHeaders);

app.use((req, res, next) =>
{
    res.redirect = function (statusOrUrl, maybeUrl)
    {
        const statusCode = typeof statusOrUrl === 'number' ? statusOrUrl : 302;
        const location = typeof statusOrUrl === 'number' ? maybeUrl : statusOrUrl;

        res.statusCode = statusCode;
        res.setHeader('Location', String(location || '/'));
        res.setHeader('Content-Length', '0');
        return res.end();
    };

    next();
});

app.use((req, res, next) =>
{
    res.locals.adminBasePath = ADMIN_BASE_PATH;
    res.locals.adminApiPath = ADMIN_API_BASE_PATH;
    next();
});

// Compression (Brotli fallback)
app.use(compression({ level: 9 }));

// Static files with caching
const oneWeek = 7 * 24 * 60 * 60 * 1000;
app.use('/', express.static(path.join(__dirname, '..', 'public'), {
    etag: false,
    lastModified: false
    /* maxAge: oneWeek */
}));
// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
    origin: function(origin, callback)
    {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin))
        {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use('/api', apiLimiter);
app.use(attachUser);

// Routes
app.use('/', router);

// 404 handler
app.use((req, res, next) =>
{
    if (wantsJson(req))
    {
        return res.status(404).json({ error: 'Not found' });
    }

    return res.status(404).type('text/plain').send('Not found');
});

// 500 handler
app.use((err, req, res, next) =>
{
    console.error(err);
    const statusCode = err.status || err.statusCode || (err.type === 'entity.parse.failed' ? 400 : 500);
    const publicMessage = err.type === 'entity.parse.failed' || err.type === 'entity.too.large'
        ? 'Invalid request body'
        : (statusCode < 500 ? err.message : 'Internal server error');

    if (wantsJson(req))
    {
        return res.status(statusCode).json({
            error: process.env.NODE_ENV === 'development' && !err.type ? err.message : publicMessage
        });
    }

    const response = process.env.NODE_ENV === 'development' && !err.type ? err.message : publicMessage;
    return res.status(statusCode).type('text/plain').send(response);
});

module.exports = app;
