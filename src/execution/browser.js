const { chromium } = require('playwright');

class BrowserEngine {
    async init() {
        this.browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'AgenticTraffic/1.0 (Simulation Bot)'
        });
        await this.context.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf}', route => route.abort());
        this.page = await this.context.newPage();
    }

    async navigate(url) {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    async click(selector) {
        await this.page.click(selector, { timeout: 10000 });
    }

    async type(selector, text) {
        await this.page.fill(selector, text, { timeout: 10000 });
    }

    async getPageState() {
        const body = await this.page.innerText('body');
        return body.substring(0, 10000);
    }

    async executeAction(action, profile) {
        const baseUrl = process.env.TARGET_SITE_URL || 'https://your-site.com';
        switch (action) {
            case 'register_account':
                console.log(`[BROWSER] Registering account for ${profile.username}...`);
                await this.navigate(`${baseUrl}/my-account/`);
                try {
                    await this.type('#reg_username', profile.username);
                    await this.type('#reg_email', profile.email);
                    await this.type('#reg_password', profile.password);
                    await this.click('.button'); // Typically the register button
                    await this.page.waitForTimeout(3000);
                    console.log(`[BROWSER] Registration submitted.`);
                    return { entity: 'user', id: profile.username, data: { action: 'registered' } };
                } catch (e) {
                    console.log(`[BROWSER] Registration error: ${e.message}`);
                    throw e;
                }
            case 'login_account':
                console.log(`[BROWSER] Logging in as ${profile.username}...`);
                await this.navigate(`${baseUrl}/my-account/`);
                try {
                    await this.type('#username_or_email', profile.username);
                    await this.type('#pwd', profile.password);
                    await this.click('.button');
                    await this.page.waitForTimeout(3000);
                    return { entity: 'user', id: profile.username, data: { action: 'logged_in' } };
                } catch (e) {
                    console.log(`[BROWSER] Login error: ${e.message}`);
                    throw e;
                }
            case 'search_product':
                await this.navigate(`${baseUrl}/tienda/`);
                await this.page.waitForSelector('.product', { timeout: 10000 }).catch(() => {});
                return { entity: 'search_result', id: 'page', data: { status: 'shop_loaded' } };
            case 'add_to_cart':
                console.log(`[BROWSER] Attempting to add items to cart for ${profile.username}...`);
                try {
                    // Navigate to a specific product page to handle variations
                    await this.navigate(`${baseUrl}/tienda/bolso-con-correas-mochileras/`);
                    await this.page.waitForLoadState('networkidle');

                    // Handle variations if they exist (e.g., color)
                    await this.page.evaluate(() => {
                        const select = document.querySelector('select[name=\"attribute_pa_color\"]');
                        if (select && select.options.length > 1) {
                            select.value = select.options[1].value;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                    await this.page.waitForTimeout(1000);

                    // Click "Add to Cart"
                    const addBtn = this.page.locator('.single_add_to_cart_button').first();
                    if (await addBtn.isVisible()) {
                        await addBtn.click();
                        console.log(`[BROWSER] Clicked add to cart button. Waiting for AJAX...`);
                        await this.page.waitForTimeout(3000);
                        const currentUrl = this.page.url();
                        return { entity: 'cart', id: 'cart_items', data: { action: 'item_added', url: currentUrl } };
                    } else {
                        throw new Error('Add to cart button not found on product page');
                    }
                } catch (e) {
                    console.log(`[BROWSER] Add to cart error: ${e.message}`);
                    throw e;
                }
            case 'proceed_to_checkout':
                await this.navigate(`${baseUrl}/carrito/`);
                const checkoutBtn = await this.page.$('.checkout-button, .button.checkout');
                if (checkoutBtn) {
                    await checkoutBtn.click();
                } else {
                    await this.navigate(`${baseUrl}/finalizar-compra/`);
                }

                try {
                    await this.type('input[name="billing_first_name"]', profile.firstName);
                    await this.type('input[name="billing_last_name"]', profile.lastName);
                    await this.type('input[name="billing_email"]', profile.email);
                    await this.type('input[name="billing_address_1"]', 'Test Street 123');
                    await this.type('input[name="billing_city"]', 'Test City');
                    await this.type('input[name="billing_postcode"]', '12345');
                    await this.type('input[name="billing_country"]', 'AR');
                    await this.click('#place_order');
                } catch (e) {
                    console.log(`[BROWSER] Checkout fill error: ${e.message}`);
                }

                await this.page.waitForURL('**/order-received/**', { timeout: 15000 }).catch(() => {});
                const url = this.page.url();
                const orderId = url.split('/').find(part => !isNaN(parseInt(part)));
                return {
                    entity: 'wp_posts',
                    id: orderId || 'guest_order',
                    data: { post_title: `Guest Order for ${profile.email}`, post_type: 'shop_order', post_status: 'wc-processing' }
                };
            default:
                return null;
        }
    }

    async close() {
        await this.browser.close();
    }
}

module.exports = BrowserEngine;
