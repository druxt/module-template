const { test, expect } = require('@playwright/test')

/**
 * End-to-end checks against the example application.
 *
 * Unit tests establish that the Nuxt module registers its components
 * directory. They cannot establish that the module loads inside a real Nuxt
 * application against a real Drupal backend, which is the only thing a
 * consumer of the module actually cares about.
 *
 * These are deliberately thin. A template's tests are read as an example of
 * what to write, so they should show the shape rather than exhaustively cover
 * a component that every consumer is going to replace.
 */

test.describe('the example application', () => {
  test('serves the page the module contributes to', async ({ page }) => {
    const response = await page.goto('/')
    expect(response.status()).toBe(200)
  })

  test('renders the module component', async ({ page }) => {
    await page.goto('/')
    // The template's component renders "Hello world" through its default slot.
    // Replace this with an assertion about your own component.
    await expect(page.getByText('Hello world')).toBeVisible()
  })

  test('matches the committed baseline @visual', async ({ page }) => {
    await page.goto('/')
    // Fonts and images settle after load; without this the first render is
    // captured mid-layout and every run differs from every other.
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('home.png', { fullPage: true })
  })
})
