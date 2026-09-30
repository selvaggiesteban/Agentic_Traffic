const path = require('path');
const BrowserEngine = require('./src/execution/browser');
const TransactionLogger = require('./src/execution/logger');
require('dotenv').config();

async function runSmokeTest() {
    console.log('Starting Full Flow Smoke Test (Register -> Search -> Add -> Checkout)...');

    const userProfile = {
        username: `smoke_full_${Math.random().toString(36).substring(2, 10)}`,
        email: `smoke_full_${Math.random().toString(36).substring(2, 10)}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Full',
        lastName: 'Flow'
    };

    const browser = new BrowserEngine();
    const logger = new TransactionLogger();

    try {
        await browser.init();

        // Step 0: Register Account
        console.log('Step 0: Registering account...');
        await browser.navigate(`${process.env.TARGET_SITE_URL}/mi-cuenta/`);

        // Check if registration form exists
        const regForm = browser.page.locator('form.register');
        if (await regForm.isVisible()) {
            await browser.type('input[name="username"]', userProfile.username);
            await browser.type('input[name="email"]', userProfile.email);
            await browser.type('input[name="password"]', userProfile.password);
            await browser.click('button[name="register"]');
            console.log('[BROWSER] Registration form submitted.');
            await browser.page.waitForTimeout(5000);
        } else {
            console.log('[BROWSER] Registration form not found, skipping...');
        }

        // Step 1: Search/Navigate to Shop
        console.log('Step 1: Navigating to Shop...');
        await browser.navigate(`${process.env.TARGET_SITE_URL}/tienda/`);
        await logger.logTransaction('search_result', 'page', { status: 'shop_loaded' });

        // Step 2: Add to Cart
        console.log('Step 2: Adding product to cart...');
        const productUrl = 'https://somoswanderlust.com/tienda/bolso-con-correas-mochileras/';
        await browser.navigate(productUrl);
        const addBtn = browser.page.locator('.single_add_to_cart_button').first();
        await addBtn.click();
        await browser.page.waitForTimeout(5000);
        await logger.logTransaction('cart', 'cart_items', { action: 'item_added', url: browser.page.url() });

        // Step 3: Checkout
        console.log('Step 3: Proceeding to Checkout...');
        await browser.navigate(`${process.env.TARGET_SITE_URL}/finalizar-compra/`);

        try {
            await browser.page.waitForSelector('input[name="billing_first_name"]', { timeout: 20000 });
            await browser.type('input[name="billing_first_name"]', userProfile.firstName);
            await browser.type('input[name="billing_last_name"]', userProfile.lastName);
            await browser.type('input[name="billing_email"]', userProfile.email);
            await browser.type('input[name="billing_address_1"]', 'Test Street 123');
            await browser.type('input[name="billing_city"]', 'Test City');
            await browser.type('input[name="billing_postcode"]', '12345');
            await browser.type('input[name="billing_country"]', 'AR');

            const orderBtn = browser.page.locator('#place_order');
            if (await orderBtn.isVisible()) {
                await orderBtn.click();
                console.log('[BROWSER] Clicked Place Order button.');
            }
        } catch (e) {
            console.log(`[BROWSER] Checkout fill error: ${e.message}`);
        }

        await browser.page.waitForURL('**/order-received/**', { timeout: 20000 }).catch(() => {});
        const finalUrl = browser.page.url();
        const orderId = finalUrl.split('/').find(part => !isNaN(parseInt(part)));

        await logger.logTransaction('wp_posts', orderId || 'guest_order', {
            post_title: `Order for ${userProfile.email}`,
            post_type: 'shop_order',
            post_status: 'wc-processing'
        });

        console.log(`Order ID: ${orderId || 'guest_order'}`);

    } catch (e) {
        console.error('Full Flow Smoke Test Error:', e);
    } finally {
        await browser.close();
    }
}

runSmokeTest();
