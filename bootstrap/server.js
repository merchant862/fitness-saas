require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const cpus = os.cpus().length;

const app = require('./app');
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') 
{
    if (cluster.isPrimary) 
    {
        console.log(`Primary ${process.pid} is running`);
        console.log(`Forking ${cpus} workers...`);
        for (let i = 0; i < cpus; i++) cluster.fork();

        cluster.on('exit', (worker, code, signal) => 
        {
            console.warn(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);
            setTimeout(() => cluster.fork(), 1000);
        });
    } 
    
    else 
    {
        const server = app.listen(PORT, () => 
        {
            console.log(`Worker ${process.pid} started - listening on http://localhost:${PORT}`);
        });

        process.on('SIGTERM', () => server.close(() => process.exit(0)));
        process.on('SIGINT', () => server.close(() => process.exit(0)));
    }
} 

else 
{
    app.listen(PORT, () => 
    {
        console.log(`Development Environment - http://localhost:${PORT}`);
    });
}
