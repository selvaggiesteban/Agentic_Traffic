const { Queue } = require('bullmq');

async function pushJobs() {
    const trafficQueue = new Queue('traffic-simulation', {
        connection: {
            host: process.env.REDIS_HOST || 'redis',
            port: 6379
        }
    });

    const personas = ['Comprador Decidido', 'Comparador', 'Usuario Indeciso'];
    
    for (const persona of personas) {
        await trafficQueue.add('smoke-test', {
            persona: persona,
            startUrl: 'https://somoswanderlust.com'
        });
        console.log(`Added job for persona: ${persona}`);
    }
    
    process.exit(0);
}

pushJobs().catch(console.error);
