import { test, expect } from '../fixtures';

test('sends a valid CAN frame and it appears in the log as TX', async ({ homePage }) => {
  await homePage.send.send('0x123', '01 02 03');
  await homePage.log.waitForFrame('0x123', 'TX');
});

test('shows validation error for invalid CAN ID', async ({ homePage, page }) => {
  await homePage.send.send('notHex', '01 02');
  await expect(page.locator('text=Must be hex')).toBeVisible();
});

test('shows validation error for invalid data bytes', async ({ homePage, page }) => {
  await homePage.send.send('0x123', 'ZZ');
  await expect(page.locator('text=Must be space-separated hex bytes')).toBeVisible();
});

test('Send button is disabled before socket connects', async ({ page }) => {
  await page.goto('/');
  const sendBtn = page.getByRole('button', { name: 'Send' });
  // Button starts disabled; the fixture waits for connection — test the raw page here
  await expect(sendBtn).toBeDisabled();
});

test('sent frame shows TX badge in log', async ({ homePage, page }) => {
  await homePage.send.send('0xABC', 'DE AD');
  await homePage.log.waitForFrame('0xABC', 'TX');
  const txBadge = page.locator('span', { hasText: 'TX' }).first();
  await expect(txBadge).toBeVisible();
});
