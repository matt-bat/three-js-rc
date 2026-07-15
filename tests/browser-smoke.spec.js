import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";

test("renders Three.js scene and exposes core controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "RC World" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Camera" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Auto Follow" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Weather" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Graphics" })).toBeVisible();
  await expect(page.locator("#xrValue")).toContainText(/VR/);
  await expect(page.locator("#xrButtonSlot")).toBeVisible();
  await expect(page.locator("#transmitterValue")).toContainText(/HID/);

  await page.waitForTimeout(250);
  const screenshot = await page.locator("#game").screenshot();
  const png = PNG.sync.read(screenshot);
  let brightPixels = 0;
  let darkPixels = 0;
  const colorBuckets = new Set();
  for (let index = 0; index < png.data.length; index += 4) {
    const luminance = png.data[index] + png.data[index + 1] + png.data[index + 2];
    if (luminance > 420) brightPixels += 1;
    if (luminance < 120) darkPixels += 1;
    colorBuckets.add(`${png.data[index] >> 4}-${png.data[index + 1] >> 4}-${png.data[index + 2] >> 4}`);
  }

  await expect(page.locator("#game")).toHaveJSProperty("tagName", "CANVAS");
  expect({
    brightPixels,
    darkPixels
  }).toEqual({
    brightPixels: expect.any(Number),
    darkPixels: expect.any(Number)
  });
  expect(brightPixels).toBeGreaterThan(500);
  expect(darkPixels).toBeGreaterThan(100);
  expect(colorBuckets.size).toBeGreaterThan(12);
});

test("shows mobile touch driving controls on narrow viewports", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#touchControls")).toBeVisible();
  await expect(page.locator("#steerPad")).toBeVisible();
  await expect(page.locator("#drivePad")).toBeVisible();
});

test("mode and weather controls update session state", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Mode" }).click();
  await expect(page.locator("#modeLabel")).toHaveText("Rock Crawl");
  await expect(page.locator("#objectiveValue")).toContainText("crawl gate");

  await page.getByRole("button", { name: "Weather" }).click();
  await expect(page.locator("#weatherValue")).toHaveText("rain");
});

test("graphics quality control cycles rendering presets", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#graphicsValue")).toHaveText("Balanced");
  await page.getByRole("button", { name: "Graphics" }).click();
  await expect(page.locator("#graphicsValue")).toHaveText("Cinematic");
  await page.getByRole("button", { name: "Graphics" }).click();
  await expect(page.locator("#graphicsValue")).toHaveText("Performance");
});

test("micro armor mode exposes fire action", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Mode" }).click();
  await page.getByRole("button", { name: "Mode" }).click();

  await expect(page.locator("#modeLabel")).toHaveText("Micro Armor");
  await expect(page.locator("#objectiveValue")).toContainText("targets");
  await expect(page.getByRole("button", { name: "Fire" })).toBeVisible();
  await page.getByRole("button", { name: "Fire" }).click();
  await expect(page.locator("#lapValue")).toHaveText("shots 1");
});

test("semi truck mode is reachable and hides combat action", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Mode" }).click();
  await page.getByRole("button", { name: "Mode" }).click();
  await page.getByRole("button", { name: "Mode" }).click();

  await expect(page.locator("#modeLabel")).toHaveText("Semi Truck");
  await expect(page.locator("#objectiveValue")).toContainText("dock");
  await expect(page.locator("#vehicleValue")).toHaveText("Semi Tractor");
  await expect(page.getByRole("button", { name: "Fire" })).toBeHidden();
});

test("aircraft modes are reachable after ground vehicle modes", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Mode" }).click();
  await page.getByRole("button", { name: "Mode" }).click();
  await page.getByRole("button", { name: "Mode" }).click();
  await page.getByRole("button", { name: "Mode" }).click();

  await expect(page.locator("#modeLabel")).toHaveText("Drone Flight");
  await expect(page.locator("#objectiveValue")).toContainText("air gate");
  await expect(page.locator("#lapValue")).toContainText("alt");
  await expect(page.locator("#surfaceValue")).toHaveText("air");
  await expect(page.locator("#vehicleValue")).toHaveText("Quad Drone");
  await page.getByRole("button", { name: "Mode" }).click();

  await expect(page.locator("#modeLabel")).toHaveText("Helicopter Rescue");
  await expect(page.locator("#objectiveValue")).toContainText("rescue pad");
  await expect(page.locator("#lapValue")).toContainText("hover");
  await expect(page.locator("#vehicleValue")).toHaveText("Rescue Helicopter");
  await expect(page.getByRole("button", { name: "Winch" })).toBeVisible();
});

test("garage changes active vehicle profile", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Garage" }).click();
  await expect(page.getByRole("heading", { name: "Garage" })).toBeVisible();
  await page.getByRole("button", { name: /Crawler/ }).click();

  await expect(page.locator("#vehicleValue")).toHaveText("Crawler");
  await expect(page.getByRole("button", { name: /Crawler/ })).toHaveAttribute("aria-pressed", "true");
});

test("controls panel exposes RC transmitter calibration shell", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Controls" }).click();

  await expect(page.getByRole("heading", { name: "RC Transmitter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bindings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Transmitter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect HID" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Set Center" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Set Extents" })).toBeVisible();
  await page.getByRole("button", { name: "Simulate" }).click();
  await expect(page.getByRole("heading", { name: "Control Bindings" })).toBeInViewport();
  await expect(page.locator("#transmitterStatus")).toContainText(/HID|Transmitter/);
  await expect(page.locator(".channel-row")).toHaveCount(8);
});
