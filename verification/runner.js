const { chromium } = require('playwright');
const path = require('path');

async function runTests() {
  console.log('--- Starting verification tests ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const fileUrl = `file://${path.resolve(__dirname, '../index.html')}`;

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await page.goto(fileUrl);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await fn(page);
      console.log(`✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${name}`);
      console.error(err);
      failed++;
    }
  }

  await test('initial UI state is correct', async (p) => {
    const count = await p.locator('#cookie-count').textContent();
    if (count.trim() !== '0') throw new Error(`Expected count 0, got ${count}`);

    const ach10Visible = await p.locator('#achievement-10').isVisible();
    const ach100Visible = await p.locator('#achievement-100').isVisible();
    const ach1000Visible = await p.locator('#achievement-1000').isVisible();
    if (!ach10Visible || !ach100Visible || !ach1000Visible) throw new Error('Achievement cards not visible');

    const ach10Class = await p.locator('#achievement-10').getAttribute('class');
    if (ach10Class.includes('unlocked')) throw new Error('Achievement 10 should not be unlocked initially');
  });

  await test('clicking cookie increments counter and creates floating text', async (p) => {
    await p.locator('#cookie-btn').click();
    let count = await p.locator('#cookie-count').textContent();
    if (count.trim() !== '1') throw new Error(`Expected count 1, got ${count}`);

    const floatText = await p.locator('.floating-text').first().textContent();
    if (floatText.trim() !== '+1') throw new Error(`Expected floating text +1, got ${floatText}`);
  });

  await test('keyboard interactions (Enter and Space) increment counter', async (p) => {
    await p.locator('#cookie-btn').focus();
    await p.keyboard.press('Enter');
    let count = await p.locator('#cookie-count').textContent();
    if (count.trim() !== '1') throw new Error(`Expected 1 after Enter, got ${count}`);

    await p.keyboard.press('Space');
    count = await p.locator('#cookie-count').textContent();
    if (count.trim() !== '2') throw new Error(`Expected 2 after Space, got ${count}`);
  });

  await test('unlocks 10 clics trophy and shows toast', async (p) => {
    for (let i = 0; i < 10; i++) {
      await p.locator('#cookie-btn').click();
    }
    const ach10Class = await p.locator('#achievement-10').getAttribute('class');
    if (!ach10Class.includes('unlocked')) throw new Error('Achievement 10 not unlocked');

    const toastClass = await p.locator('#achievement-toast').getAttribute('class');
    if (!toastClass.includes('show')) throw new Error('Toast not shown');

    const toastTitle = await p.locator('#toast-title').textContent();
    if (!toastTitle.includes('Novato')) throw new Error(`Toast title expected Novato, got ${toastTitle}`);
  });

  await test('unlocks 100 clics trophy and 1000 clics trophy', async (p) => {
    await p.evaluate(() => {
      for (let i = 0; i < 100; i++) document.getElementById('cookie-btn').click();
    });
    let ach100Class = await p.locator('#achievement-100').getAttribute('class');
    if (!ach100Class.includes('unlocked')) throw new Error('Achievement 100 not unlocked');

    let ach1000Class = await p.locator('#achievement-1000').getAttribute('class');
    if (ach1000Class.includes('unlocked')) throw new Error('Achievement 1000 should not be unlocked yet');

    await p.evaluate(() => {
      for (let i = 0; i < 900; i++) document.getElementById('cookie-btn').click();
    });
    ach1000Class = await p.locator('#achievement-1000').getAttribute('class');
    if (!ach1000Class.includes('unlocked')) throw new Error('Achievement 1000 not unlocked');
  });

  await test('state persists in localStorage on page reload', async (p) => {
    for (let i = 0; i < 10; i++) {
      await p.locator('#cookie-btn').click();
    }
    await p.reload();
    const count = await p.locator('#cookie-count').textContent();
    if (count.trim() !== '10') throw new Error(`Expected persisted count 10, got ${count}`);

    const ach10Class = await p.locator('#achievement-10').getAttribute('class');
    if (!ach10Class.includes('unlocked')) throw new Error('Achievement 10 not unlocked after reload');
  });

  await test('reset button resets count and achievements', async (p) => {
    for (let i = 0; i < 15; i++) {
      await p.locator('#cookie-btn').click();
    }
    await p.locator('#reset-btn').click();
    const count = await p.locator('#cookie-count').textContent();
    if (count.trim() !== '0') throw new Error(`Expected reset count 0, got ${count}`);

    const ach10Class = await p.locator('#achievement-10').getAttribute('class');
    if (ach10Class.includes('unlocked')) throw new Error('Achievement 10 still unlocked after reset');
  });

  await browser.close();
  console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
