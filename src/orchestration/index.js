const { Queue, Worker } = require('bullmq');
const BrowserEngine = require('../execution/browser');
const DecisionEngine = require('../decision/agent');
const TransactionLogger = require('../execution/logger');
require('dotenv').config();

const trafficQueue = new Queue('traffic-simulation');
const logger = new TransactionLogger();

async function startAgent(job) {
    const { persona, startUrl } = job.data;
    console.log(`Starting agent for persona: ${persona}`);

    const userProfile = {
        username: `user_${Math.random().toString(36).substring(2, 10)}`,
        email: `test_${Math.random().toString(36).substring(2, 10)}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
    };

    const browser = new BrowserEngine();
    const decision = new DecisionEngine(process.env.ANTHROPIC_API_KEY);

    await browser.init();
    await browser.navigate(startUrl);

    let active = true;
    while (active) {
        const state = await browser.getPageState();
        const action = await decision.decideNextAction(state, persona, userProfile);
        console.log(`Agent [${persona}] with user ${userProfile.username} decided to: ${action}`);

        if (action === 'exit') {
            active = false;
        } else {
            const result = await browser.executeAction(action, userProfile);
            if (result) {
                // Log the DB transaction mirroring the original DB format
                await logger.logTransaction(result.entity, result.id, result.data);
                console.log(`Transaction logged for ${result.entity} ID: ${result.id}`);
            }
        }
    }

    await browser.close();
}

const worker = new Worker('traffic-simulation', async job => {
    await startAgent(job);
});

console.log('Traffic simulation orchestrator running with DB-Mirror Logging...');
