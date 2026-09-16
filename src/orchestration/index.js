const { Queue, Worker } = require('bullmq');
const BrowserEngine = require('../execution/browser');
const DecisionEngine = require('../decision/agent');
require('dotenv').config();

const trafficQueue = new Queue('traffic-simulation');

async function startAgent(job) {
    const { persona, startUrl } = job.data;
    console.log(`Starting agent for persona: ${persona}`);

    const browser = new BrowserEngine();
    const decision = new DecisionEngine(process.env.ANTHROPIC_API_KEY);

    await browser.init();
    await browser.navigate(startUrl);

    let active = true;
    while (active) {
        const state = await browser.getPageState();
        const action = await decision.decideNextAction(state, persona);
        console.log(`Agent [${persona}] decided to: ${action}`);

        if (action === 'exit') {
            active = false;
        } else {
            // Map action to browser method
            // await browser.executeAction(action);
        }
    }

    await browser.close();
}

const worker = new Worker('traffic-simulation', async job => {
    await startAgent(job);
});

console.log('Traffic simulation orchestrator running...');
