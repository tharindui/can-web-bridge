import { Page } from '@playwright/test';
import { SendFrameComponent } from '../components/SendFrameComponent';
import { FrameLogComponent }  from '../components/FrameLogComponent';

export class HomePage {
  readonly send: SendFrameComponent;
  readonly log:  FrameLogComponent;

  constructor(private page: Page) {
    this.send = new SendFrameComponent(page);
    this.log  = new FrameLogComponent(page);
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForConnected() {
    await this.page.locator('text=Connected').waitFor({ timeout: 5000 });
  }

  async isConnected() {
    return this.page.locator('text=Connected').isVisible();
  }
}
