import { test as base, request as playwrightRequest } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

type Fixtures = {
  homePage: HomePage;
  injectFrame: (id: string, data: string) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, provide) => {
    const home = new HomePage(page);
    await home.goto();
    await home.waitForConnected();
    // Brief pause so the server registers this socket before the test injects frames
    await page.waitForTimeout(200);
    await provide(home);
  },

  injectFrame: async ({}, provide) => {
    await provide(async (id: string, data: string) => {
      const ctx = await playwrightRequest.newContext();
      await ctx.post('http://localhost:3001/test/inject-frame', {
        data: { id, data },
      });
      await ctx.dispose();
    });
  },
});

export { expect } from '@playwright/test';
