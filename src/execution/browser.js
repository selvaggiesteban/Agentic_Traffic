const { chromium } = require('playwright');

class BrowserEngine {
    async init() {
        this.browser = await chromium.launch({ headless: true });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    async navigate(url) {
        await this.page.goto(url);
    }

    async click(selector) {
        await this.page.click(selector);
    }

    async type(selector, text) {
        await this.page.fill(selector, text);
    }

    async getPageState() {
        // Returns a simplified DOM for the LLM to analyze
        return await this.page.content();
    }

    async close() {
        await this.browser.close();
    }
}

module.exports = BrowserEngine;
