const { Queue } = require('bullmq');
const BrowserEngine = require('./src/execution/browser');
const WooCommerceDriver = require('./src/decision/woocommerce_driver');
const TransactionLogger = require('./src/execution/logger');

async function run() {
    const userProfile = {
        username: 'smoke_test_user',
        email: 'smoke_test@example.com',
        password: 'TestPassword123!',
        firstName: 'Smoke',
        lastName: 'Test'
    };
    const startUrl = 'https://somoswanderlust.com';
    const persona = 'SmokeTester';

    console.log(`Starting smoke test agent for persona: ${persona}`);
    const browser = new BrowserEngine();
    const decision = new WooCommerceDriver();
    const logger = new TransactionLogger();

    try {
        await browser.init();
        await browser.navigate(startUrl);

        let active = true;
        let stepCount = 0;
        while (active) {
            const state = await browser.getPageState();
            const action = await decision.decideNextAction(state, persona, userProfile, stepCount);
            console.log(`Step ${stepCount}: Action decided -> ${action}`);

            if (action === 'exit') {
                active = false;
            } else {
                const result = await browser.executeAction(action, userProfile);
                if (result) {
                    await logger.logTransaction(result.entity, result.id, result.data);
                    console.log(`Transaction logged for ${result.entity} ID: ${result.id}`);
                }
                stepCount++;
            }
        }
    } catch (e) {
        console.error('Smoke test failed:', e);
    } finally {
        await browser.close();
    }
}

run();
