import { expect, test } from "@playwright/test";
import { storyScenes } from "../../src/game/story";

const finaleIds = ["delectable", "enchanted", "beulah", "river", "celestial"];
const finaleStart = storyScenes.findIndex((scene) => scene.id === "delectable");

test("completes the authored Delectable Mountains-to-Celestial City finale", async ({
  page,
  isMobile,
}) => {
  test.skip(
    Boolean(process.env.CI),
    "Exhaustive finale traversal runs locally; CI covers story invariants and focused interactions.",
  );
  test.skip(Boolean(isMobile), "The desktop finale smoke test covers the authored finale path.");
  test.setTimeout(300_000);
  await page.addInitScript(
    ({ sceneIndex }) => {
      localStorage.setItem(
        "narrow-way-save-v2",
        JSON.stringify({
          state: {
            started: true,
            sceneIndex,
            stepIndex: 0,
            burden: 0,
            hasRoll: true,
            hasKeyOfPromise: true,
            equipment: [],
            soundEnabled: false,
            reducedMotion: true,
            cinematicCamera: false,
          },
          version: 10,
        }),
      );
    },
    { sceneIndex: finaleStart },
  );
  await page.goto("/");
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 25_000 });

  const prompt = page.locator(".interact-prompt");
  const spoken = page.locator(".dialogue.spoken");

  for (let sceneOffset = 0; sceneOffset < finaleIds.length; sceneOffset += 1) {
    const scene = storyScenes[finaleStart + sceneOffset];
    expect(scene.id).toBe(finaleIds[sceneOffset]);
    await expect(page.getByTestId("game-hud")).toContainText(scene.title);

    for (const step of scene.steps) {
      await expect(page.locator(".objective")).toContainText(step.objective);
      // The prompt may already be mounted on a fast transition. Dispatching
      // the current cue directly avoids a locator visibility race while the
      // final-scene landmark is still compiling.
      await page.evaluate(() => {
        const element = document.querySelector<HTMLButtonElement>(
          ".navigation-cue",
        );
        if (element && !element.disabled) element.click();
      });
      await expect(prompt).toBeVisible({ timeout: 15_000 });
      await prompt.click({ force: true });

      if (step.choices?.length) {
        await expect(page.locator(".choice")).toBeVisible();
        await page.locator(".choice button").first().click();
      }
      if (step.dialogue.length || step.choices?.[0]?.response.length) {
        const lines = step.choices?.[0]?.response ?? step.dialogue;
        await expect(spoken).toBeVisible();
        for (let line = 0; line < lines.length; line += 1) {
          await page.evaluate(() => {
            document.querySelector<HTMLButtonElement>(
              ".dialogue.spoken",
            )?.click();
          });
          await page.waitForTimeout(70);
        }
        await expect(spoken).toBeHidden();
      }
    }

    await expect(page.locator(".chapter-card")).toBeVisible();
    const next = page.locator(".chapter-card .primary");
    await expect(next).toContainText(
      sceneOffset === finaleIds.length - 1
        ? "Enter the Celestial City"
        : "Continue the journey",
    );
    await next.click({ force: true });
  }

  await expect(page.locator(".ending")).toContainText("The road ends in welcome");
  await expect(page.locator(".ending-road")).toContainText("Celestial City");
});
