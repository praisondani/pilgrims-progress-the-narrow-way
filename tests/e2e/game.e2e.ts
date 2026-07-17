import { expect, test } from "@playwright/test";
import { storyScenes } from "../../src/game/story";
import { puzzleFor } from "../../src/game/puzzles";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("starts a new journey and initializes WebGL gameplay", async ({
  page,
}) => {
  const audioResponses: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/audio/")) audioResponses.push(response.url());
  });
  const title = page.getByTestId("title-screen");
  await expect(title).toBeVisible();
  await expect(title).toContainText("WASD or arrow keys");
  await page.getByRole("button", { name: "Begin the journey" }).click();
  await expect(page.getByTestId("game-screen")).toBeVisible();
  await expect(page.getByTestId("game-hud")).toContainText("The Dreamer");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 10_000 });
  await expect(
    page.getByText("Find and light the abandoned lantern"),
  ).toBeVisible();
  const sound = page.getByRole("button", { name: "Toggle sound" });
  await expect(sound).toContainText("Sound off");
  await sound.click();
  await expect(sound).toContainText("Sound on");
  await expect
    .poll(() => audioResponses.some((url) => url.endsWith("/audio/ambience/dream.mp3")))
    .toBe(true);
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-state",
    "playing",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-scene",
    "dream",
  );
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowUp");
});

test("credits the original work and offers the source edition", async ({
  page,
}) => {
  await page.getByRole("link", { name: "About this adaptation" }).click();
  await expect(
    page.getByRole("heading", {
      name: "A seventeenth-century pilgrimage, rebuilt as a world to explore.",
    }),
  ).toBeVisible();
  await expect(page.getByText("First published in 1678")).toBeVisible();

  const reader = page.getByRole("link", { name: "Read the book" });
  await expect(reader).toHaveAttribute(
    "href",
    "/downloads/the-pilgrims-progress-john-bunyan.pdf",
  );
  await expect(reader).toHaveAttribute("target", "_blank");
  await expect(reader).not.toHaveAttribute("download", "");
  await expect(
    page.getByRole("link", { name: "Courtesy and support" }),
  ).toHaveAttribute("href", "https://johnbunyan.org/donate/");

  const response = await page.request.get(
    "/downloads/the-pilgrims-progress-john-bunyan.pdf",
  );
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).byteLength).toBe(870_838);
});

test("offers brighter visibility and persists the selection", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Begin the journey" }).click();
  const visibility = page.getByRole("button", { name: /Visibility:/ });
  await expect(visibility).toContainText("bright");
  await visibility.evaluate((element) =>
    (element as HTMLButtonElement).click(),
  );
  await expect(visibility).toContainText("contrast");
  await page.reload();
  await expect(page.getByRole("button", { name: /Visibility:/ })).toContainText(
    "contrast",
  );
});

test("shows the ordered story map without unlocking future chapters", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Begin the journey" }).click();
  await page.getByRole("button", { name: "Story map" }).click();
  const map = page.getByRole("dialog", { name: "Story map" });
  await expect(map).toBeVisible();
  await expect(map.getByRole("listitem")).toHaveCount(storyScenes.length);
  await expect(
    map.getByRole("listitem", { name: /Prologue: The Dreamer, In progress/i }),
  ).toBeVisible();
  await expect(
    map.getByRole("listitem", { name: /Chapter I: City of Destruction, Locked/i }),
  ).toBeVisible();
  await expect(map.getByRole("button")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(map).toBeHidden();
});

test("shows a readable continue action on chapter completion", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.evaluate(() =>
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: { started: true, sceneIndex: 0, stepIndex: 3 },
        version: 3,
      }),
    ),
  );
  await page.reload();
  const cue = page.locator(".navigation-cue");
  await cue.click();
  const interactPrompt = page.locator(".interact-prompt");
  await expect(interactPrompt).toBeVisible({ timeout: 12_000 });
  await interactPrompt.click({ force: true });
  const spoken = page.locator(".spoken");
  await expect(spoken).toBeVisible();
  await expect(spoken).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  const chapterCta = page.locator(".chapter-card .primary");
  await expect(chapterCta).toBeVisible();
  await expect(chapterCta).toContainText("Continue the journey");
  await expect
    .poll(() =>
      chapterCta.evaluate((element) => {
        const style = getComputedStyle(element);
        return `${style.backgroundColor}|${style.color}`;
      }),
    )
    .toBe("rgb(216, 154, 69)|rgb(23, 16, 26)");
});

test("rotates the camera and moves relative to its heading", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Begin the journey" }).click();
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-camera-mood", "ominous");
  await expect(canvas).toHaveAttribute("data-camera-transition", "", {
    timeout: 8_000,
  });
  await expect(canvas).toHaveAttribute("data-camera-yaw", "0.000");
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.65, bounds!.y + 300);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 0.35, bounds!.y + 300, {
    steps: 8,
  });
  await page.mouse.up();
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-camera-yaw")))
    .not.toBeCloseTo(0, 1);
  await page.waitForTimeout(350);

  await page.keyboard.down("w");
  await page.waitForTimeout(500);
  await page.keyboard.up("w");
  await expect
    .poll(async () =>
      Number(
        await page.locator(".navigation-cue").getAttribute("data-player-x"),
      ),
    )
    .not.toBeCloseTo(0, 1);
  await page.keyboard.press("r");
});

test("migrates an old Cross ending into the expanded journey", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: {
          started: true,
          sceneIndex: 7,
          stepIndex: 6,
          burden: 0,
          gameComplete: true,
        },
        version: 3,
      }),
    ),
  );
  await page.reload();
  await expect(page.getByTestId("game-hud")).toContainText("The Cross");
  await expect(page.locator(".ending")).toBeHidden();
  await expect(page.locator(".inventory-status")).toContainText(
    "Sealed roll secured",
  );
});

test("continues from Palace Beautiful into the valley journey", async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.CI),
    "Seeded checkpoint physics is covered locally; CI software rendering is non-deterministic.",
  );
  test.setTimeout(90_000);
  await page.evaluate(() =>
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: {
          started: true,
          sceneIndex: 13,
          stepIndex: 8,
          burden: 0,
          hasRoll: true,
          equipment: ["sword", "shield", "helmet", "breastplate", "shoes"],
          journal: [],
          gameComplete: false,
          soundEnabled: false,
          visibility: "bright",
          textSize: "normal",
          reducedMotion: false,
          cinematicCamera: true,
        },
        version: 5,
      }),
    ),
  );
  await page.reload();
  const cue = page.locator(".navigation-cue");
  const interactPrompt = page.locator(".interact-prompt");
  await expect
    .poll(
      async () => {
        if (await interactPrompt.isVisible()) return true;
        if (await cue.isEnabled())
          await cue.evaluate((element) =>
            (element as HTMLButtonElement).click(),
          );
        return false;
      },
      {
        timeout: process.env.CI ? 60_000 : 24_000,
        intervals: [0, 200, 400],
        message: "Reach Palace Beautiful’s final marker through guided travel",
      },
    )
    .toBe(true);
  await interactPrompt.click({ force: true });
  const spoken = page.locator(".spoken");
  await expect(spoken).toBeVisible();
  for (let line = 0; line < 3; line++) await spoken.click({ force: true });
  const chapterCta = page.locator(".chapter-card .primary");
  await expect(chapterCta).toContainText("Continue the journey");
  await chapterCta.click();
  await expect(page.getByTestId("game-hud")).toContainText(
    "Valley of Humiliation",
  );
});

test("migrates an old Palace ending into the expanded valley journey", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: {
          started: true,
          sceneIndex: 13,
          stepIndex: 8,
          burden: 0,
          hasRoll: true,
          equipment: ["sword", "shield", "helmet", "breastplate", "shoes"],
          gameComplete: true,
        },
        version: 4,
      }),
    ),
  );
  await page.reload();
  await expect(page.getByTestId("game-hud")).toContainText(
    "Valley of Humiliation",
  );
  await expect(page.locator(".ending")).toBeHidden();
});

test("continues Hopeful’s road into the By-Ends encounter", async ({ page }) => {
  test.skip(
    Boolean(process.env.CI),
    "Seeded checkpoint physics is covered locally; CI software rendering is non-deterministic.",
  );
  test.setTimeout(90_000);
  await page.evaluate(() =>
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: {
          started: true,
          sceneIndex: 20,
          stepIndex: 6,
          burden: 0,
          hasRoll: true,
          equipment: ["sword", "shield", "helmet", "breastplate", "shoes"],
          journal: [],
          gameComplete: false,
          soundEnabled: false,
          visibility: "bright",
          textSize: "normal",
          reducedMotion: false,
          cinematicCamera: true,
        },
        version: 6,
      }),
    ),
  );
  await page.reload();
  await expect(page.locator(".inventory-status")).toContainText(
    "Hopeful travels with you",
  );
  const cue = page.locator(".navigation-cue");
  const interactPrompt = page.locator(".interact-prompt");
  await expect
    .poll(
      async () => {
        if (await interactPrompt.isVisible()) return true;
        if (await cue.isEnabled())
          await cue.evaluate((element) =>
            (element as HTMLButtonElement).click(),
          );
        return false;
      },
      {
        timeout: process.env.CI ? 60_000 : 24_000,
        intervals: [0, 200, 400],
        message: "Reach Hopeful’s final marker through guided travel",
      },
    )
    .toBe(true);
  await interactPrompt.click({ force: true });
  const spoken = page.locator(".spoken");
  await expect(spoken).toBeVisible();
  await spoken.click();
  await spoken.click();
  const chapterCta = page.locator(".chapter-card .primary");
  await expect(chapterCta).toContainText("Continue the journey");
  await chapterCta.click();
  await expect(page.getByTestId("game-hud")).toContainText("By-Ends");
});

test("migrates an old Hopeful ending into the By-Ends encounter", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: {
          started: true,
          sceneIndex: 20,
          stepIndex: 6,
          burden: 0,
          hasRoll: true,
          equipment: ["sword", "shield", "helmet", "breastplate", "shoes"],
          gameComplete: true,
        },
        version: 5,
      }),
    ),
  );
  await page.reload();
  await expect(page.getByTestId("game-hud")).toContainText("By-Ends");
  await expect(page.locator(".inventory-status")).toContainText(
    "Hopeful travels with you",
  );
  await expect(page.locator(".ending")).toBeHidden();
});

test("escapes Doubting Castle with the Key of Promise", async ({ page }) => {
  test.setTimeout(90_000);
  await page.evaluate(() =>
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: {
          started: true,
          sceneIndex: 24,
          stepIndex: 10,
          burden: 0,
          hasRoll: true,
          hasKeyOfPromise: true,
          equipment: ["sword", "shield", "helmet", "breastplate", "shoes"],
          journal: [],
          gameComplete: false,
          soundEnabled: false,
          visibility: "bright",
          textSize: "normal",
          reducedMotion: false,
          cinematicCamera: true,
        },
        version: 6,
      }),
    ),
  );
  await page.reload();
  await expect(page.locator(".inventory-status")).toContainText(
    "Key of Promise remembered",
  );
  const cue = page.locator(".navigation-cue");
  const interactPrompt = page.locator(".interact-prompt");
  await cue.evaluate((element) => (element as HTMLButtonElement).click());
  await expect(interactPrompt).toBeVisible({ timeout: 24_000 });
  await interactPrompt.click({ force: true });
  const spoken = page.locator(".spoken");
  await expect(spoken).toBeVisible();
  await spoken.click();
  await spoken.click();
  const chapterCta = page.locator(".chapter-card .primary");
  await expect(chapterCta).toContainText("Leave Doubting Castle");
  await chapterCta.click();
  await expect(page.locator(".ending")).toContainText(
    "The mountains rise ahead",
  );
});

test("completes the full Dream-to-Doubting journey through real controls", async ({
  page,
  isMobile,
}) => {
  test.skip(
    Boolean(process.env.CI),
    "Exhaustive 45-minute physics journey runs locally; CI covers focused flows and story invariants.",
  );
  test.skip(
    Boolean(isMobile),
    "Full keyboard journey runs in desktop project; mobile retains smoke coverage.",
  );
  test.setTimeout(3_600_000);
  await page.getByRole("button", { name: "Begin the journey" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  const journeyStartedAt = Date.now();
  const cue = page.locator(".navigation-cue");
  const interactPrompt = page.locator(".interact-prompt");
  const walkToTarget = async (sceneId: string, stepId: string) => {
    if (await interactPrompt.isVisible()) return;
    await expect(cue).toBeEnabled();
    await expect
      .poll(
        async () => {
          if (await interactPrompt.isVisible()) return true;
          if (await cue.isEnabled())
            await cue.evaluate((element) =>
              (element as HTMLButtonElement).click(),
            );
          return false;
        },
        {
          timeout: process.env.CI ? 60_000 : 24_000,
          intervals: [0, 200, 400],
          message: `Reach ${sceneId}:${stepId} through guided travel`,
        },
      )
      .toBe(true);
  };

  for (let sceneIndex = 0; sceneIndex < storyScenes.length; sceneIndex++) {
    const scene = storyScenes[sceneIndex];
    console.info(
      `[journey] ${sceneIndex + 1}/${storyScenes.length} ${scene.id} (${Math.round((Date.now() - journeyStartedAt) / 1000)}s)`,
    );
    await expect(page.getByTestId("game-hud")).toContainText(scene.title);

    for (const step of scene.steps) {
      await expect(page.locator(".objective")).toContainText(step.objective);
      await page.waitForTimeout(140);
      await walkToTarget(scene.id, step.id);

      await expect(interactPrompt).toBeVisible();
      await interactPrompt.click({ force: true });
      const puzzle = puzzleFor(scene.id, step.id);
      if (puzzle) {
        await expect(page.locator(".puzzle-shell")).toBeVisible();
        if (puzzle.type === "sequence") {
          for (const choice of puzzle.solution)
            await page
              .getByRole("button", { name: puzzle.options[choice] })
              .click();
        } else {
          const slider = page.locator('input[type="range"]');
          await slider.focus();
          const current = Number(await slider.inputValue());
          const key = puzzle.target > current ? "ArrowRight" : "ArrowLeft";
          for (let i = 0; i < Math.abs(puzzle.target - current); i++)
            await page.keyboard.press(key);
          await expect(slider).toHaveValue(String(puzzle.target));
          await page.getByRole("button", { name: "Hold this focus" }).click();
        }
        await expect(page.locator(".puzzle-shell")).toBeHidden();
      }
      if (step.choices?.length) {
        await expect(page.locator(".choice")).toBeVisible();
        await page.locator(".choice button").first().click();
      }
      const spoken = page.locator(".spoken");
      const dialogueCount = step.choices?.[0]
        ? step.choices[0].response.length
        : step.dialogue.length;
      if (dialogueCount) {
        await expect(spoken).toBeVisible();
        for (let line = 0; line < dialogueCount; line++)
          await spoken.click({ force: true });
        await expect(spoken).toBeHidden();
      }
    }

    await expect(page.locator(".chapter-card")).toBeVisible();
    const chapterCta = page.locator(".chapter-card .primary");
    await expect(chapterCta).toBeVisible();
    await expect(chapterCta).toContainText(
      sceneIndex === storyScenes.length - 1
        ? "Leave Doubting Castle"
        : "Continue the journey",
    );
    await expect
      .poll(() =>
        chapterCta.evaluate((element) => {
          const style = getComputedStyle(element);
          return `${style.backgroundColor}|${style.color}`;
        }),
      )
      .toBe("rgb(216, 154, 69)|rgb(23, 16, 26)");
    await chapterCta.click();
  }

  await expect(page.locator(".ending")).toBeVisible();
  await expect(page.locator(".ending")).toContainText(
    "The mountains rise ahead",
  );
  console.info(
    `[journey] complete (${Math.round((Date.now() - journeyStartedAt) / 1000)}s)`,
  );
});
