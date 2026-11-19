const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => {
 await page.addInitScript(() => !localStorage.getItem('@fitcheck/wardrobe-v1') && localStorage.setItem('@fitcheck/wardrobe-v1', JSON.stringify({ schemaVersion: 1, mode: 'demo', personalItems: [], recentlyDeleted: [], demoAvailability: {} })));
});
test('editorial homepage, filtering, saving and integrated routes', async ({ page }) => {
 const errors = []; page.on('pageerror', (error) => errors.push(error.message));
 await page.goto('/');
 await expect(page.getByRole('heading', { name: 'Good outfits. Less effort.' })).toBeVisible();
 await page.screenshot({ path: `test-results/homepage-${test.info().project.name}.png`, fullPage: true });
 for (const name of ['Work', 'Date Night', 'Casual', 'Formal', 'Gym', 'Concert', 'Travel', 'Sleepwear']) await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
 await page.getByRole('button', { name: 'Casual', exact: true }).click();
 await expect(page.getByText('Easy pieces with a point of view.')).toBeVisible();
 await page.getByRole('button', { name: 'Save this look' }).first().click();
 await expect(page.getByRole('button', { name: 'Remove saved look' })).toHaveCount(1);
 await page.getByRole('button', { name: /Saved & travel/ }).click();
 await expect(page).toHaveURL(/style-tools/); await expect(page.getByText('Saved looks', { exact: true })).toBeVisible();
 await page.goto('/');
 await page.getByRole('button', { name: 'View pieces & give feedback' }).first().click();
 await page.getByRole('button', { name: 'Try on a piece' }).first().click();
 await expect(page).toHaveURL(/try-on/); await expect(page.getByText('Virtual Try-On', { exact: true })).toBeVisible();
 await page.goto('/analysis'); await expect(page.getByRole('heading', { name: 'Recognition & review.' })).toBeVisible();
 await page.goto('/privacy'); await expect(page.getByText('A little more peace of mind.', { exact: true })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Closet visibility: Private' })).toBeVisible();
 await expect(page.getByText(/Cloud privacy controls are unavailable/)).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('wardrobe, quiz, search and shopping are reachable', async ({ page }) => {
 const errors = []; page.on('pageerror', (error) => errors.push(error.message));
 await page.goto('/'); await page.getByRole('button', { name: 'Wardrobe', exact: true }).click();
 await expect(page).toHaveURL(/wardrobe/); await expect(page.getByText('Wear what you own.', { exact: true })).toBeVisible();
 await page.getByRole('button', { name: 'Personal', exact: true }).click();
 await page.getByRole('button', { name: /Add a piece|Add clothing|Add item|Add your first/i }).first().click();
 await expect(page.getByRole('textbox', { name: 'Item name, required' })).toBeVisible();
 await page.goto('/'); await page.getByRole('button', { name: /10 questions/ }).click();
 await expect(page).toHaveURL(/quiz/);
 await page.goto('/search'); await page.getByRole('textbox', { name: 'Search clothing, occasion or style' }).fill('Work');
 await expect(page.getByRole('button', { name: 'Work', exact: true })).toBeVisible();
 await page.goto('/shopping'); await expect(page.getByRole('heading', { name: 'The finishing touch.' })).toBeVisible();
 expect(errors).toEqual([]);
});

test('wishlist transfers use the same wardrobe store', async ({ page }) => {
 await page.goto('/');
 await expect(page.getByRole('heading', { name: 'Good outfits. Less effort.' })).toBeVisible();
 await page.evaluate(() => {
  const key = '@fitcheck/wardrobe-v1'; const state = JSON.parse(localStorage.getItem(key));
  state.wishlistItems = [{ id: 'wishlist-shirt', name: 'Blue cotton shirt', category: 'top', color: 'Blue', available: true, occasions: [], fit: 'Regular', material: 'Cotton', design: 'Solid', brand: 'Original', createdAt: '2026-01-01T00:00:00.000Z' }];
  localStorage.setItem(key, JSON.stringify(state));
 });
 await page.goto('/collections'); await page.getByText('Wishlist', { exact: true }).click();
 await page.getByRole('button', { name: 'Open Blue cotton shirt', exact: true }).click();
 await page.getByText('Move to Closet', { exact: false }).click();
 await expect.poll(() => page.evaluate(() => {
  const state = JSON.parse(localStorage.getItem('@fitcheck/wardrobe-v1'));
  return state.personalItems.some((item) => item.name === 'Blue cotton shirt' && item.material === 'Cotton') && state.wishlistItems.length === 0;
 })).toBe(true);
 await page.goto('/wardrobe'); await page.getByRole('button', { name: 'Personal', exact: true }).click();
 await expect(page.getByText('Blue cotton shirt', { exact: true })).toBeVisible();
});
test('avatar controls and mobile layout remain usable', async ({ page }) => {
 await page.goto('/avatar');
 await expect(page.getByRole('button', { name: 'Rotate left', exact: true })).toBeVisible();
 await page.getByRole('button', { name: 'Rotate left', exact: true }).click();
 await page.getByRole('button', { name: 'Front view', exact: true }).click();
 await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
});
