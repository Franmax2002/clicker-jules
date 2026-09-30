import { test, expect } from '@playwright/test';
import path from 'path';

const fileUrl = `file://${path.resolve(__dirname, '../index.html')}`;

test.describe('Cookie Clicker Web Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fileUrl);
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('initial UI state is correct', async ({ page }) => {
    await expect(page.locator('#cookie-count')).toHaveText('0');

    // Check achievements section and 3 cards present
    const achievementsSection = page.locator('#achievements-section');
    await expect(achievementsSection).toBeVisible();

    const ach10 = page.locator('#achievement-10');
    const ach100 = page.locator('#achievement-100');
    const ach1000 = page.locator('#achievement-1000');

    await expect(ach10).toBeVisible();
    await expect(ach100).toBeVisible();
    await expect(ach1000).toBeVisible();

    // None should be unlocked initially
    await expect(ach10).not.toHaveClass(/unlocked/);
    await expect(ach100).not.toHaveClass(/unlocked/);
    await expect(ach1000).not.toHaveClass(/unlocked/);
  });

  test('clicking cookie increments counter and creates floating text', async ({ page }) => {
    const cookieBtn = page.locator('#cookie-btn');
    const counter = page.locator('#cookie-count');

    await cookieBtn.click();
    await expect(counter).toHaveText('1');

    await cookieBtn.click();
    await expect(counter).toHaveText('2');

    // Floating text +1 check
    const floatingText = page.locator('.floating-text');
    await expect(floatingText.first()).toHaveText('+1');
  });

  test('keyboard interactions (Enter and Space) increment counter', async ({ page }) => {
    const cookieBtn = page.locator('#cookie-btn');
    const counter = page.locator('#cookie-count');

    await cookieBtn.focus();
    await page.keyboard.press('Enter');
    await expect(counter).toHaveText('1');

    await page.keyboard.press('Space');
    await expect(counter).toHaveText('2');
  });

  test('unlocks 10 clics trophy and shows toast', async ({ page }) => {
    const cookieBtn = page.locator('#cookie-btn');
    const ach10 = page.locator('#achievement-10');
    const toast = page.locator('#achievement-toast');
    const toastTitle = page.locator('#toast-title');

    // Click 9 times
    for (let i = 0; i < 9; i++) {
      await cookieBtn.click();
    }
    await expect(ach10).not.toHaveClass(/unlocked/);

    // 10th click
    await cookieBtn.click();
    await expect(ach10).toHaveClass(/unlocked/);
    await expect(toast).toHaveClass(/show/);
    await expect(toastTitle).toContainText('Novato');
  });

  test('unlocks 100 clics trophy and 1000 clics trophy', async ({ page }) => {
    const ach100 = page.locator('#achievement-100');
    const ach1000 = page.locator('#achievement-1000');

    // Simulate 100 clicks fast via page evaluate or loop
    await page.evaluate(() => {
      for (let i = 0; i < 100; i++) {
        document.getElementById('cookie-btn').click();
      }
    });

    await expect(ach100).toHaveClass(/unlocked/);
    await expect(ach1000).not.toHaveClass(/unlocked/);

    // Simulate reaching 1000 clicks
    await page.evaluate(() => {
      for (let i = 0; i < 900; i++) {
        document.getElementById('cookie-btn').click();
      }
    });

    await expect(ach1000).toHaveClass(/unlocked/);
  });

  test('state persists in localStorage on page reload', async ({ page }) => {
    const cookieBtn = page.locator('#cookie-btn');
    const counter = page.locator('#cookie-count');
    const ach10 = page.locator('#achievement-10');

    // Click 10 times to unlock first achievement
    for (let i = 0; i < 10; i++) {
      await cookieBtn.click();
    }

    await expect(counter).toHaveText('10');
    await expect(ach10).toHaveClass(/unlocked/);

    // Reload page
    await page.reload();

    await expect(counter).toHaveText('10');
    await expect(ach10).toHaveClass(/unlocked/);
  });

  test('reset button resets count and achievements', async ({ page }) => {
    const cookieBtn = page.locator('#cookie-btn');
    const counter = page.locator('#cookie-count');
    const resetBtn = page.locator('#reset-btn');
    const ach10 = page.locator('#achievement-10');

    for (let i = 0; i < 12; i++) {
      await cookieBtn.click();
    }

    await expect(counter).toHaveText('12');
    await expect(ach10).toHaveClass(/unlocked/);

    // Click Reset
    await resetBtn.click();

    await expect(counter).toHaveText('0');
    await expect(ach10).not.toHaveClass(/unlocked/);

    // Check localStorage cleared/reset
    const savedCount = await page.evaluate(() => localStorage.getItem('cookieClickCount'));
    expect(savedCount).toBe('0');
  });
});
