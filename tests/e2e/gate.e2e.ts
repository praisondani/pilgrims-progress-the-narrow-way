import { expect, test, type Page } from "@playwright/test";
import { storyScenes } from "../../src/game/story";

const gateIndex = storyScenes.findIndex((scene) => scene.id === "gate");
const evidenceRoot = "public/studio-evidence/vertical-slice-02";

async function openGate(page: Page, stepIndex = 0) {
  await page.addInitScript(
    ({ sceneIndex, requestedStep }) => {
      localStorage.setItem(
        "narrow-way-save-v2",
        JSON.stringify({
          state: {
            started: true,
            sceneIndex,
            stepIndex: requestedStep,
            soundEnabled: false,
            reducedMotion: true,
            cinematicCamera: false,
          },
          version: 9,
        }),
      );
    },
    { sceneIndex: gateIndex, requestedStep: stepIndex },
  );
  await page.goto("/");
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 25_000 });
  await expect(page.getByTestId("game-hud")).toContainText("The Wicket Gate");
}

async function guideToCurrentBeat(page: Page) {
  const prompt = page.locator(".interact-prompt");
  if (!(await prompt.isVisible())) {
    const cue = page.locator(".navigation-cue");
    if (await cue.isEnabled()) {
      await cue.evaluate((element) =>
        (element as HTMLButtonElement).click(),
      );
      await page.waitForTimeout(50);
    }
  }
  await expect(prompt).toBeVisible({ timeout: 20_000 });
  await prompt.click({ force: true });
  await page.waitForTimeout(50);
}

async function finishDialogue(page: Page) {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    // Gate animation can replace the button between locator checks. Query and
    // dispatch in one page task so a re-render cannot leave Playwright waiting
    // on a detached dialogue node.
    const advanced = await page.evaluate(() => {
      const element = document.querySelector<HTMLButtonElement>(
        ".dialogue.spoken",
      );
      if (!element) return false;
      element.click();
      return true;
    });
    if (!advanced) return;
    await page.waitForTimeout(80);
  }
  throw new Error("Dialogue did not finish within 32 advances");
}

test("telegraphed arrows make swept contact and preserve impact feedback", async ({
  page,
  isMobile,
}) => {
  test.skip(Boolean(isMobile), "Desktop validates projectile contact; mobile uses the same world simulation.");
  test.setTimeout(60_000);
  await openGate(page);
  await expect(page.locator("html")).toHaveAttribute("data-gate-step", "approach");
  await page.screenshot({
    path: `${evidenceRoot}/wicket-gate-controller-front.jpg`,
    quality: 88,
  });

  const impact = expect(page.locator("html")).toHaveAttribute(
    "data-last-arrow-impact",
    /\d+/,
    { timeout: 15_000 },
  );
  const toast = expect(page.locator(".toast")).toContainText(
    "An arrow strikes Christian",
    { timeout: 15_000 },
  );
  // Step into the first arrow lane, then hold position. This mirrors the
  // authored moment the player is exposed on the approach and makes the
  // collision assertion independent of the salvo's phase at page load.
  await page.keyboard.down("KeyW");
  await expect
    .poll(
      async () =>
        Number(await page.locator(".navigation-cue").getAttribute("data-player-z")),
      { timeout: 5_000, intervals: [100, 200, 400] },
    )
    .toBeLessThan(4.6);
  await page.keyboard.up("KeyW");
  await Promise.all([
    impact,
    toast,
  ]);
  await expect(page.locator("html")).toHaveAttribute(
    "data-arrow-salvo-phase",
    /telegraph|flight|safe/,
  );
  await page.screenshot({
    path: `${evidenceRoot}/wicket-gate-controller-impact.jpg`,
    quality: 90,
  });
  await expect(page.locator("canvas")).toBeVisible();
});

test("all six Gate beats use the authored path and open the real doorway", async ({
  page,
  isMobile,
}) => {
  test.skip(Boolean(isMobile), "Desktop covers full authored Gate traversal.");
  test.setTimeout(90_000);
  await openGate(page);

  await guideToCurrentBeat(page);
  await expect(page.locator(".puzzle-shell")).toBeVisible();
  await page.getByRole("button", { name: "Listen for the lull" }).click();
  await page.getByRole("button", { name: "Move to cover" }).click();
  await expect(page.locator(".dialogue.spoken")).toBeVisible();
  await finishDialogue(page);

  await guideToCurrentBeat(page);
  await finishDialogue(page);
  await expect(page.locator("html")).toHaveAttribute("data-gate-step", "inscription");

  await guideToCurrentBeat(page);
  await page.screenshot({
    path: `${evidenceRoot}/wicket-gate-controller-close.jpg`,
    quality: 90,
  });
  await finishDialogue(page);

  await guideToCurrentBeat(page);
  await expect(page.locator("html")).toHaveAttribute("data-gate-door", "closed");
  await finishDialogue(page);

  await guideToCurrentBeat(page);
  const dialogue = page.locator(".dialogue.spoken");
  await expect(dialogue).toContainText("May I enter");
  await dialogue.click();
  await expect(dialogue).toContainText("Bolts turn from within");
  await expect(page.locator("html")).toHaveAttribute("data-gate-bolts", "released");
  await dialogue.click();

  await expect(page.locator("html")).toHaveAttribute("data-gate-step", "goodwill");
  await expect(page.locator("html")).toHaveAttribute("data-gate-door", "open");
  await expect(page.locator("html")).toHaveAttribute("data-gate-goodwill", "visible");
  await guideToCurrentBeat(page);
  await expect(page.locator(".navigation-cue")).toHaveAttribute(
    "data-player-z",
    /-(?:8|9|10)\./,
  );
  await finishDialogue(page);

  await expect(page.locator(".chapter-card")).toContainText("The Wicket Gate");
  await expect(page.locator(".chapter-card")).toContainText("CHAPTER V COMPLETE");
});
