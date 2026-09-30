const { Queue, Worker } = require('bullmq');
const path = require('path');
const BrowserEngine = require('../execution/browser');
const TransactionLogger = require('../execution/logger');
require('dotenv').config();

// Conditional imports to avoid loading LLM dependencies in deterministic mode
let DecisionEngine;
let WooCommerceDriver;

if (process.env.USE_DETERMINISTIC_DRIVER === 'true') {
    WooCommerceDriver = require(path.join(__dirname, '../decision/woocommerce_driver'));
} else {
    DecisionEngine = require(path.join(__dirname, '../decision/agent'));
}

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

const trafficQueue = new Queue('traffic-simulation', {
    connection: redisConfig
});
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
    const decision = process.env.USE_DETERMINISTIC_DRIVER === 'true'
        ? new WooCommerceDriver()
        : new DecisionEngine();

    await browser.init();
    await browser.navigate(startUrl);

    let active = true;
    let stepCount = 0;
    while (active) {
        const state = await browser.getPageState();
        const action = await decision.decideNextAction(state, persona, userProfile, stepCount);
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
            stepCount++;
        }
    }

    await browser.close();
}

const worker = new Worker('traffic-simulation', async job => {
    await startAgent(job);
}, {
    connection: redisConfig,
    concurrency: 1
});

console.log('Traffic simulation orchestrator running with DB-Mirror Logging...');
