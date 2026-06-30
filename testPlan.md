# E2E Test Plan — CAN-Bus Web App (Playwright)

## Architecture Pattern: Component Object Model (COM) + Playwright Fixtures + Mock MCU Endpoint

### Why COM over raw POM

POM (Page Object Model) is designed for multi-page apps. This app is single-page with discrete components, so **Component Object Model (COM)** is a better fit — same principle as POM but scoped to components instead of pages.

| | POM | COM (used here) |
|---|---|---|
| Scope | Per page | Per component |
| Fit for this app | Overkill (1 page) | Natural — `SendFrame`, `FrameLog` are already isolated React components |
| Reuse | Page-level | Component can be embedded in multiple pages later |
| Selector ownership | Page knows all selectors | Each component owns its own selectors |

---

## The Hard Problem: Simulating the MCU

Playwright drives the browser. Frames normally come from a hardware device (serial/WiFi). Three options to handle this in tests:

| Option | How | Trade-off |
|---|---|---|
| **A. Test injection endpoint** (recommended) | Add `POST /test/inject-frame` to server, active only when `NODE_ENV=test` | Clean, no hardware, true E2E — real browser → socket.io → server → browser |
| B. Mock the socket.io client in browser | Playwright intercepts WebSocket messages | Bypasses the server entirely, not true E2E |
| C. Spin up a real TCP mock MCU in fixture | Node.js script connects as fake device | Requires WiFi adapter to be in place first |

**Option A is used here.** It keeps the full E2E path real (browser ↔ socket.io ↔ server) and only shortcuts the hardware layer.

---

## Directory Structure

```
client/
└── tests/
    ├── fixtures/
    │   └── index.ts              ← custom fixtures (extends Playwright's test)
    ├── components/               ← Component Objects (COM layer)
    │   ├── SendFrameComponent.ts
    │   └── FrameLogComponent.ts
    ├── pages/
    │   └── HomePage.ts           ← thin page object, composes the two components
    └── specs/
        ├── send-frame.spec.ts
        └── receive-frame.spec.ts
```

---

## Component Objects

### `tests/components/SendFrameComponent.ts`
```ts
import { Page, Locator } from '@playwright/test';

export class SendFrameComponent {
  private readonly canIdInput: Locator;
  private readonly dataInput: Locator;
  private readonly sendBtn: Locator;

  constructor(private page: Page) {
    this.canIdInput = page.getByLabel('CAN ID');
    this.dataInput  = page.getByLabel('Data bytes');
    this.sendBtn    = page.getByRole('button', { name: 'Send' });
  }

  async send(id: string, data: string) {
    await this.canIdInput.fill(id);
    await this.dataInput.fill(data);
    await this.sendBtn.click();
  }

  async getIdError() {
    return this.page.locator('text=Must be hex').textContent();
  }
}
```

### `tests/components/FrameLogComponent.ts`
```ts
import { Page, Locator } from '@playwright/test';

export class FrameLogComponent {
  private readonly table: Locator;

  constructor(private page: Page) {
    this.table = page.locator('table');
  }

  async waitForFrame(id: string, dir: 'TX' | 'RX') {
    await this.table
      .locator('tr', { hasText: id })
      .filter({ hasText: dir })
      .waitFor({ timeout: 5000 });
  }

  async getRowCount() {
    return this.table.locator('tbody tr').count();
  }
}
```

---

## Page Object

### `tests/pages/HomePage.ts`
```ts
import { Page } from '@playwright/test';
import { SendFrameComponent } from '../components/SendFrameComponent';
import { FrameLogComponent }  from '../components/FrameLogComponent';

export class HomePage {
  readonly send: SendFrameComponent;
  readonly log:  FrameLogComponent;

  constructor(page: Page) {
    this.send = new SendFrameComponent(page);
    this.log  = new FrameLogComponent(page);
  }

  async goto(page: Page) {
    await page.goto('/');
  }

  async waitForConnected(page: Page) {
    await page.locator('text=Connected').waitFor({ timeout: 5000 });
  }
}
```

---

## Fixtures

### `tests/fixtures/index.ts`
```ts
import { test as base, request } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

type Fixtures = {
  homePage: HomePage;
  injectFrame: (id: string, data: string) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto(page);
    await home.waitForConnected(page);
    await use(home);
  },

  // Simulates the MCU sending a frame to the server
  injectFrame: async ({}, use) => {
    await use(async (id, data) => {
      const ctx = await request.newContext();
      await ctx.post('http://localhost:3001/test/inject-frame', {
        data: { id, data },
      });
      await ctx.dispose();
    });
  },
});

export { expect } from '@playwright/test';
```

---

## Test Specs

### `tests/specs/send-frame.spec.ts`
```ts
import { test, expect } from '../fixtures';

test('sends a valid CAN frame and it appears in the log as TX', async ({ page, homePage }) => {
  await homePage.send.send('0x123', '01 02 03');
  await homePage.log.waitForFrame('0x123', 'TX');
});

test('shows validation error for invalid CAN ID', async ({ page, homePage }) => {
  await homePage.send.send('notHex', '01 02');
  await expect(page.locator('text=Must be hex')).toBeVisible();
});

test('shows validation error for invalid data bytes', async ({ page, homePage }) => {
  await homePage.send.send('0x123', 'ZZ');
  await expect(page.locator('text=Must be space-separated hex bytes')).toBeVisible();
});

test('Send button is disabled when socket is not connected', async ({ page }) => {
  await page.goto('/');
  const sendBtn = page.getByRole('button', { name: 'Send' });
  await expect(sendBtn).toBeDisabled();
});
```

### `tests/specs/receive-frame.spec.ts`
```ts
import { test, expect } from '../fixtures';

test('received frame from MCU appears in log as RX', async ({ homePage, injectFrame }) => {
  await injectFrame('0x456', 'FF 00');
  await homePage.log.waitForFrame('0x456', 'RX');
});

test('multiple received frames all appear in log', async ({ homePage, injectFrame }) => {
  await injectFrame('0x100', 'AA BB');
  await injectFrame('0x200', 'CC DD');
  await homePage.log.waitForFrame('0x100', 'RX');
  await homePage.log.waitForFrame('0x200', 'RX');
});

test('log is capped at 100 frames', async ({ homePage, injectFrame }) => {
  for (let i = 0; i < 105; i++) {
    await injectFrame(`0x${i.toString(16).padStart(3, '0')}`, '00');
  }
  const count = await homePage.log.getRowCount();
  expect(count).toBeLessThanOrEqual(100);
});
```

---

## Server Change Required

Add this to `server/index.js` (guarded so it only runs outside production):

```js
if (process.env.NODE_ENV !== 'production') {
  app.use(express.json());
  app.post('/test/inject-frame', (req, res) => {
    const { id, data } = req.body;
    io.emit('frame-received', { id, data, timestamp: new Date().toISOString() });
    res.json({ ok: true });
  });
}
```

---

## Layer Diagram

```
spec file
  └── uses → Fixtures        (setup/teardown + injectFrame helper)
                └── uses → HomePage         (page-level entry point)
                              ├── SendFrameComponent  (owns send-form selectors + actions)
                              └── FrameLogComponent   (owns table selectors + assertions)
```

Each layer has one job:
- **Specs** — readable intent, no selectors
- **Components** — own their DOM selectors and interactions
- **Pages** — compose components, handle navigation
- **Fixtures** — own environment control (server injection, socket wait)

---

## Setup Commands

```bash
# Install Playwright in the client directory
cd client
npm install --save-dev @playwright/test
npx playwright install chromium

# Run all E2E tests (server must be running on :3001, client on :3000)
npx playwright test

# Run with UI mode
npx playwright test --ui
```

### Recommended `playwright.config.ts`
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/specs',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
    },
  ],
});
```
