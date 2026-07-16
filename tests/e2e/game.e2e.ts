import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('starts a new journey and initializes WebGL gameplay', async ({ page }) => {
  const title = page.getByTestId('title-screen')
  await expect(title).toBeVisible()
  await expect(title).toContainText('WASD or arrow keys')
  await page.getByRole('button', { name: 'Enter the dream' }).click()
  await expect(page.getByTestId('game-screen')).toBeVisible()
  await expect(page.getByTestId('game-hud')).toContainText('The Dreamer')
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText('Find and light the abandoned lantern')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowUp')
})

test('offers brighter visibility and persists the selection', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter the dream' }).click()
  const visibility = page.getByRole('button', { name: /Visibility:/ })
  await expect(visibility).toContainText('bright')
  await visibility.click()
  await expect(visibility).toContainText('contrast')
  await page.reload()
  await expect(page.getByRole('button', { name: /Visibility:/ })).toContainText('contrast')
})
