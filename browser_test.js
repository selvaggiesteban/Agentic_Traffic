const { chromium } = require('playwright');
(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    console.log('Navigating to site...');
    try {
        await page.goto('https://somoswanderlust.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('Page title:', await page.title());
        console.log('Browser test successful!');
    } catch (e) {
        console.error('Browser test failed:', e);
    }
    await browser.close();
})();
