const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173";

export default {
  testDir: "tests",
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  use: {
    baseURL,
    viewport: { width: 1280, height: 720 }
  }
};
