import { expect, test } from "@playwright/test";
import { storyScenes } from "../../src/game/story";

test("keeps every procedural countryside landmark reachable", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "Desktop validates keyboard-guided terrain collision; mobile has dedicated smoke coverage.");
  test.setTimeout(120_000);
  const fieldIndex = storyScenes.findIndex((scene) => scene.id === "field");
  const field = storyScenes[fieldIndex];

  for (let stepIndex = 0; stepIndex < field.steps.length; stepIndex += 1) {
    await page.goto("/");
    await page.evaluate(
      ({ fieldIndex, stepIndex }) => {
        localStorage.clear();
        localStorage.setItem(
          "narrow-way-save-v2",
          JSON.stringify({
            state: {
              started: true,
              sceneIndex: fieldIndex,
              stepIndex,
              soundEnabled: false,
              reducedMotion: true,
              cinematicCamera: false,
            },
            version: 8,
          }),
        );
      },
      { fieldIndex, stepIndex },
    );
    await page.reload();
    await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 15_000 });
    const cue = page.locator(".navigation-cue");
    await expect(cue).toBeEnabled();
    await cue.evaluate((element) => (element as HTMLButtonElement).click());
    await expect(page.locator(".interact-prompt")).toBeVisible({ timeout: 15_000 });
  }
});

test("falls back to WebGL when WebGPU is requested but unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", { value: undefined, configurable: true });
  });
  await page.goto("/?webgpu=1");
  await page.getByRole("button", { name: "Begin the journey" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-renderer-requested", "webgpu");
  await expect(page.locator("html")).toHaveAttribute("data-renderer-backend", "webgl2");
  await expect(page.locator("canvas")).toBeVisible();
});
