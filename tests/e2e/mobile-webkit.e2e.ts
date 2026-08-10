import { expect, test } from "@playwright/test";

test("loads the first playable frame under production CSP", async ({ page }) => {
  const runtimeFailures: string[] = [];
  page.on("pageerror", (error) => runtimeFailures.push(error.message));
  page.on("requestfailed", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173"))
      runtimeFailures.push(`${request.url()}: ${request.failure()?.errorText}`);
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Begin the journey" }).click();

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 25_000 });
  await expect(page.getByTestId("game-hud")).toContainText("The Dreamer");
  await expect(page.getByTestId("first-objective-coach")).toContainText(
    "arrow buttons",
  );
  await expect(page.getByTestId("first-objective-coach")).toContainText(
    "Tap action",
  );
  await expect
    .poll(async () => {
      const size = await canvas.evaluate((element) => ({
        width: (element as HTMLCanvasElement).width,
        height: (element as HTMLCanvasElement).height,
      }));
      return size.width > 0 && size.height > 0;
    })
    .toBe(true);
  expect(runtimeFailures).toEqual([]);
});

test("loads the Cross without external cloud textures", async ({ page }) => {
  const externalImages: string[] = [];
  const runtimeFailures: string[] = [];
  page.on("request", (request) => {
    if (
      request.resourceType() === "image" &&
      !request.url().startsWith("http://127.0.0.1:4173")
    )
      externalImages.push(request.url());
  });
  page.on("pageerror", (error) => runtimeFailures.push(error.message));

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() =>
    localStorage.setItem(
      "narrow-way-save-v2",
      JSON.stringify({
        state: {
          started: true,
          sceneIndex: 7,
          stepIndex: 3,
          burden: 0,
          visibility: "bright",
          soundEnabled: false,
        },
        version: 6,
      }),
    ),
  );
  await page.reload();
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 25_000 });
  await expect(page.getByTestId("game-hud")).toContainText("The Cross");
  await expect(page.locator("canvas")).toBeVisible();
  expect(externalImages).toEqual([]);
  expect(runtimeFailures).toEqual([]);
});

test("starts recorded ambience after a mobile user gesture", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin the journey" }).click();
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 25_000 });

  const sound = page.getByRole("button", { name: "Toggle sound" });
  await expect(sound).toContainText("Sound off");
  await sound.click();

  await expect(sound).toContainText("Sound on");
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-state",
    "playing",
    { timeout: 15_000 },
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-scene",
    "dream",
  );

  await page.reload();
  // WebKit can retain the autoplay grant across a reload. In that case the
  // persisted sound preference starts immediately; on stricter devices it
  // correctly reports blocked until the next trusted gesture. Both states
  // are valid, but neither may leave the HUD stuck in loading.
  await expect
    .poll(
      () => page.locator("html").getAttribute("data-audio-state"),
      { timeout: 10_000 },
    )
    .toMatch(/blocked|playing/);
  const reloadedAudioState = await page
    .locator("html")
    .getAttribute("data-audio-state");
  if (reloadedAudioState === "blocked") {
    await expect(
      page.getByRole("button", { name: "Toggle sound" }),
    ).toContainText("Start sound");
    await page.getByRole("button", { name: "Pause" }).click();
  } else {
    await expect(
      page.getByRole("button", { name: "Toggle sound" }),
    ).toContainText("Sound on");
  }
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-state",
    "playing",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-context",
    "running",
  );
});

test("reports an interrupted audio context and recovers on the next gesture", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const browserWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
      __testAudioContexts?: AudioContext[];
    };
    const AudioContextConstructor =
      browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
    if (!AudioContextConstructor) return;
    const contexts: AudioContext[] = [];
    browserWindow.__testAudioContexts = contexts;
    const WrappedAudioContext = new Proxy(AudioContextConstructor, {
      construct(target, args, newTarget) {
        const context = Reflect.construct(target, args, newTarget) as AudioContext;
        contexts.push(context);
        return context;
      },
    });
    Object.defineProperty(browserWindow, "AudioContext", {
      configurable: true,
      value: WrappedAudioContext,
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Begin the journey" }).click();
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 25_000 });
  const sound = page.getByRole("button", { name: "Toggle sound" });
  await sound.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-state",
    "playing",
    { timeout: 15_000 },
  );

  const suspendedState = await page.evaluate(async () => {
    const contexts = (
      window as typeof window & { __testAudioContexts?: AudioContext[] }
    ).__testAudioContexts;
    const context = contexts?.[0];
    if (!context) return "missing";
    await context.suspend();
    return context.state;
  });
  expect(suspendedState).toBe("suspended");
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-state",
    "blocked",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-context",
    "suspended",
  );
  await expect(sound).toContainText("Start sound");

  await sound.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-state",
    "playing",
    { timeout: 15_000 },
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-audio-context",
    "running",
  );
});
