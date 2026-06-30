import { Page, Locator } from '@playwright/test';

export class FrameLogComponent {
  private readonly table: Locator;

  constructor(private page: Page) {
    this.table = page.locator('table');
  }

  async waitForFrame(id: string, dir: 'TX' | 'RX', timeout = 5000) {
    await this.table
      .locator('tr', { hasText: id })
      .filter({ hasText: dir })
      .waitFor({ timeout });
  }

  async getRowCount() {
    return this.table.locator('tbody tr').count();
  }

  async isEmpty() {
    return this.page.locator('text=No data').isVisible();
  }
}
