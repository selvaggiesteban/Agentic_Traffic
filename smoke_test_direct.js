const path = require('path');
const BrowserEngine = require('./src/execution/browser');
const TransactionLogger = require('./src/execution/logger');
const WooCommerceDriver = require('./src/decision/woocommerce_driver');
require('dotenv').config();

async function runSmokeTest() {
    console.log('Starting Direct Smoke Test (Deterministic Mode)...');

    const persona = 'Guest Buyer';
    const startUrl = 'https://somoswanderlust.com';

    const userProfile = {
        username: `smoke_${Math.random().toString(36).substring(2, 10)}`,
        email: `smoke_test_${Math.random().toString(36).substring(2, 10)}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Smoke',
        lastName: 'Test'
    };

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
            console.log(`Step ${stepCount}: Decided to ${action}`);

            if (action === 'exit') {
                active = false;
            } else {
                const result = await browser.executeAction(action, userProfile);
                if (result) {
                    await logger.logTransaction(result.entity, result.id, result.data);
                    console.log(`Transaction logged: ${result.entity} ID: ${result.id}`);
                }
                stepCount++;
            }
        }
    } catch (e) {
        console.error('Smoke Test Error:', e);
    } finally {
        await browser.close();
    }
}

runSmokeTest();
