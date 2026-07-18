import { expect, test } from "@playwright/test";
import { storyScenes } from "../../src/game/story";

test("arrows strike and stagger Christian on the Wicket Gate approach", async ({
  page,
  isMobile,
}) => {
  test.skip(Boolean(isMobile), "Desktop validates projectile contact; mobile uses the same world simulation.");
  test.setTimeout(60_000);
  const gateIndex = storyScenes.findIndex((scene) => scene.id === "gate");
  await page.addInitScript((sceneIndex) => {
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: {
          started: true,
          sceneIndex,
          stepIndex: 0,
          soundEnabled: false,
          reducedMotion: true,
          cinematicCamera: false,
        },
        version: 9,
      }),
    );
  }, gateIndex);
  await page.goto("/");
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 15_000 });
  await expect(page.getByTestId("game-hud")).toContainText("The Wicket Gate");
  const cue = page.locator(".navigation-cue");
  await expect(cue).toBeEnabled();
  await cue.evaluate((element) => (element as HTMLButtonElement).click());
  await expect(page.locator("html")).toHaveAttribute(
    "data-last-arrow-impact",
    /\d+/,
    { timeout: 30_000 },
  );
  await expect(page.locator(".toast")).toContainText(
    "An arrow strikes Christian",
  );
  await expect(page.locator("canvas")).toBeVisible();
});
