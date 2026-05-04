require('dotenv').config();

const cluster = require('cluster');
const os = require('os');

const PORT = process.env.PORT || 3000;
const WEB_CONCURRENCY = resolveWorkerCount();
let shuttingDown = false;

if (process.env.NODE_ENV === 'production')
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
    startDevelopment();
}

function startWorker()
{
    const app = require('./app');
    const server = app.listen(PORT, () =>
    {
        console.log(`Worker ${process.pid} started - listening on http://localhost:${PORT}`);
    });

    process.on('SIGTERM', () => shutdownWorker(server));
    process.on('SIGINT', () => shutdownWorker(server));
}

function startDevelopment()
{
    const app = require('./app');

    app.listen(PORT, () =>
    {
        console.log(`Development Environment - http://localhost:${PORT}`);
    });
}

function shutdownPrimary()
{
    shuttingDown = true;

    for (const id in cluster.workers)
    {
        cluster.workers[id].kill('SIGTERM');
    }
}

function shutdownWorker(server)
{
    server.close(() => process.exit(0));
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
