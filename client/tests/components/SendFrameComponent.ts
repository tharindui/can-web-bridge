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

  async getSendButton() {
    return this.sendBtn;
  }

  async getIdError() {
    return this.page.locator('text=Must be hex').textContent();
  }

  async getDataError() {
    return this.page.locator('text=Must be space-separated hex bytes').textContent();
  }
}
