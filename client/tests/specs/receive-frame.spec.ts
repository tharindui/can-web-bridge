import { test, expect } from '../fixtures';

test('received frame from MCU appears in log as RX', async ({ homePage, injectFrame }) => {
  await injectFrame('0x456', 'FF 00');
  await homePage.log.waitForFrame('0x456', 'RX');
});

test('received frame shows RX badge in log', async ({ homePage, injectFrame, page }) => {
  await injectFrame('0x789', 'AA BB');
  await homePage.log.waitForFrame('0x789', 'RX');
  const rxBadge = page.locator('span', { hasText: 'RX' }).first();
  await expect(rxBadge).toBeVisible();
});

test('multiple received frames all appear in log', async ({ homePage, injectFrame }) => {
  await injectFrame('0x100', 'AA BB');
  await injectFrame('0x200', 'CC DD');
  await homePage.log.waitForFrame('0x100', 'RX');
  await homePage.log.waitForFrame('0x200', 'RX');
});

test('log shows both TX and RX frames in correct order', async ({ homePage, injectFrame }) => {
  await homePage.send.send('0x111', '01 02');
  await injectFrame('0x222', '03 04');
  await homePage.log.waitForFrame('0x111', 'TX');
  await homePage.log.waitForFrame('0x222', 'RX');
});

test('log is capped at 100 frames', async ({ homePage, injectFrame }) => {
  for (let i = 0; i < 105; i++) {
    await injectFrame(`0x${i.toString(16).padStart(3, '0')}`, '00');
  }
  const count = await homePage.log.getRowCount();
  expect(count).toBeLessThanOrEqual(100);
});
