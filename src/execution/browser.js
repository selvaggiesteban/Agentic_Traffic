const { chromium } = require('playwright');

class BrowserEngine {
    async init() {
        this.browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Crucial for Docker containers
                '--disable-gpu'
            ]
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'AgenticTraffic/1.0 (Simulation Bot)'
        });

        // Optimization: Block images and CSS to save bandwidth and RAM
        // and focus on DOM processing and PHP Workers
        await this.context.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf}', route => route.abort());

        this.page = await this.context.newPage();
    }

    async navigate(url) {
        // Use 'domcontentloaded' instead of 'networkidle' for faster execution
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    async click(selector) {
        await this.page.click(selector, { timeout: 10000 });
    }

    async type(selector, text) {
        await this.page.fill(selector, text, { timeout: 10000 });
    }

    async getPageState() {
        // Return a cleaned-up version of the DOM to reduce LLM token usage
        const body = await this.page.innerText('body');
        return body.substring(0, 10000); // Limit size for the LLM
    }

    async close() {
        await this.browser.close();
    }
}

module.exports = BrowserEngine;
