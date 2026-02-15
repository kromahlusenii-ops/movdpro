import { test, expect } from '@playwright/test'

/**
 * Client Onboarding E2E Test
 *
 * Tests the full flow of adding a new client:
 * 1. Navigate to clients page
 * 2. Click "Add Client"
 * 3. Fill in client details
 * 4. Submit and view recommendations
 * 5. Select listings and save
 *
 * Prerequisites:
 * - Dev server running on localhost:3001
 * - Valid session token in PLAYWRIGHT_SESSION_TOKEN env var
 */

const TEST_CLIENT = {
  name: 'Alex Thompson',
  email: 'alex.thompson@example.com',
  phone: '(704) 555-1234',
  budgetMin: '1500',
  budgetMax: '2200',
  notes: 'Moving for new job at Bank of America. Prefers walkable area.',
}

test.describe('Client Onboarding', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set auth cookie if token provided
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
    }
  })

  test('should navigate to clients page', async ({ page }) => {
    await page.goto('/clients')

    // Verify we're on the clients page
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible()
  })

  test('should open new client form', async ({ page }) => {
    await page.goto('/clients')

    // Click Add Client button
    await page.getByRole('link', { name: /add client/i }).click()

    // Verify form is displayed
    await expect(page).toHaveURL('/clients/new')
    await expect(page.getByRole('heading', { name: /add client/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/clients/new')

    // Try to submit without name
    const submitButton = page.getByRole('button', { name: /add client/i })

    // Button should be disabled when name is empty
    await expect(submitButton).toBeDisabled()

    // Fill name and button should enable
    await page.getByLabel(/name/i).fill('Test')
    await expect(submitButton).toBeEnabled()
  })

  test('should fill basic client info', async ({ page }) => {
    await page.goto('/clients/new')

    // Fill name (required)
    await page.getByLabel(/^name/i).fill(TEST_CLIENT.name)

    // Fill email
    await page.getByLabel(/email/i).fill(TEST_CLIENT.email)

    // Fill phone
    await page.getByLabel(/phone/i).fill(TEST_CLIENT.phone)

    // Verify values
    await expect(page.getByLabel(/^name/i)).toHaveValue(TEST_CLIENT.name)
    await expect(page.getByLabel(/email/i)).toHaveValue(TEST_CLIENT.email)
    await expect(page.getByLabel(/phone/i)).toHaveValue(TEST_CLIENT.phone)
  })

  test('should set budget range', async ({ page }) => {
    await page.goto('/clients/new')

    // Fill budget min
    await page.getByLabel(/minimum budget/i).fill(TEST_CLIENT.budgetMin)

    // Fill budget max
    await page.getByLabel(/maximum budget/i).fill(TEST_CLIENT.budgetMax)

    // Verify values
    await expect(page.getByLabel(/minimum budget/i)).toHaveValue(TEST_CLIENT.budgetMin)
    await expect(page.getByLabel(/maximum budget/i)).toHaveValue(TEST_CLIENT.budgetMax)
  })

  test('should select bedrooms', async ({ page }) => {
    await page.goto('/clients/new')

    // Select 1 BR
    const oneBrButton = page.getByRole('button', { name: /1 br/i })
    await oneBrButton.click()
    await expect(oneBrButton).toHaveAttribute('aria-pressed', 'true')

    // Select 2 BR
    const twoBrButton = page.getByRole('button', { name: /2 br/i })
    await twoBrButton.click()
    await expect(twoBrButton).toHaveAttribute('aria-pressed', 'true')

    // Both should remain selected (multi-select)
    await expect(oneBrButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('should select neighborhoods', async ({ page }) => {
    await page.goto('/clients/new')

    // Select South End
    const southEnd = page.getByRole('button', { name: /south end/i })
    await southEnd.click()
    await expect(southEnd).toHaveAttribute('aria-pressed', 'true')

    // Select NoDa
    const noda = page.getByRole('button', { name: /noda/i })
    await noda.click()
    await expect(noda).toHaveAttribute('aria-pressed', 'true')
  })

  test('should expand and fill lifestyle preferences', async ({ page }) => {
    await page.goto('/clients/new')

    // Expand lifestyle accordion
    await page.getByRole('button', { name: /lifestyle preferences/i }).click()

    // Wait for expansion
    await expect(page.getByText(/what matters most/i)).toBeVisible()

    // Select a vibe
    const youngPro = page.getByRole('button', { name: /young professional/i })
    await youngPro.click()
    await expect(youngPro).toHaveAttribute('aria-pressed', 'true')

    // Toggle works from home
    const wfh = page.getByRole('button', { name: /works from home/i })
    await wfh.click()
    await expect(wfh).toHaveAttribute('aria-pressed', 'true')
  })

  test('should add notes', async ({ page }) => {
    await page.goto('/clients/new')

    // Fill notes
    await page.getByLabel(/notes/i).fill(TEST_CLIENT.notes)

    // Verify
    await expect(page.getByLabel(/notes/i)).toHaveValue(TEST_CLIENT.notes)
  })

  test('full onboarding flow', async ({ page }) => {
    // Skip if no auth token (can't create clients without auth)
    test.skip(!process.env.PLAYWRIGHT_SESSION_TOKEN, 'Requires PLAYWRIGHT_SESSION_TOKEN')

    await page.goto('/clients')

    // Step 1: Navigate to new client form
    await page.getByRole('link', { name: /add client/i }).click()
    await expect(page).toHaveURL('/clients/new')

    // Step 2: Fill basic info
    await page.getByLabel(/^name/i).fill(TEST_CLIENT.name)
    await page.getByLabel(/email/i).fill(TEST_CLIENT.email)
    await page.getByLabel(/phone/i).fill(TEST_CLIENT.phone)

    // Step 3: Set budget
    await page.getByLabel(/minimum budget/i).fill(TEST_CLIENT.budgetMin)
    await page.getByLabel(/maximum budget/i).fill(TEST_CLIENT.budgetMax)

    // Step 4: Select bedrooms
    await page.getByRole('button', { name: /1 br/i }).click()
    await page.getByRole('button', { name: /2 br/i }).click()

    // Step 5: Select neighborhoods
    await page.getByRole('button', { name: /south end/i }).click()
    await page.getByRole('button', { name: /noda/i }).click()

    // Step 6: Add notes
    await page.getByLabel(/notes/i).fill(TEST_CLIENT.notes)

    // Step 7: Submit
    await page.getByRole('button', { name: /add client/i }).click()

    // Step 8: Wait for response - either recommendations or redirect
    await page.waitForURL(/\/(clients\/new|clients\/[a-z0-9]+|clients)/, { timeout: 10000 })

    // If we got recommendations, handle them
    if (await page.getByText(/recommended listings/i).isVisible({ timeout: 2000 }).catch(() => false)) {
      // Check recommendations are displayed
      await expect(page.getByText(/recommended listings/i)).toBeVisible()

      // Select first listing if available
      const listings = page.locator('[aria-pressed]').filter({ hasText: /at/ })
      if (await listings.count() > 0) {
        await listings.first().click()

        // Save and finish
        const saveButton = page.getByRole('button', { name: /add to client/i })
        if (await saveButton.isVisible()) {
          await saveButton.click()
        }
      } else {
        // Skip if no recommendations
        await page.getByRole('button', { name: /continue|skip/i }).click()
      }
    }

    // Step 9: Verify we end up on client detail or list
    await expect(page).toHaveURL(/\/clients/)

    // Verify client was created by checking it appears in the list or detail page
    await expect(page.getByText(TEST_CLIENT.name)).toBeVisible({ timeout: 5000 })
  })

  test('should handle form cancellation', async ({ page }) => {
    await page.goto('/clients/new')

    // Fill some data
    await page.getByLabel(/^name/i).fill('Cancel Test')

    // Click cancel
    await page.getByRole('link', { name: /cancel/i }).click()

    // Should return to clients list
    await expect(page).toHaveURL('/clients')
  })
})

test.describe('Client Onboarding - Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } }) // iPhone 14

  test('should work on mobile viewport', async ({ page, context }) => {
    // Set auth if available
    const sessionToken = process.env.PLAYWRIGHT_SESSION_TOKEN
    if (sessionToken) {
      await context.addCookies([
        {
          name: 'movd_pro_session',
          value: sessionToken,
          domain: 'localhost',
          path: '/',
        },
      ])
    }

    await page.goto('/clients/new')

    // Form should be usable on mobile
    await expect(page.getByLabel(/^name/i)).toBeVisible()

    // Fill name
    await page.getByLabel(/^name/i).fill('Mobile Test')

    // Buttons should be tappable
    const studioButton = page.getByRole('button', { name: /studio/i })
    await expect(studioButton).toBeVisible()
    await studioButton.tap()
    await expect(studioButton).toHaveAttribute('aria-pressed', 'true')

    // Lifestyle accordion should work
    await page.getByRole('button', { name: /lifestyle preferences/i }).tap()
    await expect(page.getByText(/what matters most/i)).toBeVisible()
  })
})
