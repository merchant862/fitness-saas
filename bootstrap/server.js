require('dotenv').config();

const cluster = require('cluster');
const os = require('os');

const PORT = process.env.PORT || 3000;
const WEB_CONCURRENCY = resolveWorkerCount();
const ENABLE_NODE_CLUSTER = shouldUseInternalCluster();
let shuttingDown = false;

if (process.env.NODE_ENV === 'production' && ENABLE_NODE_CLUSTER)
{
    if (cluster.isPrimary)
    {
        console.log(`Primary ${process.pid} is running`);
        console.log(`Forking ${WEB_CONCURRENCY} workers...`);

        for (let i = 0; i < WEB_CONCURRENCY; i += 1)
        {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) =>
        {
            console.warn(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);

            if (!shuttingDown)
            {
                setTimeout(() => cluster.fork(), 1000);
            }
        });

        process.on('SIGTERM', shutdownPrimary);
        process.on('SIGINT', shutdownPrimary);
    } 
    else 
    {
        startWorker();
    }
} 
else 
{
    startSingleProcess();
}

function startWorker()
{
    const app = require('./app');
    const server = app.listen(PORT, () =>
    {
        console.log(`Worker ${process.pid} started - listening on http://localhost:${PORT}`);
    });

    configureServerTimeouts(server);
    process.on('SIGTERM', () => shutdownWorker(server));
    process.on('SIGINT', () => shutdownWorker(server));
}

function startSingleProcess()
{
    const app = require('./app');

    const server = app.listen(PORT, () =>
    {
        const mode = process.env.NODE_ENV === 'production' ? 'Production' : 'Development';
        console.log(`${mode} server ${process.pid} listening on http://localhost:${PORT}`);
    });

    configureServerTimeouts(server);
    process.on('SIGTERM', () => shutdownWorker(server));
    process.on('SIGINT', () => shutdownWorker(server));
}

function shutdownPrimary()
{
    shuttingDown = true;

    for (const id in cluster.workers)
    {
        cluster.workers[id].kill('SIGTERM');
    }

    setTimeout(() => process.exit(0), Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000)).unref();
}

function shutdownWorker(server)
{
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000)).unref();
}

function resolveWorkerCount()
{
    const requestedWorkers = Number(process.env.WEB_CONCURRENCY);

    if (Number.isInteger(requestedWorkers) && requestedWorkers > 0)
    {
        return requestedWorkers;
    }

    return os.availableParallelism?.() || os.cpus().length || 1;
}

function shouldUseInternalCluster()
{
    const setting = String(process.env.ENABLE_NODE_CLUSTER || 'auto').toLowerCase();

    if (setting === 'false' || setting === '0' || setting === 'off')
    {
        return false;
    }

    if (setting === 'true' || setting === '1' || setting === 'on')
    {
        return true;
    }

    if (process.env.NODE_APP_INSTANCE !== undefined || process.env.pm_id !== undefined)
    {
        return false;
    }

    return true;
}

function configureServerTimeouts(server)
{
    server.keepAliveTimeout = Number(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS || 65000);
    server.headersTimeout = Number(process.env.HTTP_HEADERS_TIMEOUT_MS || 66000);
    server.requestTimeout = Number(process.env.HTTP_REQUEST_TIMEOUT_MS || 120000);
}
