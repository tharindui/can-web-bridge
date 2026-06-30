import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/specs',
  workers: 1, // serial execution — tests share the same server's io.emit broadcast
  use: {
    baseURL: 'http://localhost:3000',
  },
  // Expect both servers to already be running:
  //   server/: npm run dev   (port 3001)
  //   client/: npm run dev   (port 3000)
});
