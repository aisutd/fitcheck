const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
 testDir: './tests', timeout: 45000, fullyParallel: false,
 use: { baseURL: 'http://127.0.0.1:8081', launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}, screenshot: 'only-on-failure' },
 projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
 webServer: { command: 'node scripts/serve-web.cjs', url: 'http://127.0.0.1:8081', reuseExistingServer: !process.env.CI },
});
