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
  await expect(page.locator(".scene-loader")).toBeHidden({ timeout: 15_000 });
  await expect(page.getByTestId("game-hud")).toContainText("The Dreamer");
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
