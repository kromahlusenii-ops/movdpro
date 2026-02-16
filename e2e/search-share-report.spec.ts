import { test, expect } from '@playwright/test'

/**
 * Search → Add to Client → Share Report → Email
 *
 * 1. Create client with luiikromah@gmail.com
 * 2. Search listings
 * 3. Add 2-3 listings to client
 * 4. Go to client detail
 * 5. Share report
 * 6. Send email to luiikromah@gmail.com
 *
 * Prerequisites: Dev server on localhost:3001
 */

const TARGET_EMAIL = 'luiikromah@gmail.com'
const CLIENT_NAME = 'Share Test'

test.describe('Search Share Report', () => {
  test.beforeEach(async ({ page, context }) => {
    const sessionToken = process.env.PLAYWRIGHT_SESSION_TOKEN
    if (sessionToken) {
      await context.addCookies([
        {
          name: 'movd_pro_session',
          value: sessionToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ])
    } else {
      await page.goto('/api/dev-login')
      await page.waitForURL(/\/(dashboard|clients)/, { timeout: 15000 })
      await page.waitForLoadState('networkidle')
    }
  })

  test('full flow: search, add to client, share, email', async ({ page }) => {
    // Step 1: Create client with target email
    await page.goto('/clients/new')
    await page.waitForLoadState('networkidle')

    const nameInput = page.locator('#name')
    await nameInput.waitFor({ state: 'visible', timeout: 15000 })

    await nameInput.fill(CLIENT_NAME)
    await page.locator('#email').fill(TARGET_EMAIL)
    await page.getByRole('button', { name: /add client/i }).click()

    // Wait for redirect (recommendations or clients list)
    await page.waitForURL(/\/(clients\/new|clients\/[a-z0-9]+|clients)/, { timeout: 15000 })

    // If recommendations step, skip
    const skipBtn = page.getByRole('button', { name: /skip for now/i })
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForURL(/\/clients/, { timeout: 5000 })
    }

    // Get client ID from URL if we landed on client detail, else find from list
    const url = page.url()
    let clientId: string | null = null
    const clientMatch = url.match(/\/clients\/([a-z0-9]+)/)
    if (clientMatch) {
      clientId = clientMatch[1]
    } else {
      // Navigate to clients list and find our client
      await page.goto('/clients')
      await page.waitForLoadState('networkidle')
      const clientLink = page.getByRole('link', { name: new RegExp(CLIENT_NAME, 'i') })
      await expect(clientLink).toBeVisible({ timeout: 5000 })
      const href = await clientLink.getAttribute('href')
      clientId = href ? href.split('/').pop() || null : null
    }

    expect(clientId).toBeTruthy()

    // Step 2: Navigate to search
    await page.goto('/search')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /search/i })).toBeVisible({ timeout: 10000 })

    // Step 3 & 4: Wait for listings (load on mount or after filter)
    const listingCards = page.locator('[data-entity="property"]')
    await expect(listingCards.first()).toBeVisible({ timeout: 15000 })

    // Step 5: Add listings to client
    const saveButtons = page.getByRole('button', { name: /save/i })
    const count = await saveButtons.count()
    const toSave = Math.min(3, Math.max(1, count))

    for (let i = 0; i < toSave; i++) {
      const saveBtn = saveButtons.nth(i)
      await saveBtn.click()
      // Wait for dropdown
      const shareTestOption = page.getByRole('menuitem', { name: new RegExp(CLIENT_NAME, 'i') })
      await expect(shareTestOption).toBeVisible({ timeout: 3000 })
      await shareTestOption.click()
      // Optional: dismiss quick add notes modal if it appears
      const maybeModal = page.getByRole('button', { name: /done|close|cancel/i })
      if (await maybeModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await maybeModal.click()
      }
      // Small pause between saves
      await page.waitForTimeout(500)
    }

    // Step 6: Open client detail
    await page.goto(`/clients/${clientId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: new RegExp(CLIENT_NAME, 'i') })).toBeVisible({ timeout: 5000 })

    // Step 7: Generate share report
    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/share recommendations/i)).toBeVisible({ timeout: 3000 })

    // Step 8: Send email (button shows "Send to luiikromah@gmail.com")
    const sendButton = page.getByRole('button', { name: /send to/i })
    await expect(sendButton).toBeVisible({ timeout: 3000 })
    await sendButton.click()

    await expect(page.getByText(/email sent/i)).toBeVisible({ timeout: 10000 })
  })
})
