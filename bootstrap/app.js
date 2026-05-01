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
const { wantsJson } = require('../utils/httpResponseUtils');

const router = require('../routes/routes.js');

const app = express();
app.disable('x-powered-by');

// View engine
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger(process.env.NODE_ENV === 'development' ? 'dev' : 'tiny'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// Security
//app.use(helmet());
app.use(securityHeaders);

// Custom headers
const xPoweredByHeaders = function (req, res, next) 
{
    let agents = ["PHP 8.1.0","Express","Next.js","ASP.NET","Ruby on Rails","Perl 5.0","Java EE"];
    let agent = agents[ Math.floor(Math.random() * agents.length) ];
    res.setHeader('X-Powered-By',agent);
    next()
}

const serverHeaders = function (req, res, next) 
{
    let agents = ["Microsoft IIS","nginx","Apache (Arch)","Apache Tomcat","Cloudflare","Fastly","CloudFront"];
    let agent = agents[ Math.floor(Math.random() * agents.length) ];
    res.setHeader('Server',agent);
    next()
}

app.use(serverHeaders);
app.use(xPoweredByHeaders);

// Compression (Brotli fallback)
app.use(compression({ level: 9 }));

// Static files with caching
const oneWeek = 7 * 24 * 60 * 60 * 1000;
app.use('/', express.static(path.join(__dirname, '..', 'public')/* , { maxAge: oneWeek } */));
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
    res.status(404).send('Resource not found!');
});

// 500 handler
app.use((err, req, res, next) =>
{
    console.error(err);
    if (wantsJson(req))
    {
        return res.status(err.status || 500).json({
            error: process.env.NODE_ENV === 'development' ? err.message : (err.status ? err.message : 'Internal server error')
        });
    }
    let response = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error!'
    res.status(err.status || 500).send(response);
});

module.exports = app;
